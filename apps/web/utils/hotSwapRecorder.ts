/**
 * HotSwapRecorder - MediaRecorder wrapper with live microphone switching
 *
 * Uses Web Audio API to route audio through a MediaStreamDestination,
 * allowing source nodes to be swapped without interrupting recording.
 *
 * Architecture:
 * [Microphone] → [SourceNode] → [Destination] → [MediaRecorder]
 *
 * To swap microphones: disconnect old SourceNode, connect new SourceNode.
 * MediaRecorder sees no change because it's attached to the Destination stream.
 */

import { detectBestAudioFormat, type AudioFormat } from './audio';

export interface HotSwapRecorderOptions {
  onDataAvailable?: (event: BlobEvent) => void;
  onStop?: () => void;
  onError?: (error: Error) => void;
  onDeviceSwapped?: (deviceId: string) => void;
  timeslice?: number; // Chunk interval in ms (default: 10000)
}

export class HotSwapRecorder {
  private audioContext: AudioContext | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private currentSource: MediaStreamAudioSourceNode | null = null;
  private currentStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioFormat: AudioFormat;
  private options: HotSwapRecorderOptions;
  private currentDeviceId: string | null = null;
  private timeslice: number;

  constructor(options: HotSwapRecorderOptions = {}) {
    this.options = options;
    this.audioFormat = detectBestAudioFormat();
    this.timeslice = options.timeslice ?? 10000;
  }

  /**
   * The output stream for audio visualization.
   * This is the destination stream that MediaRecorder is attached to.
   */
  get outputStream(): MediaStream | null {
    return this.destination?.stream || null;
  }

  /**
   * Current recording state
   */
  get state(): RecordingState {
    return this.mediaRecorder?.state || 'inactive';
  }

  /**
   * Currently active device ID
   */
  get activeDeviceId(): string | null {
    return this.currentDeviceId;
  }

  /**
   * The internal MediaRecorder instance.
   * Exposed for attaching additional event handlers (onstop, onerror, etc.)
   */
  get recorder(): MediaRecorder | null {
    return this.mediaRecorder;
  }

  /**
   * Initialize the recorder with an optional initial device.
   * Must be called before start().
   */
  async initialize(deviceId?: string): Promise<void> {
    // Create AudioContext
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioContextClass();

    // Resume if suspended (autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Create destination node - this is what MediaRecorder attaches to
    this.destination = this.audioContext.createMediaStreamDestination();

    // Get initial microphone stream
    const stream = await this.acquireMicrophoneStream(deviceId);
    this.currentStream = stream;
    this.currentDeviceId = deviceId || null;

    // Create source node and connect to destination
    this.currentSource = this.audioContext.createMediaStreamSource(stream);
    this.currentSource.connect(this.destination);

    // Create MediaRecorder attached to destination stream
    this.mediaRecorder = new MediaRecorder(this.destination.stream, {
      mimeType: this.audioFormat.mimeType,
    });

    // Wire up event handlers
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.options.onDataAvailable?.(event);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.options.onStop?.();
    };

    this.mediaRecorder.onerror = () => {
      this.options.onError?.(new Error('Recording failed'));
    };
  }

  /**
   * Swap to a different microphone without interrupting recording.
   * Can be called while recording or paused.
   */
  async swapMicrophone(newDeviceId: string): Promise<void> {
    if (!this.audioContext || !this.destination) {
      throw new Error('HotSwapRecorder not initialized');
    }

    // Acquire new microphone stream
    const newStream = await this.acquireMicrophoneStream(newDeviceId);

    // Create new source node
    const newSource = this.audioContext.createMediaStreamSource(newStream);

    // Disconnect old source (seamless - destination keeps receiving from new)
    if (this.currentSource) {
      this.currentSource.disconnect();
    }

    // Stop old stream tracks to release microphone
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
    }

    // Connect new source to destination
    newSource.connect(this.destination);

    // Update internal state
    this.currentSource = newSource;
    this.currentStream = newStream;
    this.currentDeviceId = newDeviceId;

    // Notify listener
    this.options.onDeviceSwapped?.(newDeviceId);
  }

  /**
   * Acquire a microphone stream with the given device ID.
   */
  private async acquireMicrophoneStream(deviceId?: string): Promise<MediaStream> {
    const constraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100,
    };

    // Use exact constraint to ensure specific device is used
    if (deviceId) {
      constraints.deviceId = { exact: deviceId };
    }

    return navigator.mediaDevices.getUserMedia({ audio: constraints });
  }

  /**
   * Start recording
   */
  start(): void {
    if (!this.mediaRecorder) {
      throw new Error('HotSwapRecorder not initialized');
    }
    this.mediaRecorder.start(this.timeslice);
  }

  /**
   * Stop recording
   */
  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    // Stop recording if active
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Disconnect source node
    if (this.currentSource) {
      this.currentSource.disconnect();
      this.currentSource = null;
    }

    // Stop stream tracks to release microphone
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }

    // Close AudioContext
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.destination = null;
    this.mediaRecorder = null;
    this.currentDeviceId = null;
  }
}
