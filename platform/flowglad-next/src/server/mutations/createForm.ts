import { protectedProcedure } from '@/server/trpc'
import { authenticatedTransaction } from '@/db/databaseMethods'
import { createFormInputSchema } from '@/db/schema/formFields'
import { insertForm } from '@/db/tableMethods/formMethods'
import { bulkInsertFormFields } from '@/db/tableMethods/formFieldMethods'

export const createForm = protectedProcedure
  .input(createFormInputSchema)
  .mutation(async ({ input }) => {
    return authenticatedTransaction(
      async ({ transaction, userId }) => {
        const { form, formFields } = input

        // Insert the form first to get its ID
        const createdForm = await insertForm(form, transaction)

        // Add the FormId to each form field
        const formFieldsWithFormId = formFields.map((field) => ({
          ...field,
          FormId: createdForm.id,
        }))

        // Insert all form fields
        const createdFormFields = await bulkInsertFormFields(
          formFieldsWithFormId,
          transaction
        )

        return {
          data: {
            form: createdForm,
            formFields: createdFormFields,
          },
        }
      }
    )
  })
