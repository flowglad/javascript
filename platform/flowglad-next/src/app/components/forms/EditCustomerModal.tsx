'use client'

import FormModal from '@/app/components/forms/FormModal'
import { editCustomerProfileInputSchema } from '@/db/schema/customerProfiles'
import { trpc } from '@/app/_trpc/client'
import { CustomerProfile } from '@/db/schema/customerProfiles'
import CustomerProfileFormFields from './CustomerProfileFormFields'

interface EditCustomerModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  customerProfile: CustomerProfile.ClientRecord
}

const EditCustomerModal = ({
  isOpen,
  setIsOpen,
  customerProfile,
}: EditCustomerModalProps) => {
  const editCustomerProfile = trpc.customerProfiles.edit.useMutation()

  return (
    <FormModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Edit Customer"
      formSchema={editCustomerProfileInputSchema}
      defaultValues={{
        customerProfile: {
          ...customerProfile,
        },
      }}
      onSubmit={async (data) => {
        await editCustomerProfile.mutateAsync(data)
      }}
    >
      <CustomerProfileFormFields />
    </FormModal>
  )
}

export default EditCustomerModal
