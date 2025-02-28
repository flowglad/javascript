import { authenticatedTransaction } from '@/db/databaseMethods'
import {
  selectDiscountById,
  selectDiscounts,
} from '@/db/tableMethods/discountMethods'

interface PageProps {
  params: {
    id: string
  }
}

const DiscountsPage = async ({ params }: PageProps) => {
  const discount = await authenticatedTransaction(
    async ({ transaction }) => {
      return selectDiscountById(params.id, transaction)
    }
  )

  return <div>DiscountsPage: {discount?.name}</div>
}

export default DiscountsPage
