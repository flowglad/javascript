import { authenticatedTransaction } from '@/db/databaseMethods'
import { selectVariantsAndProductByProductId } from '@/db/tableMethods/variantMethods'
import InternalProductDetailsPage from './InternalProductDetailsPage'

interface ProductPageProps {
  params: {
    id: string
  }
}

const ProductPage = async ({ params }: ProductPageProps) => {
  const { product, variants } = await authenticatedTransaction(
    async ({ transaction }) => {
      const { product, variants } =
        await selectVariantsAndProductByProductId(
          params.id,
          transaction
        )
      return { product, variants }
    }
  )
  return (
    <InternalProductDetailsPage
      product={product}
      variants={variants}
    />
  )
}

export default ProductPage
