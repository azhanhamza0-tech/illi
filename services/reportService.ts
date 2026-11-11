import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { MovieReport, ReportReason } from '../types/movie';

const REPORTS_STORAGE_KEY = 'rwanin_movie_reports';

export const REPORT_REASONS_KU: { id: ReportReason; label: string }[] = [
  { id: 'video_broken', label: 'ڤیدیۆ پەخش نابێت یان وەستاوە' },
  { id: 'audio_sub_issue', label: 'کێشەی دەنگ یان ژێرنووسی هەڵە' },
  { id: 'wrong_info', label: 'زانیاری یان وێنەی هەڵە لەسەر فیلم' },
  { id: 'poor_quality', label: 'کوالێتی نزمە یان کێشەی تەقیین هەیە' },
  { id: 'other', label: 'کێشەیەکی تر' },
  { id: "Video doesn't work", label: "🔴 ڤیدیۆکە کار ناکات (Video doesn't work)" },
  { id: 'Wrong subtitle', label: '📝 ژێرنووس هەڵەیە یاخود نییە (Wrong subtitle)' },
  { id: 'Wrong information', label: 'ℹ️ زانیاری هەڵەیە (Wrong information)' },
  { id: 'Bad quality', label: '📉 کوالێتی کەمە / خراپە (Bad quality)' },
  { id: 'Other', label: '⚠️ کێشەی تر (Other)' }
];

class ReportService {
  private reports: MovieReport[] = [];
  private listeners = new Set<(reports: MovieReport[]) => void>();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
      if (stored) {
        this.reports = JSON.parse(stored);
        return;
      }
    } catch (e) {
      console.warn('Error reading reports cache:', e);
    }

    // Default sample reports so admin can immediately inspect the UI
    this.reports = [
      {
        id: 'rep-sample-1',
        movieId: 'oppenheimer-2023',
        movieTitle: 'ئۆپنهایمەر (Oppenheimer)',
        moviePoster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600',
        userId: 'user-guest-1',
        userEmail: 'viewer1@gmail.com',
        reason: 'audio_sub_issue',
        reasonText: 'کێشەی دەنگ یان ژێرنووسی هەڵە',
        details: 'لە چرکەی ٤٥ ژێرنووس بە چەند چرکەیەک پێش دەنگ دەکەوێت.',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'rep-sample-2',
        movieId: 'turtles-can-fly',
        movieTitle: 'کیسەڵەکانیش دەفڕن (Turtles Can Fly)',
        moviePoster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600',
        userId: 'user-guest-2',
        userEmail: 'kurdish_cinema@yahoo.com',
        reason: 'video_broken',
        reasonText: 'ڤیدیۆ پەخش نابێت یان وەستاوە',
        details: 'سێرڤەری 1080p دەوەستێت کاتێک لەسەر مۆبایل دەیبینم.',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(this.reports));
    } catch (e) {
      console.warn('Error saving reports cache:', e);
    }
  }

  private notify(): void {
    this.saveToStorage();
    this.listeners.forEach((cb) => cb(this.getReports()));
  }

  public subscribe(callback: (reports: MovieReport[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getReports());
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getReports(): MovieReport[] {
    return [...this.reports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async submitReport(reportData: {
    movieId: string;
    movieTitle: string;
    moviePoster?: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    reason: ReportReason;
    details?: string;
  }): Promise<MovieReport> {
    const reasonItem = REPORT_REASONS_KU.find((r) => r.id === reportData.reason);
    const newReport: MovieReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      movieId: reportData.movieId,
      movieTitle: reportData.movieTitle,
      moviePoster: reportData.moviePoster,
      userId: reportData.userId,
      userName: reportData.userName || 'بەکارهێنەر',
      userEmail: reportData.userEmail || (reportData.userName ? `${reportData.userName}@rwanin.stream` : 'بەکارهێنەری میوان'),
      reason: reportData.reason,
      reasonText: reasonItem ? reasonItem.label : 'کێشەی فیلم',
      details: reportData.details || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.reports = [newReport, ...this.reports];
    this.notify();

    try {
      await setDoc(doc(db, 'movie_reports', newReport.id), newReport);
    } catch (err) {
      console.warn('Firestore report submit note:', err);
    }

    return newReport;
  }

  public async updateReportStatus(
    id: string,
    status: 'pending' | 'resolved' | 'dismissed'
  ): Promise<void> {
    this.reports = this.reports.map((r) =>
      r.id === id ? { ...r, status, resolvedAt: new Date().toISOString() } : r
    );
    this.notify();

    try {
      await updateDoc(doc(db, 'movie_reports', id), {
        status,
        resolvedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore update report status note:', err);
    }
  }

  public async deleteReport(id: string): Promise<void> {
    this.reports = this.reports.filter((r) => r.id !== id);
    this.notify();

    try {
      await deleteDoc(doc(db, 'movie_reports', id));
    } catch (err) {
      console.warn('Firestore delete report note:', err);
    }
  }
}

export const reportService = new ReportService();
