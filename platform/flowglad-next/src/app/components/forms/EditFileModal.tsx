'use client'

import FormModal from '@/app/components/forms/FormModal'
import { File, editFileInputSchema } from '@/db/schema/files'
import { FileFormFields } from '@/app/components/forms/FileFormFields'
import { trpc } from '@/app/_trpc/client'

interface CreatePostPurchaseFileModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  file: File.ClientRecord
}

const CreatePostPurchaseFileModal: React.FC<
  CreatePostPurchaseFileModalProps
> = ({ isOpen, setIsOpen, file }) => {
  const editFile = trpc.files.update.useMutation()

  return (
    <FormModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Edit Post-Purchase File"
      formSchema={editFileInputSchema}
      defaultValues={{ file }}
      onSubmit={editFile.mutateAsync}
    >
      <FileFormFields />
    </FormModal>
  )
}

export default CreatePostPurchaseFileModal
