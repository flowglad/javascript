import { trpc } from '@/app/_trpc/client'
import FormModal, {
  NestedFormModal,
} from '@/components/forms/FormModal'
import { idInputSchema } from '@/db/tableUtils'
import { sentenceCase } from 'change-case'
import { UseFormReturn } from 'react-hook-form'

export type LocalDeleteMutation = (params: {
  id: string
}) => Promise<void>

export type ServerMutation = ReturnType<
  typeof trpc.files.delete.useMutation
>['mutateAsync']

export interface DeleteModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  id: string
  mutation: ServerMutation | LocalDeleteMutation
  form?: UseFormReturn
  noun: string
  nested?: boolean
}

export type DeleteModalWrapperProps = Omit<
  DeleteModalProps,
  'noun' | 'mutation'
>

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  setIsOpen,
  id,
  mutation,
  noun,
  nested,
  form,
}) => {
  const defaultValues = {
    id,
  }
  const ModalComponent = nested ? NestedFormModal : FormModal
  return (
    <ModalComponent
      title={`Delete ${sentenceCase(noun)}`}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      onSubmit={() => mutation({ id })}
      formSchema={idInputSchema}
      defaultValues={defaultValues}
      form={form ?? undefined}
    >
      <div className="text-secondary gap-4">
        <p className="text-secondary pb-4">
          {`Are you sure you want to delete this ${noun}?`}
        </p>
        <p className="text-secondary pb-4">
          This action cannot be undone.
        </p>
      </div>
    </ModalComponent>
  )
}

export default DeleteModal
