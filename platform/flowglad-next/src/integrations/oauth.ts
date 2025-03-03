import axios from 'axios'
import { z } from 'zod'
import crypto from 'crypto'
import core from '@/utils/core'
import { authenticatedTransaction } from '@/db/databaseMethods'
import {
  selectIntegrationById,
  updateIntegration,
} from '@/db/tableMethods/integrationMethods'
import { IntegrationMethod, IntegrationStatus } from '@/types'
import { DbTransaction } from '@/db/types'
import {
  deleteIntegrationSession,
  insertIntegrationSession,
  selectIntegrationSessions,
} from '@/db/tableMethods/integrationSessionMethods'
import { encrypt } from '@/utils/encryption'
import { IntegrationProvider } from './providers'
import { Integration } from '@/db/schema/integrations'

// Provider configuration schema
const OAuthProviderConfig = z.object({
  authorizationUrl: z.string().url(),
  tokenUrl: z.string().url(),
  clientId: z.string(),
  scopes: z.array(z.string()).nullish(),
  additionalParams: z.record(z.string()).optional(),
  requiresPKCE: z.boolean().default(false),
  includeCredentialsInBody: z.boolean().default(false),
})

type OAuthProviderConfig = z.infer<typeof OAuthProviderConfig>

// Known provider configurations - moved to environment/config
const PROVIDER_CONFIGS: Record<
  IntegrationProvider,
  Partial<OAuthProviderConfig>
> = {
  [IntegrationProvider.Calendly]: {
    authorizationUrl: 'https://auth.calendly.com/oauth/authorize',
    tokenUrl: 'https://auth.calendly.com/oauth/token',
    // scopes: ['user'],
    requiresPKCE: true,
  },
  [IntegrationProvider.Slack]: {
    authorizationUrl: 'https://slack.com/oauth/v2/authorize',
    clientId: core.envVariable('SLACK_CLIENT_ID'),
    includeCredentialsInBody: true,
    requiresPKCE: true,
    scopes: [
      'app_mentions:read',
      'bookmarks:read',
      'bookmarks:write',
      'channels:history',
      'channels:manage',
      'channels:read',
      'chat:write',
      'conversations.connect:manage',
      'conversations.connect:read',
      'conversations.connect:write',
      'groups:history',
      'groups:read',
      'groups:write',
      'im:history',
      'im:read',
      'im:write',
      'incoming-webhook',
      'mpim:history',
      'mpim:read',
      'mpim:write',
      'users:read',
      'users:read.email',
    ],
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
  },
} as const

interface GenerateOAuthUrlParams {
  integration: Integration.Record
  additionalScopes?: string[]
  additionalParams?: Record<string, string>
}

interface GenerateOAuthUrlResult {
  url: string
  state: string
  codeVerifier: string
}

// PKCE helper functions
function generateCodeVerifier(): string {
  return crypto
    .randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, 128)
}

function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

const redirectURL = (integration: Integration.Record) => {
  return core.safeUrl(
    `/oauth/callback/${integration.provider}`,
    /**
     * Some oauth providers require a redirect URI to be a valid, fully-qualified URL.
     * This is a temporary workaround to allow local development.
     */
    core.IS_PROD
      ? core.envVariable('NEXT_PUBLIC_APP_URL')
      : core.IS_DEV
        ? 'https://7177-108-41-92-245.ngrok-free.app'
        : 'http://staging.flowglad.com'
  )
}

export function generateOAuthUrl({
  integration,
  additionalScopes = [],
  additionalParams = {},
}: GenerateOAuthUrlParams): GenerateOAuthUrlResult {
  const provider = integration.provider as IntegrationProvider
  const baseConfig = PROVIDER_CONFIGS[provider]
  if (!baseConfig) {
    throw new Error(`Unsupported OAuth provider: ${provider}`)
  }

  // Get client ID from env if not provided
  const resolvedClientId =
    process.env[`${integration.provider.toUpperCase()}_CLIENT_ID`]!
  if (!resolvedClientId) {
    throw new Error(
      `No client ID configured for provider: ${provider}`
    )
  }

  const config = OAuthProviderConfig.parse({
    ...baseConfig,
    clientId: resolvedClientId,
  })

  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex')

  // Generate PKCE values
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectURL(integration),
    response_type: 'code',
    state,
  })

  // Add scopes
  const scopes = [...(config.scopes || []), ...additionalScopes]
  if (scopes.length > 0) {
    params.append('scope', scopes.join(' '))
  }

  // Add PKCE parameters
  if (config.requiresPKCE) {
    params.append('code_challenge', codeChallenge)
    params.append('code_challenge_method', 'S256')
  }

  // Add provider-specific parameters
  if (config.additionalParams) {
    Object.entries(config.additionalParams).forEach(
      ([key, value]) => {
        params.append(key, value)
      }
    )
  }

  // Add request-specific parameters
  Object.entries(additionalParams).forEach(([key, value]) => {
    params.append(key, value)
  })

  return {
    url: `${config.authorizationUrl}?${params.toString()}`,
    state,
    codeVerifier,
  }
}

