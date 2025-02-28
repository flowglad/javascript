import Link from 'next/link'
import { Lock } from 'lucide-react'
import FlowgladWordmark from '@/app/components/FlowgladWordmark'
import core from '@/utils/core'

const PoweredByFlowgladText = ({
  className,
}: {
  className?: string
}) => {
  return (
    <div
      className={core.cn(
        'h-5 w-full flex items-center gap-2 py-8 justify-center',
        className
      )}
    >
      <Lock size={16} className="text-on-disabled" />
      <div className="text-sm font-medium text-center text-on-disabled">
        Powered by
      </div>
      <Link href="https://flowglad.com">
        <FlowgladWordmark fill="rgba(255, 255, 255, 0.5)" />
      </Link>
    </div>
  )
}

export default PoweredByFlowgladText
