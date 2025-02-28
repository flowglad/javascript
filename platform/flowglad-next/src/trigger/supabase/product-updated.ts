import { logger, task } from '@trigger.dev/sdk/v3'
import { Product, productsSelectSchema } from '@/db/schema/products'
import { SupabaseUpdatePayload } from '@/types'
import { updateStripeProductFromProduct } from '@/utils/stripe'
import { supabaseUpdatePayloadSchema } from '@/db/supabase'

const productUpdateSchema = supabaseUpdatePayloadSchema(
  productsSelectSchema
)

const productNameOrImageUpdated = (params: {
  oldRecord: Product.Record
  newRecord: Product.Record
}) => {
  const { oldRecord, newRecord } = params
  return (
    oldRecord.name !== newRecord.name ||
    oldRecord.imageURL !== newRecord.imageURL
  )
}

export const productUpdatedTask = task({
  id: 'product-updated',
  run: async (payload: SupabaseUpdatePayload, { ctx }) => {
    logger.log('Product updated', { payload, ctx })
    const parsedPayload = productUpdateSchema.safeParse(payload)
    if (!parsedPayload.success) {
      logger.error(parsedPayload.error.message)
      parsedPayload.error.issues.forEach((issue) => {
        logger.error(`${issue.path.join('.')}: ${issue.message}`)
      })
      throw new Error('Invalid payload')
    }
    const { old_record: oldRecord, record: newRecord } =
      parsedPayload.data
    if (
      !productNameOrImageUpdated({
        oldRecord,
        newRecord,
      })
    ) {
      return {
        message: 'No relevant changes, skipping Stripe update',
      }
    }

    try {
      const updatedStripeProduct =
        await updateStripeProductFromProduct(
          newRecord,
          newRecord.livemode
        )

      return {
        message: 'Stripe product updated successfully',
        updatedStripeProduct,
      }
    } catch (error) {
      logger.error('Error updating Stripe product', { error })
      return {
        message: 'Error updating Stripe product',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
})
