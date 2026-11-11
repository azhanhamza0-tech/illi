import { PlayableVideo, VideoProvider, VideoQualityOption, SubtitleTrack } from './types';
import { GoogleDriveResolver } from './GoogleDriveResolver';
import { Movie } from '../../types/movie';

/**
 * RWANIN — Universal Video Source Resolver
 * 
 * Abstract pipeline that takes any movie configuration and resolves it into
 * a standardized PlayableVideo structure ready for RWANIN's cinematic HTML5 player.
 */

const DEFAULT_FALLBACK_STREAM =
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

export class VideoSourceResolver {
  /**
   * Resolves a movie object or raw URL into a PlayableVideo
   */
  public static resolve(
    movieOrUrl: Movie | string,
    options?: {
      selectedEpisode?: number;
      selectedQuality?: string;
    }
  ): PlayableVideo {
    let rawUrl = '';
    let movie: Movie | undefined;

    if (typeof movieOrUrl === 'string') {
      rawUrl = movieOrUrl;
    } else {
      movie = movieOrUrl;
      // If TV series / episode specified
      if (options?.selectedEpisode && movie.episodeList && movie.episodeList.length > 0) {
        const ep = movie.episodeList.find((e) => e.episodeNumber === options.selectedEpisode);
        if (ep?.videoUrl) {
          rawUrl = ep.videoUrl;
        }
      }

      if (!rawUrl) {
        if (options?.selectedQuality && movie.qualities && movie.qualities[options.selectedQuality]) {
          rawUrl = movie.qualities[options.selectedQuality];
        } else {
          rawUrl = movie.videoUrl || movie.video || movie.trailer || '';
        }
      }
    }

    rawUrl = (rawUrl || '').trim();
    if (!rawUrl || rawUrl.includes('commondatastorage.googleapis.com')) {
      rawUrl = DEFAULT_FALLBACK_STREAM;
    }

    // 1. Check if user pasted an iframe HTML tag: <iframe src="https://..." ...>
    const iframeMatch = rawUrl.match(/src=["']([^"']+)["']/i);
    if (iframeMatch && iframeMatch[1]) {
      rawUrl = iframeMatch[1].trim();
    }

    const title = movie?.title;
    const poster = movie?.poster;

    // 2. Resolve Google Drive
    if (GoogleDriveResolver.isGoogleDrive(rawUrl)) {
      const resolved = GoogleDriveResolver.resolve(rawUrl, title, poster);
      // Merge additional qualities if available
      if (movie?.qualities) {
        Object.entries(movie.qualities).forEach(([label, url]) => {
          if (url && !resolved.qualities.some((q) => q.url === url)) {
            resolved.qualities.push({ label, url });
          }
        });
      }
      // Merge subtitles if available
      if (movie?.subtitles && Array.isArray(movie.subtitles)) {
        resolved.subtitles = movie.subtitles.map((s: any) => ({
          lang: (s.lang as any) || 'ku',
          label: s.label || 'کوردی',
          src: (s as any).src || ''
        }));
      }
      return resolved;
    }

    // 3. Detect Provider
    const provider = this.detectProvider(rawUrl);

    // 4. Resolve Direct MP4 / WebM / CDN
    const isDirectMp4 = /\.(mp4|webm|m4v|ogg)(\?.*)?$/i.test(rawUrl);
    const canUseHtml5Video = isDirectMp4 || provider === 'direct' || provider === 'firebase';

    const qualities: VideoQualityOption[] = [{ label: 'ڕەسەن (Auto)', url: rawUrl }];
    if (movie?.qualities) {
      Object.entries(movie.qualities).forEach(([label, url]) => {
        if (url && url !== rawUrl) {
          qualities.push({ label, url });
        }
      });
    }

    const subtitles: SubtitleTrack[] = [];
    if (movie?.subtitles && Array.isArray(movie.subtitles)) {
      movie.subtitles.forEach((s: any) => {
        subtitles.push({
          lang: (s.lang as any) || 'ku',
          label: s.label || 'کوردی',
          src: (s as any).src || ''
        });
      });
    }

    return {
      provider,
      streamUrl: rawUrl,
      originalUrl: rawUrl,
      isDirectMp4,
      canUseHtml5Video,
      fallbackCandidates: [rawUrl],
      qualities,
      subtitles,
      title,
      poster
    };
  }

  /**
   * Helper to identify source provider
   */
  private static detectProvider(url: string): VideoProvider {
    if (GoogleDriveResolver.isGoogleDrive(url)) return 'google-drive';
    if (url.includes('firebasestorage.googleapis.com')) return 'firebase';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('/embed/') || url.includes('/e/') || url.includes('vidsrc') || url.includes('streamtape')) {
      return 'embed';
    }
    return 'direct';
  }
}
