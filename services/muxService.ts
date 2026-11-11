import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import * as UpChunk from '@mux/upchunk';
import { db } from './firebase';
import { MuxAssetData, VideoUploadRecord, MuxUploadProgress } from '../types/video';

/**
 * RWANIN — Mux Video Service
 * 
 * Manages Mux Direct Uploads, progress tracking, status listeners,
 * active upload polling, and interactions with backend endpoints.
 */
export class MuxService {
  /**
   * Requests a Mux Direct Upload URL from the secure backend.
   * Supports both overload patterns (positional or parameter object).
   */
  public static async createDirectUpload(
    movieIdOrParams: string | { movieId: string; fileName: string; fileSize: number; playbackPolicy?: 'signed' | 'public'; token?: string },
    playbackPolicy: 'public' | 'signed' = 'signed',
    fileName: string = 'video.mp4',
    fileSize: number = 0
  ): Promise<{ uploadId: string; uploadUrl: string }> {
    let movieId = '';
    let policy = playbackPolicy;
    let name = fileName;
    let size = fileSize;

    if (typeof movieIdOrParams === 'object') {
      movieId = movieIdOrParams.movieId;
      policy = movieIdOrParams.playbackPolicy || 'signed';
      name = movieIdOrParams.fileName;
      size = movieIdOrParams.fileSize;
    } else {
      movieId = movieIdOrParams;
    }

    try {
      const res = await fetch('/api/mux/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movieId,
          playbackPolicy: policy,
          fileName: name,
          fileSize: size
        })
      });

      if (res.ok) {
        const data = await res.json();
        return {
          uploadId: data.uploadId,
          uploadUrl: data.uploadUrl
        };
      }
    } catch (err) {
      console.warn('[muxService] Backend upload endpoint unavailable, using local mock session:', err);
    }

    // Dev / Staging simulated upload record in Firestore
    const uploadId = `upload_${Date.now()}`;
    const uploadRecord: VideoUploadRecord = {
      id: uploadId,
      movieId,
      uploadedBy: 'admin',
      muxUploadId: uploadId,
      status: 'waiting',
      fileName: name,
      fileSize: size,
      progress: 0,
      playbackPolicy: policy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'videoUploads', uploadId), uploadRecord);
    } catch (e) {
      console.warn('Firestore videoUploads write note:', e);
    }

    return {
      uploadId,
      uploadUrl: `/api/mux/mock-upload?uploadId=${uploadId}&movieId=${encodeURIComponent(movieId)}`
    };
  }

  /**
   * High-Speed Video Uploader for Mux.
   * - Files under 200MB: Uses direct high-throughput streaming PUT with zero chunk latency.
   * - Files over 200MB: Uses UpChunk with optimized 30MB chunks for smooth resumable upload.
   */
  public static uploadFileToMuxDirectly(
    file: File,
    uploadUrl: string,
    onProgress: (progress: MuxUploadProgress) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const isLargeFile = file.size > 200 * 1024 * 1024; // > 200MB

    // For files under 200MB, single continuous PUT stream is 3x-5x faster with zero chunk latency:
    if (!isLargeFile) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let lastLoadedTime = Date.now();
        let lastLoadedBytes = 0;

        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

        if (signal) {
          signal.addEventListener('abort', () => {
            xhr.abort();
            reject(new DOMException('Upload aborted', 'AbortError'));
          });
        }

        xhr.upload.onprogress = (e: ProgressEvent) => {
          if (!e.lengthComputable) return;

          const now = Date.now();
          const timeDelta = (now - lastLoadedTime) / 1000;

          let speed = 0;
          if (timeDelta > 0.4) {
            const bytesDelta = e.loaded - lastLoadedBytes;
            speed = Math.max(0, bytesDelta / timeDelta);
            lastLoadedTime = now;
            lastLoadedBytes = e.loaded;
          }

          const percentage = Math.min(100, Math.round((e.loaded / e.total) * 100));
          const remainingBytes = e.total - e.loaded;
          const estimatedSeconds = speed > 0 ? Math.round(remainingBytes / speed) : 0;

          onProgress({
            percentage,
            speed,
            estimatedTimeRemaining: estimatedSeconds,
            status: 'uploading'
          });
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress({ percentage: 100, speed: 0, estimatedTimeRemaining: 0, status: 'completed' });
            resolve();
          } else {
            onProgress({ percentage: 0, speed: 0, estimatedTimeRemaining: 0, status: 'failed' });
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          onProgress({ percentage: 0, speed: 0, estimatedTimeRemaining: 0, status: 'failed' });
          reject(new Error('Network error during video upload'));
        };

        xhr.onabort = () => {
          reject(new DOMException('Upload aborted', 'AbortError'));
        };

        xhr.send(file);
      });
    }

    // For large files (> 200MB), use UpChunk with optimized 30MB chunks (30720 KB)
    return new Promise((resolve, reject) => {
      try {
        let lastLoadedTime = Date.now();
        let lastLoadedPercent = 0;

        const upload = UpChunk.createUpload({
          endpoint: uploadUrl,
          file: file,
          chunkSize: 30720 // 30MB chunks (multiples of 256)
        });

        if (signal) {
          signal.addEventListener('abort', () => {
            try {
              upload.abort();
            } catch {}
            reject(new DOMException('Upload aborted', 'AbortError'));
          });
        }

        upload.on('progress', (ev: any) => {
          const percentage = Math.min(100, Math.max(0, Math.round(ev.detail || 0)));
          const now = Date.now();
          const timeDelta = (now - lastLoadedTime) / 1000;

          let speed = 0;
          if (timeDelta > 0.5) {
            const percentDelta = percentage - lastLoadedPercent;
            const bytesDelta = (percentDelta / 100) * file.size;
            speed = Math.max(0, bytesDelta / timeDelta);
            lastLoadedTime = now;
            lastLoadedPercent = percentage;
          }

          const remainingBytes = file.size * ((100 - percentage) / 100);
          const estimatedSeconds = speed > 0 ? Math.round(remainingBytes / speed) : 0;

          onProgress({
            percentage,
            speed,
            estimatedTimeRemaining: estimatedSeconds,
            status: 'uploading'
          });
        });

        upload.on('success', () => {
          onProgress({
            percentage: 100,
            speed: 0,
            estimatedTimeRemaining: 0,
            status: 'completed'
          });
          resolve();
        });

        upload.on('error', (err: any) => {
          onProgress({
            percentage: 0,
            speed: 0,
            estimatedTimeRemaining: 0,
            status: 'failed'
          });
          reject(new Error(err?.detail?.message || err?.message || 'Error during chunked upload'));
        });
      } catch (err) {
        // Fallback to XMLHttpRequest
        console.warn('UpChunk initialization error, falling back to standard XHR:', err);
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

        if (signal) {
          signal.addEventListener('abort', () => {
            xhr.abort();
            reject(new DOMException('Upload aborted', 'AbortError'));
          });
        }

        xhr.upload.onprogress = (e: ProgressEvent) => {
          if (!e.lengthComputable) return;
          const percentage = Math.min(100, Math.round((e.loaded / e.total) * 100));
          onProgress({
            percentage,
            speed: 0,
            estimatedTimeRemaining: 0,
            status: 'uploading'
          });
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress({ percentage: 100, speed: 0, estimatedTimeRemaining: 0, status: 'completed' });
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during video upload'));
        xhr.send(file);
      }
    });
  }

  /**
   * Polls the backend /api/mux/check-upload endpoint until Mux finishes encoding the video.
   * Essential for environments where Mux cannot send public webhooks (e.g. localhost dev).
   */
  public static async pollUntilAssetReady(
    uploadId: string,
    onStatusUpdate?: (status: string) => void,
    maxAttempts: number = 90
  ): Promise<MuxAssetData> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const res = await fetch(`/api/mux/check-upload?uploadId=${encodeURIComponent(uploadId)}`);
        if (res.ok) {
          const data = await res.json();

          if (data.status === 'ready' && data.playbackId) {
            return {
              assetId: data.assetId || '',
              playbackId: data.playbackId,
              playbackPolicy: data.playbackPolicy || 'public',
              status: 'ready',
              duration: data.duration,
              width: data.width,
              height: data.height,
              aspectRatio: data.aspectRatio,
              updatedAt: new Date().toISOString()
            };
          } else if (data.status === 'errored') {
            throw new Error(data.error || 'Mux نەیتوانی ئەم ڤیدیۆیە پرۆسە بکات.');
          } else if (data.status === 'processing') {
            onStatusUpdate?.('ڤیدیۆکە لەلایەن سێرڤەری Mux ـەوە پرۆسە دەکرێت...');
          } else {
            onStatusUpdate?.('چاوەڕوانی وەرگرتنی ڤیدیۆ لە Mux...');
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Mux نەیتوانی')) throw err;
        console.warn('Polling attempt note:', err);
      }

      // Wait 2.5 seconds before next poll
      await new Promise((r) => setTimeout(r, 2500));
    }

    throw new Error('کاتی پرۆسەکردنی ڤیدیۆ لەلایەن Mux بەسەرچوو. تکایە دووبارە پشکنین بکەرەوە.');
  }

  /**
   * Queries Mux for asset metadata using an existing Playback ID
   */
  public static async getAssetInfoByPlaybackId(playbackId: string): Promise<Partial<MuxAssetData> | null> {
    try {
      const res = await fetch(`/api/mux/asset-info?playbackId=${encodeURIComponent(playbackId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          return {
            assetId: data.assetId || '',
            playbackId: data.playbackId || playbackId,
            playbackPolicy: data.playbackPolicy || 'public',
            status: data.status === 'ready' ? 'ready' : 'processing',
            duration: data.duration,
            width: data.width,
            height: data.height,
            aspectRatio: data.aspectRatio
          };
        }
      }
    } catch (e) {
      console.warn('Failed to verify Playback ID from Mux:', e);
    }
    return null;
  }

  /**
   * Fetches assets present on the user's Mux account
   */
  public static async listAccountAssets(): Promise<any[]> {
    try {
      const res = await fetch('/api/mux/list-assets');
      if (res.ok) {
        const data = await res.json();
        return data.assets || [];
      }
    } catch (e) {
      console.warn('Failed to list Mux assets:', e);
    }
    return [];
  }

  /**
   * Updates the Firestore Movie document directly with Mux metadata and HLS stream URL
   */
  public static async saveMuxToMovieDoc(movieId: string, muxData: MuxAssetData): Promise<void> {
    if (!movieId) return;
    try {
      const movieRef = doc(db, 'movies', movieId);
      await updateDoc(movieRef, {
        videoProvider: 'mux',
        videoUrl: `https://stream.mux.com/${muxData.playbackId}.m3u8`,
        mux: muxData,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Error saving Mux data to movie in Firestore:', err);
    }
  }

  /**
   * Subscribes to real-time status of a specific video upload document
   */
  public static subscribeToUploadStatus(
    uploadId: string,
    callback: (record: VideoUploadRecord | null) => void
  ): () => void {
    try {
      const unsub = onSnapshot(doc(db, 'videoUploads', uploadId), (snap: any) => {
        if (snap.exists()) {
          callback(snap.data() as VideoUploadRecord);
        } else {
          callback(null);
        }
      });
      return unsub;
    } catch {
      return () => {};
    }
  }

  /**
   * Subscribes to real-time Mux video status for a movie
   */
  public static subscribeToMovieMuxStatus(
    movieId: string,
    callback: (muxData?: MuxAssetData) => void
  ): () => void {
    try {
      const unsub = onSnapshot(doc(db, 'movies', movieId), (snap: any) => {
        if (snap.exists()) {
          const data = snap.data();
          callback(data.mux);
        } else {
          callback(undefined);
        }
      });
      return unsub;
    } catch {
      return () => {};
    }
  }

  /**
   * Deletes a Mux video asset via backend
   */
  public static async deleteMuxAsset(movieId: string, assetId?: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/mux/asset/${assetId || movieId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, assetId })
      });
      if (res.ok) return true;
    } catch {}

    // Firestore fallback cleanup
    try {
      await updateDoc(doc(db, 'movies', movieId), {
        'mux.status': 'waiting',
        'mux.assetId': '',
        'mux.playbackId': '',
        videoProvider: 'google-drive'
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const muxService = MuxService;

