'use client'

import Select from '@/app/components/ion/Select'
import {
  Country,
  RequestStripeConnectOnboardingLinkInput,
} from '@/db/schema/countries'
import { Controller, useFormContext } from 'react-hook-form'

const RequestStripeConnectOnboardingLinkFormFields: React.FC<{
  resumeOnboarding?: boolean
  countries: Country.Record[]
}> = ({ countries }) => {
  const {
    formState: { errors },
    control,
  } = useFormContext<RequestStripeConnectOnboardingLinkInput>()
  const countryOptions = countries
    .map((country) => ({
      label: country.name,
      value: country.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
  return (
    <Controller
      control={control}
      name="CountryId"
      render={({ field: { value, onChange } }) => (
        <Select
          options={countryOptions}
          value={value ?? undefined}
          onValueChange={onChange}
          placeholder="Select Country"
          error={errors.CountryId?.message}
        />
      )}
    />
  )
}

export default RequestStripeConnectOnboardingLinkFormFields
