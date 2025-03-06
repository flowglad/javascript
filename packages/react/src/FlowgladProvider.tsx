'use client'
import React from 'react'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { FlowgladContextProvider } from './FlowgladContext'
import { validateUrl } from './utils'
const queryClient = new QueryClient()

export const FlowgladProvider = ({
  children,
  cancelUrl,
  successUrl,
  authenticated,
  loadBilling,
  serverRoute,
}: {
  children: React.ReactNode
  serverRoute?: string
  cancelUrl?: string
  successUrl?: string
  loadBilling: boolean
  /** @deprecated use loadBilling instead */
  authenticated: boolean
}) => {
  validateUrl(serverRoute, 'serverRoute', true)
  validateUrl(cancelUrl, 'cancelUrl')
  validateUrl(successUrl, 'successUrl')
  const shouldLoad =
    typeof loadBilling === 'undefined' ? authenticated : loadBilling
  return (
    <QueryClientProvider client={queryClient}>
      <FlowgladContextProvider
        serverRoute={serverRoute}
        cancelUrl={cancelUrl}
        successUrl={successUrl}
        loadBilling={shouldLoad}
      >
        {children}
      </FlowgladContextProvider>
    </QueryClientProvider>
  )
}

export default FlowgladProvider
