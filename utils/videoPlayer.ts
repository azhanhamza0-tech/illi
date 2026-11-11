export type StreamPlayerType = 'youtube' | 'embed' | 'direct';

export interface StreamInfo {
  type: StreamPlayerType;
  url: string;
  isIframeSupported: boolean;
  isGoogleDrive?: boolean;
  googleDriveId?: string;
  googleDriveDownloadUrl?: string;
  isGoogleDriveFolder?: boolean;
  isMux?: boolean;
  muxPlaybackId?: string;
  originalUrl: string;
}

/**
 * Extracts and normalizes a Mux Playback ID from a raw ID, Mux stream URL, or HLS manifest
 */
export const parseMuxPlaybackId = (input?: string): string | null => {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // 1. If full or partial URL matching stream.mux.com
  const urlMatch = trimmed.match(/stream\.mux\.com\/([a-zA-Z0-9_-]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // 2. If direct Playback ID (typically 16-60 alphanumeric chars, dashes, underscores)
  // Must not be a typical URL with slashes, dots, or protocol
  if (
    /^[a-zA-Z0-9_-]{15,60}$/.test(trimmed) &&
    !trimmed.includes('/') &&
    !trimmed.includes('.') &&
    !trimmed.includes(':')
  ) {
    return trimmed;
  }

  return null;
};

/**
 * Universal video parser that detects Mux, Google Drive, YouTube, streaming embeds, iframes, and direct MP4/WebM files.
 */
export const parseStreamUrl = (rawUrl?: string): StreamInfo => {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      type: 'direct',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      isIframeSupported: false,
      originalUrl: ''
    };
  }

  let clean = rawUrl.trim();
  if (clean.includes('commondatastorage.googleapis.com')) {
    clean = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  }

  // 0. Check for Mux Playback ID or Mux stream URL
  const muxId = parseMuxPlaybackId(clean);
  if (muxId) {
    return {
      type: 'direct',
      url: `https://stream.mux.com/${muxId}.m3u8`,
      isIframeSupported: false,
      isMux: true,
      muxPlaybackId: muxId,
      originalUrl: clean
    };
  }

  // 1. If user pasted an iframe HTML tag: <iframe src="https://..." ...>
  const iframeMatch = clean.match(/src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    clean = iframeMatch[1].trim();
  }

  // 2. Google Drive folder check (warning user if they pasted a folder instead of a file)
  if (clean.includes('drive.google.com/drive/folders/') || clean.includes('/drive/u/') && clean.includes('/folders/')) {
    return {
      type: 'embed',
      url: clean,
      isIframeSupported: true,
      isGoogleDrive: true,
      isGoogleDriveFolder: true,
      originalUrl: clean
    };
  }

  // 3. Google Drive File Links (CRITICAL):
  // Formats supported:
  // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // - https://drive.google.com/file/d/FILE_ID/view
  // - https://drive.google.com/file/d/FILE_ID/preview
  // - https://drive.google.com/file/d/FILE_ID
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID
  // - https://drive.google.com/uc?export=download&id=FILE_ID
  // - https://docs.google.com/file/d/FILE_ID/edit
  const gdriveMatch = clean.match(
    /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#&]*&)?id=)|docs\.google\.com\/(?:file\/d\/|uc\?id=))([a-zA-Z0-9_-]{15,})/i
  );

  if (gdriveMatch && gdriveMatch[1]) {
    const fileId = gdriveMatch[1];
    const directStreamUrl = `/api/proxy/drive/${fileId}`;
    return {
      type: 'direct',
      url: directStreamUrl,
      isIframeSupported: false,
      isGoogleDrive: true,
      googleDriveId: fileId,
      googleDriveDownloadUrl: directStreamUrl,
      originalUrl: clean
    };
  }

  // 4. YouTube Links:
  const ytMatch = clean.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      url: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
      isIframeSupported: true,
      originalUrl: clean
    };
  }

  // 5. Dropbox Links: convert ?dl=0 to ?raw=1 for streaming
  if (clean.includes('dropbox.com/s/')) {
    const directDropbox = clean.replace(/\?dl=[01]/, '').replace(/&dl=[01]/, '') + '?raw=1';
    return {
      type: 'direct',
      url: directDropbox,
      isIframeSupported: false,
      originalUrl: clean
    };
  }

  // 6. Known streaming providers (VidSrc, Streamtape, Doodstream, OK.ru, Mega, etc.)
  const isEmbedProvider =
    /(vidsrc|streamtape|dood|embed|ok\.ru|mega\.nz|player|videoembed|filemoon|mixdrop|uqload|superembed|vidcloud|rabbitstream|upstream|vidmoly|voe\.sx|streamwish)/i.test(
      clean
    );
  const isDirectFile = /\.(mp4|webm|ogg|mov|mkv)(\?.*)?$/i.test(clean);

  if (isEmbedProvider && !isDirectFile) {
    return {
      type: 'embed',
      url: clean,
      isIframeSupported: true,
      originalUrl: clean
    };
  }

  // 7. Any URL with /embed/ or /e/
  if (!isDirectFile && (clean.includes('/embed/') || clean.includes('/e/') || clean.includes('/v/'))) {
    return {
      type: 'embed',
      url: clean,
      isIframeSupported: true,
      originalUrl: clean
    };
  }

  // 8. Generic web streaming page URL (not ending in direct video file extension)
  if (
    !isDirectFile &&
    (clean.startsWith('http://') || clean.startsWith('https://')) &&
    !clean.includes('.mp4') &&
    !clean.includes('.webm')
  ) {
    return {
      type: 'embed',
      url: clean,
      isIframeSupported: true,
      originalUrl: clean
    };
  }

  return {
    type: 'direct',
    url: clean,
    isIframeSupported: false,
    originalUrl: clean
  };
};

/**
 * Helper to normalize Google Drive and Mux streaming URLs before saving
 */
export const normalizeGoogleDriveUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return url;
  const parsed = parseStreamUrl(url);
  if (parsed.isMux && parsed.muxPlaybackId) {
    return `https://stream.mux.com/${parsed.muxPlaybackId}.m3u8`;
  }
  if (parsed.isGoogleDrive && parsed.googleDriveId) {
    return `/api/proxy/drive/${parsed.googleDriveId}`;
  }
  return url;
};
