import { makeAgentSchema } from '@/db/agentUtils'
import { generateObject, CoreMessage } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { PgTableWithId } from '@/types'
import { InferSelectModel } from 'drizzle-orm'

export const createGenerateCreateInput = <
  Schema extends z.ZodTypeAny
>(
  schema: Schema,
  systemPrompt: string
) => {
  return async (
    messages: CoreMessage[]
  ): Promise<z.infer<Schema>> => {
    const { object: result } = await generateObject({
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      schema: makeAgentSchema(schema),
      system: systemPrompt,
      messages,
    })
    return result as z.infer<Schema>
  }
}

export const createGenerateEditInput = <
  T extends InferSelectModel<PgTableWithId>,
  Schema extends z.ZodTypeAny
>(
  schema: Schema,
  systemPrompt: string
) => {
  return async (
    messages: CoreMessage[],
    existingRecord: T
  ): Promise<z.infer<Schema>> => {
    const { object: result } = await generateObject({
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      schema: makeAgentSchema(schema),
      system: `You are creating the inputs to update existing record.
${systemPrompt}

The existing record is:
${JSON.stringify(existingRecord)}

The user has described the changes they want to make to the record.
For any fields that are unchanged, you should leave them unaltered.
Return an object where any fields that the user has not requested to change are the same value as the existing records.

For example:

Existing record: { id: "foo_12l3k4j", name: "Old Name", active: true, price: 100 }
User request: "Please change the name to 'New Name'"

The output should be:
{
    unicornRider: {
        id: "foo_12l3k4j",
        name: 'New Name', // make this match the user's request
        active: true,
        price: 100
    }
}
`,
      messages,
    })
    return result as z.infer<Schema>
  }
}
