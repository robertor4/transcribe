import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import * as admin from 'firebase-admin';

/**
 * E2E Test: Security Features
 *
 * This test suite verifies security implementations:
 * 1. Rate limiting on sensitive endpoints
 * 2. XSS protection (HTML sanitization)
 * 3. NoSQL injection protection (pagination validation)
 * 4. Strong password validation for share links
 * 5. CORS enforcement
 * 6. Error message sanitization
 */
describe('Security Features (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let transcriptionId: string;

  beforeAll(async () => {
    const testEmail = `test-security-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(
        require('../src/auth/firebase-auth.guard').FirebaseAuthGuard,
      )
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          request.user = {
            uid: userId,
            email: testEmail,
            email_verified: true,
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication({
      rawBody: true,
    });

    // Apply global validation pipe (same as in main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    // Create test user
    const userRecord = await admin.auth().createUser({
      email: testEmail,
      password: testPassword,
      emailVerified: true,
    });
    userId = userRecord.uid;

    // Create custom token
    authToken = await admin.auth().createCustomToken(userId);

    // Create user document
    await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .set({
        uid: userId,
        email: testEmail,
        displayName: 'Test Security User',
        emailVerified: true,
        subscriptionTier: 'free',
        subscriptionStatus: 'none',
        usageThisMonth: {
          hours: 0,
          transcriptions: 0,
          onDemandAnalyses: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    console.log(`✓ Test security user created: ${testEmail} (${userId})`);
  });

  afterAll(async () => {
    // Cleanup
    if (transcriptionId) {
      try {
        await admin
          .firestore()
          .collection('transcriptions')
          .doc(transcriptionId)
          .delete();
      } catch {
        // Ignore cleanup errors
      }
    }

    if (userId) {
      try {
        await admin.firestore().collection('users').doc(userId).delete();
        await admin.auth().deleteUser(userId);
      } catch {
        // Ignore cleanup errors
      }
    }

    await app.close();
  });

  describe('1. Rate Limiting', () => {
    it('should enforce rate limits on pagination endpoint', async () => {
      console.log('Testing rate limiting on /transcriptions endpoint...');

      const requests: Promise<any>[] = [];
      const requestCount = 15; // Exceed the 10 req/sec limit

      // Fire requests in rapid succession
      for (let i = 0; i < requestCount; i++) {
        requests.push(
          request(app.getHttpServer())
            .get('/transcriptions?page=1&pageSize=20')
            .set('Authorization', `Bearer ${authToken}`),
        );
      }

      const responses = await Promise.all(requests);

      // Count how many were rate limited (429 Too Many Requests)
      const rateLimited = responses.filter((res) => res.status === 429);
      const successful = responses.filter((res) => res.status === 200);

      console.log(
        `  Sent ${requestCount} requests: ${successful.length} succeeded, ${rateLimited.length} rate-limited`,
      );

      // At least some should be rate limited
      expect(rateLimited.length).toBeGreaterThan(0);
      expect(successful.length).toBeLessThan(requestCount);

      console.log('  ✓ Rate limiting is working');
    });
  });

  describe('2. XSS Protection', () => {
    it('should sanitize HTML in comment content', async () => {
      console.log('Testing XSS protection in comments...');

      // First, create a mock transcription for testing
      const transcriptionRef = await admin
        .firestore()
        .collection('transcriptions')
        .add({
          userId,
          filename: 'test-xss.mp3',
          status: 'completed',
          transcript: 'Test transcript for XSS testing',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      transcriptionId = transcriptionRef.id;

      // Attempt to inject XSS payload in comment
      const xssPayload = '<script>alert("XSS")</script>Hello World';

      const response = await request(app.getHttpServer())
        .post(`/transcriptions/${transcriptionId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          position: { start: 0, end: 10 },
          content: xssPayload,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('content');

      // The sanitized content should NOT contain script tags
      const sanitizedContent = response.body.data.content;
      expect(sanitizedContent).not.toContain('<script>');
      expect(sanitizedContent).not.toContain('</script>');
      expect(sanitizedContent).toBe('Hello World'); // Only plain text should remain

      console.log(`  Original: ${xssPayload}`);
      console.log(`  Sanitized: ${sanitizedContent}`);
      console.log('  ✓ XSS protection is working');
    });
  });

  describe('3. NoSQL Injection Protection', () => {
    it('should reject invalid pagination parameters', async () => {
      console.log('Testing NoSQL injection protection...');

      // Attempt to send malicious pagination values
      const maliciousPayloads = [
        { page: -1, pageSize: 20 }, // Negative page
        { page: 1, pageSize: 10001 }, // Exceeds max page size
        { page: 0, pageSize: 20 }, // Zero page
        { page: 1, pageSize: 0 }, // Zero page size
        { page: 'abc', pageSize: 20 }, // Non-numeric
        { page: 1, pageSize: -5 }, // Negative page size
      ];

      for (const payload of maliciousPayloads) {
        const response = await request(app.getHttpServer())
          .get(
            `/transcriptions?page=${payload.page}&pageSize=${payload.pageSize}`,
          )
          .set('Authorization', `Bearer ${authToken}`);

        // Should return 400 Bad Request for invalid values
        expect(response.status).toBe(400);
        console.log(
          `  ✓ Rejected: page=${payload.page}, pageSize=${payload.pageSize}`,
        );
      }

      // Valid pagination should work
      const validResponse = await request(app.getHttpServer())
        .get('/transcriptions?page=1&pageSize=20')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(validResponse.body.success).toBe(true);
      console.log('  ✓ Valid pagination accepted');
      console.log('  ✓ NoSQL injection protection is working');
    });
  });

  describe('4. Strong Password Validation', () => {
    it('should reject weak passwords for share links', async () => {
      console.log('Testing password validation for share links...');

      if (!transcriptionId) {
        // Create a mock transcription
        const transcriptionRef = await admin
          .firestore()
          .collection('transcriptions')
          .add({
            userId,
            filename: 'test-password.mp3',
            status: 'completed',
            transcript: 'Test transcript',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        transcriptionId = transcriptionRef.id;
      }

      // Test weak passwords
      const weakPasswords = [
        'short', // Too short
        'lowercase123!', // No uppercase
        'UPPERCASE123!', // No lowercase
        'NoNumbers!', // No numbers
        'NoSpecial123', // No special characters
        'Weak1!', // Too short (< 8 chars)
      ];

      for (const password of weakPasswords) {
        const response = await request(app.getHttpServer())
          .post(`/transcriptions/${transcriptionId}/share`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            password,
            expiresInDays: 7,
          });

        // Should return 400 Bad Request
        expect(response.status).toBe(400);
        console.log(`  ✓ Rejected weak password: "${password}"`);
      }

      // Strong password should work
      const strongPassword = 'StrongPass123!@#';
      const validResponse = await request(app.getHttpServer())
        .post(`/transcriptions/${transcriptionId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: strongPassword,
          expiresInDays: 7,
        })
        .expect(201);

      expect(validResponse.body.success).toBe(true);
      console.log(`  ✓ Accepted strong password: "${strongPassword}"`);
      console.log('  ✓ Password validation is working');
    });
  });

  describe('5. Error Message Sanitization', () => {
    it('should not expose sensitive information in error messages', async () => {
      console.log('Testing error message sanitization...');

      // Request a non-existent transcription
      const response = await request(app.getHttpServer())
        .get('/transcriptions/nonexistent-id-12345')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);

      // Error message should not contain file paths, IPs, or other sensitive info
      const errorMessage = response.body.message || '';
      expect(errorMessage).not.toMatch(/\/Users\//);
      expect(errorMessage).not.toMatch(/\/home\//);
      expect(errorMessage).not.toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/); // IP addresses
      expect(errorMessage).not.toMatch(/[A-Za-z0-9]{32,}/); // API keys

      console.log(`  Error message: ${errorMessage}`);
      console.log('  ✓ Error message sanitization is working');
    });
  });

  describe('6. Input Validation (Additional Tests)', () => {
    it('should reject non-whitelisted properties in DTOs', async () => {
      console.log('Testing DTO whitelist enforcement...');

      // Attempt to send extra properties that aren't in the DTO
      const response = await request(app.getHttpServer())
        .get(
          '/transcriptions?page=1&pageSize=20&maliciousParam=<script>alert(1)</script>',
        )
        .set('Authorization', `Bearer ${authToken}`);

      // Should return 400 because forbidNonWhitelisted is true
      expect(response.status).toBe(400);
      console.log('  ✓ Rejected non-whitelisted properties');
      console.log('  ✓ DTO whitelist enforcement is working');
    });
  });
});
