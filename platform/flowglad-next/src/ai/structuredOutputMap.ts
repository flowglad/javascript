import { Nouns } from '@/types'
import { productStructuredOutputs } from './structuredOutputs/productStructuredOutputs'
import { variantStructuredOutputs } from './structuredOutputs/variantStructuredOutput'

export const structuredOutputMap = {
  [Nouns.Product]: productStructuredOutputs,
  [Nouns.Variant]: variantStructuredOutputs,
} as const
