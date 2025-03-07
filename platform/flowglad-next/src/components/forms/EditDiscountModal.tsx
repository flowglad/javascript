'use client'

import FormModal from '@/components/forms/FormModal'
import {
  Discount,
  discountClientSelectSchema,
  editDiscountInputSchema,
} from '@/db/schema/discounts'
import DiscountFormFields from '@/components/forms/DiscountFormFields'
import { trpc } from '@/app/_trpc/client'

interface EditDiscountModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  discount: Discount.ClientRecord
}

const EditDiscountModal: React.FC<EditDiscountModalProps> = ({
  isOpen,
  setIsOpen,
  discount,
}) => {
  const editDiscount = trpc.discounts.update.useMutation()
  return (
    <FormModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Edit Discount"
      formSchema={editDiscountInputSchema}
      defaultValues={editDiscountInputSchema.parse({ discount })}
      onSubmit={editDiscount.mutateAsync}
    >
      <DiscountFormFields edit />
    </FormModal>
  )
}

export default EditDiscountModal
