import { useFormContext } from 'react-hook-form'
import Input from '../ion/Input'
import { CustomerProfile } from '@/db/schema/customerProfiles'

const CustomerProfileFormFields = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<{
    customerProfile: CustomerProfile.ClientInsert
  }>()
  return (
    <>
      {' '}
      <Input
        label="Customer Name"
        {...register('customerProfile.name', {
          required: true,
          validate: (value) => {
            if (value && value.length < 2) {
              return `Please enter the customer's full name`
            }
          },
        })}
        placeholder="Apple Inc."
        error={errors.customerProfile?.name?.message}
      />
      <Input
        label="Customer Email"
        {...register('customerProfile.email', {
          required: true,
          validate: (value) => {
            if (
              value &&
              !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
                value
              )
            ) {
              return 'Please enter a valid email address'
            }
          },
        })}
        placeholder="steve@apple.com"
        error={errors.customerProfile?.email?.message}
      />
    </>
  )
}

export default CustomerProfileFormFields
