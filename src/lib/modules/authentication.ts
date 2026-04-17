import { defaultClient, type ClientCredentials } from '$lib/constants/clients';
import { oauthService } from '$lib/http';
import type {
  DeviceAuthData,
  EpicDeviceAuthLoginData,
  EpicExchangeCodeData,
  EpicExchangeCodeLoginData,
  EpicOAuthData,
  EpicTokenType
} from '$types/game/authorizations';

export function getAccessTokenUsingDeviceAuth(
  deviceAuthData: DeviceAuthData,
  tokenType: EpicTokenType = 'eg1'
): Promise<EpicDeviceAuthLoginData> {
  return oauthService
    .post<EpicDeviceAuthLoginData>('token', {
      body: new URLSearchParams({
        grant_type: 'device_auth',
        account_id: deviceAuthData.accountId,
        device_id: deviceAuthData.deviceId,
        secret: deviceAuthData.secret,
        token_type: tokenType
      }).toString()
    })
    .json();
}

export function getAccessTokenUsingClientCredentials(
  clientCredentials: ClientCredentials = defaultClient
): Promise<EpicOAuthData> {
  return oauthService
    .post<EpicOAuthData>('token', {
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        token_type: 'eg1'
      }).toString(),
      headers: {
        Authorization: `Basic ${clientCredentials.base64}`
      }
    })
    .json();
}

export function getAccessTokenUsingDeviceCode(
  deviceCode: string,
  clientCredentials: ClientCredentials = defaultClient
): Promise<EpicOAuthData> {
  return oauthService
    .post<EpicOAuthData>('token', {
      body: new URLSearchParams({
        grant_type: 'device_code',
        device_code: deviceCode,
        token_type: 'eg1'
      }).toString(),
      headers: {
        Authorization: `Basic ${clientCredentials.base64}`
      }
    })
    .json();
}

export function getExchangeCodeUsingAccessToken(accessToken: string): Promise<EpicExchangeCodeData> {
  return oauthService
    .get<EpicExchangeCodeData>('exchange', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    .json();
}

export function getAccessTokenUsingExchangeCode(
  exchangeCode: string,
  clientCredentials: ClientCredentials = defaultClient,
  tokenType: EpicTokenType = 'eg1'
): Promise<EpicExchangeCodeLoginData> {
  return oauthService
    .post<EpicExchangeCodeLoginData>('token', {
      body: new URLSearchParams({
        grant_type: 'exchange_code',
        exchange_code: exchangeCode.replace(/[|`'"]/g, ''),
        token_type: tokenType
      }).toString(),
      headers: {
        Authorization: `Basic ${clientCredentials.base64}`
      }
    })
    .json();
}
