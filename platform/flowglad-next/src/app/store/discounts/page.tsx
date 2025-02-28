import { authenticatedTransaction } from '@/db/databaseMethods'
import { selectDiscounts } from '@/db/tableMethods/discountMethods'
import InternalDiscountsPage from './InternalDiscountsPage'

const DiscountsPage = async () => {
  const discounts = await authenticatedTransaction(
    async ({ transaction }) => {
      return selectDiscounts({}, transaction)
    }
  )

  return <InternalDiscountsPage discounts={discounts} />
}

export default DiscountsPage
