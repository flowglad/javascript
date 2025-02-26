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
  serverRoute,
}: {
  children: React.ReactNode
  serverRoute?: string
  cancelUrl?: string
  successUrl?: string
  authenticated: boolean
}) => {
  validateUrl(serverRoute, 'serverRoute', true)
  validateUrl(cancelUrl, 'cancelUrl')
  validateUrl(successUrl, 'successUrl')
  return (
    <QueryClientProvider client={queryClient}>
      <FlowgladContextProvider
        serverRoute={serverRoute}
        cancelUrl={cancelUrl}
        successUrl={successUrl}
        authenticated={authenticated}
      >
        {children}
      </FlowgladContextProvider>
    </QueryClientProvider>
  )
}

export default FlowgladProvider
