import { forwardRef, useId } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/core'

interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Accordion.Trigger> {}
const AccordionTrigger = forwardRef<
  React.ElementRef<typeof Accordion.Trigger>,
  AccordionTriggerProps
>(({ children, className, ...props }, forwardedRef) => (
  <Accordion.Header className={cn('flex', className)}>
    <Accordion.Trigger
      className={cn(
        'group flex flex-1 items-center justify-between px-4 py-4 text-sm font-medium transition-all [&[data-state=open]>svg]:rotate-180'
      )}
      {...props}
      ref={forwardedRef}
    >
      {children}
      <ChevronDown
        aria-hidden
        className="transition-transform duration-200"
      />
    </Accordion.Trigger>
  </Accordion.Header>
))

AccordionTrigger.displayName = 'AccordionTrigger'

const AccordionContent = forwardRef<
  React.ElementRef<typeof Accordion.Content>,
  React.ComponentPropsWithoutRef<typeof Accordion.Content>
>(({ children, className, ...props }, forwardedRef) => (
  <Accordion.Content
    className={cn(
      'overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
      className
    )}
    {...props}
    ref={forwardedRef}
  >
    {children}
  </Accordion.Content>
))

AccordionContent.displayName = 'AccordionContent'

interface AccordionItemProps {
  header: React.ReactNode
  content: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  value: string
}

const AccordionItem = ({
  header,
  content,
  className,
  headerClassName,
  contentClassName,
  value,
}: AccordionItemProps) => (
  <Accordion.Item className={cn('', className)} value={value}>
    <AccordionTrigger
      className={cn(
        'rounded-radius-md text-md font-bold bg-background-input w-full justify-start',
        headerClassName
      )}
    >
      {header}
    </AccordionTrigger>
    <AccordionContent className={cn('p-2', contentClassName)}>
      {content}
    </AccordionContent>
  </Accordion.Item>
)

interface CoreAccordionProps {
  items: AccordionItemProps[]
  className?: string
}
interface SingleAccordionProps extends CoreAccordionProps {
  type: 'single'
  defaultValue: string
}

interface MultipleAccordionProps extends CoreAccordionProps {
  type: 'multiple'
  defaultValue: string[]
}

type AccordionProps = SingleAccordionProps | MultipleAccordionProps

const AccordionComponent = ({
  items,
  className,
  type,
  defaultValue,
}: AccordionProps) => (
  // @ts-expect-error - prop types mismatch
  <Accordion.Root
    type={type}
    className={cn('flex flex-col gap-2 w-full', className)}
    collapsible
    defaultValue={defaultValue}
  >
    {items.map((item, index) => (
      <AccordionItem key={index} {...item} />
    ))}
  </Accordion.Root>
)

export {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  AccordionComponent as Accordion,
}
