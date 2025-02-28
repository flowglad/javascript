import {
  createSelectById,
  createInsertFunction,
  createUpdateFunction,
  createSelectFunction,
  ORMMethodCreatorConfig,
} from '@/db/tableUtils'
import {
  formSubmissions,
  formSubmissionsInsertSchema,
  formSubmissionsSelectSchema,
  formSubmissionsUpdateSchema,
} from '@/db/schema/formSubmissions'

const config: ORMMethodCreatorConfig<
  typeof formSubmissions,
  typeof formSubmissionsSelectSchema,
  typeof formSubmissionsInsertSchema,
  typeof formSubmissionsUpdateSchema
> = {
  selectSchema: formSubmissionsSelectSchema,
  insertSchema: formSubmissionsInsertSchema,
  updateSchema: formSubmissionsUpdateSchema,
}

export const selectFormSubmissionById = createSelectById(
  formSubmissions,
  config
)

export const insertFormSubmission = createInsertFunction(
  formSubmissions,
  config
)

export const updateFormSubmission = createUpdateFunction(
  formSubmissions,
  config
)

export const selectFormSubmissions = createSelectFunction(
  formSubmissions,
  config
)
