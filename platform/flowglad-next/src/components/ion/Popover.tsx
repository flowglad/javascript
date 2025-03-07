// ion/Popover: Generated with Ion on 10/11/2024, 4:12:37 AM
// Figma Link: https://www.figma.com/design/3fYHKpBnD7eYSAmfSvPhvr?node-id=3690:18567
// ion/Popover: Generated with Ion on 10/11/2024, 4:12:36 AM
import * as PopoverPrimitive from '@radix-ui/react-popover'
import clsx from 'clsx'
import * as React from 'react'
import { twMerge } from 'tailwind-merge'

const PopoverRoot = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

/* ---------------------------------- Component --------------------------------- */

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(
  (
    { className, align = 'center', sideOffset = 4, ...props },
    ref
  ) => (
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={twMerge(
        clsx(
          'disabled:outline-disabled outline-none group relative z-50 flex w-[--radix-popover-trigger-width] min-w-[8rem] overflow-hidden rounded-radius bg-background p-2 shadow-medium data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )
      )}
      {...props}
    />
  )
)
PopoverContent.displayName = PopoverPrimitive.Content.displayName

const PopoverClose = PopoverPrimitive.PopoverClose

export {
  PopoverRoot as Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
}
