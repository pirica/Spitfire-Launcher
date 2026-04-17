import { EpicAPIError } from '$lib/exceptions/EpicAPIError';
import { publicAccountService, userSearchService } from '$lib/http';
import { getAuthedKy } from '$lib/modules/auth-session';
import { displayNameCache } from '$lib/stores';
import { processChunks } from '$lib/utils';
import type { AccountData } from '$types/account';
import type { EpicAccountById, EpicAccountByName, EpicAccountSearch } from '$types/game/lookup';

export async function fetchUserById(account: AccountData, accountId: string): Promise<EpicAccountById> {
  const data = await getAuthedKy(account, publicAccountService).get<EpicAccountById>(accountId).json();
  displayNameCache.set(data.id, data.displayName);
  return data;
}

export async function fetchUsersByIds(account: AccountData, accountIds: string[]): Promise<EpicAccountById[]> {
  const MAX_IDS_PER_REQUEST = 100;
  const session = getAuthedKy(account, publicAccountService);

  const accounts = await processChunks(accountIds, MAX_IDS_PER_REQUEST, async (ids) => {
    return session.get<EpicAccountById[]>(`?${ids.map((x) => `accountId=${x}`).join('&')}`).json();
  });

  for (const account of accounts) {
    const name = account.displayName || Object.values(account.externalAuths).map((x) => x.externalDisplayName)?.[0];
    if (!name) continue;

    displayNameCache.set(account.id, name);
  }

  return accounts;
}

export async function fetchUserByName(account: AccountData, displayName: string): Promise<EpicAccountByName> {
  const data = await getAuthedKy(account, publicAccountService)
    .get<EpicAccountByName>(`displayName/${displayName.trim()}`)
    .json();

  displayNameCache.set(data.id, data.displayName);
  return data;
}

export async function searchUsersByName(account: AccountData, namePrefix: string): Promise<EpicAccountSearch[]> {
  const data = await getAuthedKy(account, userSearchService)
    .get<EpicAccountSearch[]>(`${account.accountId}?prefix=${namePrefix.trim()}&platform=epic`)
    .json();

  for (const account of data) {
    const name = account.matches[0]?.value;
    if (!name) continue;

    displayNameCache.set(account.accountId, name);
  }

  return data;
}

export async function fetchUserByNameOrId(
  account: AccountData,
  nameOrId: string
): Promise<{ accountId: string; displayName: string }> {
  const isAccountId = nameOrId.length === 32;
  if (isAccountId) {
    const data = await fetchUserById(account, nameOrId);
    return {
      accountId: data.id,
      displayName: data.displayName
    };
  } else {
    const data = (await searchUsersByName(account, nameOrId))?.[0];
    if (!data) {
      throw new EpicAPIError({
        errorCode: 'errors.com.epicgames.account.account_not_found',
        errorMessage: `Sorry, we couldn't find an account for ${nameOrId}`,
        messageVars: [nameOrId],
        numericErrorCode: 18007
      });
    }

    return {
      accountId: data.accountId,
      displayName: data.matches[0].value
    };
  }
}
