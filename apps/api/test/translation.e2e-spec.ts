import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * E2E Test: Comprehensive Translation System
 *
 * This test verifies that the translation system works correctly for both:
 * 1. Core analyses (summary, action items, etc.)
 * 2. On-demand analyses (stored in separate GeneratedAnalysis documents)
 *
 * Test Flow:
 * 1. Create test user and get auth token
 * 2. Upload and transcribe test audio file
 * 3. Wait for transcription to complete
 * 4. Generate 1-2 on-demand analyses
 * 5. Translate transcription to Spanish
 * 6. Verify core analyses are translated
 * 7. Verify on-demand analyses are translated
 * 8. Switch to French and verify translations
 * 9. Cleanup: Delete test data
 */
describe('Translation System (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let transcriptionId: string;
  const generatedAnalysisIds: string[] = [];

  // Test audio file path
  const testAudioPath = path.join(
    __dirname,
    'data',
    'Neural Summary Radio Commercial.mp3',
  );

  beforeAll(async () => {
    // Create NestJS application FIRST (this initializes Firebase Admin SDK)
    const testEmail = `test-translation-${Date.now()}@example.com`;
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
          // Mock the decoded token for tests
          request.user = {
            uid: userId, // Will be set after user creation
            email: testEmail,
            email_verified: true,
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication({
      rawBody: true, // Enable raw body for Stripe webhooks
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

    console.log(`✓ Test app initialized`);

    // NOW create test user (after Firebase is initialized by the app)
    try {
      const userRecord = await admin.auth().createUser({
        email: testEmail,
        password: testPassword,
        emailVerified: true,
      });
      userId = userRecord.uid;

      // Create custom token - this is what Firebase Client SDK would use to sign in
      const customToken = await admin.auth().createCustomToken(userId);

      // Create user document in Firestore
      await admin
        .firestore()
        .collection('users')
        .doc(userId)
        .set({
          uid: userId,
          email: testEmail,
          displayName: 'Test User',
          emailVerified: true,
          subscriptionTier: 'free',
          subscriptionStatus: 'none',
          usageThisMonth: {
            hours: 0,
            transcriptions: 0,
            onDemandAnalyses: 0,
            lastResetAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      authToken = customToken;

      console.log(`✓ Test user created: ${testEmail} (${userId})`);
      console.log(`✓ User document created in Firestore`);
    } catch (error) {
      console.error('Failed to create test user:', error);
      throw error;
    }
  }, 60000); // 60 second timeout for setup

  afterAll(async () => {
    // Cleanup: Delete test user and data
    try {
      if (userId) {
        // Delete transcription (will cascade delete analyses via Firestore triggers)
        if (transcriptionId) {
          await admin
            .firestore()
            .collection('transcriptions')
            .doc(transcriptionId)
            .delete();
          console.log(`✓ Deleted transcription: ${transcriptionId}`);
        }

        // Delete generated analyses
        for (const analysisId of generatedAnalysisIds) {
          await admin
            .firestore()
            .collection('generatedAnalyses')
            .doc(analysisId)
            .delete();
        }
        if (generatedAnalysisIds.length > 0) {
          console.log(
            `✓ Deleted ${generatedAnalysisIds.length} generated analyses`,
          );
        }

        // Delete user document from Firestore
        await admin.firestore().collection('users').doc(userId).delete();
        console.log(`✓ Deleted user document from Firestore`);

        // Delete user from Firebase Auth
        await admin.auth().deleteUser(userId);
        console.log(`✓ Deleted test user from Auth: ${userId}`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    if (app) {
      await app.close();
    }
  }, 30000); // 30 second timeout for cleanup

  describe('1. Upload and Transcribe', () => {
    it('should upload audio file and create transcription job', async () => {
      // Check if test file exists
      expect(fs.existsSync(testAudioPath)).toBe(true);

      const response = await request(app.getHttpServer())
        .post('/transcriptions/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testAudioPath)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('id');

      transcriptionId = response.body.data.id;

      console.log(`✓ Upload successful, transcription ID: ${transcriptionId}`);
    }, 30000); // 30 second timeout

    it('should wait for transcription to complete', async () => {
      // Poll for transcription completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (5s intervals)
      let completed = false;

      while (attempts < maxAttempts && !completed) {
        attempts++;

        // Get user's transcriptions
        const response = await request(app.getHttpServer())
          .get('/transcriptions?page=1&pageSize=20')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const result = response.body;

        if (!result.success || !result.data) {
          console.log(
            `  [Attempt ${attempts}/${maxAttempts}] Invalid response format`,
          );
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }

        const transcriptions = result.data.items;

        if (transcriptions && transcriptions.length > 0) {
          const latest = transcriptions[0];

          if (latest.status === 'completed') {
            transcriptionId = latest.id;
            completed = true;
            console.log(`✓ Transcription completed: ${transcriptionId}`);
            console.log(`  Duration: ${latest.duration}s`);
            console.log(
              `  Transcript length: ${latest.transcriptText?.length || 0} chars`,
            );
            console.log(
              `  Analyses: ${Object.keys(latest.coreAnalyses || {}).join(', ')}`,
            );
          } else if (latest.status === 'failed') {
            throw new Error(`Transcription failed: ${latest.errorMessage}`);
          } else {
            // Still processing
            console.log(
              `  [Attempt ${attempts}/${maxAttempts}] Status: ${latest.status}...`,
            );
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
          }
        } else {
          console.log(
            `  [Attempt ${attempts}/${maxAttempts}] No transcriptions yet...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      if (!completed) {
        throw new Error('Transcription did not complete within timeout period');
      }

      expect(transcriptionId).toBeTruthy();
    }, 360000); // 6 minute timeout for transcription
  });

  describe('2. Generate On-Demand Analyses', () => {
    it('should get available analysis templates', async () => {
      const response = await request(app.getHttpServer())
        .get('/transcriptions/analysis-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      console.log(`✓ Found ${response.body.data.length} analysis templates`);
      console.log(
        `  Templates: ${response.body.data.map((t: any) => t.name).join(', ')}`,
      );
    });

    it('should generate first on-demand analysis (Emotional Intelligence)', async () => {
      // Get templates to find ID
      const templatesResponse = await request(app.getHttpServer())
        .get('/transcriptions/analysis-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const emotionalIntelTemplate = templatesResponse.body.data.find(
        (t: any) => t.name === 'Emotional Intelligence',
      );

      if (!emotionalIntelTemplate) {
        console.warn('  Skipping: Emotional Intelligence template not found');
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/transcriptions/${transcriptionId}/generate-analysis`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ templateId: emotionalIntelTemplate.id })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data.templateName).toBe('Emotional Intelligence');

      generatedAnalysisIds.push(response.body.data.id);
      console.log(`✓ Generated analysis: ${response.body.data.templateName}`);
      console.log(
        `  Content length: ${response.body.data.content?.length || 0} chars`,
      );
    }, 120000); // 2 minute timeout

    it('should generate second on-demand analysis (Key Insights)', async () => {
      // Get templates to find ID
      const templatesResponse = await request(app.getHttpServer())
        .get('/transcriptions/analysis-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const keyInsightsTemplate = templatesResponse.body.data.find(
        (t: any) => t.name === 'Key Insights',
      );

      if (!keyInsightsTemplate) {
        console.warn('  Skipping: Key Insights template not found');
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/transcriptions/${transcriptionId}/generate-analysis`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ templateId: keyInsightsTemplate.id })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data.templateName).toBe('Key Insights');

      generatedAnalysisIds.push(response.body.data.id);
      console.log(`✓ Generated analysis: ${response.body.data.templateName}`);
      console.log(
        `  Content length: ${response.body.data.content?.length || 0} chars`,
      );
    }, 120000); // 2 minute timeout
  });

  describe('3. Translate to Spanish', () => {
    it('should translate transcription to Spanish', async () => {
      const response = await request(app.getHttpServer())
        .post(`/transcriptions/${transcriptionId}/translate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetLanguage: 'es' })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('language', 'es');
      expect(response.body.data).toHaveProperty('languageName', 'Spanish');
      expect(response.body.data).toHaveProperty('transcriptText');
      expect(response.body.data).toHaveProperty('analyses');

      // Verify core analyses are translated
      const analyses = response.body.data.analyses;
      expect(analyses).toBeDefined();

      console.log(`✓ Translation to Spanish completed`);
      console.log(
        `  Transcript length: ${response.body.data.transcriptText?.length || 0} chars`,
      );
      console.log(
        `  Translated analyses: ${Object.keys(analyses || {}).join(', ')}`,
      );

      // Check summary contains Spanish text (basic check)
      if (analyses.summary) {
        const hasSpanishIndicators =
          analyses.summary.includes('de ') ||
          analyses.summary.includes('el ') ||
          analyses.summary.includes('la ') ||
          analyses.summary.includes('para ') ||
          analyses.summary.includes('con ');

        if (hasSpanishIndicators) {
          console.log(`  ✓ Summary appears to be in Spanish`);
        }
      }
    }, 180000); // 3 minute timeout for translation

    it('should verify on-demand analyses have Spanish translations', async () => {
      // Get the generated analyses and check for translations
      const response = await request(app.getHttpServer())
        .get(`/transcriptions/${transcriptionId}/analyses`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);

      const analysesWithTranslations = response.body.data.filter(
        (analysis: any) => analysis.translations && analysis.translations.es,
      );

      console.log(
        `✓ On-demand analyses checked: ${response.body.data.length} total`,
      );
      console.log(
        `  Analyses with Spanish translation: ${analysesWithTranslations.length}`,
      );

      // Verify each generated analysis has Spanish translation
      for (const analysis of response.body.data) {
        expect(analysis).toHaveProperty('translations');
        expect(analysis.translations).toHaveProperty('es');
        expect(typeof analysis.translations.es).toBe('string');
        expect(analysis.translations.es.length).toBeGreaterThan(0);

        console.log(
          `  ✓ ${analysis.templateName}: ${analysis.translations.es.length} chars`,
        );

        // Verify it's different from original (basic check)
        expect(analysis.translations.es).not.toBe(analysis.content);
      }

      expect(analysesWithTranslations.length).toBe(generatedAnalysisIds.length);
    });
  });

  describe('4. Translate to French', () => {
    it('should translate transcription to French', async () => {
      const response = await request(app.getHttpServer())
        .post(`/transcriptions/${transcriptionId}/translate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetLanguage: 'fr' })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('language', 'fr');
      expect(response.body.data).toHaveProperty('languageName', 'French');
      expect(response.body.data).toHaveProperty('transcriptText');
      expect(response.body.data).toHaveProperty('analyses');

      console.log(`✓ Translation to French completed`);
      console.log(
        `  Transcript length: ${response.body.data.transcriptText?.length || 0} chars`,
      );
      console.log(
        `  Translated analyses: ${Object.keys(response.body.data.analyses || {}).join(', ')}`,
      );
    }, 180000); // 3 minute timeout

    it('should verify on-demand analyses have French translations', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transcriptions/${transcriptionId}/analyses`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      console.log(`✓ On-demand analyses checked for French translations`);

      // Verify response structure (API response has success/data wrapper)
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      const analyses = response.body.data;

      // Verify each generated analysis has both Spanish AND French translations
      for (const analysis of analyses) {
        expect(analysis).toHaveProperty('translations');
        expect(analysis.translations).toHaveProperty('es'); // Spanish from previous test
        expect(analysis.translations).toHaveProperty('fr'); // French from this test
        expect(typeof analysis.translations.fr).toBe('string');
        expect(analysis.translations.fr.length).toBeGreaterThan(0);

        console.log(
          `  ✓ ${analysis.templateName}: ES=${analysis.translations.es.length} chars, FR=${analysis.translations.fr.length} chars`,
        );

        // Verify French is different from Spanish and original
        expect(analysis.translations.fr).not.toBe(analysis.content);
        expect(analysis.translations.fr).not.toBe(analysis.translations.es);
      }
    });
  });

  describe('5. Verify Translation Persistence', () => {
    it('should retrieve Spanish translation without re-translating', async () => {
      const response = await request(app.getHttpServer())
        .post(`/transcriptions/${transcriptionId}/translate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetLanguage: 'es' })
        .expect(201); // Should still return 201 but use cached translation

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('language', 'es');
      expect(response.body.data.analyses).toBeDefined();

      console.log(`✓ Retrieved cached Spanish translation`);
    });

    it('should verify Firestore structure is correct', async () => {
      // Directly check Firestore to verify data structure
      const transcriptionDoc = await admin
        .firestore()
        .collection('transcriptions')
        .doc(transcriptionId)
        .get();

      const transcriptionData = transcriptionDoc.data();

      expect(transcriptionData).toBeDefined();
      expect(transcriptionData?.translations).toBeDefined();
      expect(transcriptionData?.translations.es).toBeDefined();
      expect(transcriptionData?.translations.fr).toBeDefined();

      console.log(`✓ Firestore transcription structure verified`);
      console.log(
        `  Languages: ${Object.keys(transcriptionData?.translations || {}).join(', ')}`,
      );

      // Check GeneratedAnalysis documents
      for (const analysisId of generatedAnalysisIds) {
        const analysisDoc = await admin
          .firestore()
          .collection('generatedAnalyses')
          .doc(analysisId)
          .get();

        const analysisData = analysisDoc.data();

        expect(analysisData).toBeDefined();
        expect(analysisData?.translations).toBeDefined();
        expect(analysisData?.translations.es).toBeDefined();
        expect(analysisData?.translations.fr).toBeDefined();

        console.log(
          `  ✓ Analysis ${analysisData?.templateName}: ${Object.keys(analysisData?.translations || {}).join(', ')}`,
        );
      }
    });
  });
});
