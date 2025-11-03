import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Log full error details server-side
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception,
    );

    // Generic error message for production
    const isProduction = process.env.NODE_ENV === 'production';

    let message = 'An error occurred';
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
    }

    // Sanitize error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: isProduction ? this.sanitizeMessage(message) : message,
      // Only include stack trace in development
      ...(isProduction
        ? {}
        : {
            stack: exception instanceof Error ? exception.stack : undefined,
          }),
    };

    response.status(status).json(errorResponse);
  }

  private sanitizeMessage(message: string | string[]): string | string[] {
    if (Array.isArray(message)) {
      return message.map((m) => this.sanitizeSingleMessage(m));
    }
    return this.sanitizeSingleMessage(message);
  }

  private sanitizeSingleMessage(message: string): string {
    // Remove file paths
    message = message.replace(/\/[^\s]+/g, '[path]');
    // Remove IP addresses
    message = message.replace(
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
      '[ip]',
    );
    // Remove potential API keys (sequences of 32+ alphanumeric chars)
    message = message.replace(/\b[A-Za-z0-9]{32,}\b/g, '[key]');
    // Remove email addresses
    message = message.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      '[email]',
    );

    return message;
  }
}
