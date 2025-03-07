import { Organization } from '@/db/schema/organizations'
import { CurrencyCode, StripeConnectContractType } from '@/types'

export const dummyOrganization: Organization.Record = {
  id: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'Test Organization',
  stripeAccountId: 'acct_123456',
  subdomainSlug: 'test-org',
  domain: 'testorg.com',
  CountryId: '1',
  logoURL: null,
  tagline: null,
  payoutsEnabled: false,
  onboardingStatus: null,
  feePercentage: '0',
  stripeConnectContractType:
    StripeConnectContractType.MerchantOfRecord,
  defaultCurrency: CurrencyCode.USD,
  billingAddress: null,
  contactEmail: null,
}
