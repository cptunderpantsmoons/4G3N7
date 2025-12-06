/**
 * Phase 5.1 - Screen Recorder Service
 * 
 * Handles screen recording, playback, and frame manipulation.
 * Supports multiple video formats and advanced recording options.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  RecordingSession,
  ScreenRecording,
  ScreenRecordingOptions,
  PlaybackOptions,
  PlaybackFrame,
  FrameRate,
  ScreenRecordingFormat,
  RecordingPlaylist,
} from '../interfaces/desktop-control.interface';

@Injectable()
export class ScreenRecorderService {
  private readonly logger = new Logger(ScreenRecorderService.name);

  // Store active recording sessions
  private activeSessions = new Map<string, RecordingSession>();
  // Store completed recordings
  private recordings = new Map<string, ScreenRecording>();
  // Store recording playlists
  private playlists = new Map<string, RecordingPlaylist>();
  // Playback state
  private playbackState = new Map<string, { isPlaying: boolean; currentFrame: number }>();

  constructor() {
    this.startCleanupScheduler();
  }

  /**
   * Start a new recording session
   */
  async startRecording(options: ScreenRecordingOptions): Promise<RecordingSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = `recording_${Date.now()}.${options.format.toLowerCase()}`;
    const filepath = `/tmp/recordings/${filename}`;

    const session: RecordingSession = {
      id: sessionId,
      startTime: new Date(),
      duration: 0,
      filename,
      filepath,
      options,
      frameCount: 0,
      totalSize: 0,
      isActive: true,
    };

    this.activeSessions.set(sessionId, session);
    this.logger.log(`Recording session started: ${sessionId} at ${filepath}`);

    return session;
  }

  /**
   * Stop a recording session and finalize the recording
   */
  async stopRecording(sessionId: string): Promise<ScreenRecording> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Recording session not found: ${sessionId}`);
    }

    session.isActive = false;
    const endTime = new Date();
    const duration = endTime.getTime() - session.startTime.getTime();

    const recording: ScreenRecording = {
      id: sessionId,
      filename: session.filename,
      filepath: session.filepath,
      duration,
      frameRate: session.options.frameRate,
      frameCount: session.frameCount,
      fileSize: session.totalSize,
      createdAt: session.startTime,
      modifiedAt: endTime,
      metadata: {
        resolution: { width: 1920, height: 1080 }, // TODO: Get from screen
        audioTracks: session.options.audioEnabled ? 1 : 0,
        videoCodec: 'h264',
        audioCodec: session.options.audioEnabled ? 'aac' : undefined,
      },
    };

    this.recordings.set(sessionId, recording);
    this.activeSessions.delete(sessionId);
    this.logger.log(`Recording session completed: ${sessionId} (${duration}ms, ${session.frameCount} frames)`);

    return recording;
  }

  /**
   * Pause a recording session (without stopping it)
   */
  async pauseRecording(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Recording session not found: ${sessionId}`);
    }

    this.logger.debug(`Pausing recording session: ${sessionId}`);
    // TODO: Implement pause mechanism
  }

  /**
   * Resume a paused recording session
   */
  async resumeRecording(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Recording session not found: ${sessionId}`);
    }

    this.logger.debug(`Resuming recording session: ${sessionId}`);
    // TODO: Implement resume mechanism
  }

  /**
   * Add a frame to an active recording
   */
  async addFrame(sessionId: string, frame: PlaybackFrame): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Recording session not found: ${sessionId}`);
    }

    if (!session.isActive) {
      throw new Error(`Recording session is not active: ${sessionId}`);
    }

    // Update session statistics
    session.frameCount++;
    session.totalSize += frame.image.length;
    session.duration = new Date().getTime() - session.startTime.getTime();

    // TODO: Actually write frame to video file
  }

  /**
   * Play a recording with optional options
   */
  async playRecording(recordingId: string, options?: PlaybackOptions): Promise<void> {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      throw new Error(`Recording not found: ${recordingId}`);
    }

    const playbackId = `playback_${recordingId}_${Date.now()}`;
    this.playbackState.set(playbackId, { isPlaying: true, currentFrame: 0 });

    this.logger.log(`Playing recording: ${recordingId} with playback ID ${playbackId}`);

    try {
      // TODO: Implement actual playback mechanism
      // - Load frames from file
      // - Apply playback options (speed, loop, frame range)
      // - Emit frames or handle rendering

      const speed = options?.speed || 1.0;
      const loop = options?.loop || false;
      const startFrame = options?.startFrame || 0;
      const endFrame = options?.endFrame || recording.frameCount;

      let currentFrame = startFrame;
      const frameInterval = 1000 / (recording.frameRate * speed);

      while (currentFrame <= endFrame && this.playbackState.get(playbackId)?.isPlaying) {
        // TODO: Get frame and emit or render
        await new Promise(resolve => setTimeout(resolve, frameInterval));
        currentFrame++;
      }

      if (loop && this.playbackState.get(playbackId)?.isPlaying) {
        await this.playRecording(recordingId, options);
      }
    } finally {
      this.playbackState.delete(playbackId);
    }
  }

  /**
   * Stop playback of a recording
   */
  async stopPlayback(playbackId: string): Promise<void> {
    const state = this.playbackState.get(playbackId);
    if (state) {
      state.isPlaying = false;
      this.logger.debug(`Stopped playback: ${playbackId}`);
    }
  }

  /**
   * List all recordings
   */
  listRecordings(limit?: number): ScreenRecording[] {
    const recordings = Array.from(this.recordings.values());
    
    if (limit) {
      return recordings.slice(-limit);
    }
    
    return recordings;
  }

  /**
   * Get a recording by ID
   */
  getRecording(recordingId: string): ScreenRecording | undefined {
    return this.recordings.get(recordingId);
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      throw new Error(`Recording not found: ${recordingId}`);
    }

    // TODO: Actually delete file from filesystem
    this.recordings.delete(recordingId);
    this.logger.log(`Recording deleted: ${recordingId}`);
  }

  /**
   * Export recording to different format
   */
  async exportRecording(
    recordingId: string,
    targetFormat: ScreenRecordingFormat,
    outputPath: string
  ): Promise<ScreenRecording> {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      throw new Error(`Recording not found: ${recordingId}`);
    }

    this.logger.log(`Exporting recording ${recordingId} to ${targetFormat} format`);

    // TODO: Implement actual format conversion
    // - Use ffmpeg or similar tool
    // - Convert video codec/audio codec as needed
    // - Handle quality/bitrate settings

    const exportedRecording: ScreenRecording = {
      ...recording,
      id: `exported_${recordingId}_${Date.now()}`,
      filename: `${recording.filename.split('.')[0]}.${targetFormat.toLowerCase()}`,
      filepath: outputPath,
      modifiedAt: new Date(),
    };

    this.recordings.set(exportedRecording.id, exportedRecording);
    this.logger.log(`Recording exported successfully: ${exportedRecording.id}`);

    return exportedRecording;
  }

  /**
   * Create a playlist of recordings
   */
  createPlaylist(name: string, description: string, recordingIds: string[]): RecordingPlaylist {
    const playlistId = `playlist_${Date.now()}`;
    const recordings = recordingIds
      .map(id => this.recordings.get(id))
      .filter((r): r is ScreenRecording => r !== undefined);

    const playlist: RecordingPlaylist = {
      id: playlistId,
      name,
      description,
      recordings,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    this.playlists.set(playlistId, playlist);
    this.logger.log(`Playlist created: ${playlistId} with ${recordings.length} recordings`);

    return playlist;
  }

  /**
   * Get a playlist
   */
  getPlaylist(playlistId: string): RecordingPlaylist | undefined {
    return this.playlists.get(playlistId);
  }

  /**
   * Play all recordings in a playlist
   */
  async playPlaylist(playlistId: string, options?: PlaybackOptions): Promise<void> {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) {
      throw new Error(`Playlist not found: ${playlistId}`);
    }

    this.logger.log(`Playing playlist: ${playlistId} with ${playlist.recordings.length} recordings`);

    for (const recording of playlist.recordings) {
      await this.playRecording(recording.id, options);
    }
  }

  /**
   * Get recording statistics
   */
  getRecordingStats(): {
    totalRecordings: number;
    totalDuration: number;
    totalSize: number;
    averageDuration: number;
    averageSize: number;
  } {
    const recordings = Array.from(this.recordings.values());

    if (recordings.length === 0) {
      return {
        totalRecordings: 0,
        totalDuration: 0,
        totalSize: 0,
        averageDuration: 0,
        averageSize: 0,
      };
    }

    const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0);
    const totalSize = recordings.reduce((sum, r) => sum + r.fileSize, 0);

    return {
      totalRecordings: recordings.length,
      totalDuration,
      totalSize,
      averageDuration: totalDuration / recordings.length,
      averageSize: totalSize / recordings.length,
    };
  }

  /**
   * Get active recording sessions
   */
  getActiveSessions(): RecordingSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get recording size on disk
   */
  getRecordingSize(recordingId: string): number {
    const recording = this.recordings.get(recordingId);
    return recording?.fileSize || 0;
  }

  /**
   * Cleanup old recordings periodically
   */
  private startCleanupScheduler(): void {
    const MAX_RECORDINGS = 100;
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

    setInterval(() => {
      const recordings = Array.from(this.recordings.values());
      
      if (recordings.length > MAX_RECORDINGS) {
        // Sort by creation date
        recordings.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        // Remove oldest recordings
        const toRemove = recordings.length - MAX_RECORDINGS;
        for (let i = 0; i < toRemove; i++) {
          this.recordings.delete(recordings[i].id);
        }

        this.logger.log(`Cleaned up ${toRemove} old recordings`);
      }
    }, CLEANUP_INTERVAL);
  }

  /**
   * Shutdown the service
   */
  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down Screen Recorder Service');

    // Stop all active recordings
    for (const [sessionId, session] of this.activeSessions) {
      if (session.isActive) {
        try {
          await this.stopRecording(sessionId);
        } catch (error) {
          this.logger.error(`Error stopping recording ${sessionId}:`, error);
        }
      }
    }

    this.activeSessions.clear();
  }
}
