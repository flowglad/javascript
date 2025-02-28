// ion/Progress: Generated with Ion on 9/20/2024, 10:31:44 PM
import * as ProgressPrimitive from '@radix-ui/react-progress'
import clsx from 'clsx'
import * as React from 'react'

/* ---------------------------------- Component --------------------------------- */

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={clsx(
      'relative h-2 w-full overflow-hidden rounded-full bg-disabled',
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all rounded-full focus:primary-focus"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export default Progress
