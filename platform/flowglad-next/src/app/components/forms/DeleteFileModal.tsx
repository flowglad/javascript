import { trpc } from '@/app/_trpc/client'
import DeleteModal, {
  DeleteModalWrapperProps,
} from '@/app/components/forms/DeleteModal'

const DeleteFileModal: React.FC<DeleteModalWrapperProps> = (
  props
) => {
  const deleteFile = trpc.files.delete.useMutation()
  return (
    <DeleteModal
      noun="link"
      mutation={deleteFile.mutateAsync}
      {...props}
    />
  )
}

export default DeleteFileModal
