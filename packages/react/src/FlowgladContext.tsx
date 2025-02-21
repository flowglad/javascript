'use client'
import React, { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import {
  createPurchaseSessionSchema,
  FlowgladActionKey,
} from '@flowglad/shared'
import type { Flowglad } from '@flowglad/node'

type LoadedFlowgladContextValues = {
  loaded: true
  authenticated: true
  customerProfile: Flowglad.CustomerProfiles.CustomerProfileRetrieveBillingResponse.CustomerProfile
  subscriptions: Flowglad.CustomerProfiles.CustomerProfileRetrieveBillingResponse.Subscription[]
  createPurchaseSession: (
    params: z.infer<typeof createPurchaseSessionSchema> & {
      autoRedirect?: boolean
    }
  ) => Promise<{
    id: string
    url: string
  }>
  catalog: Flowglad.CustomerProfiles.CustomerProfileRetrieveBillingResponse.Catalog
  errors: null
}

interface NotLoadedFlowgladContextValues {
  loaded: false
  authenticated: boolean
  errors: null
}

interface NotAuthenticatedFlowgladContextValues {
  loaded: true
  authenticated: false
  errors: null
}

interface ErrorFlowgladContextValues {
  loaded: true
  authenticated: boolean
  errors: Error[]
}

type FlowgladContextValues =
  | LoadedFlowgladContextValues
  | NotLoadedFlowgladContextValues
  | NotAuthenticatedFlowgladContextValues
  | ErrorFlowgladContextValues

const FlowgladContext = createContext<FlowgladContextValues>({
  loaded: false,
  authenticated: false,
  errors: null,
})

const constructCreatePurchaseSession =
  (flowgladRoute: string) =>
  async (
    params: Parameters<
      LoadedFlowgladContextValues['createPurchaseSession']
    >[0]
  ) => {
    const response = await fetch(
      `${flowgladRoute}/${FlowgladActionKey.CreatePurchaseSession}`,
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    )
    const json: {
      data: Flowglad.PurchaseSessions.PurchaseSessionCreateResponse
    } = await response.json()
    console.log('create purchase session data', json.data)
    const data = json.data
    if (params.autoRedirect) {
      window.location.href = data.url
    }
    return {
      id: data.purchaseSession.id,
      url: data.url,
    }
  }

export const FlowgladContextProvider = ({
  children,
  flowgladRoute = '/api/flowglad',
  cancelUrl,
  successUrl,
  authenticated,
}: {
  authenticated?: boolean
  customerProfile?: {
    externalId: string
    email: string
    name: string
  }
  flowgladRoute?: string
  cancelUrl?: string
  successUrl?: string
  children: React.ReactNode
}) => {
  const {
    isPending: isPendingBilling,
    error: errorBilling,
    data: billing,
  } = useQuery({
    queryKey: [FlowgladActionKey.GetCustomerProfileBilling],
    enabled: authenticated,
    queryFn: async () => {
      const response = await fetch(
        `${flowgladRoute}/${FlowgladActionKey.GetCustomerProfileBilling}`
      )
      const data = await response.json()
      return data
    },
  })

  const {
    isPending: isPendingFindOrCreate,
    error: errorFindOrCreate,
    data: customerProfile,
  } = useQuery({
    queryKey: [FlowgladActionKey.FindOrCreateCustomerProfile],
    queryFn: async () => {
      const response = await fetch(
        `${flowgladRoute}/${FlowgladActionKey.FindOrCreateCustomerProfile}`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )
      const data = await response.json()
      return data
    },
    enabled: authenticated,
  })
  const createPurchaseSession =
    constructCreatePurchaseSession(flowgladRoute)

  let value: FlowgladContextValues
  if (!authenticated) {
    value = {
      loaded: true,
      authenticated: false,
      errors: null,
    }
  } else if (customerProfile && billing) {
    value = {
      loaded: true,
      authenticated,
      customerProfile: customerProfile.data.customerProfile,
      createPurchaseSession,
      catalog: billing.data.catalog,
      subscriptions: billing.data.subscriptions,
      errors: null,
    }
  } else if (isPendingBilling || isPendingFindOrCreate) {
    value = {
      loaded: false,
      authenticated,
      errors: null,
    }
  } else {
    const errors: Error[] = [errorBilling, errorFindOrCreate].filter(
      (error): error is Error => error !== null
    )
    console.log('errors', errors)
    value = {
      loaded: true,
      authenticated,
      errors,
    }
  }

  return (
    <FlowgladContext.Provider value={value}>
      {children}
    </FlowgladContext.Provider>
  )
}

export const useBilling = () => {
  const billing = useContext(FlowgladContext)
  if (!billing.authenticated) {
    throw new Error(
      'FlowgladContext is not authenticated. If you are authenticated, ensure that the FlowgladProvider `authenticated` property is set to true.'
    )
  }
  return billing
}
