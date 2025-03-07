import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { RadioGroup, RadioGroupItem } from '@/components/ion/Radio'
import { SubscriptionCancellationArrangement } from '@/types'
import { Label } from '@radix-ui/react-label'
import Datepicker from '@/components/ion/Datepicker'
import { cn } from '@/utils/core'
import { ScheduleSubscriptionCancellationParams } from '@/subscriptions/cancelSubscription'

// Define the available radio options
const options = [
  {
    label: 'Immediately',
    value: SubscriptionCancellationArrangement.Immediately,
  },
  {
    label: 'At End Of Current Billing Period',
    value:
      SubscriptionCancellationArrangement.AtEndOfCurrentBillingPeriod,
  },
  {
    label: 'At Future Date',
    value: SubscriptionCancellationArrangement.AtFutureDate,
  },
]

const CancelSubscriptionFormFields: React.FC = () => {
  const { control, watch } =
    useFormContext<ScheduleSubscriptionCancellationParams>()
  const selectedArrangement = watch('cancellation.timing')

  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        selectedArrangement ===
          SubscriptionCancellationArrangement.AtFutureDate &&
          'min-h-[500px]'
      )}
    >
      <Label>Timing</Label>
      <Controller
        name="cancellation.timing"
        control={control}
        defaultValue={SubscriptionCancellationArrangement.Immediately}
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onValueChange={field.onChange}
          >
            {options.map((option) => (
              <RadioGroupItem
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </RadioGroup>
        )}
      />
      {selectedArrangement ===
        SubscriptionCancellationArrangement.AtFutureDate && (
        <div className="flex flex-col gap-3">
          <Label>End Date</Label>
          <Controller
            name="cancellation.endDate"
            control={control}
            render={({ field }) => (
              <Datepicker
                {...field}
                minDate={new Date()}
                onSelect={(value) => field.onChange(value)}
                value={field.value || undefined}
              />
            )}
          />
        </div>
      )}
    </div>
  )
}

export default CancelSubscriptionFormFields
