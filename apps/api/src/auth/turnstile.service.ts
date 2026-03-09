import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  /**
   * Verify a Cloudflare Turnstile token server-side.
   * Returns true if the token is valid, false otherwise.
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      const secretKey = process.env.TURNSTILE_SECRET_KEY;
      if (!secretKey) {
        this.logger.warn('TURNSTILE_SECRET_KEY not configured');
        return false;
      }

      const response = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            secret: secretKey,
            response: token,
          }),
        },
      );

      const result = await response.json();
      if (!result.success) {
        this.logger.warn(
          `Turnstile verification failed: ${JSON.stringify(result['error-codes'] || [])}`,
        );
      }
      return result.success === true;
    } catch (error) {
      this.logger.error('Turnstile verification error:', error);
      return false;
    }
  }
}
