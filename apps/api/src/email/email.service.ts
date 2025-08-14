import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ShareEmailRequest } from '@transcribe/shared';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromEmail: string;
  private frontendUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'noreply@transcribe.app';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email service initialized');
    } else {
      this.logger.warn('RESEND_API_KEY not configured, email sending will be disabled');
    }
  }

  async sendShareEmail(
    shareToken: string,
    transcriptionTitle: string,
    request: ShareEmailRequest,
    locale: string = 'en',
  ): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn('Email service not configured, skipping email send');
      return false;
    }

    try {
      const shareUrl = `${this.frontendUrl}/${locale}/shared/${shareToken}`;
      const senderName = request.senderName || 'Someone';
      const recipientName = request.recipientName || 'there';
      
      const subject = `${senderName} shared a transcript with you: "${transcriptionTitle}"`;
      
      const htmlContent = this.generateEmailHtml(
        transcriptionTitle,
        shareUrl,
        senderName,
        recipientName,
        request.message,
      );

      const textContent = this.generateEmailText(
        transcriptionTitle,
        shareUrl,
        senderName,
        recipientName,
        request.message,
      );

      const { data, error } = await this.resend.emails.send({
        from: `Transcribe App <${this.fromEmail}>`,
        to: [request.recipientEmail],
        subject,
        html: htmlContent,
        text: textContent,
      });

      if (error) {
        this.logger.error('Failed to send share email:', error);
        return false;
      }

      this.logger.log(`Share email sent successfully to ${request.recipientEmail}`, data);
      return true;
    } catch (error) {
      this.logger.error('Error sending share email:', error);
      return false;
    }
  }

  private generateEmailHtml(
    transcriptionTitle: string,
    shareUrl: string,
    senderName: string,
    recipientName: string,
    customMessage?: string,
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transcript Shared With You</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #3B82F6;
      margin-bottom: 10px;
    }
    h1 {
      color: #1F2937;
      font-size: 20px;
      margin: 0;
    }
    .transcript-title {
      background-color: #F3F4F6;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
    .message-box {
      background-color: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3B82F6;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
    .button:hover {
      background-color: #2563EB;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 12px;
      color: #6B7280;
    }
    .link {
      color: #3B82F6;
      word-break: break-all;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">📝 Transcribe</div>
      <h1>A transcript has been shared with you</h1>
    </div>
    
    <p>Hi ${recipientName},</p>
    
    <p><strong>${senderName}</strong> has shared a transcript with you:</p>
    
    <div class="transcript-title">
      📄 ${transcriptionTitle}
    </div>
    
    ${customMessage ? `
    <div class="message-box">
      <strong>Message from ${senderName}:</strong><br>
      ${customMessage}
    </div>
    ` : ''}
    
    <div style="text-align: center;">
      <a href="${shareUrl}" class="button">View Transcript</a>
    </div>
    
    <p style="font-size: 14px; color: #6B7280;">
      Or copy and paste this link into your browser:<br>
      <span class="link">${shareUrl}</span>
    </p>
    
    <div class="footer">
      <p>This link may expire or have limited views based on the sender's settings.</p>
      <p>© ${new Date().getFullYear()} Transcribe App. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateEmailText(
    transcriptionTitle: string,
    shareUrl: string,
    senderName: string,
    recipientName: string,
    customMessage?: string,
  ): string {
    let text = `Hi ${recipientName},\n\n`;
    text += `${senderName} has shared a transcript with you:\n\n`;
    text += `"${transcriptionTitle}"\n\n`;
    
    if (customMessage) {
      text += `Message from ${senderName}:\n${customMessage}\n\n`;
    }
    
    text += `View the transcript here:\n${shareUrl}\n\n`;
    text += `This link may expire or have limited views based on the sender's settings.\n\n`;
    text += `© ${new Date().getFullYear()} Transcribe App. All rights reserved.`;
    
    return text;
  }
}