import { AppNotification, Movie, User } from '../types/movie';
import { movieService } from './movieService';

const NOTIFICATIONS_STORAGE_KEY = 'rwanin_user_notifications';

class NotificationService {
  private notifications: AppNotification[] = [];
  private listeners = new Set<(notifs: AppNotification[]) => void>();

  constructor() {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
        return;
      }
    } catch (e) {
      console.warn('Error reading notifications:', e);
    }

    // Default rich welcome notifications
    this.notifications = [
      {
        id: 'notif-welcome',
        title: 'بەخێربێیت بۆ پلاتفۆرمی ڕوانین! 🎬',
        message: 'نوێترین بەرهەمە سینەماییە کوردی و جیهانییەکان بە کوالێتی 4K و ژێرنووسی تایبەت ئامادەیە.',
        time: 'ئێستا',
        unread: true,
        type: 'info',
        link: '/catalog'
      }
    ];
    this.saveNotifications();
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (e) {
      console.warn('Error saving notifications:', e);
    }
  }

  private notifyListeners(): void {
    this.saveNotifications();
    this.listeners.forEach((cb) => cb(this.getNotifications()));
  }

  public subscribe(callback: (notifs: AppNotification[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getNotifications());
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getNotifications(_userId?: string): AppNotification[] {
    return this.notifications;
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => n.unread).length;
  }

  public markAsRead(id: string): void {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, unread: false } : n
    );
    this.notifyListeners();
  }

  public markAllAsRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, unread: false }));
    this.notifyListeners();
  }

  public async createNotification(notif: { title: string; message: string; type?: any; link?: string }): Promise<AppNotification> {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: notif.title,
      message: notif.message,
      time: 'ئێستا',
      unread: true,
      type: notif.type || 'info',
      link: notif.link || '/'
    };
    this.notifications = [newNotif, ...this.notifications];
    this.notifyListeners();
    this.showBrowserPushNotification(newNotif.title, newNotif.message);
    return newNotif;
  }

  public async deleteNotification(id: string): Promise<boolean> {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notifyListeners();
    return true;
  }

  public sendBrowserPush(title: string, message: string): void {
    this.showBrowserPushNotification(title, message);
  }

  public addNotification(notif: Omit<AppNotification, 'id'>): void {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    this.notifications = [newNotif, ...this.notifications].slice(0, 30);
    this.notifyListeners();

    // Trigger Native Browser Notification if permission granted
    this.showBrowserPushNotification(newNotif.title, newNotif.message);
  }

  /**
   * Automatically generate notifications based on user state & movie catalog
   */
  public generateAutomatedNotifications(user: User | null, favoriteIds: string[] = []): void {
    const movies = movieService.getMovies();
    if (movies.length === 0) return;

    const existingTitles = new Set(this.notifications.map((n) => n.title));

    // 1. New Movie Notification: Check recently added movies
    const latestMovie = movies[0];
    if (latestMovie && !existingTitles.has(`فیلمی نوێ: ${latestMovie.title}`)) {
      this.addNotification({
        title: `فیلمی نوێ: ${latestMovie.title}`,
        message: `${latestMovie.title} ئێستا بە کوالێتی بەرز و دۆبلاژ/ژێرنووسی کوردی بەردەستە!`,
        time: 'ئەمڕۆ',
        unread: true,
        type: 'movie',
        link: `/movie/${latestMovie.id}`
      });
    }

    // 2. VIP Warning Notification
    if (user && user.package === 'VIP') {
      const isExpiringSoon = user.vipExpiresAt
        ? new Date(user.vipExpiresAt).getTime() - Date.now() < 3 * 24 * 3600 * 1000
        : false;

      const vipTitle = 'ئاگاداری بەشداریکردنی VIP 👑';
      if (isExpiringSoon && !existingTitles.has(vipTitle)) {
        this.addNotification({
          title: vipTitle,
          message: 'ماوەی بەشداریکردنی VIP ـەکەت کەمتر لە ٣ ڕۆژی ماوە. بۆ بەردەوامبوونی پەخشی 4K و بێ ڕیکلام نوێی بکەرەوە.',
          time: 'ئەمڕۆ',
          unread: true,
          type: 'vip',
          link: '/vip'
        });
      }
    }

    // 3. Favorited Movie Update Notification
    if (favoriteIds.length > 0) {
      const favMovie = movies.find((m) => favoriteIds.includes(m.id));
      const favTitle = favMovie ? `نوێکاری لە لیستی دڵخواز: ${favMovie.title}` : '';
      if (favMovie && favTitle && !existingTitles.has(favTitle)) {
        this.addNotification({
          title: favTitle,
          message: `فیلمی "${favMovie.title}" کە لە لیستی دڵخوازەکانتە سێرڤەری خێرای 4K بۆ چالاک کرا!`,
          time: 'دوێنێ',
          unread: true,
          type: 'info',
          link: `/movie/${favMovie.id}`
        });
      }
    }
  }

  /**
   * Request Web Push Notification Permission
   */
  public async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  private showBrowserPushNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/rwanin-mark.png'
        });
      } catch (err) {
        console.warn('Could not display browser push notification:', err);
      }
    }
  }
}

export const notificationService = new NotificationService();
