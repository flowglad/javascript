import {
  CreateVariantInput,
  createVariantSchema,
  EditVariantInput,
  editVariantSchema,
  Variant,
} from '@/db/schema/variants'
import {
  createGenerateCreateInput,
  createGenerateEditInput,
} from '@/ai/structuredOutputUtils'
import { Verbs } from '@/types'
import { CoreMessage } from 'ai'

export const generateCreateVariantInput = createGenerateCreateInput(
  createVariantSchema,
  `You are helping a digital seller create a new variant to add to their product.
  Remember the unitPrice is in Stripe prices for USD - so $1.00 => 100
  Also, never make up an imgURL - this will throw an ERROR!
  Only add an imageURL if it was provided by the user.
    `
)

export const generateEditVariantInput = createGenerateEditInput<
  Variant.Record,
  typeof editVariantSchema
>(
  editVariantSchema,
  `You are helping a digital seller edit an existing variant in their product`
)

interface StructuredOutputCreatorMap {
  [Verbs.Create]: (
    messages: CoreMessage[]
  ) => Promise<CreateVariantInput>
  [Verbs.Edit]: (
    messages: CoreMessage[],
    existingRecord: Variant.Record
  ) => Promise<EditVariantInput>
}

export const variantStructuredOutputs: StructuredOutputCreatorMap = {
  [Verbs.Create]: generateCreateVariantInput,
  [Verbs.Edit]: generateEditVariantInput,
} as const
