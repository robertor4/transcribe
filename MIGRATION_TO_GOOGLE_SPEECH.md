# Migration Plan: OpenAI Whisper to Google Cloud Speech-to-Text with Speaker Diarization

## Executive Summary

This document outlines the migration strategy from OpenAI's Whisper API to Google Cloud Speech-to-Text API to add native speaker diarization (speaker identification) capabilities to our transcription service. This enhancement will allow users to identify different speakers in their audio recordings, making the transcriptions more useful for meetings, interviews, and multi-person conversations.

## Current Architecture

### Current Stack
- **Transcription**: OpenAI Whisper API (whisper-1 model)
- **Summarization**: OpenAI GPT-4 (gpt-4o-mini)
- **Audio Processing**: FFmpeg for splitting large files
- **File Limits**: 25MB per request to Whisper, 500MB total file size
- **Languages**: Auto-detection with ~100 language support

### Current Limitations
- No speaker identification/diarization
- No real-time streaming transcription
- Limited to Whisper's vocabulary
- No word-level timestamps

## Benefits of Migration

### 1. Speaker Diarization
- **Native Support**: Built-in speaker identification and labeling
- **Speaker Timeline**: Know exactly when each speaker talks
- **Speaker Count**: Automatic detection of number of speakers (configurable min/max)
- **Word-level Attribution**: Each word tagged with speaker ID

### 2. Enhanced Capabilities
- **Real-time Streaming**: Support for live transcription
- **125+ Languages**: Extended language support with variants
- **Custom Vocabulary**: Boost recognition of specific terms, names, acronyms
- **Word Timestamps**: Precise timing for each word
- **Confidence Scores**: Accuracy metrics for each word/phrase
- **Profanity Filtering**: Optional content filtering

### 3. Processing Options
- **Synchronous**: For short audio (< 1 minute)
- **Asynchronous**: For long audio (up to 480 minutes)
- **Streaming**: For real-time transcription (up to 5 minutes continuous)

## Implementation Plan

### Phase 1: Setup & Configuration

#### 1.1 Google Cloud Project Setup
```bash
# Steps to complete:
1. Create new Google Cloud Project
2. Enable Speech-to-Text API
3. Create service account with Speech-to-Text permissions
4. Download service account JSON key
5. Enable billing (required for API access)
```

#### 1.2 Environment Configuration
```env
# Add to .env files:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1  # or preferred region

# Keep for GPT-4 summaries:
OPENAI_API_KEY=existing_key
```

#### 1.3 Install Dependencies
```json
// Add to apps/api/package.json
{
  "dependencies": {
    "@google-cloud/speech": "^6.0.0",
    "@google-cloud/storage": "^7.0.0"  // Optional for Google Cloud Storage
  }
}
```

### Phase 2: Service Implementation

#### 2.1 Create Google Speech Service
```typescript
// apps/api/src/google-speech/google-speech.service.ts
export class GoogleSpeechService {
  - Initialize Speech client
  - Implement transcribeWithDiarization()
  - Handle audio format conversion
  - Process long audio with async requests
  - Parse and format speaker segments
}
```

#### 2.2 Audio Format Handling
```typescript
// Preferred formats for Google Speech:
- LINEAR16 (PCM 16-bit)
- FLAC
- OGG_OPUS
- WEBM_OPUS

// Conversion strategy:
- Use FFmpeg to convert M4A/MP3 to FLAC
- Maintain sample rate (16000-48000 Hz recommended)
- Mono channel recommended for better accuracy
```

#### 2.3 Speaker Diarization Configuration
```typescript
const config = {
  encoding: 'FLAC',
  sampleRateHertz: 16000,
  languageCode: 'en-US',  // or auto-detect
  enableSpeakerDiarization: true,
  minSpeakerCount: 2,  // Minimum expected speakers
  maxSpeakerCount: 10, // Maximum expected speakers
  model: 'latest_long',  // Best for audio > 1 minute
  useEnhanced: true,     // Better accuracy (higher cost)
  enableWordTimeOffsets: true,
  enableWordConfidence: true,
};
```

### Phase 3: Data Model Updates

#### 3.1 Update Transcription Interface
```typescript
// packages/shared/src/types.ts
export interface Transcription {
  // ... existing fields ...
  
  // New speaker-related fields:
  speakerCount?: number;
  speakers?: Speaker[];
  speakerSegments?: SpeakerSegment[];
  transcriptWithSpeakers?: string;  // Formatted with [Speaker 1], [Speaker 2], etc.
  diarizationConfidence?: number;
}

export interface Speaker {
  speakerId: number;
  speakerTag: string;  // e.g., "Speaker 1"
  totalSpeakingTime: number;  // seconds
  wordCount: number;
  firstAppearance: number;  // timestamp
}

export interface SpeakerSegment {
  speakerTag: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence?: number;
}
```

