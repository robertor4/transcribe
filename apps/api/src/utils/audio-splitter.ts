import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface AudioChunk {
  path: string;
  startTime: number;
  endTime: number;
  duration: number;
  index: number;
}

export interface SplitOptions {
  maxDurationSeconds?: number;
  maxSizeBytes?: number;
  outputDir?: string;
  format?: string;
}

export class AudioSplitter {
  private readonly logger = new Logger(AudioSplitter.name);
  private readonly DEFAULT_CHUNK_DURATION = 600; // 10 minutes per chunk
  private readonly MAX_WHISPER_SIZE = 24 * 1024 * 1024; // 24MB to leave buffer
  private ffmpegPath: string | undefined;

  constructor() {
    this.initializeFfmpeg();
  }

  private async initializeFfmpeg() {
    try {
      // Check if ffmpeg is available
      const { stdout } = await execAsync('which ffmpeg');
      this.ffmpegPath = stdout.trim();

      if (this.ffmpegPath) {
        ffmpeg.setFfmpegPath(this.ffmpegPath);
        this.logger.log(`FFmpeg found at: ${this.ffmpegPath}`);
      }
    } catch (error) {
      // Try common locations
      const commonPaths = [
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
        '/opt/homebrew/bin/ffmpeg',
      ];

      for (const path of commonPaths) {
        if (fs.existsSync(path)) {
          this.ffmpegPath = path;
          ffmpeg.setFfmpegPath(path);
          this.logger.log(`FFmpeg found at: ${path}`);
          break;
        }
      }

      if (!this.ffmpegPath) {
        this.logger.warn(
          'FFmpeg not found in PATH. Audio splitting may not work.',
        );
      }
    }
  }

  async checkFfmpegAvailable(): Promise<boolean> {
    if (!this.ffmpegPath) {
      await this.initializeFfmpeg();
    }
    return !!this.ffmpegPath;
  }

