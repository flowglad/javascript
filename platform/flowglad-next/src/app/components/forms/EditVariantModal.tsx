'use client'

import FormModal from '@/app/components/forms/FormModal'
import { editVariantSchema, Variant } from '@/db/schema/variants'
import VariantFormFields from './VariantFormFields'
import { trpc } from '@/app/_trpc/client'

interface EditVariantModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  variant: Variant.Record
}

const EditVariantModal: React.FC<EditVariantModalProps> = ({
  isOpen,
  setIsOpen,
  variant,
}) => {
  const editVariant = trpc.variants.edit.useMutation()
  const defaultValues = editVariantSchema.parse({ variant })
  return (
    <FormModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Edit Variant"
      formSchema={editVariantSchema}
      defaultValues={defaultValues}
      onSubmit={editVariant.mutateAsync}
    >
      <VariantFormFields variantOnly edit />
    </FormModal>
  )
}

export default EditVariantModal
