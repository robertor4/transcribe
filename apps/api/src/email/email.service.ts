import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  ShareEmailRequest,
  Transcription,
  User,
  FollowUpEmailOutput,
  SalesEmailOutput,
  InternalUpdateOutput,
  ClientProposalOutput,
} from '@transcribe/shared';

// Union type for all email outputs
type EmailDraftData =
  | FollowUpEmailOutput
  | SalesEmailOutput
  | InternalUpdateOutput
  | ClientProposalOutput;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private frontendUrl: string;

  constructor(private configService: ConfigService) {
    // Separate auth user from FROM email for domain alias support
    const gmailAuthUser = this.configService.get<string>('GMAIL_AUTH_USER');
    const gmailFromEmail =
      this.configService.get<string>('GMAIL_FROM_EMAIL') ||
      'noreply@neuralsummary.com';
    const gmailAppPassword =
      this.configService.get<string>('GMAIL_APP_PASSWORD');

    this.fromEmail = gmailFromEmail;
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

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
      });

      // Verify transporter configuration
      this.transporter?.verify((error, _success) => {
        if (error) {
          this.logger.error('Gmail configuration error:', error);
          this.logger.warn(
            'Make sure you are using an App Password, not your regular Gmail password',
          );
          this.logger.warn(
            'Generate an App Password at: https://myaccount.google.com/apppasswords',
          );
          this.logger.warn(
            `Auth user: ${gmailAuthUser}, FROM email: ${gmailFromEmail}`,
          );

          // Log more details for production debugging
          if (error.message.includes('Invalid login')) {
            this.logger.error('Authentication failed - check App Password');
          } else if (error.message.includes('ECONNREFUSED')) {
            this.logger.error(
              'Connection refused - check firewall/network settings',
            );
          } else if (error.message.includes('getaddrinfo')) {
            this.logger.error(
              'DNS resolution failed - check network configuration',
            );
          }
        } else {
          this.logger.log('Gmail email service configured and ready');
        }
      });

      this.logger.log('Gmail email service initialized');
    } else {
      this.logger.warn(
        'Gmail credentials not configured, email sending will be disabled',
      );
      this.logger.warn(
        'Required: GMAIL_AUTH_USER and GMAIL_APP_PASSWORD environment variables',
      );
    }
  }

  async sendTranscriptionCompleteEmail(
    user: User,
    transcription: Transcription,
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured, skipping email send');
      return false;
    }

    // Check if user has email notifications enabled
    if (
      !user.emailNotifications?.enabled ||
      user.emailNotifications?.onTranscriptionComplete === false
    ) {
      this.logger.debug(`Email notifications disabled for user ${user.uid}`);
      return false;
    }

    try {
      const transcriptionUrl = `${this.frontendUrl}/${user.preferredLanguage || 'en'}/conversation/${transcription.id}`;
      const recipientName = user.displayName || 'there';
      const transcriptionTitle = transcription.title || transcription.fileName;

      // Get the user's preferred language for the email
      const locale = user.preferredLanguage || 'en';

      const subject = this.getLocalizedSubject(locale, transcriptionTitle);

      const htmlContent = this.generateTranscriptionCompleteEmailHtml(
        transcriptionTitle,
        transcriptionUrl,
        recipientName,
        transcription,
        locale,
      );

      const textContent = this.generateTranscriptionCompleteEmailText(
        transcriptionTitle,
        transcriptionUrl,
        recipientName,
        transcription,
        locale,
      );

      const info = await this.transporter.sendMail({
        from: `"Neural Summary" <${this.fromEmail}>`,
        to: user.email,
        subject,
        html: htmlContent,
        text: textContent,
      });

      this.logger.debug(
        `Transcription complete email sent to ${user.email} for transcription ${transcription.id}`,
        info.messageId,
      );
      return true;
    } catch (error: any) {
      this.logger.error('Error sending transcription complete email:', error);
      return false;
    }
  }

  private getLocalizedSubject(locale: string, title: string): string {
    const subjects = {
      en: `Your conversation "${title}" is ready`,
      nl: `Uw gesprek "${title}" is klaar`,
      de: `Ihr Gespräch "${title}" ist fertig`,
      fr: `Votre conversation "${title}" est prête`,
      es: `Tu conversación "${title}" está lista`,
    };
    return subjects[locale] || subjects.en;
  }

  async sendShareEmail(
    shareToken: string,
    transcriptionTitle: string,
    request: ShareEmailRequest,
    _locale: string = 'en',
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured, skipping email send');
      return false;
    }

    try {
      const shareUrl = `${this.frontendUrl}/s/${shareToken}`;
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

      this.logger.debug(
        `Share email sent successfully to ${request.recipientEmail}`,
        info.messageId,
      );
      return true;
    } catch (error: any) {
      this.logger.error('Error sending share email:', error);

      // Log specific error details for production debugging
      if (error.code === 'EAUTH') {
        this.logger.error(
          'Authentication failed - verify App Password and 2FA is enabled',
        );
      } else if (error.code === 'ESOCKET') {
        this.logger.error('Socket error - check network/firewall settings');
      } else if (error.responseCode === 534) {
        this.logger.error(
          'Google requires app-specific password or less secure app access',
        );
      } else if (error.responseCode === 535) {
        this.logger.error(
          'Invalid credentials - check GMAIL_AUTH_USER and GMAIL_APP_PASSWORD',
        );
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
  <title>Conversation Shared With You - Neural Summary</title>
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
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #111827;
      margin: 0;
      padding: 40px 20px;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      font-weight: 600;
      text-align: center;
      margin: 0 0 10px 0;
    }
    .greeting {
      font-size: 16px;
      color: #6b7280;
      text-align: center;
      margin-bottom: 10px;
    }
    .sender-info {
      font-size: 16px;
      color: #6b7280;
      text-align: center;
      margin-bottom: 30px;
    }
    .sender-name {
      color: #8D6AFA;
      font-weight: 600;
    }
    .conversation-title {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      text-align: center;
      margin: 20px 0 10px 0;
      padding: 15px;
      background-color: #f9fafb;
      border-radius: 8px;
    }
    .custom-message {
      font-size: 15px;
      color: #6b7280;
      text-align: center;
      font-style: italic;
      margin: 20px 0;
      padding: 15px;
      background-color: #F5F3FF;
      border-left: 3px solid #8D6AFA;
      border-radius: 4px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: #8D6AFA;
      color: white !important;
      text-decoration: none;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background-color: #7A5AE0;
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
      color: #8D6AFA;
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
      color: #9ca3af;
      margin: 5px 0;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body {
        background: #23194B !important;
      }
      .container {
        background-color: #1E1B4B !important;
        color: #e5e7eb !important;
      }
      h1 {
        color: #f3f4f6 !important;
      }
      .greeting, .sender-info {
        color: #d1d5db !important;
      }
      .conversation-title {
        background-color: #2D2A5B !important;
        color: #e5e7eb !important;
      }
      .custom-message {
        background-color: #2D2657 !important;
        color: #d1d5db !important;
      }
      .url-section {
        background-color: #2D2A5B !important;
      }
      .url-label {
        color: #9ca3af !important;
      }
      .link {
        color: #A78BFA !important;
      }
      .footer {
        border-top-color: #374151 !important;
      }
      .footer-text {
        color: #9ca3af !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="40" cellspacing="0" border="0" class="container" style="max-width: 600px; background-color: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <tr>
            <td>
              <div class="header" style="text-align: center; margin-bottom: 30px;">
                <img src="https://neuralsummary.com/assets/logos/neural-summary-logo.png" alt="Neural Summary" style="width: 200px; height: auto; margin: 0 auto;" />
              </div>
              <h1 style="color: #111827; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 10px 0;">Conversation Shared With You</h1>
              <p class="greeting" style="font-size: 16px; color: #6b7280; text-align: center; margin-bottom: 10px;">Hi ${recipientName || 'there'},</p>
              <p class="sender-info" style="font-size: 16px; color: #6b7280; text-align: center; margin-bottom: 30px;"><span class="sender-name" style="color: #8D6AFA; font-weight: 600;">${senderName}</span> has shared a conversation with you</p>

              <div class="conversation-title" style="font-size: 18px; font-weight: 600; color: #374151; text-align: center; margin: 20px 0 10px 0; padding: 15px; background-color: #f9fafb; border-radius: 8px;">${transcriptionTitle}</div>

              ${
                customMessage
                  ? `<div class="custom-message" style="font-size: 15px; color: #6b7280; text-align: center; font-style: italic; margin: 20px 0; padding: 15px; background-color: #F5F3FF; border-left: 3px solid #8D6AFA; border-radius: 4px;">"${customMessage}"<br><span style="font-size: 13px; color: #9ca3af;">— ${senderName}</span></div>`
                  : ''
              }

              <div class="button-container" style="text-align: center; margin: 30px 0;">
                <a href="${shareUrl}" class="button" style="display: inline-block; padding: 14px 32px; background-color: #8D6AFA; color: white !important; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 16px;">View Conversation →</a>
              </div>

              <div class="url-section" style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 20px;">
                <div class="url-label" style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Or copy and paste this link into your browser:</div>
                <a href="${shareUrl}" class="link" style="color: #8D6AFA; word-break: break-all; font-size: 14px; text-decoration: none;">${shareUrl}</a>
              </div>

              <div class="footer" style="text-align: center; margin-top: 40px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
                <p class="footer-text" style="font-size: 13px; color: #9ca3af; margin: 5px 0;">This link may expire or have limited views based on the sender's settings.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
    text += `${senderName} has shared a conversation with you:\n\n`;
    text += `"${transcriptionTitle}"\n\n`;

    if (customMessage) {
      text += `Message from ${senderName}:\n${customMessage}\n\n`;
    }

    text += `View the conversation here:\n${shareUrl}\n\n`;
    text += `This link may expire or have limited views based on the sender's settings.\n\n`;
    text += `---\nNeural Summary • ${new Date().getFullYear()}`;

    return text;
  }

  private generateTranscriptionCompleteEmailHtml(
    transcriptionTitle: string,
    transcriptionUrl: string,
    recipientName: string,
    transcription: Transcription,
    locale: string,
  ): string {
    // Calculate processing statistics (reserved for future template use)
    const _processingTime =
      transcription.completedAt && transcription.createdAt
        ? Math.round(
            (new Date(transcription.completedAt).getTime() -
              new Date(transcription.createdAt).getTime()) /
              1000 /
              60,
          )
        : null;

    const analysisTypes: string[] = [];
    if (transcription.analyses?.summary) analysisTypes.push('Summary');
    if (transcription.analyses?.actionItems) analysisTypes.push('Action Items');
    if (transcription.analyses?.communicationStyles)
      analysisTypes.push('Communication Styles');
    if (transcription.analyses?.emotionalIntelligence)
      analysisTypes.push('Emotional Intelligence');
    if (transcription.analyses?.influencePersuasion)
      analysisTypes.push('Influence & Persuasion');
    if (transcription.analyses?.personalDevelopment)
      analysisTypes.push('Personal Development');
    if (transcription.analyses?.custom) analysisTypes.push('Custom Analysis');

    const getLocalizedContent = (key: string) => {
      const content = {
        en: {
          greeting: `Hi ${recipientName}`,
          mainMessage:
            'Your conversation has been successfully processed and is ready to view.',
          processingTime: 'Processing time',
          minutes: 'minutes',
          duration: 'Audio duration',
          speakers: 'Speakers detected',
          analyses: 'AI Assets generated',
          viewButton: 'View Your Conversation',
          urlLabel: 'Or copy and paste this link into your browser:',
          footer1:
            'You received this email because you have email notifications enabled.',
          footer2:
            'To manage your notification preferences, visit your account settings.',
          unsubscribe: 'Unsubscribe from these notifications',
        },
        nl: {
          greeting: `Hallo ${recipientName}`,
          mainMessage:
            'Uw gesprek is succesvol verwerkt en klaar om te bekijken.',
          processingTime: 'Verwerkingstijd',
          minutes: 'minuten',
          duration: 'Audio duur',
          speakers: 'Sprekers gedetecteerd',
          analyses: 'AI Assets gegenereerd',
          viewButton: 'Bekijk Uw Gesprek',
          urlLabel: 'Of kopieer en plak deze link in uw browser:',
          footer1:
            'U ontvangt deze e-mail omdat u e-mailmeldingen heeft ingeschakeld.',
          footer2:
            'Om uw meldingsvoorkeuren te beheren, bezoek uw accountinstellingen.',
          unsubscribe: 'Uitschrijven van deze meldingen',
        },
        de: {
          greeting: `Hallo ${recipientName}`,
          mainMessage:
            'Ihr Gespräch wurde erfolgreich verarbeitet und ist bereit zur Ansicht.',
          processingTime: 'Verarbeitungszeit',
          minutes: 'Minuten',
          duration: 'Audiodauer',
          speakers: 'Sprecher erkannt',
          analyses: 'AI Assets generiert',
          viewButton: 'Gespräch Anzeigen',
          urlLabel: 'Oder kopieren Sie diesen Link in Ihren Browser:',
          footer1:
            'Sie erhalten diese E-Mail, weil Sie E-Mail-Benachrichtigungen aktiviert haben.',
          footer2:
            'Um Ihre Benachrichtigungseinstellungen zu verwalten, besuchen Sie Ihre Kontoeinstellungen.',
          unsubscribe: 'Von diesen Benachrichtigungen abmelden',
        },
        fr: {
          greeting: `Bonjour ${recipientName}`,
          mainMessage:
            'Votre conversation a été traitée avec succès et est prête à être consultée.',
          processingTime: 'Temps de traitement',
          minutes: 'minutes',
          duration: 'Durée audio',
          speakers: 'Locuteurs détectés',
          analyses: 'AI Assets générés',
          viewButton: 'Voir Votre Conversation',
          urlLabel: 'Ou copiez et collez ce lien dans votre navigateur :',
          footer1:
            'Vous recevez cet e-mail car vous avez activé les notifications par e-mail.',
          footer2:
            'Pour gérer vos préférences de notification, visitez les paramètres de votre compte.',
          unsubscribe: 'Se désabonner de ces notifications',
        },
        es: {
          greeting: `Hola ${recipientName}`,
          mainMessage:
            'Su conversación se ha procesado con éxito y está lista para ver.',
          processingTime: 'Tiempo de procesamiento',
          minutes: 'minutos',
          duration: 'Duración del audio',
          speakers: 'Hablantes detectados',
          analyses: 'AI Assets generados',
          viewButton: 'Ver Su Conversación',
          urlLabel: 'O copie y pegue este enlace en su navegador:',
          footer1:
            'Recibe este correo porque tiene las notificaciones por correo habilitadas.',
          footer2:
            'Para gestionar sus preferencias de notificación, visite la configuración de su cuenta.',
          unsubscribe: 'Cancelar suscripción a estas notificaciones',
        },
      };
      return content[locale]?.[key] || content.en[key];
    };

    return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${transcriptionTitle} - Neural Summary</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #111827;
      margin: 0;
      padding: 40px 20px;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      font-weight: 600;
      text-align: center;
      margin: 0 0 10px 0;
    }
    .greeting {
      font-size: 16px;
      color: #6b7280;
      text-align: center;
      margin-bottom: 30px;
    }
    .conversation-title {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      text-align: center;
      margin: 20px 0 30px 0;
      padding: 15px;
      background-color: #f9fafb;
      border-radius: 8px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: #8D6AFA;
      color: white !important;
      text-decoration: none;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background-color: #7A5AE0;
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
      color: #8D6AFA;
      word-break: break-all;
      font-size: 13px;
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
      color: #9ca3af;
      margin: 5px 0;
    }
    .unsubscribe {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 15px;
    }
    .unsubscribe a {
      color: #8D6AFA;
      text-decoration: none;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body {
        background: #23194B !important;
      }
      .container {
        background-color: #1E1B4B !important;
        color: #e5e7eb !important;
      }
      h1 {
        color: #f3f4f6 !important;
      }
      .greeting {
        color: #d1d5db !important;
      }
      .conversation-title {
        background-color: #2D2A5B !important;
        color: #e5e7eb !important;
      }
      .url-section {
        background-color: #2D2A5B !important;
      }
      .url-label {
        color: #9ca3af !important;
      }
      .link {
        color: #A78BFA !important;
      }
      .footer {
        border-top-color: #374151 !important;
      }
      .footer-text {
        color: #9ca3af !important;
      }
      .unsubscribe a {
        color: #A78BFA !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="40" cellspacing="0" border="0" class="container" style="max-width: 600px; background-color: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <tr>
            <td>
              <div class="header" style="text-align: center; margin-bottom: 30px;">
                <img src="https://neuralsummary.com/assets/logos/neural-summary-logo.png" alt="Neural Summary" style="width: 200px; height: auto; margin: 0 auto;" />
              </div>
              <h1 style="color: #111827; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 10px 0;">Conversation Ready!</h1>
              <p class="greeting" style="font-size: 16px; color: #6b7280; text-align: center; margin-bottom: 10px;">${getLocalizedContent('greeting')},</p>
              <p class="greeting" style="font-size: 16px; color: #6b7280; text-align: center; margin-bottom: 30px;">${getLocalizedContent('mainMessage')}</p>

              <div class="conversation-title" style="font-size: 18px; font-weight: 600; color: #374151; text-align: center; margin: 20px 0 30px 0; padding: 15px; background-color: #f9fafb; border-radius: 8px;">${transcriptionTitle}</div>

              <div class="button-container" style="text-align: center; margin: 30px 0;">
                <a href="${transcriptionUrl}" class="button" style="display: inline-block; padding: 14px 32px; background-color: #8D6AFA; color: white !important; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 16px;">${getLocalizedContent('viewButton')} →</a>
              </div>

              <div class="url-section" style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 20px;">
                <div class="url-label" style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">${getLocalizedContent('urlLabel')}</div>
                <a href="${transcriptionUrl}" class="link" style="color: #8D6AFA; word-break: break-all; font-size: 13px; text-decoration: none;">${transcriptionUrl}</a>
              </div>

              <div class="footer" style="text-align: center; margin-top: 40px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
                <p class="footer-text" style="font-size: 13px; color: #9ca3af; margin: 5px 0;">${getLocalizedContent('footer1')}</p>
                <p class="unsubscribe" style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                  <a href="${this.frontendUrl}/${locale}/settings" style="color: #8D6AFA; text-decoration: none;">${getLocalizedContent('unsubscribe')}</a>
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Send an email draft to the user's own email address
   * This allows users to review/edit and forward from their own mailbox
   */
  async sendEmailDraftToSelf(
    userEmail: string,
    userName: string,
    emailData: EmailDraftData,
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured, skipping email send');
      return false;
    }

    try {
      const htmlContent = this.generateEmailDraftHtml(emailData, userName);
      const textContent = this.generateEmailDraftText(emailData);

      const info = await this.transporter.sendMail({
        from: `"Neural Summary" <${this.fromEmail}>`,
        to: userEmail,
        subject: `[Draft] ${emailData.subject}`,
        html: htmlContent,
        text: textContent,
      });

      this.logger.debug(
        `Email draft sent to ${userEmail}, messageId: ${info.messageId}`,
      );
      return true;
    } catch (error: any) {
      this.logger.error('Error sending email draft:', error);
      return false;
    }
  }

  /**
   * Generate HTML for email draft - designed to look like a natural email
   * Clean, left-aligned, minimal styling so it can be forwarded professionally
   */
  private generateEmailDraftHtml(
    data: EmailDraftData,
    userName: string,
  ): string {
    // Build type-specific content with minimal styling
    let typeSpecificContent = '';

    switch (data.type) {
      case 'followUpEmail':
        typeSpecificContent = this.buildFollowUpEmailContent(data);
        break;
      case 'salesEmail':
        typeSpecificContent = this.buildSalesEmailContent(data);
        break;
      case 'internalUpdate':
        typeSpecificContent = this.buildInternalUpdateContent(data);
        break;
      case 'clientProposal':
        typeSpecificContent = this.buildClientProposalContent(data);
        break;
    }

    // Common body paragraphs - simple styling
    const bodyContent = data.body
      .map((p) => `<p style="margin: 0 0 1em 0;">${p}</p>`)
      .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.5; color: #222; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 32px; border-radius: 8px;">

    <!-- Draft banner -->
    <div style="background-color: #8D6AFA; color: white; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px; font-size: 14px;">
      <strong style="display: block; margin-bottom: 2px;">Email Draft from Neural Summary</strong>
      Hi ${userName}, review and edit this draft, then forward it from your mailbox.
    </div>

    <!-- Email content - clean, natural styling -->
    <div style="font-size: 15px; color: #333;">
      <p style="margin: 0 0 1em 0;">${data.greeting}</p>

      ${bodyContent}

      ${typeSpecificContent}

      <p style="margin: 1.5em 0 0 0;">${data.closing}</p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #999; text-align: center;">
      Generated by <a href="${this.frontendUrl}" style="color: #8D6AFA; text-decoration: none;">Neural Summary</a>
    </div>
  </div>
</body>
</html>
    `;
  }

  private buildFollowUpEmailContent(data: FollowUpEmailOutput): string {
    let content = '';

    if (data.meetingRecap) {
      content += `<p style="margin: 0 0 1em 0; color: #666; font-style: italic;">${data.meetingRecap}</p>`;
    }

    if (data.decisionsConfirmed && data.decisionsConfirmed.length > 0) {
      content += `<p style="margin: 1em 0 0.5em 0;"><strong>Decisions confirmed:</strong></p>`;
      content += `<ul style="margin: 0 0 1em 0; padding-left: 20px;">${data.decisionsConfirmed.map((d) => `<li style="margin-bottom: 4px;">${d}</li>`).join('')}</ul>`;
    }

    if (data.actionItems && data.actionItems.length > 0) {
      content += `<p style="margin: 1em 0 0.5em 0;"><strong>Action items:</strong></p>`;
      content += `<ul style="margin: 0 0 1em 0; padding-left: 20px;">${data.actionItems
        .map((item) => {
          let text = item.task;
          if (item.owner) text += ` <em>(${item.owner})</em>`;
          if (item.deadline) text += ` — ${item.deadline}`;
          return `<li style="margin-bottom: 4px;">${text}</li>`;
        })
        .join('')}</ul>`;
    }

    if (data.nextSteps) {
      content += `<p style="margin: 1em 0 0.5em 0;"><strong>Next steps:</strong></p>`;
      content += `<p style="margin: 0 0 1em 0;">${data.nextSteps}</p>`;
    }

    return content;
  }

  private buildSalesEmailContent(data: SalesEmailOutput): string {
    let content = '';

    if (data.painPointsAddressed && data.painPointsAddressed.length > 0) {
      content += `<p style="margin: 1em 0 0.5em 0;"><strong>Addressing your challenges:</strong></p>`;
      content += `<ul style="margin: 0 0 1em 0; padding-left: 20px;">${data.painPointsAddressed.map((p) => `<li style="margin-bottom: 4px;">${p}</li>`).join('')}</ul>`;
    }

    if (data.valueProposition) {
      content += `<p style="margin: 0 0 1em 0;">${data.valueProposition}</p>`;
    }

    if (data.urgencyHook) {
      content += `<p style="margin: 0 0 1em 0; font-style: italic;">${data.urgencyHook}</p>`;
    }

    if (data.callToAction) {
      content += `<p style="margin: 0 0 1em 0;"><strong>${data.callToAction}</strong></p>`;
    }

    return content;
  }

  private buildInternalUpdateContent(data: InternalUpdateOutput): string {
    let content = '';

    if (data.tldr) {
      content += `<p style="margin: 0 0 1em 0;"><strong>TL;DR:</strong> ${data.tldr}</p>`;
    }

    if (data.keyDecisions && data.keyDecisions.length > 0) {
      content += `<p style="margin: 1em 0 0.5em 0;"><strong>Key decisions:</strong></p>`;
      content += `<ul style="margin: 0 0 1em 0; padding-left: 20px;">${data.keyDecisions.map((d) => `<li style="margin-bottom: 4px;">${d}</li>`).join('')}</ul>`;
    }

    if (data.blockers && data.blockers.length > 0) {
      content += `<p style="margin: 1em 0 0.5em 0;"><strong>Blockers:</strong></p>`;
      content += `<ul style="margin: 0 0 1em 0; padding-left: 20px;">${data.blockers.map((b) => `<li style="margin-bottom: 4px;">${b}</li>`).join('')}</ul>`;
    }

    if (data.nextMilestone) {
      content += `<p style="margin: 1em 0 0.5em 0;"><strong>Next milestone:</strong> ${data.nextMilestone}</p>`;
    }

    return content;
  }

  private buildClientProposalContent(data: ClientProposalOutput): string {
    let content = '';

    if (data.executiveSummary) {
      content += `<p style="margin: 0 0 1em 0;"><strong>Executive summary:</strong> ${data.executiveSummary}</p>`;
    }

    if (data.requirementsSummary && data.requirementsSummary.length > 0) {
      content += `<p style="margin: 1em 0 0.5em 0;"><strong>Requirements:</strong></p>`;
      content += `<ul style="margin: 0 0 1em 0; padding-left: 20px;">${data.requirementsSummary.map((r) => `<li style="margin-bottom: 4px;">${r}</li>`).join('')}</ul>`;
    }

    if (data.proposedSolution) {
      content += `<p style="margin: 1em 0 0.5em 0;"><strong>Proposed solution:</strong></p>`;
      content += `<p style="margin: 0 0 1em 0;">${data.proposedSolution}</p>`;
    }

    if (data.timelineEstimate) {
      content += `<p style="margin: 0 0 1em 0;"><strong>Timeline:</strong> ${data.timelineEstimate}</p>`;
    }

    if (data.nextStepsToEngage && data.nextStepsToEngage.length > 0) {
      content += `<p style="margin: 1em 0 0.5em 0;"><strong>Next steps:</strong></p>`;
      content += `<ol style="margin: 0; padding-left: 1.5em;">`;
      data.nextStepsToEngage.forEach((step) => {
        content += `<li style="margin: 0.25em 0;">${step}</li>`;
      });
      content += `</ol>`;
    }

    return content;
  }

  /**
   * Generate plain text version of email draft
   */
  private generateEmailDraftText(data: EmailDraftData): string {
    let text = `[EMAIL DRAFT FROM NEURAL SUMMARY]\n`;
    text += `Review and edit this draft, then forward it from your mailbox.\n\n`;
    text += `---\n\n`;
    text += `Subject: ${data.subject}\n\n`;
    text += `${data.greeting}\n\n`;
    text += data.body.join('\n\n') + '\n\n';

    switch (data.type) {
      case 'followUpEmail':
        if (data.meetingRecap) text += `${data.meetingRecap}\n\n`;
        if (data.decisionsConfirmed?.length) {
          text += `DECISIONS CONFIRMED:\n`;
          data.decisionsConfirmed.forEach((d) => (text += `• ${d}\n`));
          text += '\n';
        }
        if (data.actionItems?.length) {
          text += `ACTION ITEMS:\n`;
          data.actionItems.forEach((item) => {
            let line = `• ${item.task}`;
            if (item.owner) line += ` (${item.owner})`;
            if (item.deadline) line += ` - ${item.deadline}`;
            text += line + '\n';
          });
          text += '\n';
        }
        if (data.nextSteps) text += `NEXT STEPS:\n${data.nextSteps}\n\n`;
        break;

      case 'salesEmail':
        if (data.painPointsAddressed?.length) {
          text += `ADDRESSING YOUR CHALLENGES:\n`;
          data.painPointsAddressed.forEach((p) => (text += `• ${p}\n`));
          text += '\n';
        }
        if (data.valueProposition)
          text += `HOW WE CAN HELP:\n${data.valueProposition}\n\n`;
        if (data.urgencyHook) text += `${data.urgencyHook}\n\n`;
        if (data.callToAction) text += `>>> ${data.callToAction} <<<\n\n`;
        break;

      case 'internalUpdate':
        if (data.tldr) text += `TL;DR: ${data.tldr}\n\n`;
        if (data.keyDecisions?.length) {
          text += `KEY DECISIONS:\n`;
          data.keyDecisions.forEach((d) => (text += `• ${d}\n`));
          text += '\n';
        }
        if (data.blockers?.length) {
          text += `BLOCKERS:\n`;
          data.blockers.forEach((b) => (text += `• ${b}\n`));
          text += '\n';
        }
        if (data.nextMilestone)
          text += `NEXT MILESTONE: ${data.nextMilestone}\n\n`;
        break;

      case 'clientProposal':
        if (data.executiveSummary)
          text += `EXECUTIVE SUMMARY:\n${data.executiveSummary}\n\n`;
        if (data.requirementsSummary?.length) {
          text += `REQUIREMENTS:\n`;
          data.requirementsSummary.forEach((r) => (text += `• ${r}\n`));
          text += '\n';
        }
        if (data.proposedSolution)
          text += `PROPOSED SOLUTION:\n${data.proposedSolution}\n\n`;
        if (data.timelineEstimate)
          text += `TIMELINE: ${data.timelineEstimate}\n\n`;
        if (data.nextStepsToEngage && data.nextStepsToEngage.length > 0)
          text += `NEXT STEPS:\n${data.nextStepsToEngage.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\n`;
        break;
    }

    text += data.closing + '\n\n';
    text += `---\nGenerated by Neural Summary • ${this.frontendUrl}`;

    return text;
  }

  private generateTranscriptionCompleteEmailText(
    transcriptionTitle: string,
    transcriptionUrl: string,
    recipientName: string,
    transcription: Transcription,
    locale: string,
  ): string {
    const getLocalizedContent = (key: string) => {
      const content = {
        en: {
          greeting: `Hi ${recipientName}`,
          mainMessage:
            'Your conversation has been successfully processed and is ready to view.',
          title: 'Conversation',
          processingComplete: 'Processing complete',
          viewHere: 'View your conversation here',
          footer:
            'You received this email because you have email notifications enabled. To manage your preferences, visit your account settings.',
        },
        nl: {
          greeting: `Hallo ${recipientName}`,
          mainMessage:
            'Uw gesprek is succesvol verwerkt en klaar om te bekijken.',
          title: 'Gesprek',
          processingComplete: 'Verwerking voltooid',
          viewHere: 'Bekijk uw gesprek hier',
          footer:
            'U ontvangt deze e-mail omdat u e-mailmeldingen heeft ingeschakeld. Om uw voorkeuren te beheren, bezoek uw accountinstellingen.',
        },
        de: {
          greeting: `Hallo ${recipientName}`,
          mainMessage:
            'Ihr Gespräch wurde erfolgreich verarbeitet und ist bereit zur Ansicht.',
          title: 'Gespräch',
          processingComplete: 'Verarbeitung abgeschlossen',
          viewHere: 'Sehen Sie Ihr Gespräch hier',
          footer:
            'Sie erhalten diese E-Mail, weil Sie E-Mail-Benachrichtigungen aktiviert haben. Um Ihre Einstellungen zu verwalten, besuchen Sie Ihre Kontoeinstellungen.',
        },
        fr: {
          greeting: `Bonjour ${recipientName}`,
          mainMessage:
            'Votre conversation a été traitée avec succès et est prête à être consultée.',
          title: 'Conversation',
          processingComplete: 'Traitement terminé',
          viewHere: 'Consultez votre conversation ici',
          footer:
            'Vous recevez cet e-mail car vous avez activé les notifications par e-mail. Pour gérer vos préférences, visitez les paramètres de votre compte.',
        },
        es: {
          greeting: `Hola ${recipientName}`,
          mainMessage:
            'Su conversación se ha procesado con éxito y está lista para ver.',
          title: 'Conversación',
          processingComplete: 'Procesamiento completado',
          viewHere: 'Ver su conversación aquí',
          footer:
            'Recibe este correo porque tiene las notificaciones por correo habilitadas. Para gestionar sus preferencias, visite la configuración de su cuenta.',
        },
      };
      return content[locale]?.[key] || content.en[key];
    };

    let text = `${getLocalizedContent('greeting')},\n\n`;
    text += `${getLocalizedContent('mainMessage')}\n\n`;
    text += `${getLocalizedContent('title')}: "${transcriptionTitle}"\n`;

    if (transcription.duration) {
      text += `Duration: ${Math.round(transcription.duration / 60)} minutes\n`;
    }
    if (transcription.speakerCount) {
      text += `Speakers: ${transcription.speakerCount}\n`;
    }

    text += `\n${getLocalizedContent('processingComplete')}!\n\n`;
    text += `${getLocalizedContent('viewHere')}:\n${transcriptionUrl}\n\n`;
    text += `---\n${getLocalizedContent('footer')}\n\n`;
    text += `Neural Summary • ${new Date().getFullYear()}`;

    return text;
  }

  /**
   * Send a contact form email to the support team
   */
  async sendContactEmail(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    locale?: string;
  }): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured, skipping contact email');
      return false;
    }

    const subjectLabels: Record<string, string> = {
      general: 'General Inquiry',
      support: 'Technical Support',
      sales: 'Sales',
      partnership: 'Partnership',
    };

    const subjectLabel = subjectLabels[data.subject] || data.subject;
    const emailSubject = `[Contact Form] ${subjectLabel} from ${data.name}`;

    try {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #23194B; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 20px; }
    .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: 600; color: #374151; font-size: 14px; }
    .value { color: #6b7280; margin-top: 4px; }
    .message { background-color: white; padding: 15px; border-radius: 8px; border-left: 3px solid #8D6AFA; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Contact Form Submission</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">From</div>
        <div class="value">${data.name} &lt;${data.email}&gt;</div>
      </div>
      <div class="field">
        <div class="label">Subject</div>
        <div class="value">${subjectLabel}</div>
      </div>
      <div class="field">
        <div class="label">Locale</div>
        <div class="value">${data.locale || 'en'}</div>
      </div>
      <div class="field">
        <div class="label">Message</div>
        <div class="message">${data.message.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      const textContent = `
New Contact Form Submission
===========================

From: ${data.name} <${data.email}>
Subject: ${subjectLabel}
Locale: ${data.locale || 'en'}

Message:
${data.message}
      `;

      const info = await this.transporter.sendMail({
        from: `"Neural Summary Contact" <${this.fromEmail}>`,
        to: 'hello@neuralsummary.com',
        replyTo: data.email,
        subject: emailSubject,
        html: htmlContent,
        text: textContent,
      });

      this.logger.log(`Contact email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send contact email:', error);
      return false;
    }
  }
}
