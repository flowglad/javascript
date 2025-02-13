'use client'
import React, { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { FlowgladActionKey } from '../shared/types'
import { z } from 'zod'
import { createPurchaseSessionSchema } from '../shared/actions'

type LoadedFlowgladContextValues = {
  loaded: true
  customerProfile: {
    externalId: string
    email: string
    name: string
  }
  subscriptions: {
    id: string
    status: string
    currentPeriodEnd: string
    currentPeriodStart: string
  }[]
  createPurchaseSession: (
    params: z.infer<typeof createPurchaseSessionSchema> & {
      autoRedirect?: boolean
    }
  ) => Promise<{
    id: string
    url: string
  }>
  catalog: {
    products: {
      id: string
      variants: {
        id: string
        price: number
      }[]
    }[]
  }
}

interface NotLoadedFlowgladContextValues {
  loaded: false
}
type FlowgladContextValues =
  | LoadedFlowgladContextValues
  | NotLoadedFlowgladContextValues

const FlowgladContext = createContext<FlowgladContextValues>({
  loaded: false,
})

const constructCreatePurchaseSession =
  (flowgladRoute: string) =>
  async (
    params: Parameters<
      LoadedFlowgladContextValues['createPurchaseSession']
    >[0]
  ) => {
    const response = await axios.post(
      `${flowgladRoute}/${FlowgladActionKey.CreatePurchaseSession}`,
      params
    )
    if (params.autoRedirect) {
      window.location.href = response.data.purchaseSessionUrl
    }
    return {
      id: response.data.purchaseSessionId,
      url: response.data.purchaseSessionUrl,
    }
  }

export const FlowgladContextProvider = ({
  children,
  flowgladRoute = '/api/flowglad',
  cancelUrl,
  successUrl,
}: {
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
    isPending,
    error,
    data: billing,
  } = useQuery({
    queryKey: [FlowgladActionKey.GetCustomerProfileBilling],
    queryFn: async () => {
      const response = await axios.get(
        `${flowgladRoute}/${FlowgladActionKey.GetCustomerProfileBilling}`
      )
      return response.data
    },
  })

  const {
    isPending: isPendingFindOrCreate,
    error: errorFindOrCreate,
    data: customerProfile,
  } = useQuery({
    queryKey: [FlowgladActionKey.FindOrCreateCustomerProfile],
    queryFn: () =>
      axios.post(
        `${flowgladRoute}/${FlowgladActionKey.FindOrCreateCustomerProfile}`
      ),
  })

  const createPurchaseSession =
    constructCreatePurchaseSession(flowgladRoute)
  const value: FlowgladContextValues =
    customerProfile && billing
      ? {
          loaded: true,
          customerProfile: customerProfile.data.customerProfile,
          createPurchaseSession,
          catalog: billing.catalog,
          subscriptions: billing.subscriptions,
        }
      : {
          loaded: false,
        }
  console.log('flowglad context values', value)
  return (
    <FlowgladContext.Provider value={value}>
      {children}
    </FlowgladContext.Provider>
  )
}

export const useBilling = () => useContext(FlowgladContext)
