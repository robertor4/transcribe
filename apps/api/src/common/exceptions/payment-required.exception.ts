import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for payment/subscription required scenarios
 * HTTP 402 Payment Required
 */
export class PaymentRequiredException extends HttpException {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: any,
  ) {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message,
        code,
        details,
        error: 'Payment Required',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
