/**
 * RWANIN — Mux Video & Access Control Types
 */

export type MuxAssetStatus = 'waiting' | 'uploading' | 'processing' | 'ready' | 'errored';
export type MuxPlaybackPolicy = 'public' | 'signed';
export type VideoAccessType = 'free' | 'vip' | 'mixed';
export type VideoProviderType = 'mux' | 'google-drive' | 'direct' | 'firebase';

export interface MuxUploadProgress {
  percentage: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
  status: 'idle' | 'uploading' | 'completed' | 'failed';
}

export interface MuxAssetData {
  assetId: string;
  playbackId: string;
  playbackPolicy: MuxPlaybackPolicy;
  status: MuxAssetStatus;
  duration?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  createdAt?: string;
  updatedAt?: string;
  errorMessage?: string;
}

export interface MovieAccess {
  type: VideoAccessType;
  freeDailyLimitMinutes?: number; // default: 50
  freePreviewMinutes?: number;    // for 'mixed' type, e.g. 10 minutes
}

export interface VideoUploadRecord {
  id: string;
  movieId: string;
  uploadedBy: string;
  muxUploadId: string;
  status: 'waiting' | 'uploading' | 'uploaded' | 'processing' | 'ready' | 'errored' | 'cancelled' | 'timed_out';
  fileName: string;
  fileSize: number;
  progress?: number;
  uploadUrl?: string;
  playbackPolicy?: MuxPlaybackPolicy;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface PlaybackTokenResponse {
  allowed: boolean;
  playbackId: string;
  token?: string;
  policy?: 'public' | 'signed';
  streamUrl?: string;
  expiresAt?: number;
  accessStatus?: 'authorized' | 'vip_required' | 'vip_expired' | 'free_limit_reached' | 'denied';
  reason?: string;
  message?: string;
  freeRemainingSeconds?: number;
  freePreviewMinutes?: number;
  previewMinutes?: number;
}
