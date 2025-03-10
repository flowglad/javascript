'use client'
import core from '@/utils/core'
import { trpc } from '@/app/_trpc/client'
import FormModal from '@/components/forms/FormModal'
import InvoiceFormFields from './InvoiceFormFields'
import {
  CreateInvoiceInput,
  createInvoiceSchema,
} from '@/db/schema/invoiceLineItems'
import { useAuthenticatedContext } from '@/contexts/authContext'
import { CustomerProfile } from '@/db/schema/customerProfiles'
import { InvoiceType } from '@/types'

function CreateInvoiceModal({
  isOpen,
  setIsOpen,
  customerProfile,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  customerProfile?: CustomerProfile.ClientRecord
}) {
  const { organization, livemode } = useAuthenticatedContext()
  const createInvoice = trpc.invoices.create.useMutation()
  const defaultValues: CreateInvoiceInput = {
    invoice: {
      livemode: livemode ?? false,
      invoiceDate: new Date(),
      CustomerProfileId: customerProfile?.id ?? '',
      currency: organization!.defaultCurrency,
      invoiceNumber: core.createInvoiceNumber(
        customerProfile?.invoiceNumberBase ?? '',
        1
      ),
      OrganizationId: organization!.id,
      type: InvoiceType.Standalone,
      PurchaseId: null,
      BillingPeriodId: null,
    },
    invoiceLineItems: [],
  }

  return (
    <FormModal<CreateInvoiceInput>
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Create Invoice"
      formSchema={createInvoiceSchema}
      onSubmit={createInvoice.mutateAsync}
      defaultValues={defaultValues}
      wide
    >
      <InvoiceFormFields />
    </FormModal>
  )
}

export default CreateInvoiceModal
