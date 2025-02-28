'use client'
// Generated with Ion on 10/1/2024, 2:36:05 PM
// Figma Link: https://www.figma.com/design/3fYHKpBnD7eYSAmfSvPhvr?node-id=640:29773
import * as React from 'react'
import clsx from 'clsx'
import { useCheckoutPageContext } from '@/app/contexts/checkoutPageContext'
import Image from 'next/image'

export interface SellerInfoProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const SellerInfo = React.forwardRef<HTMLDivElement, SellerInfoProps>(
  ({ className, ...props }, ref) => {
    const { sellerOrganization } = useCheckoutPageContext()
    return (
      <div
        ref={ref}
        className={clsx(
          'h-7 flex items-center lg:items-start w-full lg:w-auto lg:absolute lg:left-4 lg:top-4 lg:ml-3 lg:mt-3',
          className
        )}
        {...props}
      >
        <div className="flex items-center">
          {sellerOrganization.logoURL && (
            <div className="bg-white h-7 w-7 flex justify-center items-center rounded-full shadow-[0_1px_1px_0_rgba(0,0,0,0.07),0_2px_5px_0_rgba(50,50,93,0.1)] mr-2">
              <Image
                src={sellerOrganization.logoURL ?? ''}
                alt={sellerOrganization.name}
                className="h-7 w-7 rounded-full"
                width={28}
                height={28}
              />
            </div>
          )}
          <div className="text-sm text-white opacity-90">
            {sellerOrganization.name}
          </div>
        </div>
      </div>
    )
  }
)

SellerInfo.displayName = 'SellerInfo'

export default SellerInfo
