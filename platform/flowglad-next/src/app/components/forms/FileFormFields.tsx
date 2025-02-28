'use client'

import { useFormContext } from 'react-hook-form'
import { CreateFileInput } from '@/db/schema/files'
import Input from '@/app/components/ion/Input'
import FileInput from '../FileInput'

export const FileFormFields = ({
  basePath,
}: {
  basePath?: string
}) => {
  const { register, setValue } = useFormContext<CreateFileInput>()
  const namePath = `${basePath}.file.name` as 'file.name'
  const objectKeyPath =
    `${basePath}.file.objectKey` as 'file.objectKey'
  return (
    <>
      <Input
        {...register(namePath)}
        placeholder="File name"
        label="Name"
      />
      <FileInput
        onUploadComplete={({ objectKey }) => {
          setValue(objectKeyPath, objectKey)
        }}
        onUploadDeleted={({ objectKey }) => {
          setValue(objectKeyPath, '')
        }}
        directory="files"
        id={`${basePath}-file-input`}
        singleOnly
      />
    </>
  )
}
