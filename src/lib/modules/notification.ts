import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export async function requestNotificationPermission() {
  if (await isPermissionGranted()) return true;

  const permission = await requestPermission();
  return permission === 'granted';
}

export async function sendNotificationMessage(message: string, title = 'Spitfire Launcher') {
  const permissionGranted = await requestNotificationPermission();
  if (!permissionGranted) return false;

  sendNotification({ title, body: message });
  return true;
}
