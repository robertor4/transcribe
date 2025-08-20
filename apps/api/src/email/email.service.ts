import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ShareEmailRequest } from '@transcribe/shared';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private frontendUrl: string;

  constructor(private configService: ConfigService) {
    // Separate auth user from FROM email for domain alias support
    const gmailAuthUser = this.configService.get<string>('GMAIL_AUTH_USER');
    const gmailFromEmail = this.configService.get<string>('GMAIL_FROM_EMAIL') || 'noreply@neuralsummary.com';
    const gmailAppPassword = this.configService.get<string>('GMAIL_APP_PASSWORD');
    
    this.fromEmail = gmailFromEmail;
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    
    if (gmailAuthUser && gmailAppPassword) {
      // PRODUCTION FIX: Use explicit SMTP config for Hetzner/data center compatibility
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // use STARTTLS
        auth: {
          user: gmailAuthUser,
          pass: gmailAppPassword,
        },
        tls: {
          // Required for some data center IPs that Google might not trust
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2',
        },
        // Increase timeouts for potentially slower connections
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        // Add these for better debugging
        logger: true,
        debug: process.env.NODE_ENV !== 'production',
      });
      
      // Verify transporter configuration
      this.transporter?.verify((error, success) => {
        if (error) {
          this.logger.error('Gmail configuration error:', error);
          this.logger.warn('Make sure you are using an App Password, not your regular Gmail password');
          this.logger.warn('Generate an App Password at: https://myaccount.google.com/apppasswords');
          this.logger.warn(`Auth user: ${gmailAuthUser}, FROM email: ${gmailFromEmail}`);
          
          // Log more details for production debugging
          if (error.message.includes('Invalid login')) {
            this.logger.error('Authentication failed - check App Password');
          } else if (error.message.includes('ECONNREFUSED')) {
            this.logger.error('Connection refused - check firewall/network settings');
          } else if (error.message.includes('getaddrinfo')) {
            this.logger.error('DNS resolution failed - check network configuration');
          }
        } else {
          this.logger.log('Gmail email service configured and ready');
          this.logger.log(`Authenticating as: ${gmailAuthUser}`);
          this.logger.log(`Sending from: ${gmailFromEmail}`);
          this.logger.log(`Using SMTP: smtp.gmail.com:587 with STARTTLS`);
        }
      });
      
      this.logger.log('Gmail email service initialized');
    } else {
      this.logger.warn('Gmail credentials not configured, email sending will be disabled');
      this.logger.warn('Required: GMAIL_AUTH_USER and GMAIL_APP_PASSWORD environment variables');
    }
  }

  async sendShareEmail(
    shareToken: string,
    transcriptionTitle: string,
    request: ShareEmailRequest,
    locale: string = 'en',
  ): Promise<boolean> {
    if (!this.transporter) {
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

      const info = await this.transporter.sendMail({
        from: `"Neural Summary" <${this.fromEmail}>`,
        to: request.recipientEmail,
        subject,
        html: htmlContent,
        text: textContent,
      });

      this.logger.log(`Share email sent successfully to ${request.recipientEmail}`, info.messageId);
      return true;
    } catch (error: any) {
      this.logger.error('Error sending share email:', error);
      
      // Log specific error details for production debugging
      if (error.code === 'EAUTH') {
        this.logger.error('Authentication failed - verify App Password and 2FA is enabled');
      } else if (error.code === 'ESOCKET') {
        this.logger.error('Socket error - check network/firewall settings');
      } else if (error.responseCode === 534) {
        this.logger.error('Google requires app-specific password or less secure app access');
      } else if (error.responseCode === 535) {
        this.logger.error('Invalid credentials - check GMAIL_AUTH_USER and GMAIL_APP_PASSWORD');
      }
      
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
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Transcript Shared With You - Neural Summary</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
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
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body {
        background: #1a1a2e !important;
        color: #e5e7eb !important;
      }
      .container {
        background-color: #16213e !important;
        color: #e5e7eb !important;
      }
      h1 {
        color: #f3f4f6 !important;
      }
      .greeting {
        color: #e5e7eb !important;
      }
      .sender-info {
        color: #d1d5db !important;
      }
      .sender-name {
        color: #ec4899 !important;
      }
      .button {
        background: linear-gradient(135deg, #ec4899 0%, #db2777 100%) !important;
      }
      .url-section {
        background-color: #1f2937 !important;
      }
      .url-label {
        color: #9ca3af !important;
      }
      .link {
        color: #ec4899 !important;
      }
      .footer {
        border-top-color: #374151 !important;
      }
      .footer-text {
        color: #9ca3af !important;
      }
      .footer-brand {
        color: #c084fc !important;
      }
    }
    
    /* Gmail-specific dark mode */
    [data-ogsc] body {
      background: #1a1a2e !important;
      color: #e5e7eb !important;
    }
    [data-ogsc] .container {
      background-color: #16213e !important;
      color: #e5e7eb !important;
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
    
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0;">
      <tr>
        <td>
          <table width="100%" cellpadding="20" cellspacing="0" border="0" style="background-color: #4a1d7a; border-radius: 10px; border-left: 4px solid #cc3399;">
            <tr>
              <td>
                <div style="font-size: 12px; text-transform: uppercase; color: #e9d5ff !important; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 8px;">📄 Transcript</div>
                <div style="font-size: 18px; color: #ffffff !important; font-weight: 600;">${transcriptionTitle}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    ${customMessage ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0;">
      <tr>
        <td>
          <table width="100%" cellpadding="18" cellspacing="0" border="0" style="background-color: #7c6f64; border-radius: 8px; border-left: 4px solid #fbbf24;">
            <tr>
              <td>
                <div style="font-size: 13px; color: #fef3c7 !important; font-weight: 600; margin-bottom: 8px;">💬 Message from ${senderName}:</div>
                <div style="font-size: 15px; color: #ffffff !important; line-height: 1.5;">${customMessage}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
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
      <p class="footer-text" style="font-size: 10px; color: #9ca3af;">Email Template v3 - Dark Mode Fixed</p>
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