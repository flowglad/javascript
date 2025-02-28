'use client'

import FormModal from '@/app/components/forms/FormModal'
import { createLinkInputSchema } from '@/db/schema/links'
import LinkFormFields from '@/app/components/forms/LinkFormFields'
import { trpc } from '@/app/_trpc/client'

interface CreateLinkModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const CreateLinkModal: React.FC<CreateLinkModalProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const createLink = trpc.links.create.useMutation()

  return (
    <FormModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Create Link"
      formSchema={createLinkInputSchema}
      onSubmit={createLink.mutateAsync}
      defaultValues={{
        link: {
          name: '',
          url: '',
        },
      }}
    >
      <LinkFormFields />
    </FormModal>
  )
}

export default CreateLinkModal
