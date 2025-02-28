import FormModal from './FormModal'
import { trpc } from '@/app/_trpc/client'
import {
  Country,
  requestStripeConnectOnboardingLinkInputSchema,
} from '@/db/schema/countries'
import RequestStripeConnectOnboardingLinkFormFields from '@/app/components/forms/RequestStripeConnectOnboardingLinkFormFields'

const RequestStripeConnectOnboardingLinkModal = ({
  isOpen,
  setIsOpen,
  countries,
}: {
  isOpen: boolean
  countries: Country.Record[]
  setIsOpen: (isOpen: boolean) => void
}) => {
  const requestStripeConnectOnboardingLink =
    trpc.organizations.requestStripeConnect.useMutation()
  return (
    <FormModal
      title="Set up Stripe"
      onSubmit={async (data) => {
        const { onboardingLink } =
          await requestStripeConnectOnboardingLink.mutateAsync(data)
        window.location.href = onboardingLink
      }}
      formSchema={requestStripeConnectOnboardingLinkInputSchema}
      defaultValues={{
        CountryId: countries.find(
          (country) => country.name === 'United States'
        )?.id!,
      }}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      submitButtonText="Continue to Stripe"
    >
      <RequestStripeConnectOnboardingLinkFormFields
        countries={countries}
      />
    </FormModal>
  )
}

export default RequestStripeConnectOnboardingLinkModal
