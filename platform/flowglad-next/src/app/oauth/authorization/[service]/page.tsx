import { notFound, redirect } from 'next/navigation'
import { getAuthorizationUrl } from '@/integrations/kit'

interface Props {
  params: {
    service: string
  }
  searchParams: {
    redirect?: string
  }
}

const OAuthAuthorizationPage = async ({
  params,
  searchParams,
}: Props) => {
  const { service } = params
  const { redirect: kitRedirect } = searchParams

  // Validate service param
  if (!service || !['kit'].includes(service)) {
    notFound()
  }

  if (service === 'kit') {
    const clientId = process.env.KIT_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/oauth/redirect/${service}`

    if (!clientId) {
      throw new Error('KIT_CLIENT_ID environment variable is not set')
    }

    // Get authorization URL with PKCE challenge
    const authUrl = await getAuthorizationUrl(clientId, redirectUri)

    // Store the Kit redirect URL if provided
    if (kitRedirect) {
      sessionStorage.setItem('kit_redirect', kitRedirect)
    }

    // Redirect to Kit authorization page
    redirect(authUrl)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">
        Authorize {service.charAt(0).toUpperCase() + service.slice(1)}
      </h1>
      <p>
        You are about to authorize {service} to connect with your
        account.
      </p>
    </div>
  )
}

export default OAuthAuthorizationPage
