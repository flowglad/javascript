import { DollarSign } from 'lucide-react'
import NumberInput, { NumberInputProps } from './NumberInput'
import { UseFormRegisterReturn } from 'react-hook-form'
import { ChangeEvent } from 'react'

export const CurrencyInput = (
  props: NumberInputProps & { register?: UseFormRegisterReturn }
) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    const integerValue = value
      ? Math.round(Number(value) * 100)
      : undefined
    /**
     * Deliberately unsafe code: just a stubbed event object
     * to help onChange handlers that expect one but only
     * need the value
     */
    const stubbedEvent = {
      target: { value: integerValue },
    } as unknown as ChangeEvent<HTMLInputElement>
    if (props.register) {
      props.register.onChange(stubbedEvent)
    }
    if (props.onChange) {
      props.onChange(stubbedEvent)
    }
  }

  const formatValue = (value: number | undefined) => {
    if (value === undefined) return ''
    // Convert integer cents to decimal dollars with 2 decimal places
    return (value / 100).toFixed(2)
  }

  return (
    <NumberInput
      {...props}
      value={
        props.value ? formatValue(props.value as number) : undefined
      }
      onChange={handleChange}
      placeholder="0.00"
      showControls={false}
      iconLeading={<DollarSign size={16} strokeWidth={2} />}
    />
  )
}
