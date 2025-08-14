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
        from: `Neural Summary <${this.fromEmail}>`,
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
  <title>Transcript Shared With You - Neural Summary</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #111827;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #fce7f3 0%, #f3e7fc 100%);
      min-height: 100vh;
    }
    .container {
      background-color: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 10px 25px rgba(204, 51, 153, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 35px;
      padding-bottom: 25px;
      border-bottom: 2px solid #fce7f3;
    }
    .logo-text {
      font-size: 26px;
      font-weight: 700;
      color: #cc3399;
      margin-bottom: 15px;
    }
    h1 {
      color: #374151;
      font-size: 18px;
      margin: 0;
      font-weight: 500;
    }
    .greeting {
      font-size: 16px;
      color: #374151;
      margin-bottom: 10px;
    }
    .sender-info {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 20px;
    }
    .sender-name {
      color: #cc3399;
      font-weight: 600;
    }
    .transcript-title {
      background: linear-gradient(135deg, #fce7f3 0%, #f9fafb 100%);
      padding: 20px;
      border-radius: 10px;
      margin: 25px 0;
      border-left: 4px solid #cc3399;
    }
    .transcript-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #9333ea;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .transcript-name {
      font-size: 18px;
      color: #111827;
      font-weight: 600;
    }
    .message-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%);
      border-left: 4px solid #f59e0b;
      padding: 18px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .message-label {
      font-size: 13px;
      color: #92400e;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .message-content {
      color: #451a03;
      font-size: 15px;
      line-height: 1.5;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #cc3399 0%, #b82d89 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(204, 51, 153, 0.25);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(204, 51, 153, 0.35);
      color: white !important;
    }
    .url-section {
      background-color: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .url-label {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .link {
      color: #cc3399;
      word-break: break-all;
      font-size: 14px;
      text-decoration: none;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 25px;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 13px;
      color: #6b7280;
      margin: 5px 0;
    }
    .footer-brand {
      font-size: 14px;
      color: #9333ea;
      font-weight: 600;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">Neural Summary</div>
      <h1>A transcript has been shared with you</h1>
    </div>
    
    <p class="greeting">Hi ${recipientName || 'there'},</p>
    
    <p class="sender-info"><span class="sender-name">${senderName}</span> has shared a transcript with you:</p>
    
    <div class="transcript-title">
      <div class="transcript-label">📄 Transcript</div>
      <div class="transcript-name">${transcriptionTitle}</div>
    </div>
    
    ${customMessage ? `
    <div class="message-box">
      <div class="message-label">💬 Message from ${senderName}:</div>
      <div class="message-content">${customMessage}</div>
    </div>
    ` : ''}
    
    <div class="button-container">
      <a href="${shareUrl}" class="button">View Transcript →</a>
    </div>
    
    <div class="url-section">
      <div class="url-label">Or copy and paste this link into your browser:</div>
      <a href="${shareUrl}" class="link">${shareUrl}</a>
    </div>
    
    <div class="footer">
      <p class="footer-text">This link may expire or have limited views based on the sender's settings.</p>
      <p class="footer-text">You're receiving this because someone shared a transcript with you.</p>
      <p class="footer-brand">✨ Neural Summary • ${new Date().getFullYear()}</p>
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
    let text = `Hi ${recipientName || 'there'},\n\n`;
    text += `${senderName} has shared a transcript with you:\n\n`;
    text += `"${transcriptionTitle}"\n\n`;
    
    if (customMessage) {
      text += `Message from ${senderName}:\n${customMessage}\n\n`;
    }
    
    text += `View the transcript here:\n${shareUrl}\n\n`;
    text += `This link may expire or have limited views based on the sender's settings.\n\n`;
    text += `---\nNeural Summary • ${new Date().getFullYear()}`;
    
    return text;
  }
}