import { setLogLevel } from '$lib/logger';
import { baseLocale, locales } from '$lib/paraglide/runtime';
import { settingsStore } from '$lib/storage';
import { getLocale } from '$lib/tauri';

export const prerender = true;
export const ssr = false;

export async function load() {
  const settings = settingsStore.get();
  // Set the initial log level before anything else
  setLogLevel(settings.app?.debugLogs ? 'debug' : 'info');

  const systemLocale = await getLocale();
  let locale = settings.app?.language || systemLocale || baseLocale;
  if (!locales.includes(locale as any)) {
    locale = baseLocale;
  }

  settingsStore.setLanguage(locale as (typeof locales)[number]);
}
