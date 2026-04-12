import defaultPartyMemberMeta from '$lib/data/default-party-member-meta.json';
import defaultPartyMeta from '$lib/data/default-party-meta.json';
import { EpicAPIError } from '$lib/exceptions/EpicAPIError';
import { partyService } from '$lib/http';
import { getAuthedKy } from '$lib/modules/auth-session';
import { avatarCache, displayNameCache, partyCache } from '$lib/stores';
import type { AccountData } from '$types/account';
import type { FetchPartyResponse, InviterPartyResponse } from '$types/game/party';

export async function getParty(account: AccountData) {
  const data = await getAuthedKy(account, partyService).get<FetchPartyResponse>(`user/${account.accountId}`).json();

  const partyData = data.current[0];
  if (partyData) {
    partyCache.set(account.accountId, partyData);

    for (const member of partyData.members) {
      const name = member.meta['urn:epic:member:dn_s'] || member.connections?.[0]?.meta?.['account_pl_dn'];
      if (name) {
        displayNameCache.set(member.account_id, name);
      }

      const loadoutJ = member.meta['Default:AthenaCosmeticLoadout_j'];
      if (loadoutJ) {
        const loadout = JSON.parse(loadoutJ).AthenaCosmeticLoadout;
        const equippedCharacterId = loadout?.characterPrimaryAssetId?.split(':')[1];
        if (equippedCharacterId) {
          avatarCache.set(
            member.account_id,
            `https://fortnite-api.com/images/cosmetics/br/${equippedCharacterId}/smallicon.png`
          );
        }
      }
    }
  }

  return data;
}

export function kickParty(account: AccountData, partyId: string, accountToKick: string) {
  return getAuthedKy(account, partyService).delete(`parties/${partyId}/members/${accountToKick}`).json();
}

export function leaveParty(account: AccountData, partyId: string) {
  return kickParty(account, partyId, account.accountId);
}

export function promote(account: AccountData, partyId: string, accountToPromote: string) {
  return getAuthedKy(account, partyService).post(`parties/${partyId}/members/${accountToPromote}/promote`).json();
}

export function patchParty(account: AccountData, partyId: string, revision: number, update: Record<string, string>) {
  const body = {
    revision,
    meta: {
      deleted: [],
      update: { ...defaultPartyMeta, ...update }
    }
  };

  return patchWithRetry(account, `parties/${partyId}`, body);
}

export function patchSelf(account: AccountData, partyId: string, revision: number, update: Record<string, string>) {
  const body = {
    revision,
    deleted: [],
    update: { ...defaultPartyMemberMeta, ...update }
  };

  return patchWithRetry(account, `parties/${partyId}/members/${account.accountId}/meta`, body);
}

async function patchWithRetry(account: AccountData, url: string, body: Record<string, any>) {
  try {
    return await getAuthedKy(account, partyService).patch(url, { json: body }).json();
  } catch (error) {
    if (error instanceof EpicAPIError && error.errorCode === 'errors.com.epicgames.social.party.stale_revision') {
      const newRevision = Number.parseInt(error.messageVars[1]);
      if (!Number.isNaN(newRevision)) {
        return getAuthedKy(account, partyService)
          .patch(url, { json: { ...body, revision: newRevision } })
          .json();
      }
    }

    throw error;
  }
}

export function invite(account: AccountData, partyId: string, friendToInvite: string) {
  return getAuthedKy(account, partyService)
    .post(`parties/${partyId}/invites/${friendToInvite}?sendPing=true`, {
      json: {
        'urn:epic:invite:platformdata_s': ''
      }
    })
    .json();
}

export function getInviterParty(account: AccountData, senderId: string) {
  return getAuthedKy(account, partyService)
    .get<InviterPartyResponse[]>(`user/${account.accountId}/pings/${senderId}/parties`)
    .json();
}

export async function acceptInvite(
  account: AccountData,
  partyId: string,
  senderId: string,
  jid: string,
  meta: Record<string, string> = {}
) {
  await getAuthedKy(account, partyService)
    .post(`parties/${partyId}/members/${account.accountId}/join`, {
      json: {
        connection: {
          id: jid,
          meta: {
            'urn:epic:conn:platform_s': 'WIN',
            'urn:epic:conn:type_s': 'game'
          },
          yield_leadership: false
        },
        meta: {
          ...defaultPartyMemberMeta,
          ...meta,
          'urn:epic:member:dn_s': account.displayName,
          'urn:epic:member:joinrequestusers_j': JSON.stringify({
            users: [
              {
                id: account.accountId,
                dn: account.displayName,
                plat: 'WIN',
                data: JSON.stringify({
                  CrossplayPreference: '1',
                  SubGame_u: '1'
                })
              }
            ]
          })
        }
      }
    })
    .json();

  await getAuthedKy(account, partyService).delete(`user/${account.accountId}/pings/${senderId}`);
}
