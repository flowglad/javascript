import {
  createSelectById,
  createInsertFunction,
  createUpdateFunction,
  ORMMethodCreatorConfig,
  createBulkInsertFunction,
  whereClauseFromObject,
} from '@/db/tableUtils'
import {
  formFields,
  formFieldsInsertSchema,
  formFieldsSelectSchema,
  formFieldsUpdateSchema,
} from '@/db/schema/formFields'
import { DbTransaction } from '@/db/types'
import { eq } from 'drizzle-orm'
import { Form, formsSelectSchema, forms } from '@/db/schema/forms'

const config: ORMMethodCreatorConfig<
  typeof formFields,
  typeof formFieldsSelectSchema,
  typeof formFieldsInsertSchema,
  typeof formFieldsUpdateSchema
> = {
  selectSchema: formFieldsSelectSchema,
  insertSchema: formFieldsInsertSchema,
  updateSchema: formFieldsUpdateSchema,
}

export const selectFormFieldById = createSelectById(
  formFields,
  config
)

export const insertFormField = createInsertFunction(
  formFields,
  config
)

export const updateFormField = createUpdateFunction(
  formFields,
  config
)

export const bulkInsertFormFields = createBulkInsertFunction(
  formFields,
  config
)

export const selectFormFieldAndFormByFormWhere = async (
  whereCondition: Partial<Form.Record>,
  transaction: DbTransaction
) => {
  const result = await transaction
    .select({
      formField: formFields,
      form: forms,
    })
    .from(formFields)
    .innerJoin(forms, eq(formFields.FormId, forms.id))
    .where(whereClauseFromObject(forms, whereCondition))

  const resultForm = formsSelectSchema.parse(result[0].form)
  const resultFormFields = result.map((item) =>
    formFieldsSelectSchema.parse(item.formField)
  )
  return { form: resultForm, formFields: resultFormFields }
}
