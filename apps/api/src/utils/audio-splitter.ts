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
}
