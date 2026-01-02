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
}

@Controller('contact')
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  constructor(private readonly emailService: EmailService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 requests per minute
  async submitContactForm(
    @Body() data: ContactFormDto,
  ): Promise<{ success: boolean }> {
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
