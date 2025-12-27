import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

// Create mock functions that will be used by the mock
const mockTransporter = {
  sendMail: jest.fn(),
  verify: jest.fn((cb: any) => cb(null, true)),
};

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

describe('EmailService', () => {
  let service: EmailService;
  let mockConfigService: any;

  describe('when configured', () => {
    beforeEach(async () => {
      mockConfigService = {
        get: jest.fn((key: string) => {
          switch (key) {
            case 'GMAIL_AUTH_USER':
              return 'test@gmail.com';
            case 'GMAIL_APP_PASSWORD':
              return 'app-password-123';
            case 'GMAIL_FROM_EMAIL':
              return 'noreply@neuralsummary.com';
            case 'FRONTEND_URL':
              return 'https://neuralsummary.com';
            default:
              return null;
          }
        }),
      };

      // Reset mocks
      mockTransporter.sendMail
        .mockReset()
        .mockResolvedValue({ messageId: 'msg-123' });
      mockTransporter.verify
        .mockReset()
        .mockImplementation((cb: any) => cb(null, true));

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('sendTranscriptionCompleteEmail', () => {
      const mockUser = {
        uid: 'user-123',
        email: 'user@example.com',
        displayName: 'Test User',
        preferredLanguage: 'en',
        emailNotifications: {
          enabled: true,
          onTranscriptionComplete: true,
        },
      } as any;

      const mockTranscription = {
        id: 'trans-123',
        title: 'Meeting Notes',
        fileName: 'meeting.mp3',
        status: 'completed',
        durationSeconds: 300,
        speakers: [{ speakerTag: 'Speaker A' }],
      } as any;

      it('should send email when notifications are enabled', async () => {
        const result = await service.sendTranscriptionCompleteEmail(
          mockUser,
          mockTranscription,
        );

        expect(result).toBe(true);
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'user@example.com',
            subject: expect.stringContaining('Meeting Notes'),
          }),
        );
      });

      it('should skip sending when notifications are disabled', async () => {
        const userWithDisabledNotifications = {
          ...mockUser,
          emailNotifications: { enabled: false },
        };

        const result = await service.sendTranscriptionCompleteEmail(
          userWithDisabledNotifications,
          mockTranscription,
        );

        expect(result).toBe(false);
        expect(mockTransporter.sendMail).not.toHaveBeenCalled();
      });

      it('should skip when onTranscriptionComplete is false', async () => {
        const userWithDisabledTranscriptionNotifs = {
          ...mockUser,
          emailNotifications: {
            enabled: true,
            onTranscriptionComplete: false,
          },
        };

        const result = await service.sendTranscriptionCompleteEmail(
          userWithDisabledTranscriptionNotifs,
          mockTranscription,
        );

        expect(result).toBe(false);
        expect(mockTransporter.sendMail).not.toHaveBeenCalled();
      });

      it('should use filename when title is not set', async () => {
        const transcriptionWithoutTitle = {
          ...mockTranscription,
          title: undefined,
        };

        await service.sendTranscriptionCompleteEmail(
          mockUser,
          transcriptionWithoutTitle,
        );

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: expect.stringContaining('meeting.mp3'),
          }),
        );
      });

      it('should handle sendMail errors gracefully', async () => {
        mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

        const result = await service.sendTranscriptionCompleteEmail(
          mockUser,
          mockTranscription,
        );

        expect(result).toBe(false);
      });

      it('should use default name when displayName is not set', async () => {
        const userWithoutName = { ...mockUser, displayName: undefined };

        await service.sendTranscriptionCompleteEmail(
          userWithoutName,
          mockTranscription,
        );

        expect(mockTransporter.sendMail).toHaveBeenCalled();
      });
    });

    describe('sendShareEmail', () => {
      const mockShareRequest = {
        recipientEmail: 'recipient@example.com',
        message: 'Check out this transcript',
        senderName: 'Sender User',
        recipientName: 'Recipient User',
      } as any;

      it('should send share email', async () => {
        const result = await service.sendShareEmail(
          'abc123',
          'Important Meeting',
          mockShareRequest,
        );

        expect(result).toBe(true);
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'recipient@example.com',
            subject: expect.stringContaining('Important Meeting'),
          }),
        );
      });

      it('should handle sendMail errors gracefully', async () => {
        mockTransporter.sendMail.mockRejectedValue(new Error('Network error'));

        const result = await service.sendShareEmail(
          'abc123',
          'Test Meeting',
          mockShareRequest,
        );

        expect(result).toBe(false);
      });
    });

    describe('sendEmailDraftToSelf', () => {
      const mockEmailDraft = {
        type: 'followUpEmail' as const,
        subject: 'Follow-up from our meeting',
        greeting: 'Hi,',
        meetingRecap: 'Thank you for your time today',
        body: ['First paragraph.', 'Second paragraph.'],
        actionItems: ['Item 1', 'Item 2'],
        nextSteps: 'Let me know if you have questions',
        closing: 'Best regards',
      };

      it('should send email draft to user', async () => {
        const result = await service.sendEmailDraftToSelf(
          'user@example.com',
          'Test User',
          mockEmailDraft,
        );

        expect(result).toBe(true);
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'user@example.com',
            subject: '[Draft] Follow-up from our meeting',
          }),
        );
      });

      it('should handle different draft types', async () => {
        const salesDraft = {
          type: 'salesEmail' as const,
          subject: 'Great meeting you!',
          greeting: 'Hi there,',
          body: ['Thanks for the call.', 'Here is what we discussed.'],
          painPointsAddressed: ['Pain 1', 'Pain 2'],
          valueProposition: 'Our solution helps with...',
          callToAction: 'Schedule a demo',
          closing: 'Best',
        };

        const result = await service.sendEmailDraftToSelf(
          'user@example.com',
          'Test User',
          salesDraft,
        );

        expect(result).toBe(true);
        expect(mockTransporter.sendMail).toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

        const result = await service.sendEmailDraftToSelf(
          'user@example.com',
          'Test User',
          mockEmailDraft,
        );

        expect(result).toBe(false);
      });
    });
  });

  describe('when not configured', () => {
    beforeEach(async () => {
      mockConfigService = {
        get: jest.fn().mockReturnValue(null),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    it('should return false when transporter is not configured', async () => {
      const result = await service.sendTranscriptionCompleteEmail(
        {
          uid: '123',
          email: 'test@example.com',
          emailNotifications: { enabled: true },
        } as any,
        { id: 'trans-123', title: 'Test' } as any,
      );

      expect(result).toBe(false);
    });

    it('should return false for share email when not configured', async () => {
      const result = await service.sendShareEmail('abc123', 'Test', {
        recipientEmail: 'test@example.com',
      } as any);

      expect(result).toBe(false);
    });

    it('should return false for email draft when not configured', async () => {
      const result = await service.sendEmailDraftToSelf(
        'test@example.com',
        'Test User',
        {
          type: 'followUpEmail',
          subject: 'Test',
          greeting: 'Hi',
          meetingRecap: 'test',
          body: ['test'],
          actionItems: [],
          nextSteps: 'test',
          closing: 'bye',
        } as any,
      );

      expect(result).toBe(false);
    });
  });
});
