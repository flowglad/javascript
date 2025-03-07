// ion/Switch: Generated with Ion on 9/20/2024, 10:31:45 PM
import * as SwitchPrimitives from '@radix-ui/react-switch'
import clsx from 'clsx'
import * as React from 'react'

import Label from '@/components/ion/Label'

/* ---------------------------------- Type --------------------------------- */

type SwitchProps = React.ComponentPropsWithoutRef<
  typeof SwitchPrimitives.Root
> & {
  /** Size of the switch
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /** Label for the switch */
  label?: React.ReactNode
  /** Description, under the label, of the switch */
  description?: string
  /** Helper text, to the right of the label*/
  helper?: string
  /** Custom class name for the thumb */
  thumbClassName?: string
  /** Custom class name for when the thumb is checked */
  checkedClassName?: string
  /** Custom class name for the label */
  labelClassName?: string
}

/* ---------------------------------- Component --------------------------------- */

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(
  (
    {
      className,
      size = 'md',
      required,
      label,
      description,
      helper,
      thumbClassName,
      labelClassName,
      checkedClassName,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const id = props.id || generatedId

    return (
      <span className="flex items-center gap-2 text-sm">
        <SwitchPrimitives.Root
          id={id}
          ref={ref}
          aria-required={required}
          aria-describedby={
            description ? `${id}__description` : undefined
          }
          className={clsx(
            'group',
            'data-[state=checked]:focus-visible:primary-focus focus-visible:neutral-focus peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors',
            'disabled:pointer-events-none disabled:bg-disabled',
            {
              'h-4 w-8': size === 'sm',
              'h-6 w-12': size === 'md',
              'h-[34px] w-[56px] pl-1': size === 'lg',
            },
            !props.disabled &&
              'data-[state=checked]:bg-primary data-[state=unchecked]:bg-on-disabled data-[state=unchecked]:hover:bg-soft',
            checkedClassName,
            className
          )}
          {...props}
        >
          <SwitchPrimitives.Thumb
            className={clsx(
              'pointer-events-none block rounded-full bg-white data-[state=checked]:bg-black shadow-lg ring-0 transition-transform group-disabled:bg-on-disabled group-disabled:shadow-none data-[state=unchecked]:translate-x-0',
              {
                'h-3 w-3 data-[state=checked]:translate-x-4':
                  size === 'sm',
                'h-5 w-5 data-[state=checked]:translate-x-6':
                  size === 'md',
                'h-6 w-6 data-[state=checked]:translate-x-5':
                  size === 'lg',
              },
              thumbClassName
            )}
          />
        </SwitchPrimitives.Root>
        {label && (
          <Label
            id={`${id}__label`}
            htmlFor={id}
            required={required}
            description={description}
            descriptionId={
              description ? `${id}__description` : undefined
            }
            helper={helper}
            className={labelClassName}
          >
            {label}
          </Label>
        )}
      </span>
    )
  }
)
Switch.displayName = SwitchPrimitives.Root.displayName

export default Switch
