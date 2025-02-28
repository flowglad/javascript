import { redirect } from 'next/navigation'
import { handleOAuthCallback } from '@/integrations/oauth'

interface Props {
  params: {
    provider: string
  }
  searchParams: {
    code: string
    state: string
    redirectPath: string
  }
}

const OAuthCallbackPage = async ({ params, searchParams }: Props) => {
  const { provider } = params
  const { code, state, redirectPath } = searchParams
  const { success, redirectUrl, integration } =
    await handleOAuthCallback({
      code,
      state,
    })
  if (redirectPath) {
    redirect(redirectPath)
  } else {
    return (
      <>
        <h1>OAuth Callback</h1>
        <p>Redirect path: {redirectPath}</p>
        <p>Code: {code}</p>
        <p>State: {state}</p>
        <p>Provider: {provider}</p>
      </>
    )
  }
}

export default OAuthCallbackPage
