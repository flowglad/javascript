import { FlowgladActionKey } from '@flowglad/shared'
import {
  findOrCreateCustomerProfile,
  getCustomerProfileBilling,
} from './customerProfileHandlers'
import { createPurchaseSession } from './purchaseSessionHandlers'
import { SubRouteHandler } from './types'

export const routeToHandlerMap: Record<
  FlowgladActionKey,
  SubRouteHandler<FlowgladActionKey>
> = {
  [FlowgladActionKey.GetCustomerProfileBilling]:
    getCustomerProfileBilling,
  [FlowgladActionKey.FindOrCreateCustomerProfile]:
    findOrCreateCustomerProfile,
  [FlowgladActionKey.CreatePurchaseSession]: createPurchaseSession,
}
