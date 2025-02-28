import { trpc } from '@/app/_trpc/client'
import DeleteModal, {
  DeleteModalWrapperProps,
} from '@/app/components/forms/DeleteModal'

const DeleteLinkModal: React.FC<DeleteModalWrapperProps> = (
  props
) => {
  const deleteLink = trpc.links.delete.useMutation()
  return (
    <DeleteModal
      noun="link"
      mutation={deleteLink.mutateAsync}
      {...props}
    />
  )
}

export default DeleteLinkModal
