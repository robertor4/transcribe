import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentRequiredException extends HttpException {
  constructor(
    message: string,
    public readonly errorCode?: string,
    public readonly details?: any,
  ) {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message,
        errorCode,
        details,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
