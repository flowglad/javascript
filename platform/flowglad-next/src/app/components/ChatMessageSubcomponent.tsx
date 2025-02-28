import { Classification } from '@/ai/classify'
import { Product } from '@/db/schema/products'
import {
  Circle,
  Box,
  X,
  ChevronRight,
  LoaderCircle,
  Check,
} from 'lucide-react'
import { Nouns, Verbs } from '@/types'
import {
  ChatActionStatus,
  useChatActionsContext,
} from './ChatActionsContext'
import { cn } from '@/utils/core'

const ChatActionStatusStrip = ({
  status,
}: {
  status: ChatActionStatus
}) => {
  let label = ''
  let color = ''
  let icon = <Circle size={20} />
  if (status === ChatActionStatus.Proposed) {
    label = 'Needs Confirmation'
    color = 'bg-yellow-500'
    icon = <div className="rounded-full bg-yellow-500 w-2 h-2" />
  } else if (status === ChatActionStatus.Pending) {
    label = 'Pending'
    color = 'bg-blue-500'
    icon = <LoaderCircle size={16} className="animate-spin" />
  } else if (status === ChatActionStatus.Success) {
    label = 'Submitted'
    color = 'bg-green-500'
    icon = (
      <div className="bg-green-primary-500 rounded-full w-4 h-4 items-center justify-center flex">
        <Check size={8} color="white" strokeWidth={4} />
      </div>
    )
  } else if (status === ChatActionStatus.Error) {
    label = 'Error'
    color = 'bg-red-500'
    icon = <X size={16} color="red" />
  }
  return (
    <div className="flex items-center flex-row gap-1 py-1 px-2">
      <div className={cn('rounded-full items-center justify-center')}>
        {icon}
      </div>
      <span className="text-xs font-medium text-fbg-primary-400">
        {label}
      </span>
    </div>
  )
}

const ProductChatPreview = ({
  product,
  id,
}: {
  product: Product.ClientInsert
  id: string
}) => {
  const { setFocusedActionId, getAction } = useChatActionsContext()
  const action = getAction(id)
  return (
    <>
      <div
        className="flex items-center gap-4 bg-background rounded-lg p-2 py-4 w-[80%] cursor-pointer justify-between border border-stroke hover:bg-fbg-background-900"
        onClick={() => setFocusedActionId(id)}
      >
        <div className="flex items-center gap-2">
          <Box size={20} />
          <span className="text-sm font-medium">{product.name}</span>
        </div>
        <ChevronRight size={20} />
      </div>
      <ChatActionStatusStrip status={action.status} />
    </>
  )
}

export const ChatMessageSubcomponent = ({
  classification,
  innerProps,
  id,
}: {
  classification: Classification
  innerProps: any
  id: string
}) => {
  if (
    classification.noun === Nouns.Product &&
    classification.verb === Verbs.Create
  ) {
    return <ProductChatPreview product={innerProps.product} id={id} />
  }
  return (
    <div>
      <p>{classification.noun}</p>
      <p>{classification.verb}</p>
    </div>
  )
}
