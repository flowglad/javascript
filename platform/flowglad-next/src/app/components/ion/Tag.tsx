// ion/Tag: Generated with Ion on 9/20/2024, 10:31:44 PM
import { X } from 'lucide-react'
import { cva } from 'class-variance-authority'
import clsx from 'clsx'
import React from 'react'

/* ---------------------------------- Type --------------------------------- */

export interface TagProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'type'
  > {
  /** Variant of the tag
   * @default 'stroke'
   */
  variant?: 'stroke' | 'filled'
  /** Color of the tag
   * @default 'neutral'
   */
  color?: 'neutral' | 'primary' | 'success' | 'danger'
  /** Icon to the left of the tag content */
  iconLeading?: React.ReactNode
  /** Callback when the tag is dismissed, exposes close button */
  onDismiss?: React.MouseEventHandler<SVGSVGElement>
}

/* ---------------------------------- Component --------------------------------- */

const tagClassNames = cva(
  'cursor-default flex w-fit flex-row items-center justify-center gap-1.5 rounded-radius-xs border px-2 py-1 text-[11px] leading-none transition-all disabled:border-transparent disabled:bg-disabled',
  {
    variants: {
      color: {
        neutral: ['text-foreground', 'active:border-outline'],
        primary: ['text-primary', 'active:border-primary'],
        success: ['text-success', 'active:border-success'],
        danger: ['text-danger', 'active:border-danger'],
      },
      variant: {
        stroke: ['bg-transparent', 'active:bg-transparent'],
        filled: ['border-transparent'],
      },
    },
    compoundVariants: [
      {
        color: 'neutral',
        variant: 'stroke',
        className: ['border-stroke', 'hover:bg-container-high'],
      },
      {
        color: 'neutral',
        variant: 'filled',
        className: ['bg-container-high', 'hover:border-stroke'],
      },
      {
        color: 'primary',
        variant: 'stroke',
        className: [
          'border-stroke-primary',
          'hover:bg-primary-container',
        ],
      },
      {
        color: 'primary',
        variant: 'filled',
        className: [
          'bg-primary-accent',
          'hover:border-stroke-primary',
        ],
      },
      {
        color: 'success',
        variant: 'stroke',
        className: [
          'border-stroke-success',
          'hover:bg-success-container',
        ],
      },
      {
        color: 'success',
        variant: 'filled',
        className: [
          'bg-success-accent',
          'hover:border-stroke-success',
        ],
      },
      {
        color: 'danger',
        variant: 'stroke',
        className: [
          'border-stroke-danger',
          'hover:bg-danger-container',
        ],
      },
      {
        color: 'danger',
        variant: 'filled',
        className: ['bg-danger-accent', 'hover:border-stroke-danger'],
      },
    ],
  }
)

const Tag = React.forwardRef<HTMLButtonElement, TagProps>(
  (
    {
      className,
      variant = 'stroke',
      color = 'neutral',
      iconLeading,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          tagClassNames({
            variant,
            color,
          }),
          className
        )}
        {...props}
      >
        {iconLeading}
        {children}
        {onDismiss && (
          <X
            onClick={(e) => {
              // Don't fire the top-level onClick for the tag
              e.stopPropagation()
              onDismiss(e)
            }}
            role="button"
            aria-label="Remove"
            className="h-3 w-3"
          />
        )}
      </button>
    )
  }
)
Tag.displayName = 'Tag'

export default Tag
