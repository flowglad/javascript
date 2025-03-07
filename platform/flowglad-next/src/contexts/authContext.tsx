'use client'
import { Organization } from '@/db/schema/organizations'
import { useUser } from '@clerk/nextjs'
import { createContext, useContext, useEffect, useState } from 'react'
import { trpc } from '@/app/_trpc/client'

export type AuthContextValues = Partial<{
  user: ReturnType<typeof useUser>['user']
  organization: Organization.ClientRecord
}> & {
  setOrganization: (organization: Organization.ClientRecord) => void
  livemode: boolean
}

const AuthContext = createContext<AuthContextValues>({
  setOrganization: () => {},
  livemode: false,
})

/**
 * - user: User
 * - organization: Organization.ClientRecord | undefined
 */
export const useAuthContext = () => useContext(AuthContext)

export const useAuthenticatedContext = () => {
  const { organization, user, setOrganization, livemode } =
    useAuthContext()
  if (!organization || !user) {
    return {
      ready: false,
    }
  }
  if (!setOrganization) {
    throw Error(
      'useAuthenticatedContext: setOrganization is not defined'
    )
  }
  return {
    user,
    organization,
    setOrganization,
    livemode,
    ready: true,
  }
}

const AuthProvider = ({
  children,
  values,
}: {
  children: React.ReactNode
  values: Omit<AuthContextValues, 'setOrganization'>
}) => {
  const { user } = useUser()
  const [organization, setOrganization] = useState<
    Organization.ClientRecord | undefined
  >(values.organization)
  const {
    data: focusedMembership,
    refetch: refetchFocusedMembership,
  } = trpc.utils.getFocusedMembership.useQuery()
  /**
   * A race condition happens where sometimes the layout renders
   * before the user is fetched when first logging in.
   * This gracefully recovers by refetching the focused membership
   * when the user is fetched.
   */
  useEffect(() => {
    if (user) {
      refetchFocusedMembership()
    }
  }, [user, refetchFocusedMembership])

  const focusedOrganization = focusedMembership?.organization
  useEffect(() => {
    if (focusedOrganization) {
      setOrganization(focusedOrganization)
    }
  }, [focusedOrganization])
  return (
    <AuthContext.Provider
      value={{
        ...values,
        user,
        organization,
        setOrganization,
        livemode: focusedMembership?.membership.livemode ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
