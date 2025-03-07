'use client'
import { useForm, Controller } from 'react-hook-form'
import Select from '@/components/ion/Select'
import Button from '@/components/ion/Button'
import Input from '@/components/ion/Input'
import ErrorLabel from '@/components/ErrorLabel'
import Textarea from '@/components/ion/Textarea'
import { Organization } from '@/db/schema/organizations'
import { trpc } from '@/app/_trpc/client'

interface ServicePurchaseIntakeFormFields {
  dashboardTypes: string
  dashboardDesignAssets: string
  industry: string
}

const ServicePurchaseIntakeForm = ({
  organization,
}: {
  organization: Organization.ClientRecord
}) => {
  const createFormSubmission =
    trpc.forms.createSubmission.useMutation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitted },
    control,
  } = useForm<ServicePurchaseIntakeFormFields>({
    defaultValues: {
      dashboardTypes: 'revenue',
    },
  })

  const onSubmit = handleSubmit(
    async (data: ServicePurchaseIntakeFormFields) => {
      try {
        await createFormSubmission.mutateAsync(data)
        // Handle success - redirect to Discord
        window.location.href = 'https://discord.gg/CJZGRHd8W9'
      } catch (error) {
        // Handle error appropriately
        console.error(error)
      }
    }
  )

  return (
    <div className="bg-internal h-full w-full flex justify-between items-center">
      <div className="flex-1 h-full w-full flex flex-col justify-center items-center gap-9 p-20">
        <div className="w-full flex flex-col items-center gap-4">
          <form
            onSubmit={onSubmit}
            className="w-[380px] flex flex-col gap-6"
          >
            <div className="w-full flex flex-col gap-4">
              <Input
                placeholder="B2B SaaS"
                required
                label="What industry is your business in?"
                {...register('industry')}
                className="w-full"
              />
            </div>
            <div className="w-full flex flex-col gap-4">
              <Controller
                control={control}
                name="dashboardTypes"
                render={({ field }) => (
                  <Select
                    label="What dashboards do you primarily work with?"
                    defaultValue={field.value}
                    options={[
                      { value: 'revenue', label: 'Revenue' },
                      {
                        value: 'product_analytics',
                        label: 'Product Analytics',
                      },
                      { value: 'sales', label: 'Sales' },
                      { value: 'marketing', label: 'Marketing' },
                    ]}
                    {...field}
                    className="w-full"
                    required
                  />
                )}
              />
            </div>
            <div className="w-full flex flex-col gap-4">
              <Textarea
                placeholder="Design systems, component libraries, data visualization guidelines, etc."
                label="Describe your existing dashboard design assets"
                {...register('dashboardDesignAssets')}
                className="w-full"
                required
              />
            </div>
            <ErrorLabel error={errors.root} />
            <Button
              variant="filled"
              color="primary"
              size="md"
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              Submit
            </Button>
            <div className="text-sm font-medium text-on-disabled text-center">
              {`Next, you will be redirected to your ${organization.name} channel`}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ServicePurchaseIntakeForm
