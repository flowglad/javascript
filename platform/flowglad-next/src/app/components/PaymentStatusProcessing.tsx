'use client'
import { Hourglass } from 'lucide-react'

const PaymentStatusProcessing = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full">
      <Hourglass size={64} color="white" />
      <h1 className="text-2xl font-bold mt-4">Processing</h1>
    </div>
  )
}

export default PaymentStatusProcessing
