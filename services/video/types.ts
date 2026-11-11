/**
 * RWANIN (ڕوانین) — Video Source & Playback Types
 */

export type VideoProvider = 'google-drive' | 'direct' | 'firebase' | 'youtube' | 'embed';

export interface VideoQualityOption {
  label: string; // e.g. '1080p', '720p', '480p', 'Auto / ڕەسەن'
  url: string;
}

export interface SubtitleTrack {
  lang: 'ku' | 'en' | 'ar' | 'tr';
  label: string;
  src: string; // URL to .srt or .vtt or inline cues
  default?: boolean;
}

export interface VideoSource {
  provider?: VideoProvider;
  url: string;
  fileId?: string;
  format?: 'mp4' | 'webm' | 'hls' | 'embed';
  qualities?: Record<string, string>;
  subtitles?: SubtitleTrack[];
}

export interface PlayableVideo {
  provider: VideoProvider;
  streamUrl: string;
  originalUrl: string;
  fileId?: string;
  isDirectMp4: boolean;
  canUseHtml5Video: boolean;
  fallbackCandidates: string[];
  fallbackEmbedUrl?: string;
  qualities: VideoQualityOption[];
  subtitles: SubtitleTrack[];
  title?: string;
  poster?: string;
}

export interface PlayerProgressState {
  currentTime: number;
  duration: number;
  buffered: number; // percentage 0-100
  percentage: number; // percentage 0-100
  isLive?: boolean;
}

export interface PlayerControlsState {
  isPlaying: boolean;
  isBuffering: boolean;
  isLoading: boolean;
  isMuted: boolean;
  volume: number; // 0 to 1
  playbackRate: number; // 0.5 to 2
  isFullscreen: boolean;
  isPiPSupported: boolean;
  isPiPActive: boolean;
  showControls: boolean;
  activeQuality: string;
  activeSubtitle: string; // 'off' or lang code
  hasError: boolean;
  errorMessage?: string;
}
