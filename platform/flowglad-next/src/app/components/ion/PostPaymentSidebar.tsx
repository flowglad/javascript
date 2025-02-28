// Generated with Ion on 11/17/2024, 2:36:56 AM
// Figma Link: https://www.figma.com/design/3fYHKpBnD7eYSAmfSvPhvr?node-id=583:15070
import clsx from 'clsx'
import { Organization } from '@/db/schema/organizations'
import Image from 'next/image'
import PoweredByFlowgladText from './PoweredByFlowgladText'

type PostPaymentSideBarProps = {
  className?: string
  organization: Organization.Record
}

function PostPaymentSideBar({
  className = '',
  organization,
}: PostPaymentSideBarProps) {
  return (
    <div
      className={clsx(
        'bg-nav flex-1 h-full w-full max-w-[512px] flex flex-col justify-center items-start gap-[175px] px-10 pt-[100px] pb-[20px] border-r border-container',
        className
      )}
    >
      <div className="w-full max-w-[372px] min-w-[328px] flex flex-col items-start gap-6 text-left justify-between h-full">
        <div className="flex flex-col flex-0"></div>
        <div className="w-full flex flex-1 flex-col gap-3 items-start">
          {organization.logoURL && (
            <Image
              src={organization.logoURL}
              alt={organization.name}
              width={100}
              height={100}
              className="object-contain rounded-full"
            />
          )}
          <div className="text-5xl leading-[54px] font-semibold text-foreground w-full max-w-[372px]">
            Order Complete!
          </div>
        </div>
        <div className="flex flex-1 flex-col items-end justify-end">
          <PoweredByFlowgladText className="text-left justify-start" />
        </div>
      </div>
    </div>
  )
}

export default PostPaymentSideBar
