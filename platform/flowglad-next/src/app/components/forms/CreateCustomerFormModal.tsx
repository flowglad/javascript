'use client'
import FormModal from '@/app/components/forms/FormModal'
import { trpc } from '@/app/_trpc/client'
import {
  CreateCustomerProfileInputSchema,
  createCustomerProfileInputSchema,
} from '@/db/tableMethods/purchaseMethods'
import CustomerProfileFormFields from './CustomerProfileFormFields'
import core from '@/utils/core'

const CreateCustomerFormModal = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}) => {
  const createCustomerProfile =
    trpc.customerProfiles.create.useMutation()

  const defaultValues: CreateCustomerProfileInputSchema = {
    customerProfile: {
      name: '',
      email: '',
      externalId: core.nanoid(),
    },
  }

  return (
    <FormModal
      title="Create Customer"
      formSchema={createCustomerProfileInputSchema}
      defaultValues={defaultValues}
      onSubmit={createCustomerProfile.mutateAsync}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
    >
      <div className="flex flex-col gap-6">
        <CustomerProfileFormFields />
      </div>
    </FormModal>
  )
}

export default CreateCustomerFormModal
