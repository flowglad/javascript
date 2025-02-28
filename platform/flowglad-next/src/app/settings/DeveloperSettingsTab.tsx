import { trpc } from '@/app/_trpc/client'
import ApiKeysTable, { ApiKeysTableProps } from './ApiKeysTable'

const DeveloperSettingsPage = () => {
  const { data: apiKeys, isPending } = trpc.apiKeys.get.useQuery({})
  let apiKeysTableProps: ApiKeysTableProps
  if (isPending) {
    apiKeysTableProps = { data: undefined, loading: true }
  } else {
    apiKeysTableProps = {
      data: apiKeys?.data.apiKeys ?? [],
      loading: false,
    }
  }
  return <ApiKeysTable {...apiKeysTableProps} />
}

export default DeveloperSettingsPage