  async getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata.format.duration || 0);
        }
      });
    });
  }

  async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.promises.stat(filePath);
    return stats.size;
  }

  async shouldSplitFile(filePath: string): Promise<boolean> {
    const fileSize = await this.getFileSize(filePath);
    return fileSize > this.MAX_WHISPER_SIZE;
  }

  async splitAudioFile(
    inputPath: string,
    options: SplitOptions = {},
  ): Promise<AudioChunk[]> {
    const {
      maxDurationSeconds = this.DEFAULT_CHUNK_DURATION,
      outputDir = path.dirname(inputPath),
      format = 'mp3',
    } = options;

    // Check if ffmpeg is available
    const ffmpegAvailable = await this.checkFfmpegAvailable();
    if (!ffmpegAvailable) {
      throw new Error('FFmpeg is not available. Cannot split audio files.');
    }

    this.logger.log(`Splitting audio file: ${inputPath}`);

    const fileSize = await this.getFileSize(inputPath);
    const duration = await this.getAudioDuration(inputPath);

    if (fileSize <= this.MAX_WHISPER_SIZE) {
      this.logger.log('File size is within limits, no splitting needed');
      return [
        {
          path: inputPath,
          startTime: 0,
          endTime: duration,
          duration: duration,
          index: 0,
        },
      ];
    }

    const baseFileName = path.basename(inputPath, path.extname(inputPath));
    const chunks: AudioChunk[] = [];

    const estimatedChunks = Math.ceil(fileSize / this.MAX_WHISPER_SIZE);
    const chunkDuration = Math.min(
      maxDurationSeconds,
      Math.ceil(duration / estimatedChunks),
    );

    const totalChunks = Math.ceil(duration / chunkDuration);

    this.logger.log(
      `Splitting into ${totalChunks} chunks of ~${chunkDuration}s each`,
    );

    const promises: Promise<AudioChunk>[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const startTime = i * chunkDuration;
      const endTime = Math.min((i + 1) * chunkDuration, duration);
      const actualDuration = endTime - startTime;

      const outputPath = path.join(
        outputDir,
        `${baseFileName}_chunk_${i + 1}.${format}`,
      );

      promises.push(
        this.extractChunk(inputPath, outputPath, startTime, actualDuration, i),
      );
    }

    const results = await Promise.all(promises);
    chunks.push(...results);

    this.logger.log(`Successfully split audio into ${chunks.length} chunks`);
    return chunks;
  }

  private extractChunk(
    inputPath: string,
    outputPath: string,
    startTime: number,
    duration: number,
    index: number,
  ): Promise<AudioChunk> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .on('start', (commandLine) => {
          this.logger.debug(`Starting chunk ${index + 1}: ${commandLine}`);
        })
        .on('progress', (progress) => {
          this.logger.debug(
            `Processing chunk ${index + 1}: ${progress.percent}%`,
          );
        })
        .on('end', () => {
          this.logger.log(`Chunk ${index + 1} created: ${outputPath}`);
          resolve({
            path: outputPath,
            startTime,
            endTime: startTime + duration,
            duration,
            index,
          });
        })
        .on('error', (err) => {
          this.logger.error(`Error creating chunk ${index + 1}:`, err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  async cleanupChunks(chunks: AudioChunk[]): Promise<void> {
    for (const chunk of chunks) {
      try {
        await fs.promises.unlink(chunk.path);
        this.logger.debug(`Deleted chunk: ${chunk.path}`);
      } catch (error) {
        this.logger.warn(`Failed to delete chunk ${chunk.path}:`, error);
      }
    }
  }

  async mergeTranscriptions(
    transcriptions: { text: string; chunk: AudioChunk }[],
  ): Promise<string> {
    transcriptions.sort((a, b) => a.chunk.index - b.chunk.index);

    const mergedText = transcriptions
      .map((t) => t.text.trim())
      .filter((text) => text.length > 0)
      .join(' ');

    return mergedText;
  }

  formatTimeForContext(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  createChunkContext(
    chunk: AudioChunk,
    totalChunks: number,
    originalContext?: string,
  ): string {
    const chunkInfo =
      `[Audio chunk ${chunk.index + 1} of ${totalChunks}, ` +
      `time ${this.formatTimeForContext(chunk.startTime)} - ${this.formatTimeForContext(chunk.endTime)}]`;

    if (originalContext) {
      return `${chunkInfo} ${originalContext}`;
    }

    return chunkInfo;
  }

  async convertToFlac(
    inputPath: string,
    outputDir?: string,
    options?: { sampleRate?: number; channels?: number },
  ): Promise<string> {
    const dir = outputDir || path.dirname(inputPath);
    const baseFileName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(dir, `${baseFileName}.flac`);

    // Check if already FLAC
    if (path.extname(inputPath).toLowerCase() === '.flac') {
      return inputPath;
    }

    this.logger.log(`Converting ${inputPath} to FLAC format for Google Speech`);

    return new Promise((resolve, reject) => {
      const ffmpegCommand = ffmpeg(inputPath)
        .audioCodec('flac')
        .audioFrequency(options?.sampleRate || 16000)
        .audioChannels(options?.channels || 1); // Mono for better accuracy

      ffmpegCommand
        .on('start', (commandLine) => {
          this.logger.debug(`Starting FLAC conversion: ${commandLine}`);
        })
        .on('progress', (progress) => {
          this.logger.debug(`Converting to FLAC: ${progress.percent}%`);
        })
        .on('end', () => {
          this.logger.log(`Successfully converted to FLAC: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          this.logger.error(`Error converting to FLAC:`, err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  async splitForGoogleSpeech(
    inputPath: string,
    options: SplitOptions = {},
  ): Promise<AudioChunk[]> {
    const {
      maxDurationSeconds = 600, // 10 minutes - optimal balance for reliability and processing speed
      maxSizeBytes = 9 * 1024 * 1024, // 9MB to leave buffer for 10MB limit
      outputDir = path.dirname(inputPath),
      format = 'flac', // Use FLAC for Google Speech
    } = options;

    // Check if ffmpeg is available
    const ffmpegAvailable = await this.checkFfmpegAvailable();
    if (!ffmpegAvailable) {
      throw new Error('FFmpeg is not available. Cannot split audio files.');
    }

    this.logger.log(`Splitting audio file for Google Speech: ${inputPath}`);

    const fileSize = await this.getFileSize(inputPath);
    const duration = await this.getAudioDuration(inputPath);
    const fileSizeInMB = fileSize / (1024 * 1024);

    // Check if file is small enough to process directly
    if (fileSize <= maxSizeBytes) {
      this.logger.log(`File size ${fileSizeInMB.toFixed(2)}MB is within 9MB limit, no splitting needed`);
      // If already FLAC, return as is
      if (path.extname(inputPath).toLowerCase() === '.flac') {
        return [
          {
            path: inputPath,
            startTime: 0,
            endTime: duration,
            duration: duration,
            index: 0,
          },
        ];
      }
      // Convert to FLAC if needed
      const flacPath = await this.convertToFlac(inputPath, outputDir);
      const flacSize = await this.getFileSize(flacPath);
      const flacSizeInMB = flacSize / (1024 * 1024);
      
      // Check if FLAC conversion made it too large
      if (flacSize > maxSizeBytes) {
        this.logger.log(`FLAC conversion resulted in ${flacSizeInMB.toFixed(2)}MB, need to split`);
        // Need to split even after conversion
      } else {
        return [
          {
            path: flacPath,
            startTime: 0,
            endTime: duration,
            duration: duration,
            index: 0,
          },
        ];
      }
    }

    const baseFileName = path.basename(inputPath, path.extname(inputPath));
    const chunks: AudioChunk[] = [];
    
    // Calculate optimal chunk duration based on file size
    // Estimate: FLAC at 16kHz mono is roughly 1-2MB per minute
    const estimatedBytesPerSecond = (fileSize / duration);
    const optimalChunkDuration = Math.min(
      maxDurationSeconds,
      Math.floor(maxSizeBytes / estimatedBytesPerSecond)
    );
    
    const totalChunks = Math.ceil(duration / optimalChunkDuration);

    this.logger.log(
      `Splitting into ${totalChunks} chunks of ~${optimalChunkDuration}s each for Google Speech (est. ${(optimalChunkDuration * estimatedBytesPerSecond / (1024 * 1024)).toFixed(2)}MB per chunk)`,
    );

    const promises: Promise<AudioChunk>[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const startTime = i * optimalChunkDuration;
      const endTime = Math.min((i + 1) * optimalChunkDuration, duration);
      const actualDuration = endTime - startTime;

      const outputPath = path.join(
        outputDir,
        `${baseFileName}_chunk_${i + 1}.${format}`,
      );

      promises.push(
        this.extractChunkAsFlac(inputPath, outputPath, startTime, actualDuration, i),
      );
    }

    const results = await Promise.all(promises);
    chunks.push(...results);

    this.logger.log(`Successfully split audio into ${chunks.length} chunks for Google Speech`);
    return chunks;
  }

  private extractChunkAsFlac(
    inputPath: string,
    outputPath: string,
    startTime: number,
    duration: number,
    index: number,
  ): Promise<AudioChunk> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .audioCodec('flac')
        .audioFrequency(16000) // Optimal for speech recognition
        .audioChannels(1) // Mono for better accuracy
        .on('start', (commandLine) => {
          this.logger.debug(`Starting FLAC chunk ${index + 1}: ${commandLine}`);
        })
        .on('progress', (progress) => {
          this.logger.debug(
            `Processing FLAC chunk ${index + 1}: ${progress.percent}%`,
          );
        })
        .on('end', () => {
          this.logger.log(`FLAC chunk ${index + 1} created: ${outputPath}`);
          resolve({
            path: outputPath,
            startTime,
            endTime: startTime + duration,
            duration,
            index,
          });
        })
        .on('error', (err) => {
          this.logger.error(`Error creating FLAC chunk ${index + 1}:`, err);
          reject(err);
        })
        .save(outputPath);
    });
  }
}
