'use client'
import { useEffect, useState } from 'react'
import Label from '@/app/components/ion/Label'
import {
  RadioGroup,
  RadioGroupItem as Radio,
} from '@/app/components/ion/Radio'
import { IntervalUnit, PriceType } from '@/types'
import Switch from '@/app/components/ion/Switch'
import { CurrencyInput } from '@/app/components/ion/CurrencyInput'
import Select from '@/app/components/ion/Select'
import NumberInput from '@/app/components/ion/NumberInput'
import { CreateProductSchema } from '@/db/schema/variants'
import {
  Controller,
  FieldError,
  useFormContext,
} from 'react-hook-form'
import Input from '@/app/components/ion/Input'
import { ControlledCurrencyInput } from './ControlledCurrencyInput'
import Hint from '../ion/Hint'

const useVariantFormContext = () => {
  return useFormContext<Pick<CreateProductSchema, 'variant'>>()
}

const SubscriptionFields = () => {
  const {
    register,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useVariantFormContext()
  const trialPeriodDays = watch('variant.trialPeriodDays')
  const [offerTrial, setOfferTrial] = useState(
    Boolean(trialPeriodDays && trialPeriodDays > 0)
  )
  useEffect(() => {
    setOfferTrial(Boolean(trialPeriodDays && trialPeriodDays > 0))
  }, [trialPeriodDays])
  return (
    <>
      <div className="flex items-end gap-2.5">
        <ControlledCurrencyInput
          name="variant.unitPrice"
          control={control}
          label="Amount"
          className="flex-1"
        />
        <Controller
          name="variant.intervalUnit"
          control={control}
          render={({ field }) => (
            <Select
              label="Per"
              placeholder="Select interval"
              options={[
                { label: 'Day', value: IntervalUnit.Day },
                { label: 'Week', value: IntervalUnit.Week },
                { label: 'Month', value: IntervalUnit.Month },
                { label: 'Year', value: IntervalUnit.Year },
              ]}
              className="flex-1"
              value={field.value ?? ''}
              onValueChange={field.onChange}
              error={
                (errors.variant?.intervalUnit as FieldError)?.message
              }
            />
          )}
        />
      </div>
      <Switch
        label="Trial period"
        checked={offerTrial}
        onCheckedChange={(checked) => {
          setOfferTrial(checked)
          if (!checked) {
            setValue('variant.trialPeriodDays', 0)
          }
        }}
      />
      {offerTrial && (
        <Controller
          name="variant.trialPeriodDays"
          control={control}
          render={({ field }) => (
            <NumberInput
              {...field}
              label="Trial Period Days"
              min={1}
              max={365}
              step={1}
              error={
                (errors.variant?.trialPeriodDays as FieldError)
                  ?.message
              }
            />
          )}
        />
      )}
    </>
  )
}

// const InstallmentsFields = () => {
//   const {
//     formState: { errors },
//     control,
//   } = useVariantFormContext()
//   return (
//     <div className="flex items-end gap-2.5">
//       <Controller
//         name="variant.totalInstallmentsAmount"
//         control={control}
//         render={({ field }) => (
//           <CurrencyInput
//             {...field}
//             label="Total Amount"
//             className="flex-1"
//             error={(errors.variant?.unitPrice as FieldError)?.message}
//           />
//         )}
//       />
//       <Controller
//         name="variant.firstInstallmentAmount"
//         control={control}
//         render={({ field }) => (
//           <CurrencyInput
//             {...field}
//             label="First Installment Amount"
//             className="flex-1"
//             error={
//               (errors.variant?.firstInstallmentAmount as FieldError)
//                 ?.message
//             }
//           />
//         )}
//       />
//     </div>
//   )
// }

const SinglePaymentFields = () => {
  const { control } = useVariantFormContext()
  return (
    <Controller
      name="variant.unitPrice"
      control={control}
      render={({ field }) => (
        <CurrencyInput {...field} label="Amount" defaultValue={0} />
      )}
    />
  )
}
const VariantFormFields = ({
  variantOnly,
  edit,
}: {
  variantOnly?: boolean
  edit?: boolean
}) => {
  const {
    control,
    watch,
    setValue,
    register,
    formState: { errors },
  } = useVariantFormContext()
  const variant = watch('variant')
  const priceType = watch('variant.priceType')
  let priceTypeFields = <></>

  switch (priceType) {
    case PriceType.Subscription:
      priceTypeFields = <SubscriptionFields />
      break
    case PriceType.SinglePayment:
      priceTypeFields = <SinglePaymentFields />
      break
  }
  return (
    <div className="flex-1 w-full relative flex flex-col justify-center gap-6">
      {variantOnly && (
        <Input
          label="Variant Name"
          {...register('variant.name')}
          error={errors.variant?.name?.message}
        />
      )}

      <div className="w-full relative flex flex-col gap-3">
        <Label>Price Type</Label>
        <Controller
          name="variant.priceType"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              orientation="horizontal"
              onValueChange={(value) => {
                if (value === PriceType.Subscription) {
                  setValue('variant.intervalCount', 1)
                  setValue('variant.intervalUnit', IntervalUnit.Month)
                }
                if (value === PriceType.SinglePayment) {
                  setValue('variant.intervalCount', null)
                  setValue('variant.intervalUnit', null)
                }
                field.onChange(value)
              }}
              disabled={edit}
              disabledTooltip="You can't change price type after creating a variant"
            >
              <div className="w-full relative flex items-start gap-5">
                <Radio
                  label="Single Payment"
                  value={PriceType.SinglePayment}
                />
                <Radio
                  label="Subscription"
                  value={PriceType.Subscription}
                />
              </div>
            </RadioGroup>
          )}
        />
        <Hint>
          <p>
            What type of payment the user will make. Cannot be edited
            after creation.
          </p>
        </Hint>
      </div>
      {priceTypeFields}
      {variantOnly && (
        <div className="w-full relative flex flex-col gap-3">
          <Controller
            name="variant.isDefault"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                label="Default"
              />
            )}
          />
        </div>
      )}
    </div>
  )
}
export default VariantFormFields
