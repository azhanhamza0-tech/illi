import { MuxAssetData, MovieAccess, VideoProviderType } from './video';
import { UserSubscription } from './subscription';

export type { VideoProviderType, MuxAssetData, MovieAccess } from './video';

export interface CastMember {
  name: string;
  role: string;
  avatar?: string;
}

export interface EpisodeItem {
  id: string;
  episodeNumber: number;
  seasonNumber?: number;
  title: string;
  videoUrl: string;
  duration?: string;
  thumbnail?: string;
  mux?: MuxAssetData;
  access?: MovieAccess;
}

export type MediaType = 'movie' | 'tv' | 'anime';

export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  imdbId?: string;
  tmdbId?: number;
  type?: MediaType; // 'movie' | 'tv' | 'anime'
  seasons?: number;
  episodes?: number;
  episodeList?: EpisodeItem[];
  year: number;
  rating: number;
  genre: string[];
  country: string;
  language: string[];
  duration: string;
  director: string;
  cast: string[];
  castMembers?: CastMember[];
  poster: string;
  backdrop: string;
  trailer?: string;
  video?: string;
  videoUrl?: string;
  mux?: MuxAssetData;
  access?: MovieAccess;
  videoProvider?: VideoProviderType;
  qualities?: {
    [key: string]: string; // '4K', '1080p', '720p'
  };
  subtitles?: any;
  description: string;
  isVIP: boolean;
  isVip?: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isRecommended?: boolean;
  dubbedBy?: string;
  originalLanguage?: string;
  isDubbed?: boolean;
  introStart?: number; // In seconds (e.g. 10)
  introEnd?: number;   // In seconds (e.g. 85)
  views: number;
  badge?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'owner' | 'admin' | 'user';
export type UserPackage = 'FREE' | 'VIP';

export interface User {
  id: string;
  uid?: string;
  name: string;
  email: string;
  avatar: string;
  photoURL?: string;
  role: UserRole;
  package: UserPackage;
  isVIP?: boolean;
  isVip?: boolean;
  isAdmin?: boolean;
  isOwner?: boolean;
  subscription?: UserSubscription;
  subscriptionStatus?: 'active' | 'expired' | 'canceled';
  subscriptionStart?: string;
  subscriptionEnd?: string;
  vipExpiresAt?: string;
  joinDate: string;
  status: 'active' | 'blocked';
  dailyMinutesRemaining?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin';
  status: 'active' | 'disabled';
  avatar?: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  roleTitle: string; // e.g. "دامەزرێنەر و خاوەنی ماڵپەڕ", "سەرپەرشتیاری بەڕێوەبەران", "وەرگێڕی باڵا"
  category: 'owner' | 'admin' | 'translator' | 'developer' | 'moderator';
  avatar: string;
  bio: string;
  email?: string;
  telegram?: string;
  instagram?: string;
  badge?: string;
  order: number;
  createdAt: string;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  method: 'FIB' | 'Qi Card' | 'QR Payment';
  amount: string;
  transactionId: string;
  receiptImage?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'pending' | 'approved' | 'rejected';
  date: string;
  createdAt?: string;
}

export interface Review {
  id: string;
  movieId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
  isVIP?: boolean;
  status?: 'published' | 'flagged';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'info' | 'vip' | 'movie' | 'system';
  link?: string;
  createdAt?: string;
}

export interface ContinueWatchingItem {
  movieId: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  role: 'owner' | 'admin';
  action: string;
  targetType: string;
  targetId?: string;
  timestamp: string;
  description: string;
}

export type SortFilterOption = 'newest' | 'popular' | 'rating' | 'az';

export type ReportReason =
  | 'video_broken'
  | 'audio_sub_issue'
  | 'wrong_info'
  | 'poor_quality'
  | 'other'
  | "Video doesn't work"
  | 'Wrong subtitle'
  | 'Wrong information'
  | 'Bad quality'
  | 'Other';

export interface MovieReport {
  id: string;
  movieId: string;
  movieTitle: string;
  moviePoster?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  reason: ReportReason;
  reasonText?: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
}

export interface UserDeviceSession {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'tv';
  browser: string;
  os: string;
  ip?: string;
  location?: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserCustomCollection {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  movieIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface UserAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  targetProgress?: number;
  progress: number;
  currentProgress?: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface UserWatchAnalytics {
  totalSeconds: number;
  moviesWatchedCount: number;
  genreBreakdown: { [genre: string]: number };
  ratingBreakdown: { [range: string]: number };
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate: string;
}


