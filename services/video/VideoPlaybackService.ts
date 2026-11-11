import { watchProgressService } from '../watchProgressService';

/**
 * RWANIN — Video Playback Service
 * 
 * Central coordinator for time formatting, watch history persistence,
 * completion thresholds (90-95%), and Media Session integration.
 */

export class VideoPlaybackService {
  public static COMPLETION_PERCENTAGE = 0.92; // 92% marks movie as completed

  /**
   * Formats seconds into clean MM:SS or HH:MM:SS
   */
  public static formatTime(totalSeconds: number): string {
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) {
      return '00:00';
    }

    const sec = Math.floor(totalSeconds);
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  /**
   * Checks if video reached completion threshold
   */
  public static isCompleted(currentTime: number, duration: number): boolean {
    if (!duration || duration <= 0) return false;
    return currentTime / duration >= this.COMPLETION_PERCENTAGE;
  }

  /**
   * Saves progress using the existing watchProgressService
   */
  public static recordProgress(
    movieId: string,
    currentTime: number,
    duration: number,
    userId?: string
  ): void {
    if (!movieId || duration <= 0) return;
    watchProgressService.saveProgress(movieId, currentTime, duration, userId);
  }

  /**
   * Sets up Media Session API for native lock-screen & mobile notification controls
   */
  public static updateMediaSession(params: {
    title?: string;
    artist?: string;
    album?: string;
    artworkUrl?: string;
    onPlay?: () => void;
    onPause?: () => void;
    onSeekForward?: () => void;
    onSeekBackward?: () => void;
  }): void {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: params.title || 'ڕوانین — پەخشی فیلم',
        artist: params.artist || 'RWANIN Cinema',
        album: params.album || 'ڕوانین',
        artwork: params.artworkUrl
          ? [
              { src: params.artworkUrl, sizes: '96x96', type: 'image/jpeg' },
              { src: params.artworkUrl, sizes: '192x192', type: 'image/jpeg' },
              { src: params.artworkUrl, sizes: '512x512', type: 'image/jpeg' }
            ]
          : []
      });

      if (params.onPlay) {
        navigator.mediaSession.setActionHandler('play', params.onPlay);
      }
      if (params.onPause) {
        navigator.mediaSession.setActionHandler('pause', params.onPause);
      }
      if (params.onSeekForward) {
        navigator.mediaSession.setActionHandler('seekforward', params.onSeekForward);
      }
      if (params.onSeekBackward) {
        navigator.mediaSession.setActionHandler('seekbackward', params.onSeekBackward);
      }
    } catch (e) {
      console.warn('MediaSession handler warning:', e);
    }
  }

  /**
   * Cleans up MediaSession handlers on player unmount
   */
  public static clearMediaSession(): void {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
    } catch {
      // Ignored
    }
  }
}
