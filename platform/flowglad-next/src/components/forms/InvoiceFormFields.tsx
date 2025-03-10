import { Calendar, ChevronDown } from 'lucide-react'

import Input from '@/components/ion/Input'
import Select from '@/components/ion/Select'
import Textarea from '@/components/ion/Textarea'
import { InvoiceFormLineItemsField } from './InvoiceFormLineItemsField'

import { Invoice } from '@/db/schema/invoices'
import { Controller, useFormContext } from 'react-hook-form'
import { useAuthenticatedContext } from '../../contexts/authContext'
import Datepicker from '../ion/Datepicker'
import clsx from 'clsx'
import { useState } from 'react'
import { CustomerProfile } from '@/db/schema/customerProfiles'
import { trpc } from '@/app/_trpc/client'

const customerProfileOptions = (
  customerProfile?: CustomerProfile.ClientRecord,
  data?: CustomerProfile.PaginatedList
) => {
  if (customerProfile) {
    return [
      {
        label: customerProfile.name as string,
        value: customerProfile.id,
      },
    ]
  }
  return (
    data?.data.map((customerProfile) => ({
      label: customerProfile.name as string,
      value: customerProfile.id as string,
    })) ?? []
  )
}

const InvoiceFormFields = ({
  customerProfile,
}: {
  customerProfile?: CustomerProfile.ClientRecord
}) => {
  const { organization } = useAuthenticatedContext()
  const { data } = trpc.customerProfiles.list.useQuery({})
  const customerOptions = customerProfileOptions(
    customerProfile,
    data
  )
  const { control, register } = useFormContext<{
    invoice: Invoice.Insert
  }>()
  const [dueOption, setDueOption] = useState('On Receipt')

  return (
    <>
      <div className="w-full flex items-start gap-2.5">
        <Input
          label="Bill From"
          value={organization!.name}
          className="flex-1"
          disabled
        />
        <Controller
          name="invoice.CustomerProfileId"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              placeholder="placeholder"
              options={customerOptions}
              label="Bill To"
              className="flex-1"
              disabled={!!customerProfile}
              value={field.value?.toString()}
              onValueChange={(value) => field.onChange(Number(value))}
            />
          )}
        />
      </div>
      <div className="w-full flex items-start gap-2.5">
        <Controller
          name="invoice.invoiceDate"
          control={control}
          render={({ field }) => (
            <Datepicker
              {...field}
              onSelect={(value) =>
                field.onChange(value ? value.toISOString() : '')
              }
              value={field.value ? new Date(field.value) : undefined}
              iconTrailing={<ChevronDown size={16} />}
              iconLeading={<Calendar size={16} />}
              label="Issued On"
              className="flex-1 w-full"
            />
          )}
        />
        <Input
          {...register('invoice.invoiceNumber')}
          placeholder="0000"
          label="Invoice #"
          className="flex-1 w-full"
        />
      </div>
      <div className="w-full flex flex-row items-start gap-2.5">
        <Select
          placeholder="placeholder"
          options={[
            {
              label: 'On Receipt',
              value: 'On Receipt',
            },
            {
              label: 'Custom Date',
              value: 'Custom Date',
            },
          ]}
          label="Due"
          className="flex-1"
          value={dueOption}
          onValueChange={(value) => setDueOption(value)}
        />

        <Controller
          name="invoice.dueDate"
          control={control}
          render={({ field }) => (
            <Datepicker
              {...field}
              onSelect={(value) =>
                field.onChange(value ? value.toISOString() : '')
              }
              value={field.value ? new Date(field.value) : undefined}
              iconTrailing={<ChevronDown size={16} />}
              iconLeading={<Calendar size={16} />}
              label="Due Date"
              className={clsx(
                'flex-1',
                dueOption !== 'Custom Date' && 'opacity-0'
              )}
              disabled={dueOption !== 'Custom Date'}
            />
          )}
        />
      </div>
      <div className="w-full border-opacity-[0.07] flex items-start py-6 border-b border-white">
        <div className="flex-1 w-full flex flex-col justify-center gap-6">
          <div className="w-full flex flex-col gap-3">
            <InvoiceFormLineItemsField />
          </div>
        </div>
      </div>
      <div className="w-full flex items-start py-6">
        <div className="flex-1 w-full flex flex-col justify-center gap-6">
          <Controller
            name="invoice.memo"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Add cope of work and other notes"
                label="Memo"
                className="w-full"
                value={field.value ?? ''}
              />
            )}
          />
        </div>
      </div>
    </>
  )
}

export default InvoiceFormFields