#### 3.2 Database Schema Updates
```typescript
// Firestore document structure:
transcriptions/{id}: {
  // ... existing fields ...
  speakers: [{
    speakerId: 1,
    speakerTag: "Speaker 1",
    totalSpeakingTime: 120.5,
    wordCount: 250,
    firstAppearance: 0.0
  }],
  speakerSegments: [{
    speakerTag: "Speaker 1",
    startTime: 0.0,
    endTime: 5.2,
    text: "Hello, welcome to the meeting.",
    confidence: 0.95
  }],
  transcriptWithSpeakers: "[Speaker 1]: Hello, welcome...\n[Speaker 2]: Thank you for..."
}
```

### Phase 4: Service Integration

#### 4.1 Update Transcription Service
```typescript
// apps/api/src/transcription/transcription.service.ts
class TranscriptionService {
  constructor(
    // ... existing dependencies ...
    private googleSpeechService: GoogleSpeechService,
  ) {}

  async transcribeAudio(fileUrl: string, context?: string) {
    // Use feature flag or config to choose service
    if (this.configService.get('USE_GOOGLE_SPEECH')) {
      return this.googleSpeechService.transcribeWithDiarization(fileUrl, context);
    } else {
      return this.transcribeWithWhisper(fileUrl, context);  // Legacy
    }
  }
}
```

#### 4.2 Process Speaker Data
```typescript
async processTranscriptionResult(result: GoogleSpeechResult) {
  // Extract speaker information
  const speakers = this.extractSpeakers(result);
  const segments = this.formatSpeakerSegments(result);
  const formattedTranscript = this.formatTranscriptWithSpeakers(segments);
  
  return {
    text: result.transcription,
    speakers,
    speakerSegments: segments,
    transcriptWithSpeakers: formattedTranscript,
    language: result.languageCode,
    confidence: result.confidence
  };
}
```

### Phase 5: Audio Processing Updates

#### 5.1 Modify Audio Splitter
```typescript
// apps/api/src/utils/audio-splitter.ts
class AudioSplitter {
  // Google has different limits:
  // - Synchronous: 1 minute
  // - Asynchronous: 480 minutes
  // - Streaming: 5 minutes continuous
  
  async splitForGoogleSpeech(inputPath: string) {
    // For async requests, can send up to 480 minutes
    // But recommended to split into 10-30 minute chunks for reliability
    const CHUNK_DURATION = 1800; // 30 minutes
    // ... implementation ...
  }
  
  async convertToGoogleFormat(inputPath: string): Promise<string> {
    // Convert to FLAC for best results
    return this.convertToFlac(inputPath, {
      sampleRate: 16000,
      channels: 1  // Mono recommended
    });
  }
}
```

### Phase 6: Frontend Updates

#### 6.1 Display Speaker Information
```tsx
// apps/web/components/TranscriptionView.tsx
function TranscriptionView({ transcription }) {
  return (
    <div>
      {/* Speaker summary */}
      <SpeakerSummary speakers={transcription.speakers} />
      
      {/* Transcript with speaker labels */}
      <TranscriptWithSpeakers segments={transcription.speakerSegments} />
      
      {/* Speaker timeline visualization */}
      <SpeakerTimeline segments={transcription.speakerSegments} />
    </div>
  );
}
```

#### 6.2 Speaker Components
```tsx
// apps/web/components/SpeakerSummary.tsx
function SpeakerSummary({ speakers }) {
  return (
    <div className="speaker-summary">
      <h3>Speakers ({speakers.length})</h3>
      {speakers.map(speaker => (
        <div key={speaker.speakerId}>
          <span>{speaker.speakerTag}</span>
          <span>{speaker.wordCount} words</span>
          <span>{formatDuration(speaker.totalSpeakingTime)}</span>
        </div>
      ))}
    </div>
  );
}
```

### Phase 7: Testing & Migration

#### 7.1 Testing Strategy
1. **Unit Tests**: Test Google Speech service methods
2. **Integration Tests**: Test end-to-end with sample audio
3. **Format Testing**: Test with various audio formats
4. **Speaker Testing**: Test with different speaker counts
5. **Language Testing**: Test auto-detection and specific languages
6. **Performance Testing**: Compare processing times

#### 7.2 Migration Strategy
```typescript
// Feature flag approach:
enum TranscriptionProvider {
  WHISPER = 'whisper',
  GOOGLE = 'google'
}

// Gradual rollout:
1. Add feature flag (default: WHISPER)
2. Test with internal users (flag: GOOGLE)
3. A/B test with percentage of users
4. Full migration when stable
5. Remove Whisper code after verification
```

## Technical Considerations

### Audio Format Requirements
| Format | Google Support | Current Files | Action Required |
|--------|---------------|---------------|-----------------|
| M4A | No | Yes | Convert to FLAC |
| MP3 | Yes (not optimal) | Yes | Convert to FLAC |
| WAV | Yes | Yes | Use as-is |
| FLAC | Yes (preferred) | No | Target format |
| MP4 | No | Yes | Extract audio, convert |
| WebM | Yes (Opus) | Yes | Use as-is |

