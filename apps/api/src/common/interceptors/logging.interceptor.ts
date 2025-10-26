import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Logging Interceptor for Security Monitoring
 *
 * Logs important security events:
 * - Rate limit hits (429 responses)
 * - Validation errors (400 responses)
 * - Authentication failures (401 responses)
 * - Authorization failures (403 responses)
 * - Suspicious patterns
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SecurityMonitor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const userId = (request as any).user?.uid || 'anonymous';
    const startTime = Date.now();

    // Track the response
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log security-relevant events
        this.logSecurityEvent(
          statusCode,
          method,
          url,
          userId,
          ip,
          userAgent,
          duration,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log the error with context
        this.logSecurityEvent(
          statusCode,
          method,
          url,
          userId,
          ip,
          userAgent,
          duration,
          error,
        );

        return throwError(() => error);
      }),
    );
  }

  private logSecurityEvent(
    statusCode: number,
    method: string,
    url: string,
    userId: string,
    ip: string,
    userAgent: string,
    duration: number,
    error?: any,
  ) {
    const context = {
      statusCode,
      method,
      url,
      userId,
      ip: this.sanitizeIp(ip),
      userAgent: this.truncate(userAgent, 100),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    // Rate Limit Hit (429)
    if (statusCode === 429) {
      this.logger.warn('⚠️  RATE LIMIT HIT', {
        ...context,
        severity: 'MEDIUM',
        action: 'BLOCKED',
        message: 'User exceeded rate limit',
      });
      return;
    }

    // Validation Error (400)
    if (statusCode === 400) {
      const validationErrors = error?.response?.message || [];
      this.logger.log('🔍 VALIDATION ERROR', {
        ...context,
        severity: 'LOW',
        action: 'REJECTED',
        errors: Array.isArray(validationErrors)
          ? validationErrors
          : [validationErrors],
      });
      return;
    }

    // Authentication Failure (401)
    if (statusCode === 401) {
      this.logger.warn('🚫 AUTH FAILURE', {
        ...context,
        severity: 'MEDIUM',
        action: 'BLOCKED',
        message: 'Authentication failed',
      });
      return;
    }

    // Authorization Failure (403)
    if (statusCode === 403) {
      this.logger.warn('🚫 AUTHORIZATION FAILURE', {
        ...context,
        severity: 'MEDIUM',
        action: 'BLOCKED',
        message: 'Insufficient permissions',
      });
      return;
    }

    // Server Error (500+)
    if (statusCode >= 500) {
      this.logger.error('💥 SERVER ERROR', {
        ...context,
        severity: 'HIGH',
        action: 'ERROR',
        error: error?.message || 'Unknown error',
      });
      return;
    }

    // Success - only log if slow (>1s)
    if (statusCode >= 200 && statusCode < 300 && duration > 1000) {
      this.logger.log('⏱️  SLOW REQUEST', {
        ...context,
        severity: 'LOW',
        action: 'COMPLETED',
        message: `Request took ${duration}ms`,
      });
    }
  }

  private sanitizeIp(ip: string): string {
    // Mask last octet for privacy: 192.168.1.1 -> 192.168.1.xxx
    if (!ip) return 'unknown';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    return 'masked';
  }

  private truncate(str: string, maxLength: number): string {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  }
}
