// Generated with Ion on 9/24/2024, 3:10:31 AM
// Figma Link: https://www.figma.com/design/3fYHKpBnD7eYSAmfSvPhvr?node-id=3960:21561
// ion/FilledIcon: Generated with Ion on 9/24/2024, 3:10:30 AM
import { cva } from 'class-variance-authority'
import clsx from 'clsx'
import React from 'react'

/* ---------------------------------- Type --------------------------------- */

type FilledIconProps = {
  /** Icon to be displayed */
  icon: React.ReactNode
  /** Variant of the icon
   * @default 'default'
   */
  variant?: 'default' | 'bg' | 'outline' | 'primary' | 'inverse'
  /** Shape of the icon
   * @default 'square'
   */
  shape?: 'square' | 'circle'
  /** Size of the icon
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/* ---------------------------------- Component --------------------------------- */

const classNames = cva(
  ['flex', 'flex-col', 'justify-center', 'items-center', 'p-1'],
  {
    variants: {
      variant: {
        default: 'bg-background-input text-on-container',
        bg: 'bg-background',
        outline: 'border border-stroke-subtle',
        primary: 'bg-primary-container text-on-primary-container',
        inverse: 'bg-foreground text-background',
      },
      shape: {
        square: 'rounded-radius-xs',
        circle: 'rounded-full',
      },
      size: {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
      },
    },
  }
)

const FilledIcon = React.forwardRef<HTMLDivElement, FilledIconProps>(
  (
    {
      icon,
      variant = 'default',
      shape = 'square',
      size = 'sm',
      className = '',
    },
    ref
  ) => (
    <div
      ref={ref}
      className={clsx(
        classNames({
          variant,
          shape,
          size,
        }),
        className
      )}
    >
      {icon}
    </div>
  )
)
FilledIcon.displayName = 'FilledIcon'

export default FilledIcon
