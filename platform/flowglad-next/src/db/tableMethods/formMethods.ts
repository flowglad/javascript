import {
  createSelectById,
  createInsertFunction,
  createUpdateFunction,
  ORMMethodCreatorConfig,
  createSelectFunction,
} from '@/db/tableUtils'
import {
  forms,
  formsInsertSchema,
  formsSelectSchema,
  formsUpdateSchema,
} from '@/db/schema/forms'

const config: ORMMethodCreatorConfig<
  typeof forms,
  typeof formsSelectSchema,
  typeof formsInsertSchema,
  typeof formsUpdateSchema
> = {
  selectSchema: formsSelectSchema,
  insertSchema: formsInsertSchema,
  updateSchema: formsUpdateSchema,
}

export const selectFormById = createSelectById(forms, config)

export const insertForm = createInsertFunction(forms, config)

export const updateForm = createUpdateFunction(forms, config)

export const selectForms = createSelectFunction(forms, config)
