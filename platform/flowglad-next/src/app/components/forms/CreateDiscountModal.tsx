'use client'

import FormModal from '@/app/components/forms/FormModal'
import { createDiscountInputSchema } from '@/db/schema/discounts'
import DiscountFormFields from '@/app/components/forms/DiscountFormFields'
import { trpc } from '@/app/_trpc/client'
import { DiscountAmountType, DiscountDuration } from '@/types'

interface CreateDiscountModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const CreateDiscountModal: React.FC<CreateDiscountModalProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const createDiscount = trpc.discounts.create.useMutation()

  return (
    <FormModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Create Discount"
      formSchema={createDiscountInputSchema}
      onSubmit={createDiscount.mutateAsync}
      defaultValues={{
        discount: {
          name: '',
          code: '',
          amountType: DiscountAmountType.Fixed,
          amount: 0,
          duration: DiscountDuration.Once,
          active: true,
          numberOfPayments: null,
        },
      }}
    >
      <DiscountFormFields />
    </FormModal>
  )
}

export default CreateDiscountModal
