import { z } from 'zod'
import { Nouns, Verbs } from '@/types'
import { productsClientSelectSchema } from '@/db/schema/products'
import { variantsClientSelectSchema } from '@/db/schema/variants'
import { classifierSelectionCriteriaFromClientSelectSchema } from '@/db/agentUtils'

const editClassifierSchemaCore = z.object({
  verb: z.literal(Verbs.Edit),
})

const editProductClassifierSchema = editClassifierSchemaCore.extend({
  noun: z.literal(Nouns.Product),
  recordSelectionCriteria:
    classifierSelectionCriteriaFromClientSelectSchema<
      typeof productsClientSelectSchema
    >(productsClientSelectSchema),
})

const editVariantClassifierSchema = editClassifierSchemaCore.extend({
  noun: z.literal(Nouns.Variant),
  recordSelectionCriteria:
    classifierSelectionCriteriaFromClientSelectSchema<
      typeof variantsClientSelectSchema
    >(variantsClientSelectSchema),
})

export const editSchema = z.discriminatedUnion('noun', [
  editProductClassifierSchema,
  editVariantClassifierSchema,
])

export type EditClassification = z.infer<typeof editSchema>
