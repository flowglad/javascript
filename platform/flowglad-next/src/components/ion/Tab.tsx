// Generated with Ion on 10/10/2024, 7:02:11 PM
// Figma Link: https://www.figma.com/design/3fYHKpBnD7eYSAmfSvPhvr?node-id=20:27800
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cva } from 'class-variance-authority'
import clsx from 'clsx'
import * as React from 'react'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={clsx('flex items-start', className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={clsx('mt-2', className)}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

const tabClassnames = cva(
  'flex justify-center items-center px-2 pt-2 pb-4 text-2xl font-semibold',
  {
    variants: {
      state: {
        default: 'text-subtle',
        selected: 'border-b border-[#dfdfdf] text-[#dfdfdf]',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  }
)

interface TabProps {
  title?: string
  state: 'selected' | 'default'
}

const Tab = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> &
    TabProps
>(({ className, title, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={clsx(tabClassnames({ state: props.state }), className)}
    {...props}
  >
    {title}
  </TabsPrimitive.Trigger>
))
Tab.displayName = TabsPrimitive.Trigger.displayName

export { Tab, Tabs, TabsList, TabsContent }
