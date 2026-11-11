import { auth } from './firebase';
import { PlaybackTokenResponse } from '../types/video';
import { VideoPlaybackService as InternalPlaybackUtil } from './video/VideoPlaybackService';

export class VideoPlaybackService {
  public static formatTime(totalSeconds: number): string {
    return InternalPlaybackUtil.formatTime(totalSeconds);
  }

  public static isCompleted(currentTime: number, duration: number): boolean {
    return InternalPlaybackUtil.isCompleted(currentTime, duration);
  }

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
    InternalPlaybackUtil.updateMediaSession(params);
  }

  /**
   * Fetches a secure playback token from the backend for a given movie.
   * Checks authorization (Free / VIP / Mixed / Daily Limit).
   */
  public static async getPlaybackToken(
    movieId: string,
    playbackId?: string,
    policy: 'public' | 'signed' = 'public'
  ): Promise<PlaybackTokenResponse> {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;

    try {
      const response = await fetch(`/api/mux/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ movieId, playbackId, policy })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return {
          allowed: false,
          playbackId: '',
          reason: errJson.reason || 'UNKNOWN_ERROR',
          message: errJson.message || 'نەتوانرا مۆڵەتی سەیرکردنی ئەم فیلمە وەربگیرێت.'
        };
      }

      const data: PlaybackTokenResponse = await response.json();
      return data;
    } catch (err: any) {
      console.warn('[VideoPlaybackService] Error requesting playback token:', err);
      return {
        allowed: false,
        playbackId: '',
        reason: 'NETWORK_ERROR',
        message: 'کێشەی پەیوەندی هەیە لەگەڵ سێرڤەر. دووبارە هەوڵبدەرەوە.'
      };
    }
  }
}

export const videoPlaybackService = VideoPlaybackService;
