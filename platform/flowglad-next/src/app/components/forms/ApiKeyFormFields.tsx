'use client'

import { useFormContext, Controller } from 'react-hook-form'
import { CreateApiKeyInput } from '@/db/schema/apiKeys'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/app/components/ion/Radio'
import Input from '@/app/components/ion/Input'
import { FlowgladApiKeyType } from '@/types'

const ApiKeyFormFields = () => {
  const {
    register,
    formState: { errors },
    control,
  } = useFormContext<CreateApiKeyInput>()
  return (
    <div className="flex flex-col gap-4">
      <Input
        {...register('apiKey.name')}
        label="Name"
        placeholder="e.g. Production API Key"
        error={errors.apiKey?.name?.message}
      />
      <Controller
        control={control}
        name="apiKey.type"
        render={({ field }) => (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-foreground">Type</p>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value={FlowgladApiKeyType.Secret}
                  label="Secret"
                  id="secret"
                />
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value={FlowgladApiKeyType.Publishable}
                  label="Publishable"
                  id="publishable"
                />
              </div>
            </RadioGroup>
          </div>
        )}
      />
    </div>
  )
}

export default ApiKeyFormFields
