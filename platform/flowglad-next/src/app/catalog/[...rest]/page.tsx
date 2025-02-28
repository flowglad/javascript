import { redirect } from 'next/navigation'

/**
 * Redirects /catalog to /store
 *
 * We do this because store section used to be under /catalog.
 */
const CatalogPage = ({ params }: { params: { rest: string[] } }) => {
  const dynamicPath = params.rest.join('/')
  const newPath = `/store/${dynamicPath}`
  redirect(newPath)
}

export default CatalogPage
