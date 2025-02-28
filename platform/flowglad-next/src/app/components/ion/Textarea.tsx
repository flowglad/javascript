// Generated with Ion on 9/24/2024, 3:10:31 AM
// Figma Link: https://www.figma.com/design/3fYHKpBnD7eYSAmfSvPhvr?node-id=3910:7546
// ion/Textarea: Generated with Ion on 9/24/2024, 3:10:29 AM
import clsx from 'clsx'
import * as React from 'react'
import { useState } from 'react'

import Hint from '@/app/components/ion/Hint'
import Label from '@/app/components/ion/Label'

/* ---------------------------------- Type --------------------------------- */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Display the maximum length of the textarea in the bottom right corner, has to include the `maxLength` property to work
   * @default false
   */
  showCount?: boolean
  /** Label of the input */
  label?: string
  /** Helper text, to the right of the label */
  helper?: string
  /** Hint/description below the datepicker */
  hint?: string
  /** Display hint icon to the left of the hinti
   * @default false
   */
  showHintIcon?: boolean
  /** Display required mark to the right of the label */
  required?: boolean
  /** Display the input with an error state */
  error?: boolean | string
  /** Classname of the container (use this to position the textarea) */
  className?: string
  /** Classname of the textarea (use this to restyle the textarea) */
  textareaClassName?: string
  /** Element to display to the right of the label */
  rightLabelElement?: React.ReactNode
}

/* ---------------------------------- Component --------------------------------- */

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      required,
      label,
      helper,
      hint,
      showHintIcon = false,
      error,
      showCount,
      className,
      onChange,
      rightLabelElement,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const id = props.id || generatedId
    const [charCount, setCharCount] = useState(0)
    let labelElement = (
      <Label
        htmlFor={id}
        disabled={props.disabled}
        required={required}
        helper={helper}
        className="mb-1"
      >
        {label}
      </Label>
    )
    if (rightLabelElement) {
      labelElement = (
        <div className="flex items-center justify-between">
          {labelElement}
          {rightLabelElement}
        </div>
      )
    }
    return (
      <div className={className}>
        {label && labelElement}
        <div className="relative">
          <textarea
            maxLength={props.maxLength}
            ref={ref}
            onChange={(e) => {
              if (onChange) {
                onChange(e)
              }
              setCharCount(e.target.value.length)
            }}
            className={clsx(
              'bg-background-input focus-visible:primary-focus flex w-full rounded-radius border hover:border-outline p-3 text-sm text-foreground transition-all placeholder:text-subtle',
              'disabled:pointer-events-none disabled:border-stroke-disabled disabled:bg-disabled disabled:text-on-disabled disabled:placeholder:text-on-disabled',
              {
                'focus-visible:danger-focus border-danger': error,
                'border-stroke focus-visible:border-stroke-primary':
                  !error,
              }
            )}
            {...props}
            id={id}
          />
          {showCount && (
            <span
              className={clsx(
                'absolute bottom-3 right-4 text-xs font-normal text-secondary',
                {
                  'text-on-disabled': props.disabled,
                  '!text-danger': error,
                }
              )}
            >
              {charCount} / {props.maxLength}
            </span>
          )}
        </div>
        {hint && (
          <Hint
            error={error}
            className="mt-1"
            showIcon={showHintIcon}
            disabled={props.disabled}
          >
            {hint}
          </Hint>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export default Textarea
