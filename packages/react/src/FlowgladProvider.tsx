'use client'
import React from 'react'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { FlowgladContextProvider } from './FlowgladContext'
import { z } from 'zod'
const queryClient = new QueryClient()

const isValidURL = (url: string) => {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}

const validateUrl = (
  url: string | undefined,
  propName: string,
  allowRelative = false
) => {
  if (typeof url === 'undefined') return

  const isValid = allowRelative
    ? url.startsWith('/') || isValidURL(url)
    : isValidURL(url)

  if (!isValid) {
    const expectedMsg = allowRelative
      ? 'a valid URL or relative path starting with a forward slash (/)'
      : 'a valid URL'
    throw new Error(
      `FlowgladProvider: Received invalid \`${propName}\` property. Expected ${expectedMsg}. Received: "${url}"`
    )
  }
}

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
