import { UserDeviceSession } from '../types/movie';

const DEVICE_STORAGE_KEY = 'rwanin_user_devices';

class DeviceService {
  private devices: UserDeviceSession[] = [];
  private listeners = new Set<(devices: UserDeviceSession[]) => void>();

  constructor() {
    this.initCurrentDevice();
  }

  private detectCurrentDeviceInfo(): {
    name: string;
    type: 'mobile' | 'desktop' | 'tablet';
    browser: string;
    os: string;
  } {
    const ua = navigator.userAgent;
    let type: 'mobile' | 'desktop' | 'tablet' = 'desktop';
    let os = 'Windows';
    let browser = 'Chrome';

    if (/iPad|Tablet/i.test(ua)) type = 'tablet';
    else if (/Mobile|Android|iPhone/i.test(ua)) type = 'mobile';

    if (/Windows/i.test(ua)) os = 'Windows 11 / 10';
    else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
    else if (/Chrome/i.test(ua)) browser = 'Google Chrome';
    else if (/Safari/i.test(ua)) browser = 'Apple Safari';
    else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';

    const name = type === 'mobile' ? `مۆبایل (${os})` : type === 'tablet' ? `تابلێت (${os})` : `کۆمپیوتەر (${os})`;

    return { name, type, browser, os };
  }

  private initCurrentDevice(): void {
    try {
      const stored = localStorage.getItem(DEVICE_STORAGE_KEY);
      if (stored) {
        this.devices = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading device sessions:', e);
    }

    const currentInfo = this.detectCurrentDeviceInfo();
    const currentId = 'device_current_session';

    const existingCurrent = this.devices.find((d) => d.id === currentId);
    if (existingCurrent) {
      existingCurrent.lastActive = 'ئێستا چالاکە';
      existingCurrent.isCurrent = true;
    } else {
      // Create initial device list with current device + realistic other session examples
      this.devices = [
        {
          id: currentId,
          deviceName: currentInfo.name,
          deviceType: currentInfo.type,
          browser: currentInfo.browser,
          os: currentInfo.os,
          ip: '185.192.x.x (هەولێر، کوردستان)',
          lastActive: 'ئێستا چالاکە',
          isCurrent: true
        },
        {
          id: 'device_phone_mock',
          deviceName: 'Apple iPhone 15 Pro',
          deviceType: 'mobile',
          browser: 'Safari Mobile',
          os: 'iOS 17.5',
          ip: '149.255.x.x (سلێمانی، کوردستان)',
          lastActive: '٣ کاتژمێر لەمەوبەر',
          isCurrent: false
        },
        {
          id: 'device_tv_mock',
          deviceName: 'Samsung Smart TV 65" 4K',
          deviceType: 'tv',
          browser: 'Tizen Browser',
          os: 'Tizen OS',
          ip: '185.192.x.x (هەولێر، کوردستان)',
          lastActive: 'دوێنێ کاتژمێر ٩:٣٠ شەو',
          isCurrent: false
        }
      ];
    }
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(this.devices));
    } catch (e) {
      console.warn('Error saving device sessions:', e);
    }
  }

  private notify(): void {
    this.saveToStorage();
    this.listeners.forEach((cb) => cb(this.getDevices()));
  }

  public subscribe(callback: (devices: UserDeviceSession[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getDevices());
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getDevices(): UserDeviceSession[] {
    return this.devices;
  }

  public getUserSessions(_userId?: string): UserDeviceSession[] {
    return this.devices;
  }

  public logoutDevice(id: string): void {
    this.devices = this.devices.filter((d) => d.id !== id);
    this.notify();
  }

  public terminateSession(id: string): void {
    this.logoutDevice(id);
  }

  public logoutAllOtherDevices(): void {
    this.devices = this.devices.filter((d) => d.isCurrent);
    this.notify();
  }

  public terminateOtherSessions(_userId?: string, _currentId?: string): void {
    this.logoutAllOtherDevices();
  }
}

export const deviceService = new DeviceService();
