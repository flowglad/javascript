// ion/Checkbox: Generated with Ion on 9/20/2024, 10:31:44 PM
import { Check, Minus } from 'lucide-react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import clsx from 'clsx'
import * as React from 'react'
import { twMerge } from 'tailwind-merge'

import Label from '@/app/components/ion/Label'

/* ---------------------------------- Type --------------------------------- */

export interface CheckboxProps {
  /** Label of the checkbox */
  label?: React.ReactNode
  /** Description, under the label, of the checkbox */
  description?: string
  /** Helper text, to the right of the label */
  helper?: string
  /** Display the checkbox with an error state */
  error?: string | boolean
  /** Classname of the checkbox container (use this to position the checkbox) */
  className?: string
  /** Classname of the HTML checkbox (use this to restyle the checkbox) */
  checkboxClassName?: string
}

/* ---------------------------------- Component --------------------------------- */

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> &
    CheckboxProps
>(
  (
    {
      className,
      label,
      description,
      required,
      helper,
      error,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const id = props.id || generatedId
    const ariaInvalid = props['aria-invalid'] || !!error

    return (
      <span className={clsx('flex items-center gap-2', className)}>
        <CheckboxPrimitive.Root
          id={id}
          aria-required={required}
          aria-invalid={ariaInvalid}
          aria-describedby={
            description ? `${id}__description` : undefined
          }
          ref={ref}
          className={twMerge(
            clsx(
              'peer h-5 w-5 shrink-0 overflow-hidden rounded-radius-xs border border-stroke bg-background transition-colors hover:border-stroke-strong',
              'focus-visible:primary-focus focus-visible:border-stroke-primary',
              'data-[state=checked]:text-on-primary data-[state=indeterminate]:text-on-primary data-[state=indeterminate]:bg-primary data-[state=checked]:bg-primary',
              'data-[state=checked]:border-transparent data-[state=indeterminate]:border-transparent',
              'disabled:pointer-events-none disabled:border-stroke-disabled disabled:bg-disabled disabled:text-on-disabled',
              'disabled:data-[state=checked]:bg-disabled disabled:data-[state=indeterminate]:bg-disabled',
              'disabled:data-[state=checked]:text-on-disabled disabled:data-[state=indeterminate]:text-on-disabled',
              'group',
              !!error &&
                'border-danger hover:border-danger data-[state=checked]:bg-danger data-[state=indeterminate]:bg-danger'
            )
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator
            className={clsx('flex items-center justify-center')}
          >
            <Check
              size={12}
              strokeWidth={2}
              className={
                'z-10 hidden transition-none group-data-[state=checked]:block'
              }
            />
            <Minus
              size={12}
              strokeWidth={2}
              className={
                'hidden group-data-[state=indeterminate]:block'
              }
            />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {label && (
          <Label
            id={`${id}__label`}
            htmlFor={id}
            required={required}
            disabled={props.disabled}
            description={description}
            descriptionId={`${id}__description`}
            helper={helper}
          >
            {label}
          </Label>
        )}
      </span>
    )
  }
)
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export default Checkbox
