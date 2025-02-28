import { SideNavigation } from '@/app/components/navigation/SideNavigation'
import React from 'react'

const SidebarLayout = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <div className="flex h-screen">
      <div className="sticky top-0 bottom-0 h-full">
        <SideNavigation />
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}

export default SidebarLayout