### API Limits Comparison
| Feature | Whisper | Google Speech |
|---------|---------|---------------|
| Max file size | 25MB | No limit (time-based) |
| Max duration | ~3 hours* | 480 minutes |
| Languages | ~100 | 125+ |
| Real-time | No | Yes |
| Speaker ID | No | Yes |
| Custom vocab | No | Yes |
| Word timing | No | Yes |

*With our chunking implementation

### Cost Analysis
| Service | Pricing | Monthly Estimate* |
|---------|---------|-------------------|
| Whisper | $0.006/minute | $180 |
| Google (Standard) | $0.004/15 seconds | $480 |
| Google (Enhanced) | $0.009/15 seconds | $1,080 |
| Google (w/ Diarization) | +$0.002/15 seconds | +$240 |

*Based on 30,000 minutes/month

### Processing Flow Comparison

#### Current (Whisper)
```
Audio → FFmpeg Split (if >25MB) → Whisper API → Merge Text → GPT-4 Summary
```

#### New (Google Speech)
```
Audio → Format Check → Convert to FLAC → Google Speech API (w/ Diarization) → 
→ Extract Speakers → Format Transcript → GPT-4 Summary (with speaker context)
```

## Implementation Timeline

### Week 1: Setup & Infrastructure
- Day 1-2: Google Cloud setup, credentials
- Day 3-4: Create GoogleSpeechService
- Day 5: Audio format conversion logic

### Week 2: Core Implementation
- Day 1-2: Integrate with TranscriptionService
- Day 3-4: Update data models and database
- Day 5: Handle speaker data processing

### Week 3: Frontend & Testing
- Day 1-2: Create speaker UI components
- Day 3-4: Integration testing
- Day 5: Performance testing

### Week 4: Migration & Deployment
- Day 1-2: Feature flag implementation
- Day 3: Staged rollout (10% users)
- Day 4: Monitor and fix issues
- Day 5: Full rollout

## Rollback Plan

If issues arise during migration:

1. **Immediate**: Toggle feature flag back to WHISPER
2. **Data**: Speaker fields are optional, won't break existing transcriptions
3. **Frontend**: Components gracefully handle missing speaker data
4. **API**: Both services remain available during transition

## Success Metrics

1. **Functionality**
   - Speaker identification accuracy > 85%
   - Transcription accuracy maintained or improved
   - Processing time < 2x current time

2. **User Satisfaction**
   - Positive feedback on speaker identification
   - No increase in error rates
   - Feature adoption > 60% within 1 month

3. **Technical**
   - API success rate > 99%
   - Cost per minute < $0.50
   - Support for all current audio formats

## Conclusion

This migration will significantly enhance our transcription service by adding speaker diarization while maintaining all current capabilities. The phased approach ensures minimal risk and allows for rollback if needed. The investment in Google Cloud Speech-to-Text will provide immediate value through speaker identification and open doors for future enhancements like real-time transcription and custom vocabulary support.

## Appendix

### A. Sample Code Snippets

#### Google Speech Client Initialization
```typescript
import { SpeechClient } from '@google-cloud/speech';

export class GoogleSpeechService {
  private client: SpeechClient;

  constructor() {
    this.client = new SpeechClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }
}
```

#### Diarization Request
```typescript
async transcribeWithDiarization(audioUri: string) {
  const request = {
    config: {
      encoding: 'FLAC',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
      enableSpeakerDiarization: true,
      minSpeakerCount: 2,
      maxSpeakerCount: 10,
      model: 'latest_long',
    },
    audio: {
      uri: audioUri,  // or content: audioBytes
    },
  };

  const [operation] = await this.client.longRunningRecognize(request);
  const [response] = await operation.promise();
  return this.processDiarizationResult(response);
}
```

### B. References

- [Google Cloud Speech-to-Text Documentation](https://cloud.google.com/speech-to-text/docs)
- [Speaker Diarization Guide](https://cloud.google.com/speech-to-text/docs/speaker-diarization)
- [API Pricing](https://cloud.google.com/speech-to-text/pricing)
- [Best Practices](https://cloud.google.com/speech-to-text/docs/best-practices)
- [Migration Guide](https://cloud.google.com/speech-to-text/docs/migration)

### C. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Higher costs | High | Medium | Monitor usage, set alerts, optimize settings |
| API reliability | Low | High | Implement retry logic, fallback to Whisper |
| Format issues | Medium | Low | Comprehensive format conversion |
| Speaker accuracy | Medium | Medium | Allow manual speaker correction |
| Migration bugs | Medium | High | Phased rollout, feature flags |

### D. Future Enhancements

After successful migration, consider:

1. **Real-time Transcription**: Live streaming for meetings
2. **Custom Vocabulary**: User-defined terms and names
3. **Multi-language Support**: Detect and transcribe multiple languages in same audio
4. **Speaker Profiles**: Save and recognize returning speakers
5. **Emotion Detection**: Analyze speaker sentiment and tone
6. **Meeting Analytics**: Speaking time distribution, interruption analysis
7. **Export Formats**: SRT/VTT with speaker labels for video subtitles