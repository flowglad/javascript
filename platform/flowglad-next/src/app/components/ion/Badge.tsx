// ion/Badge: Generated with Ion on 9/20/2024, 10:31:44 PM
import { cva } from 'class-variance-authority'
import clsx from 'clsx'
import React from 'react'

const badgeClassNames = cva(
  [
    'font-semibold',
    'rounded-lg',
    'shrink-0',
    'whitespace-nowrap',
    'border',
  ],
  {
    variants: {
      type: {
        text: 'py-1 px-2 flex h-fit w-fit justify-center items-center gap-1 font-medium',
        number:
          'text-center flex shrink-none justify-center items-center',
      },
      variant: {
        outline: '',
        soft: 'border-transparent',
      },
      color: {
        blue: '',
        green: 'bg-green-single-50',
        pink: '',
        cyan: '',
        purple: '',
        red: '',
        grey: 'bg-gray-50',
        yellow: '',
      },
      size: {
        sm: 'text-[11px] leading-4',
        md: 'text-xs',
        lg: 'text-sm',
      },
    },
    compoundVariants: [
      {
        size: ['sm'],
        type: ['number'],
        className: ['min-w-6 h-6'],
      },
      {
        size: ['md'],
        type: ['number'],
        className: ['min-w-6 h-6'],
      },
      {
        size: ['lg'],
        type: ['number'],
        className: ['min-w-7 h-7'],
      },
      {
        variant: ['soft'],
        color: ['blue'],
        className: ['bg-blue-50', 'text-blue-800'],
      },
      {
        variant: ['soft'],
        color: ['green'],
        className: ['bg-green-single-50', 'text-green-single-800'],
      },
      {
        variant: ['soft'],
        color: ['pink'],
        className: ['bg-pink-50', 'text-pink-800'],
      },
      {
        variant: ['soft'],
        color: ['cyan'],
        className: ['bg-cyan-50', 'text-cyan-800'],
      },
      {
        variant: ['soft'],
        color: ['purple'],
        className: ['bg-purple-50', 'text-purple-800'],
      },
      {
        variant: ['soft'],
        color: ['red'],
        className: ['bg-red-50', 'text-red-700'],
      },
      {
        variant: ['soft'],
        color: ['grey'],
        className: ['bg-gray-50', 'text-gray-800'],
      },
      {
        variant: ['soft'],
        color: ['yellow'],
        className: ['bg-yellow-50', 'text-yellow-800'],
      },
      {
        variant: ['outline'],
        color: ['blue'],
        className: ['border-blue-400', 'text-blue-800'],
      },
      {
        variant: ['outline'],
        color: ['green'],
        className: ['border-emerald-400', 'text-emerald-800'],
      },
      {
        variant: ['outline'],
        color: ['pink'],
        className: ['border-pink-400', 'text-pink-800'],
      },
      {
        variant: ['outline'],
        color: ['cyan'],
        className: ['border-cyan-400', 'text-cyan-800'],
      },
      {
        variant: ['outline'],
        color: ['purple'],
        className: ['border-purple-400', 'text-purple-800'],
      },
      {
        variant: ['outline'],
        color: ['red'],
        className: ['border-red-400', 'text-red-800'],
      },
      {
        variant: ['outline'],
        color: ['grey'],
        className: ['border-gray-400', 'text-gray-800'],
      },
      {
        variant: ['outline'],
        color: ['yellow'],
        className: ['border-yellow-400', 'text-yellow-800'],
      },
    ],
    defaultVariants: {
      type: 'text',
      variant: 'soft',
      color: 'blue',
      size: 'md',
    },
  }
)

export type BadgeColor =
  | 'blue'
  | 'green'
  | 'pink'
  | 'purple'
  | 'red'
  | 'grey'
  | 'yellow'
  | 'cyan'

/* ---------------------------------- Type --------------------------------- */

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Icon to be displayed before the badge content */
  iconLeading?: React.ReactNode
  /** Icon to be displayed after the badge content */
  iconTrailing?: React.ReactNode
  /** Type of the Badge. Setting type to `number` makes the Badge fit the size of the number.
   * @default 'text'
   */
  type?: 'text' | 'number'
  /** Variant of the badge
   * @default 'soft'
   */
  variant?: 'soft' | 'outline'
  /** Color of the badge
   * @default 'blue'
   */
  color?: BadgeColor
  /** Size of the badge
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
}

/* ---------------------------------- Component --------------------------------- */

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      type,
      variant,
      color,
      size,
      children,
      iconLeading,
      iconTrailing,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          badgeClassNames({
            type,
            variant,
            color,
            size,
          }),
          className
        )}
        {...props}
      >
        {iconLeading}
        {children}
        {iconTrailing}
      </div>
    )
  }
)
Badge.displayName = 'Badge'

export default Badge
