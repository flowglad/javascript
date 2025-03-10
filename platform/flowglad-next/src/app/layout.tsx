import { currentUser } from '@clerk/nextjs/server'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'

import Providers from './Providers'
import { cn } from '@/utils/core'
import { adminTransaction } from '@/db/databaseMethods'
import { selectMembershipAndOrganizations } from '@/db/tableMethods/membershipMethods'
import { Organization } from '@/db/schema/organizations'
// import AIModal from './components/forms/AIModal'
// import { ChatActionsProvider } from './components/ChatActionsContext'

const PostHogPageView = dynamic(() => import('./PostHogPageview'), {
  ssr: false,
})

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Flowglad',
  description: 'Make more internet money',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await currentUser()
  let organization: Organization.Record | undefined = undefined
  let livemode: boolean = true
  if (user) {
    const [membershipData] = await adminTransaction(
      async ({ transaction }) => {
        return await selectMembershipAndOrganizations(
          {
            UserId: user.id,
            focused: true,
          },
          transaction
        )
      }
    )
    livemode = membershipData?.membership.livemode
    organization = membershipData?.organization
  }
  return (
    <Providers
      authContext={{
        organization,
        livemode,
      }}
    >
      <html lang="en" className="dark h-full">
        <body className={cn(inter.className, 'dark', 'h-full')}>
          {/* {!livemode && (
            <div className="h-12 w-full bg-orange-primary-500"></div>
          )} */}
          <PostHogPageView />
          <Toaster />
          {/* <ChatActionsProvider>
            <AIModal />
          </ChatActionsProvider> */}
          {children}
        </body>
      </html>
    </Providers>
  )
}
