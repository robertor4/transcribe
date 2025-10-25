# E2E Tests

This directory contains end-to-end tests for the Neural Summary API.

## Prerequisites

1. **Firebase Admin SDK** must be initialized with valid credentials
2. **Test audio file** must be present at `test/data/Neural Summary Radio Commercial.mp3`
3. **Redis** must be running (for Bull queues)
4. **Environment variables** must be configured (see root `.env` file)
5. **AssemblyAI API key** must be valid (for transcription)
6. **OpenAI API key** must be valid (for analysis and translation)

## Running Tests

### Run all e2e tests
```bash
cd apps/api
npm run test:e2e
```

### Run specific test suite
```bash
cd apps/api
npm run test:e2e -- translation.e2e-spec.ts
```

### Run with verbose output
```bash
cd apps/api
npm run test:e2e -- --verbose
```

## Test Suites

### `translation.e2e-spec.ts` - Comprehensive Translation System

Tests the complete translation workflow for both core and on-demand analyses.

**Test Flow:**
1. Create test user and authenticate
2. Upload test audio file
3. Wait for transcription to complete
4. Generate 2 on-demand analyses (Emotional Intelligence, Key Insights)
5. Translate to Spanish - verify core + on-demand analyses
6. Translate to French - verify all analyses
7. Verify translation persistence (cached translations)
8. Verify Firestore data structure
9. Cleanup: Delete test data and user

**Duration:** ~10-15 minutes (includes transcription and analysis generation)

**What it tests:**
- ✅ File upload and transcription
- ✅ On-demand analysis generation
- ✅ Core analyses translation (summary, action items, etc.)
- ✅ On-demand analyses translation (stored in GeneratedAnalysis documents)
- ✅ Multiple language support (Spanish, French)
- ✅ Translation caching (no re-translation)
- ✅ Firestore data structure validation
- ✅ Automatic cleanup

## Test Data

### Required Files

- `test/data/Neural Summary Radio Commercial.mp3` - Test audio file (provided)

### Generated Test Data

All test data is automatically cleaned up after test completion:
- Test user account (deleted via Firebase Admin SDK)
- Transcription document (deleted from Firestore)
- Generated analyses (deleted from Firestore)
- Uploaded audio file (deleted from Firebase Storage via cleanup function)

## Cleaning Up Orphaned Test Data

If a test is interrupted (Ctrl+C or process killed), the `afterAll()` cleanup hook won't run, leaving behind:
- Test user accounts in Firebase Auth
- Test user documents in Firestore
- Test transcriptions and analyses

**Manual Cleanup Script:**
```bash
cd apps/api
npx ts-node test/cleanup-test-data.ts
```

This script will:
- Find all users with email starting with `test-translation-`
- Delete their transcriptions and analyses
- Delete their Firestore user documents
- Delete their Firebase Auth accounts

**Run this after:**
- Interrupted test runs
- Failed test runs that didn't complete cleanup
- Before running tests in a clean environment

## Troubleshooting

### Test times out waiting for transcription
- Check AssemblyAI API quota/credits
- Verify API key is valid
- Check network connectivity
- Review API logs for errors

### Translation fails
- Check OpenAI API quota/credits
- Verify GPT-5-mini model is available
- Check API logs for rate limiting errors

### Firebase authentication errors
- Verify Firebase credentials are correct
- Check Firebase project permissions
- Ensure test user email domain is allowed

### Redis connection errors
- Start Redis: `npm run redis:start`
- Verify Redis is running: `npm run redis:check`
- Check Redis connection settings in `.env`

## Development

### Adding new e2e tests

1. Create new test file: `apps/api/test/[feature].e2e-spec.ts`
2. Follow the pattern from existing tests:
   - Create test user in `beforeAll`
   - Clean up in `afterAll`
   - Use `request(app.getHttpServer())` for API calls
   - Set auth header: `.set('Authorization', \`Bearer \${authToken}\`)`
3. Update this README with test details

### Test utilities

Consider extracting common patterns into test utilities:
- User creation/deletion
- Authentication token generation
- Transcription upload and polling
- Firestore cleanup

## CI/CD Integration

To run e2e tests in CI/CD:

1. Ensure Firebase credentials are available as environment variables
2. Start Redis container before tests
3. Set appropriate timeout values (e2e tests can take 10+ minutes)
4. Configure test audio files to be included in build artifacts

Example GitHub Actions workflow:
```yaml
- name: Run E2E Tests
  run: |
    cd apps/api
    npm run test:e2e
  timeout-minutes: 20
  env:
    FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
    FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}
    FIREBASE_CLIENT_EMAIL: ${{ secrets.FIREBASE_CLIENT_EMAIL }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    ASSEMBLYAI_API_KEY: ${{ secrets.ASSEMBLYAI_API_KEY }}
```
