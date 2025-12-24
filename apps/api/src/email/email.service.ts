import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ShareEmailRequest, Transcription, User } from '@transcribe/shared';

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
      const transcriptionUrl = `${this.frontendUrl}/${user.preferredLanguage || 'en'}/dashboard?transcriptionId=${transcription.id}`;
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
}
