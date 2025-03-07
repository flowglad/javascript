import { Nouns, Verbs } from '@/types'
import CreateDiscountModal from './CreateDiscountModal'
import CreateProductModal from './CreateProductModal'
import CreateVariantModal from './CreateVariantModal'
import CreateCustomerFormModal from './CreateCustomerFormModal'
import CreatePostPurchaseFileModal from './EditFileModal'

const NounVerbModalMap = {
  [Nouns.Discount]: {
    [Verbs.Create]: { Component: CreateDiscountModal },
  },
  [Nouns.Product]: {
    [Verbs.Create]: { Component: CreateProductModal },
  },
  [Nouns.Variant]: {
    [Verbs.Create]: {
      Component: CreateVariantModal,
      parentIdToModalProp: (ProductId: string) => ({ ProductId }),
    },
  },
  [Nouns.CustomerProfile]: {
    [Verbs.Create]: { Component: CreateCustomerFormModal },
  },
  [Nouns.File]: {
    [Verbs.Create]: {
      Component: CreatePostPurchaseFileModal,
      parentIdToModalProp: (ProductId: string) => ({ ProductId }),
    },
  },
}

const NounVerbModal = ({
  isOpen,
  setIsOpen,
  nounVerb,
  parentId,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  nounVerb?: {
    noun: Nouns
    verb: Verbs
  }
  parentId?: string
}) => {
  if (!nounVerb) {
    return null
  }
  const { noun, verb } = nounVerb
  if (verb === Verbs.Edit) {
    return null
  }
  const ModalComponent = NounVerbModalMap[noun][verb].Component
  let modalProps: Omit<
    React.ComponentProps<typeof ModalComponent>,
    'isOpen' | 'setIsOpen'
  > = {}
  if ('parentIdToModalProp' in NounVerbModalMap[noun][verb]) {
    if (parentId) {
      modalProps = NounVerbModalMap[noun][verb].parentIdToModalProp(
        parentId
      ) as Omit<
        React.ComponentProps<typeof ModalComponent>,
        'isOpen' | 'setIsOpen'
      >
    }
  }
  return (
    // @ts-ignore - this fails lint because ModalProps is untyped, but it's merely a routing layer
    <ModalComponent
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      {...modalProps}
    />
  )
}

export default NounVerbModal
