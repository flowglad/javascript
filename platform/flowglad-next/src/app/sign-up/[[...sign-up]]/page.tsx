// Generated with Ion on 11/17/2024, 2:37:07 AM
// Figma Link: https://www.figma.com/design/3fYHKpBnD7eYSAmfSvPhvr?node-id=1302:8858
'use client'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

function SignupPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/onboarding'
  return <SignUp fallbackRedirectUrl={redirectTo} />
}

export default SignupPage
