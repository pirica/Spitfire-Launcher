import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export class Notification {
  static async requestPermission() {
    if (await isPermissionGranted()) return true;

    const permission = await requestPermission();
    return permission === 'granted';
  }

  static async sendNotification(message: string, title = 'Spitfire Launcher') {
    const permissionGranted = await this.requestPermission();
    if (!permissionGranted) return false;

    sendNotification({ title, body: message });
    return true;
  }
}
