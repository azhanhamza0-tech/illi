import { PlayableVideo, VideoQualityOption } from './types';

/**
 * RWANIN — Google Drive Video Source Resolver
 * 
 * Extracts Google Drive file IDs and constructs high-compatibility
 * direct MP4 streaming links for HTML5 <video> playback.
 */

// Regular expressions to detect Google Drive link structures
const GDRIVE_ID_PATTERNS = [
  // drive.google.com/file/d/{id}/...
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{15,})/i,
  // drive.google.com/open?id={id}
  /drive\.google\.com\/open\?(?:[^#&]*&)?id=([a-zA-Z0-9_-]{15,})/i,
  // drive.google.com/uc?(...&)id={id}
  /drive\.google\.com\/uc\?(?:[^#&]*&)?id=([a-zA-Z0-9_-]{15,})/i,
  // docs.google.com/file/d/{id}
  /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]{15,})/i,
  // docs.google.com/uc?id={id}
  /docs\.google\.com\/uc\?(?:[^#&]*&)?id=([a-zA-Z0-9_-]{15,})/i,
  // drive.google.com/drive/folders/{id} (folder link, handled with warning)
  /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]{15,})/i
];

export class GoogleDriveResolver {
  /**
   * Checks whether the input string corresponds to a Google Drive link or ID
   */
  public static isGoogleDrive(input?: string): boolean {
    if (!input || typeof input !== 'string') return false;
    const clean = input.trim();
    if (clean.includes('drive.google.com') || clean.includes('docs.google.com')) {
      return true;
    }
    // Check if it's a bare alphanumeric file ID of 25-50 characters with no slashes
    if (/^[a-zA-Z0-9_-]{25,50}$/.test(clean)) {
      return true;
    }
    return false;
  }

  /**
   * Checks whether the input is a Google Drive folder URL (which cannot be played directly as a video)
   */
  public static isFolderUrl(input?: string): boolean {
    if (!input) return false;
    return input.includes('/folders/') || input.includes('drive/folders/');
  }

  /**
   * Extracts the unique Google Drive File ID from any sharing or direct link
   */
  public static extractFileId(input?: string): string | null {
    if (!input || typeof input !== 'string') return null;
    const clean = input.trim();

    // 1. Check if raw file ID
    if (/^[a-zA-Z0-9_-]{25,50}$/.test(clean)) {
      return clean;
    }

    // 2. Iterate regex patterns
    for (const pattern of GDRIVE_ID_PATTERNS) {
      const match = clean.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Generates prioritized direct streaming endpoint URLs for an extracted Google Drive file ID
   */
  public static getDirectStreamCandidates(fileId: string): string[] {
    if (!fileId) return [];
    return [
      // Primary: Usercontent MP4 direct stream with confirmation bypass
      `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
      // Alternate 1: Direct uc download with confirm token
      `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`,
      // Alternate 2: Standard uc export
      `https://drive.google.com/uc?export=download&id=${fileId}`,
      // Alternate 3: Docs open endpoint
      `https://docs.google.com/uc?export=open&id=${fileId}`
    ];
  }

  /**
   * Resolves a Google Drive source into a PlayableVideo object
   */
  public static resolve(rawUrlOrId: string, title?: string, poster?: string): PlayableVideo {
    const clean = (rawUrlOrId || '').trim();
    const fileId = this.extractFileId(clean);

    if (!fileId) {
      return {
        provider: 'google-drive',
        streamUrl: clean,
        originalUrl: clean,
        isDirectMp4: false,
        canUseHtml5Video: false,
        fallbackCandidates: [],
        qualities: [{ label: 'ڕەسەن (Original)', url: clean }],
        subtitles: [],
        title,
        poster
      };
    }

    const candidates = this.getDirectStreamCandidates(fileId);
    const primaryStreamUrl = candidates[0];
    const previewEmbedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

    const qualities: VideoQualityOption[] = [
      { label: 'Auto (1080p / MP4)', url: primaryStreamUrl },
      { label: 'سێرڤەری یەدەگ (CDN)', url: candidates[1] || primaryStreamUrl }
    ];

    return {
      provider: 'google-drive',
      streamUrl: primaryStreamUrl,
      originalUrl: clean,
      fileId,
      isDirectMp4: true,
      canUseHtml5Video: true,
      fallbackCandidates: candidates,
      fallbackEmbedUrl: previewEmbedUrl,
      qualities,
      subtitles: [],
      title,
      poster
    };
  }
}
