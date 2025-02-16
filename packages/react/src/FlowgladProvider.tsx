'use client'
import React from 'react'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { FlowgladContextProvider } from './FlowgladContext'

const queryClient = new QueryClient()

export const FlowgladProvider = ({
  children,
  flowgladRoute,
  cancelUrl,
  successUrl,
  authenticated,
}: {
  children: React.ReactNode
  flowgladRoute?: string
  cancelUrl?: string
  successUrl?: string
  authenticated: boolean
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <FlowgladContextProvider
        flowgladRoute={flowgladRoute}
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
