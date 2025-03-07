// ion/Divider: Generated with Ion on 9/20/2024, 3:49:01 PM
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import clsx from 'clsx'
import * as React from 'react'

/* ---------------------------------- Component --------------------------------- */

const Divider = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
    children?: React.ReactNode
    color?: 'default' | 'primary' | 'strong'
  }
>(
  (
    {
      className,
      children,
      decorative = true,
      color = 'default',
      ...props
    },
    ref
  ) => (
    <div className={clsx('relative w-full', className)}>
      <div
        className={clsx(
          'absolute inset-0 flex items-center p-[inherit]'
        )}
      >
        <SeparatorPrimitive.Root
          ref={ref}
          decorative={decorative}
          orientation={'horizontal'}
          className={clsx(
            {
              'bg-primary': color === 'primary',
              'bg-stroke-strong': color === 'strong',
              'bg-stroke': color === 'default',
            },
            'h-[1px] w-full'
          )}
          {...props}
        />
      </div>

      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-3 text-subtle">
          {children}
        </span>
      </div>
    </div>
  )
)
Divider.displayName = SeparatorPrimitive.Root.displayName

export default Divider
