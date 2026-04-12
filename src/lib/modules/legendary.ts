import { get } from 'svelte/store';
import { dev } from '$app/environment';
import { path } from '@tauri-apps/api';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { LegendaryError } from '$lib/exceptions/LegendaryError';
import { legendaryService } from '$lib/http';
import { getChildLogger } from '$lib/logger';
import { getCachedToken } from '$lib/modules/auth-session';
import { getExchangeCodeUsingAccessToken } from '$lib/modules/authentication';
import { dataDirectory } from '$lib/storage/file-store';
import { ownedAppsCache } from '$lib/stores';
import { launchApp, runLegendary } from '$lib/tauri';
import type { AccountData } from '$types/account';
import type { EpicOAuthData } from '$types/game/authorizations';
import type {
  LegendaryAppInfo,
  LegendaryInstalledList,
  LegendaryLaunchData,
  LegendaryList,
  LegendarySDLResponse,
  LegendaryStatus
} from '$types/legendary';

const logger = getChildLogger('Legendary');
export const configPath = await path.join(dataDirectory, dev ? 'legendary-dev' : 'legendary');
let legendaryAccountId: string | undefined;

type ExecuteResult<T = any> = {
  code: number | null;
  signal: number | null;
  stdout: T;
  stderr: string;
};

async function executeLegendary<T>(args: string[]): Promise<ExecuteResult<T>> {
  try {
    const result = await runLegendary({ configPath, args });

    logger.debug('Command executed', {
      args,
      code: result.code,
      signal: result.signal,
      stderr: result.stderr?.slice(-512)
    });

    let stdout = result.stdout as T;
    if (args.includes('--json')) {
      stdout = JSON.parse(result.stdout) as T;
    }

    if (result.code !== 0) {
      throw new Error(result.stderr);
    }

    return {
      code: result.code,
      signal: result.signal,
      stdout,
      stderr: result.stderr
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new LegendaryError(message);
  }
}

export async function loginLegendary(account: AccountData) {
  const accessToken = await getCachedToken(account);
  const { code: exchange } = await getExchangeCodeUsingAccessToken(accessToken);

  const data = await executeLegendary<string>(['auth', '--token', exchange]);
  legendaryAccountId = account.accountId;
  return data;
}

export async function logoutLegendary() {
  const data = await executeLegendary<string>(['auth', '--delete']);
  legendaryAccountId = undefined;
  ownedAppsCache.set([]);
  return data;
}

export function getLegendaryList() {
  return executeLegendary<LegendaryList>(['list', '--json']);
}

export async function getLegendaryStatus() {
  const { stdout } = await executeLegendary<LegendaryStatus>(['status', '--json']);
  if (stdout.account === '<not logged in>') {
    stdout.account = null;
  }

  return stdout;
}

export async function getLegendaryAccount() {
  if (legendaryAccountId) {
    return legendaryAccountId;
  }

  try {
    const userConfig = await path.join(configPath, 'user.json');
    const file = await readTextFile(userConfig);
    const data: EpicOAuthData = JSON.parse(file);
    if (!data.account_id) return null;

    legendaryAccountId = data.account_id;
    return data.account_id;
  } catch {
    return null;
  }
}

export function getLegendaryAppInfo(appId: string) {
  return executeLegendary<LegendaryAppInfo>(['info', appId, '--json']);
}

export function getLegendaryInstalledList() {
  return executeLegendary<LegendaryInstalledList>(['list-installed', '--json']);
}

export function syncLegendaryEGL() {
  return executeLegendary(['egl-sync', '-y', '--enable-sync']);
}

export async function launchLegendaryApp(appId: string) {
  const { stdout: launchData } = await executeLegendary<LegendaryLaunchData>(['launch', appId, '--dry-run', '--json']);

  return launchApp({
    launchData: {
      ...launchData,
      game_id: appId
    }
  });
}

export async function verifyLegendaryApp(appId: string) {
  const { stderr } = await executeLegendary<string>(['verify', appId, '-y', '--skip-sdl']);
  const requiresRepair = stderr.includes('repair your game installation');
  const requiredRepair = get(ownedAppsCache).find((app) => app.id === appId)?.requiresRepair || false;

  if (requiresRepair !== requiredRepair) {
    ownedAppsCache.update((current) => {
      return current.map((app) => (app.id === appId ? { ...app, requiresRepair } : app));
    });
  }

  return { requiresRepair };
}

export async function uninstallLegendaryApp(appId: string) {
  const data = await executeLegendary(['uninstall', appId, '-y']);

  ownedAppsCache.update((current) => {
    return current.map((app) => (app.id === appId ? { ...app, installed: false } : app));
  });

  return data;
}

export async function cacheLegendaryApps() {
  const list = await getLegendaryList();
  await syncLegendaryEGL();
  const installedList = await getLegendaryInstalledList();

  ownedAppsCache.set(
    list.stdout
      .filter((app) => app.metadata.entitlementType === 'EXECUTABLE')
      .map((app) => {
        const images = app.metadata.keyImages.reduce<Record<string, string>>((acc, image) => {
          acc[image.type] = image.url;
          return acc;
        }, {});

        const installed = installedList.stdout.find((installed) => installed.app_name === app.app_name);

        return {
          id: app.app_name,
          title: app.app_title,
          images: {
            tall: images.DieselGameBoxTall || app.metadata.keyImages[0]?.url,
            wide: images.DieselGameBox || images.Featured || app.metadata.keyImages[0]?.url
          },
          requiresRepair: installed && installed.needs_verification,
          hasUpdate: installed ? installed.version !== app.asset_infos.Windows.build_version : false,
          installSize: installed?.install_size || 0,
          installed: !!installed,
          canRunOffline: installed?.can_run_offline || false
        };
      })
  );
}

export async function getLegendarySDLList(appName: string) {
  const response = await legendaryService.get(`v1/sdl/${appName}.json`);
  if (!response.headers.get('Content-Type')?.includes('application/json')) {
    throw new LegendaryError('App not found');
  }

  return await response.json<LegendarySDLResponse>();
}
