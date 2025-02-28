import { CustomerProfile } from '@/db/schema/customerProfiles'
import axios from 'axios'
import crypto from 'crypto'

const KIT_API_BASE = 'https://api.kit.com/v4'
const KIT_AUTH_BASE = 'https://app.kit.com/oauth'

interface KitTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
  created_at: number
}

const base64URLEncode = (buffer: Buffer): string => {
  return encodeURIComponent(buffer.toString('base64'))
}

export const generateCodeVerifier = () => {
  // Generate a random string between 43-128 chars using crypto
  const verifier = crypto.randomBytes(32).toString('hex')
  return verifier
}

export const generateCodeChallenge = async (codeVerifier: string) => {
  // Generate SHA256 hash of verifier
  const hash = crypto.createHash('sha256')
  hash.update(codeVerifier)
  return base64URLEncode(hash.digest())
}

export const getAuthorizationUrl = async (
  clientId: string,
  redirectUri: string
) => {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  // Store code verifier in session to use later
  // This should be implemented securely in your app
  sessionStorage.setItem('kit_code_verifier', codeVerifier)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  return `${KIT_AUTH_BASE}/authorize?${params.toString()}`
}

export const exchangeCodeForTokens = async (
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier: string
): Promise<KitTokenResponse> => {
  try {
    const response = await axios.post<KitTokenResponse>(
      `${KIT_AUTH_BASE}/token`,
      {
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    throw new Error('Failed to exchange code for tokens')
  }
}

export const refreshAccessToken = async (
  clientId: string,
  refreshToken: string
): Promise<KitTokenResponse> => {
  try {
    const response = await axios.post<KitTokenResponse>(
      `${KIT_AUTH_BASE}/token`,
      {
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    throw new Error('Failed to refresh access token')
  }
}

export type KitAuthParms =
  | {
      accessToken: string
      apiKey?: never
    }
  | {
      accessToken?: never
      apiKey: string
    }

export type KitCreateSubscriberFromCustomerProfileParams = {
  customerProfile: CustomerProfile.ClientRecord
} & KitAuthParms

const headersFromAuthParams = (params: KitAuthParms) => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  ...(params.accessToken
    ? { Authorization: `Bearer ${params.accessToken}` }
    : { 'X-Kit-Api-Key': params.apiKey }),
})

const customerProfileToKitSubscriber = (
  customerProfile: CustomerProfile.ClientRecord
): Record<string, unknown> => ({
  email_address: customerProfile.email,
  first_name: customerProfile.name?.split(' ')[0] || '',
  state: 'active',
  fields: {
    'Last name':
      customerProfile.name?.split(' ').slice(1).join(' ') || '',
    Birthday: '',
    Source: '',
    Role: '',
    Company: customerProfile.domain || '',
    'Postal code': '',
    Website: customerProfile.domain || '',
    'Social media': '',
    'How did you hear about us?': '',
    Interests: '',
    Coupon: '',
  },
})

export const idempotentCreateSubscriberFromCustomerProfile = async (
  params: KitCreateSubscriberFromCustomerProfileParams
): Promise<{
  subscriber: {
    id: number
    first_name: string
    email_address: string
    state: string
    created_at: string
    added_at: string
    fields: Record<string, unknown>
    referrer_utm_parameters: {
      source: string
      medium: string
      campaign: string
      term: string
      content: string
    }
  }
}> => {
  const response = await axios.post(
    `${KIT_API_BASE}/subscribers`,
    customerProfileToKitSubscriber(params.customerProfile),
    {
      headers: headersFromAuthParams(params),
    }
  )
  return response.data
}