export async function initiateOAuthFlowForIntegration(
  integration: Integration.Record,
  transaction: DbTransaction
) {
  const { url, codeVerifier, state } = generateOAuthUrl({
    integration,
  })

  if (integration.status === IntegrationStatus.Live) {
    return
  }
  integration = await updateIntegration(
    {
      status: IntegrationStatus.Incomplete,
      id: integration.id,
      method: integration.method,
    },
    transaction
  )
  // Create OAuth session
  await insertIntegrationSession(
    {
      IntegrationId: integration.id,
      state,
      codeVerifier,
      redirectUrl: redirectURL(integration),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      livemode: integration.livemode,
    },
    transaction
  )

  return url
}

// Base token response schema that all providers must satisfy
const baseTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  scope: z.string().nullish(),
  token_type: z.string().optional(),
})

type BaseTokenResponse = z.infer<typeof baseTokenResponseSchema>

// Provider-specific configurations
interface OAuthTokenConfig {
  authorizationUrl: string
  tokenUrl: string
  clientId: string
  clientSecret: string
  // Some providers expect credentials in body vs Authorization header
  includeCredentialsInBody?: boolean
  // Some providers require additional parameters
  additionalParams?: Record<string, string>
  // Custom response parsing if provider deviates from OAuth spec
  responseParser?: (response: any) => BaseTokenResponse
}

interface ExchangeCodeOptions {
  integration: Integration.Record
  code: string
  codeVerifier?: string
  clientId?: string // Optional as it might come from env
  clientSecret?: string // Optional as it might come from env
}

async function exchangeCodeForTokens({
  integration,
  code,
  codeVerifier,
  clientId: providedClientId,
  clientSecret: providedClientSecret,
}: ExchangeCodeOptions): Promise<BaseTokenResponse> {
  const provider = integration.provider as IntegrationProvider
  const providerConfig = PROVIDER_CONFIGS[provider]
  if (!providerConfig) {
    throw new Error(
      `Unsupported OAuth provider: ${integration.provider}`
    )
  }

  const clientId =
    providedClientId ||
    core.envVariable(`${provider.toUpperCase()}_CLIENT_ID`)
  const clientSecret =
    providedClientSecret ||
    core.envVariable(`${provider.toUpperCase()}_CLIENT_SECRET`)

  if (!clientId || !clientSecret) {
    throw new Error(`Missing credentials for provider: ${provider}`)
  }

  const config: OAuthTokenConfig = {
    ...providerConfig,
    authorizationUrl: providerConfig.authorizationUrl!,
    tokenUrl: providerConfig.tokenUrl!,
    clientId,
    clientSecret,
  }

  // Construct request body
  const body: Record<string, string> = {
    code,
    redirect_uri: redirectURL(integration),
    grant_type: 'authorization_code',
    ...(config.includeCredentialsInBody && {
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
    // ...(codeVerifier && { code_verifier: codeVerifier }),
    ...(config.additionalParams || {}),
  }
  // Construct headers
  const headers: Record<string, string> = {
    'Content-Type': config.includeCredentialsInBody
      ? 'application/x-www-form-urlencoded'
      : 'application/json',
    Accept: 'application/json',
  }

  // Add authorization header if credentials aren't in body
  if (!config.includeCredentialsInBody) {
    const credentials = Buffer.from(
      `${config.clientId}:${config.clientSecret}`
    ).toString('base64')
    headers['Authorization'] = `Basic ${credentials}`
  }

  try {
    const response = await axios.post(
      providerConfig.tokenUrl!,
      body,
      {
        headers,
      }
    )
    // Use custom parser if provided, otherwise parse as standard OAuth response
    const tokenResponse = config.responseParser
      ? config.responseParser(response.data)
      : response.data
    // Validate response matches expected schema
    return baseTokenResponseSchema.parse(tokenResponse)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid token response from ${provider}: ${error.message}`
      )
    }
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Token exchange failed: ${
          JSON.stringify(error.response?.data) || error.message
        }`
      )
    }
    throw error
  }
}

export async function handleOAuthCallback(params: {
  code: string
  state: string
}) {
  return authenticatedTransaction(async ({ transaction }) => {
    // Get session with state
    const [session] = await selectIntegrationSessions(
      { state: params.state },
      transaction
    )

    if (!session || session.expiresAt < new Date()) {
      throw new Error('Invalid or expired session')
    }

    // Get integration
    const integration = await selectIntegrationById(
      session.IntegrationId,
      transaction
    )

    if (!integration) {
      throw new Error('Integration not found')
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens({
      integration,
      code: params.code,
      codeVerifier: session.codeVerifier!,
    })

    // Update integration with tokens
    await updateIntegration(
      {
        id: integration.id,
        encryptedAccessToken: encrypt(tokens.access_token),
        encryptedRefreshToken: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : null,
        tokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        status: IntegrationStatus.Live,
        method: IntegrationMethod.OAuth,
      },
      transaction
    )

    // Clean up session
    await deleteIntegrationSession(session.id, transaction)

    return {
      success: true,
      redirectUrl: session.redirectUrl,
      integration,
    }
  })
}
