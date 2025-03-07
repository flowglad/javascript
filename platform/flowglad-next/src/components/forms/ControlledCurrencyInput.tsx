import {
  Control,
  Controller,
  FieldValues,
  Path,
} from 'react-hook-form'
import { CurrencyInput } from '../ion/CurrencyInput'

type ControlledCurrencyInputProps<T extends FieldValues> = {
  label?: string
  name: Path<T>
  control: Control<T>
  className?: string
  onChange?: (value: number) => void
}

export const ControlledCurrencyInput = <T extends FieldValues>({
  label,
  name,
  control,
  className,
  onChange,
}: ControlledCurrencyInputProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <CurrencyInput
          {...field}
          label={label}
          className={className}
          onChange={(e) => {
            onChange?.(Number(e.target.value))
            field.onChange(e)
          }}
        />
      )}
    />
  )
}
