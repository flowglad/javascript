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
}: {
  children: React.ReactNode
  flowgladRoute?: string
  cancelUrl?: string
  successUrl?: string
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <FlowgladContextProvider
        flowgladRoute={flowgladRoute}
        cancelUrl={cancelUrl}
        successUrl={successUrl}
      >
        {children}
      </FlowgladContextProvider>
    </QueryClientProvider>
  )
}

export default FlowgladProvider
