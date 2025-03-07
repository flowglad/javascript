'use client'
import { ChevronRight, TriangleRight } from 'lucide-react'
import {
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ion/Navigation'
import { BusinessOnboardingStatus } from '@/types'
import { useAuthContext } from '@/contexts/authContext'
import { usePathname } from 'next/navigation'

const OnboardingNavigationSection = () => {
  const pathname = usePathname()
  const selectedPath = pathname
  const { organization } = useAuthContext()
  if (
    organization?.onboardingStatus ===
    BusinessOnboardingStatus.FullyOnboarded
  ) {
    return null
  }
  return (
    <NavigationMenuItem>
      <NavigationMenuLink
        iconLeading={
          <TriangleRight size={14} strokeWidth={2} color="orange" />
        }
        iconTrailing={<ChevronRight size={16} strokeWidth={2} />}
        className="w-full"
        href="/onboarding"
        selected={selectedPath.startsWith('/onboarding')}
      >
        Set Up
      </NavigationMenuLink>
    </NavigationMenuItem>
  )
}

export default OnboardingNavigationSection
