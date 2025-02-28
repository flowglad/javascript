import { Nouns, Verbs } from '@/types'
import {
  ChatActionStatus,
  useChatActionsContext,
} from './ChatActionsContext'
import { CreateProductModal } from './forms/CreateProductModal'

const ChatFocusedActionView = () => {
  const {
    focusedActionId,
    getAction,
    setFocusedActionId,
    setAction,
  } = useChatActionsContext()
  if (!focusedActionId) {
    return null
  }
  const action = getAction(focusedActionId)
  if (!action) {
    return null
  }
  const { structuredOutput, classification } = action
  if (
    classification.noun === Nouns.Product &&
    classification.verb === Verbs.Create
  ) {
    return (
      <CreateProductModal
        isOpen={true}
        setIsOpen={(open) => {
          if (!open) {
            setFocusedActionId(null)
          }
        }}
        onSubmitStart={() => {
          setAction({
            ...action,
            status: ChatActionStatus.Pending,
          })
        }}
        onSubmitSuccess={() => {
          setAction({
            ...action,
            status: ChatActionStatus.Success,
          })
        }}
        onSubmitError={(error) => {
          setAction({
            ...action,
            status: ChatActionStatus.Error,
            error: error.message,
          })
        }}
        defaultValues={structuredOutput}
        chatPreview
      />
    )
  }
  return (
    <div>
      <div>
        <div></div>
      </div>
    </div>
  )
}

export default ChatFocusedActionView
