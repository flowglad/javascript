import { logger, task } from '@trigger.dev/sdk/v3'
import { Invoice } from '@/db/schema/invoices'
import { InvoiceStatus, SupabaseUpdatePayload } from '@/types'
import { selectInvoiceLineItems } from '@/db/tableMethods/invoiceLineItemMethods'
import { sendReceiptEmail } from '@/utils/email'
import { selectCustomerProfileAndCustomerTableRows } from '@/db/tableMethods/customerProfileMethods'
import { selectOrganizationById } from '@/db/tableMethods/organizationMethods'
import { adminTransaction } from '@/db/databaseMethods'
import { supabaseUpdatePayloadSchema } from '@/db/supabase'
import { invoicesSelectSchema } from '@/db/schema/invoices'

interface ChangeCheckerParams {
  oldRecord: Invoice.Record
  newRecord: Invoice.Record
}

const invoiceStatusChangedToPaid = (params: ChangeCheckerParams) => {
  const { oldRecord, newRecord } = params
  return (
    oldRecord.status !== InvoiceStatus.Paid &&
    newRecord.status === InvoiceStatus.Paid
  )
}

const invoiceUpdateSchema = supabaseUpdatePayloadSchema(
  invoicesSelectSchema
)

export const invoiceUpdatedTask = task({
  id: 'invoice-updated',
  run: async (
    payload: SupabaseUpdatePayload<Invoice.Record>,
    { ctx }
  ) => {
    logger.log(JSON.stringify({ payload, ctx }, null, 2))

    const parsedPayload = invoiceUpdateSchema.safeParse(payload)

    if (!parsedPayload.success) {
      logger.error(parsedPayload.error.message)
      parsedPayload.error.issues.forEach((issue) => {
        logger.error(`${issue.path.join('.')}: ${issue.message}`)
      })
      throw new Error('Invalid payload')
    }

    const { old_record: oldRecord, record: newRecord } =
      parsedPayload.data

    if (invoiceStatusChangedToPaid({ oldRecord, newRecord })) {
      return adminTransaction(async ({ transaction }) => {
        const invoiceLineItems = await selectInvoiceLineItems(
          { InvoiceId: newRecord.id },
          transaction
        )

        const [{ customer, customerProfile }] =
          await selectCustomerProfileAndCustomerTableRows(
            {
              id: newRecord.CustomerProfileId,
            },
            transaction
          )
        if (!customer) {
          throw new Error(
            `Customer not found for invoice ${newRecord.id}`
          )
        }

        const organization = await selectOrganizationById(
          customerProfile.OrganizationId,
          transaction
        )
        if (!organization) {
          throw new Error(
            `Organization not found for invoice ${newRecord.id}`
          )
        }
        logger.info(`Sending receipt email to ${customer.email}`)
        await sendReceiptEmail({
          to: [customer.email],
          invoice: newRecord,
          invoiceLineItems,
          organizationName: organization.name,
        })
        return {
          message: 'Receipt email sent successfully',
        }
      })
    }

    return {
      message: 'No action required',
    }
  },
})
