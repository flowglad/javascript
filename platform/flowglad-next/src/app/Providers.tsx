'use client'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import type { AuthContextValues } from '../contexts/authContext'
import AuthProvider from '../contexts/authContext'
import TrpcProvider from '@/app/_trpc/Provider'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
  })
}

export default function Providers({
  children,
  authContext,
}: {
  children: React.ReactNode
  authContext: Omit<AuthContextValues, 'setOrganization'>
}) {
  return (
    <ClerkProvider
      afterSignOutUrl="/sign-in"
      appearance={{
        baseTheme: dark,
        variables: {
          colorBackground: 'rgb(35, 35, 35)',
          colorText: '#d2d2d2',
          colorTextSecondary: '#939393',
          colorInputBackground: 'rgba(255, 255, 255, 0.07)',
        },
      }}
    >
      <TrpcProvider>
        <AuthProvider values={authContext}>
          <PostHogProvider client={posthog}>
            {children}
          </PostHogProvider>
        </AuthProvider>
      </TrpcProvider>
    </ClerkProvider>
  )
}
