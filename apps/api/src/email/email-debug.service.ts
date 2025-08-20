import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailDebugService {
  private readonly logger = new Logger(EmailDebugService.name);

  constructor(private configService: ConfigService) {}

  async debugEmailConfiguration(): Promise<void> {
    const gmailAuthUser = this.configService.get<string>('GMAIL_AUTH_USER');
    const gmailFromEmail = this.configService.get<string>('GMAIL_FROM_EMAIL');
    const gmailAppPassword = this.configService.get<string>('GMAIL_APP_PASSWORD');

    this.logger.log('=== Email Configuration Debug ===');
    this.logger.log(`Auth User: ${gmailAuthUser ? gmailAuthUser.substring(0, 3) + '***' : 'NOT SET'}`);
    this.logger.log(`From Email: ${gmailFromEmail || 'NOT SET'}`);
    this.logger.log(`App Password: ${gmailAppPassword ? '***SET***' : 'NOT SET'}`);
    this.logger.log(`Frontend URL: ${this.configService.get<string>('FRONTEND_URL')}`);

    if (!gmailAuthUser || !gmailAppPassword) {
      this.logger.error('Missing email credentials!');
      return;
    }

    // Try alternative SMTP configurations
    const configs = [
      {
        name: 'Gmail Service (Port 587)',
        config: {
          service: 'gmail',
          auth: { user: gmailAuthUser, pass: gmailAppPassword },
        },
      },
      {
        name: 'Direct SMTP (Port 587 - STARTTLS)',
        config: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: { user: gmailAuthUser, pass: gmailAppPassword },
          tls: { rejectUnauthorized: false },
        },
      },
      {
        name: 'Direct SMTP (Port 465 - SSL)',
        config: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user: gmailAuthUser, pass: gmailAppPassword },
          tls: { rejectUnauthorized: false },
        },
      },
    ];

    for (const { name, config } of configs) {
      this.logger.log(`\nTesting: ${name}`);
      try {
        const transporter = nodemailer.createTransporter(config as any);
        
        // Test connection
        await new Promise((resolve, reject) => {
          transporter.verify((error, success) => {
            if (error) {
              this.logger.error(`❌ ${name} failed:`, error.message);
              reject(error);
            } else {
              this.logger.log(`✅ ${name} connected successfully`);
              resolve(success);
            }
          });
        });

        // Try sending test email
        const info = await transporter.sendMail({
          from: `"Test" <${gmailFromEmail || gmailAuthUser}>`,
          to: gmailAuthUser, // Send to self
          subject: `Production Email Test - ${new Date().toISOString()}`,
          text: `Testing from Hetzner server using ${name}`,
          html: `<p>Testing from Hetzner server using <b>${name}</b></p>`,
        });

        this.logger.log(`✅ Test email sent via ${name}: ${info.messageId}`);
        this.logger.log('Response:', info.response);
        
        // If successful, log the working configuration
        this.logger.log('\n🎉 WORKING CONFIGURATION:');
        this.logger.log(JSON.stringify(config, null, 2));
        break;
        
      } catch (error: any) {
        this.logger.error(`Failed to send via ${name}:`, error.message);
        if (error.responseCode) {
          this.logger.error(`Response code: ${error.responseCode}`);
        }
        if (error.command) {
          this.logger.error(`Failed command: ${error.command}`);
        }
      }
    }
  }
}