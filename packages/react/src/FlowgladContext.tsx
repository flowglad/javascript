'use client'
import React, { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import {
  createPurchaseSessionSchema,
  FlowgladActionKey,
  flowgladActionValidators,
} from '@flowglad/shared'
import type { Flowglad } from '@flowglad/node'
import { validateUrl } from './utils'

type LoadedFlowgladContextValues = {
  loaded: true
  loadBilling: true
  customerProfile: Flowglad.CustomerProfiles.CustomerProfileRetrieveBillingResponse.CustomerProfile
  subscriptions: Flowglad.CustomerProfiles.CustomerProfileRetrieveBillingResponse.Subscription[]
  createPurchaseSession: (
    params: z.infer<typeof createPurchaseSessionSchema> & {
      autoRedirect?: boolean
    }
  ) => Promise<
    | {
        id: string
        url: string
      }
    | { error: { code: string; json: Record<string, unknown> } }
  >
  catalog: Flowglad.CustomerProfiles.CustomerProfileRetrieveBillingResponse.Catalog
  errors: null
}

interface NotLoadedFlowgladContextValues {
  loaded: false
  loadBilling: boolean
  errors: null
}

interface NotAuthenticatedFlowgladContextValues {
  loaded: true
  loadBilling: false
  errors: null
}

interface ErrorFlowgladContextValues {
  loaded: true
  loadBilling: boolean
  errors: Error[]
}

type FlowgladContextValues =
  | LoadedFlowgladContextValues
  | NotLoadedFlowgladContextValues
  | NotAuthenticatedFlowgladContextValues
  | ErrorFlowgladContextValues

const FlowgladContext = createContext<FlowgladContextValues>({
  loaded: false,
  loadBilling: false,
  errors: null,
})

const constructCreatePurchaseSession =
  (flowgladRoute: string) =>
  async (
    params: Parameters<
      LoadedFlowgladContextValues['createPurchaseSession']
    >[0]
  ): Promise<
    | {
        id: string
        url: string
      }
    | { error: { code: string; json: Record<string, unknown> } }
  > => {
    validateUrl(params.successUrl, 'successUrl')
    validateUrl(params.cancelUrl, 'cancelUrl')
    const response = await fetch(
      `${flowgladRoute}/${FlowgladActionKey.CreatePurchaseSession}`,
      {
        method:
          flowgladActionValidators[
            FlowgladActionKey.CreatePurchaseSession
          ].method,
        body: JSON.stringify(params),
      }
    )
    const json: {
      data: Flowglad.PurchaseSessions.PurchaseSessionCreateResponse
      error?: { code: string; json: Record<string, unknown> }
    } = await response.json()
    const data = json.data
    if (json.error) {
      console.error(
        'FlowgladContext: Purchase session creation failed',
        json
      )
      return {
        error: json.error!,
      }
    }
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
  serverRoute = '/api/flowglad',
  cancelUrl,
  successUrl,
  loadBilling,
}: {
  loadBilling?: boolean
  customerProfile?: {
    externalId: string
    email: string
    name: string
  }
  serverRoute?: string
  cancelUrl?: string
  successUrl?: string
  children: React.ReactNode
}) => {
  // In a perfect world, this would be a useMutation hook rather than useQuery.
  // Because technically, billing fetch requests run a "find or create" operation on
  // the customer profile. But useQuery allows us to execute the call using `enabled`
  // which allows us to avoid maintaining a useEffect hook.
  const {
    isPending: isPendingBilling,
    error: errorBilling,
    data: billing,
  } = useQuery({
    queryKey: [FlowgladActionKey.GetCustomerProfileBilling],
    enabled: loadBilling,
    queryFn: async () => {
      const response = await fetch(
        `${serverRoute}/${FlowgladActionKey.GetCustomerProfileBilling}`,
        {
          method:
            flowgladActionValidators[
              FlowgladActionKey.GetCustomerProfileBilling
            ].method,
          body: JSON.stringify({}),
        }
      )
      const data = await response.json()
      return data
    },
  })
  const createPurchaseSession =
    constructCreatePurchaseSession(serverRoute)

  let value: FlowgladContextValues
  if (!loadBilling) {
    value = {
      loaded: true,
      loadBilling: loadBilling ?? false,
      errors: null,
    }
  } else if (billing) {
    value = {
      loaded: true,
      loadBilling,
      customerProfile: billing.data.customerProfile,
      createPurchaseSession,
      catalog: billing.data.catalog,
      subscriptions: billing.data.subscriptions,
      errors: null,
    }
  } else if (isPendingBilling) {
    value = {
      loaded: false,
      loadBilling,
      errors: null,
    }
  } else {
    const errors: Error[] = [errorBilling].filter(
      (error): error is Error => error !== null
    )
    value = {
      loaded: true,
      loadBilling,
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
  if (!billing.loadBilling) {
    throw new Error(
      'Flowglad: Attempted to access billing data while `loadBilling` property is not `true`. Ensure that the FlowgladProvider `loadBilling` property is set to true.'
    )
  }
  return billing
}
