'use client'

import { useFormContext } from 'react-hook-form'
import { CreateLinkInput } from '@/db/schema/links'
import Input from '@/components/ion/Input'

interface LinkFormFieldsProps {
  /**
   * Optional base path for the form fields.
   * If not provided, will default to assuming the form fields are nested under `{ link: {...} }`
   * If provided, will assume the form fields are nested under `{ [basePath]: { link: {...} } }`
   * @example
   * <LinkFormFields basePath="offerings.0" />
   * @default
   * null
   */
  basePath?: string
}
const LinkFormFields = ({ basePath }: LinkFormFieldsProps) => {
  const form = useFormContext<CreateLinkInput>()

  return (
    <>
      <Input
        label="Name"
        {...form.register(
          (basePath
            ? `${basePath}.link.name`
            : 'link.name') as 'link.name'
        )}
        placeholder="Name"
      />
      <Input
        label="URL"
        {...form.register(
          (basePath
            ? `${basePath}.link.url`
            : 'link.url') as 'link.url'
        )}
        placeholder="https://..."
      />
    </>
  )
}

export default LinkFormFields
