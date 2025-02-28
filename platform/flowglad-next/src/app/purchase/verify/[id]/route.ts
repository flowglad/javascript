import { adminTransaction } from '@/db/databaseMethods'
import { exchangeTokenForPurchaseAccessSession } from '@/utils/purchaseAccessSessionState'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export const GET = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return new Response('Missing token', {
        status: 400,
      })
    }

    await adminTransaction(async ({ transaction }) => {
      return exchangeTokenForPurchaseAccessSession(token, transaction)
    })
  } catch (error) {
    return new Response((error as Error).message, { status: 500 })
  } finally {
    return redirect(`/purchase/access/${params.id}`)
  }
}
