import { z, ZodSchema } from 'zod'
import { FlowgladActionKey, HTTPMethod } from './types'

type FlowgladActionValidatorMap = Record<
  FlowgladActionKey,
  {
    method: HTTPMethod
    validator: ZodSchema
  }
>

export const createPurchaseSessionSchema = z.object({
  VariantId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

export const flowgladActionValidators: FlowgladActionValidatorMap = {
  [FlowgladActionKey.GetCustomerProfileBilling]: {
    method: HTTPMethod.GET,
    validator: z.object({
      externalId: z.string(),
    }),
  },
  [FlowgladActionKey.FindOrCreateCustomerProfile]: {
    method: HTTPMethod.POST,
    validator: z.object({
      externalId: z.string(),
    }),
  },
  [FlowgladActionKey.CreatePurchaseSession]: {
    method: HTTPMethod.POST,
    validator: createPurchaseSessionSchema,
  },
}
