'use client'
import { useState } from 'react'
import FormModal from '@/components/forms/FormModal'
import { createApiKeyInputSchema } from '@/db/schema/apiKeys'
import ApiKeyFormFields from '@/components/forms/ApiKeyFormFields'
import { trpc } from '@/app/_trpc/client'
import { Copy } from 'lucide-react'
import { useCopyTextHandler } from '@/app/hooks/useCopyTextHandler'
import Input from '@/components/ion/Input'
import { FlowgladApiKeyType } from '@/types'

interface CreateApiKeyModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const CreateApiKeyModal = ({
  isOpen,
  setIsOpen,
}: CreateApiKeyModalProps) => {
  const createApiKey = trpc.apiKeys.create.useMutation()
  /**
   * Used to determine if the key is in livemode
   */
  const [livemode, setLivemode] = useState(false)
  const [rawApiKey, setRawApiKey] = useState<string | null>(null)
  const copyTextHandler = useCopyTextHandler({
    text: rawApiKey ?? '',
  })
  return (
    <FormModal
      isOpen={isOpen}
      setIsOpen={(newIsOpen) => {
        setIsOpen(newIsOpen)
        setRawApiKey(null)
      }}
      title="Create API Key"
      formSchema={createApiKeyInputSchema}
      defaultValues={{
        apiKey: {
          name: '',
          type: FlowgladApiKeyType.Secret,
        },
      }}
      onSubmit={async (data) => {
        const result = await createApiKey.mutateAsync(data)
        setRawApiKey(result.shownOnlyOnceKey)
        setLivemode(result.apiKey.livemode)
      }}
      hideFooter={rawApiKey ? true : false}
      autoClose={false}
    >
      {rawApiKey ? (
        <div className="flex flex-col gap-4">
          <div
            className="flex flex-row gap-4 items-center cursor-pointer w-full"
            onClick={copyTextHandler}
          >
            <Input
              value={rawApiKey}
              readOnly
              className="w-full pr-0 cursor-pointer"
              inputClassName="cursor-pointer"
              iconTrailing={<Copy size={16} />}
            />
          </div>
          {livemode ? (
            <p className="text-sm text-foreground text-orange-600">
              This key is only shown once.
            </p>
          ) : null}
          <p className="text-sm text-foreground">
            Copy this key and save it in your environment variables.
          </p>
        </div>
      ) : (
        <ApiKeyFormFields />
      )}
    </FormModal>
  )
}

export default CreateApiKeyModal
