import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EmailService } from '../email/email.service';

interface ContactFormDto {
  name: string;
  email: string;
  subject: string;
  message: string;
  locale?: string;
  turnstileToken?: string;
  website?: string; // Honeypot field
}

@Controller('contact')
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Verify Cloudflare Turnstile token
   */
  private async verifyTurnstileToken(token: string): Promise<boolean> {
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
      return result.success === true;
    } catch (error) {
      this.logger.error('Turnstile verification error:', error);
      return false;
    }
  }

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 requests per minute
  async submitContactForm(
    @Body() data: ContactFormDto,
  ): Promise<{ success: boolean }> {
    // Check honeypot field - if filled, it's a bot
    if (data.website && data.website.trim() !== '') {
      this.logger.warn('Honeypot field filled - potential bot detected');
      throw new HttpException('Invalid submission', HttpStatus.BAD_REQUEST);
    }

    // Verify Turnstile token
    if (!data.turnstileToken) {
      throw new HttpException(
        'CAPTCHA verification required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isValidToken = await this.verifyTurnstileToken(data.turnstileToken);
    if (!isValidToken) {
      this.logger.warn('Invalid Turnstile token');
      throw new HttpException(
        'CAPTCHA verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate required fields
    if (!data.name?.trim()) {
      throw new HttpException('Name is required', HttpStatus.BAD_REQUEST);
    }
    if (!data.email?.trim()) {
      throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
    }
    if (!data.subject?.trim()) {
      throw new HttpException('Subject is required', HttpStatus.BAD_REQUEST);
    }
    if (!data.message?.trim()) {
      throw new HttpException('Message is required', HttpStatus.BAD_REQUEST);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new HttpException('Invalid email format', HttpStatus.BAD_REQUEST);
    }

    // Validate subject is one of the allowed values
    const validSubjects = ['general', 'support', 'sales', 'partnership'];
    if (!validSubjects.includes(data.subject)) {
      throw new HttpException('Invalid subject', HttpStatus.BAD_REQUEST);
    }

    // Validate message length
    if (data.message.trim().length < 10) {
      throw new HttpException(
        'Message must be at least 10 characters',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(
      `Contact form submission from ${data.name} <${data.email}> - Subject: ${data.subject}`,
    );

    try {
      const success = await this.emailService.sendContactEmail({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        subject: data.subject,
        message: data.message.trim(),
        locale: data.locale,
      });

      if (!success) {
        throw new HttpException(
          'Failed to send message. Please try again later.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to process contact form:', error);
      throw new HttpException(
        'Failed to send message. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
