import Input from '@/app/components/ion/Input'
import Label from '@/app/components/ion/Label'
import Textarea from '@/app/components/ion/Textarea'
import FileInput from '@/app/components/FileInput'
import VariantFormFields from '@/app/components/forms/VariantFormFields'
import { Controller, useFormContext } from 'react-hook-form'
import { CreateProductSchema } from '@/db/schema/variants'
import Switch from '../ion/Switch'
import Select from '../ion/Select'
import StatusBadge from '../StatusBadge'
import { ProductType } from '@/types'
import { Accordion } from '../ion/Accordion'
import AIHoverModal from './AIHoverModal'

export const ProductFormFields = ({
  editProduct = false,
}: {
  editProduct?: boolean
}) => {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<CreateProductSchema>()
  const product = watch('product')
  return (
    <div className="relative flex justify-between items-center gap-2.5 bg-background">
      <div className="flex-1 w-full max-w-[656px] min-w-[460px] relative flex flex-col rounded-radius-md">
        <div className="w-full relative flex items-start">
          <Accordion
            type="multiple"
            defaultValue={[
              'general',
              'pricing',
              'thumbnail',
              'offerings',
            ]}
            items={[
              {
                value: 'general',
                header: <div>General</div>,
                content: (
                  <div className="flex-1 w-full relative flex flex-col justify-center gap-6">
                    <Input
                      placeholder="Product"
                      label="Name"
                      {...register('product.name')}
                      className="w-full"
                      error={errors.product?.name?.message}
                    />
                    <Textarea
                      placeholder="Product description"
                      label="Description"
                      className="w-full"
                      {...register('product.description')}
                      error={errors.product?.description?.message}
                      rightLabelElement={
                        <AIHoverModal
                          productName={product.name}
                          triggerLabel="Generate"
                          onGenerateComplete={(result) => {
                            setValue('product.description', result)
                          }}
                        />
                      }
                      hint="Details about your product that will be displayed on the purchase page."
                    />
                    <Controller
                      name="product.type"
                      render={({ field }) => (
                        <Select
                          label="Product Type"
                          value={`${field.value}`}
                          onValueChange={(value) => {
                            if (value === `${ProductType.Service}`) {
                              field.onChange(ProductType.Service)
                            } else if (
                              value === `${ProductType.Digital}`
                            ) {
                              field.onChange(ProductType.Digital)
                            }
                          }}
                          options={[
                            {
                              label:
                                'Digital (Software, files, communities)',
                              value: `${ProductType.Digital}`,
                            },
                            {
                              label: 'Service (Consulting, coaching)',
                              value: `${ProductType.Service}`,
                            },
                          ]}
                          disabled={editProduct}
                          hint="Used for tax calculation. Cannot be edited after creation."
                        />
                      )}
                    />
                    {editProduct && (
                      <div className="w-full relative flex flex-col gap-3">
                        <Label>Status</Label>
                        <Controller
                          name="product.active"
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              label={
                                <div className="cursor-pointer w-full">
                                  {field.value ? (
                                    <StatusBadge active={true} />
                                  ) : (
                                    <StatusBadge active={false} />
                                  )}
                                </div>
                              }
                            />
                          )}
                        />
                      </div>
                    )}
                  </div>
                ),
              },
              {
                value: 'pricing',
                header: <div>Pricing</div>,
                content: <VariantFormFields edit={editProduct} />,
              },
              {
                value: 'thumbnail',
                header: <div>Thumbnail</div>,
                content: (
                  <FileInput
                    directory="products"
                    onUploadComplete={({ publicURL }) => {
                      setValue('product.imageURL', publicURL)
                    }}
                    onUploadDeleted={() => {
                      setValue('product.imageURL', '')
                    }}
                    fileTypes={[
                      'png',
                      'jpeg',
                      'jpg',
                      'gif',
                      'webp',
                      'svg',
                      'avif',
                    ]}
                    singleOnly
                    initialURL={product.imageURL}
                    hint={`The image used on the purchase page. 760 : 420 aspect ratio.`}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
