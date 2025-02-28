'use client'
// Generated with Ion on 10/1/2024, 2:36:06 PM
// Figma Link: https://www.figma.com/design/3fYHKpBnD7eYSAmfSvPhvr?node-id=640:29775
import * as React from 'react'
import clsx from 'clsx'
import { Nullish } from '@/types'
import Image from 'next/image'

export interface BillingLineItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  imageSrc: string
  title: string
  price: string
  isLast?: boolean
  billingFrequency: Nullish<string>
}

const BillingLineItem = React.forwardRef<
  HTMLDivElement,
  BillingLineItemProps
>(
  (
    {
      className,
      imageSrc,
      title,
      price,
      billingFrequency,
      isLast,
      ...props
    },
    ref
  ) => {
    const noImage = !imageSrc
    return (
      <div
        ref={ref}
        className={clsx('flex items-start', className)}
        {...props}
      >
        <div className="pr-4">
          {noImage ? (
            <div className="h-[42px] w-[42px] rounded object-cover object-center overflow-hidden" />
          ) : (
            <Image
              src={imageSrc}
              alt={title}
              className="h-[42px] w-[42px] rounded object-cover object-center overflow-hidden"
              width={42}
              height={42}
            />
          )}
        </div>
        <div className="flex-1 relative">
          <div className="flex justify-between text-sm leading-tight text-white">
            <div data-testid="billing-line-item-title">{title}</div>
            <div data-testid="billing-line-item-price">{price}</div>
          </div>
          <div
            className={clsx(
              'flex flex-row text-xs opacity-50 text-white border-b border-white border-opacity-20 pb-4 justify-end',
              isLast && 'border-none'
            )}
          >
            {billingFrequency && (
              <div data-testid="billing-line-item-billing-frequency">
                {billingFrequency}
              </div>
            )}
          </div>
          {!isLast && (
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white opacity-20" />
          )}
        </div>
      </div>
    )
  }
)

BillingLineItem.displayName = 'BillingLineItem'

export default BillingLineItem
