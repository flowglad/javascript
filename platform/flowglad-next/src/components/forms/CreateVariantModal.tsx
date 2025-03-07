'use client'

import FormModal from '@/components/forms/FormModal'
import { createVariantSchema } from '@/db/schema/variants'
import VariantFormFields from './VariantFormFields'
import { trpc } from '@/app/_trpc/client'
import { PriceType } from '@/types'

interface CreateVariantModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  ProductId: string
}

const CreateVariantModal: React.FC<CreateVariantModalProps> = ({
  isOpen,
  setIsOpen,
  ProductId,
}) => {
  const createVariant = trpc.variants.create.useMutation()

  return (
    <FormModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Create Variant"
      formSchema={createVariantSchema}
      defaultValues={{
        variant: {
          ProductId,
          priceType: PriceType.SinglePayment,
          isDefault: false,
          unitPrice: 0,
          active: true,
        },
      }}
      onSubmit={createVariant.mutateAsync}
    >
      <VariantFormFields variantOnly />
    </FormModal>
  )
}

export default CreateVariantModal
