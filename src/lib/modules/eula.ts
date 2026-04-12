import { eulaService } from '$lib/http';
import { getAuthedKy } from '$lib/modules/auth-session';
import type { AccountData } from '$types/account';
import type { EULACheckData } from '$types/game/eula';

// Returns null if EULA is accepted.
export async function checkEULA(account: AccountData) {
  const response = await getAuthedKy(account, eulaService).get<EULACheckData>(`account/${account.accountId}`);

  if (response.status === 204) return null;
  return response.json();
}

export function acceptEULA(account: AccountData, version: number) {
  return getAuthedKy(account, eulaService).post(`version/${version}/${account.accountId}/accept`);
}
