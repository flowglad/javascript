import { z } from 'zod'
import * as R from 'ramda'

const reorderDiscriminatedUnionSchema = <
  DiscriminatorT extends string,
  SchemaT extends z.ZodDiscriminatedUnion<DiscriminatorT, any>
>(
  schema: SchemaT
) => {
  const options = schema._def.options
  const discriminator: DiscriminatorT = schema._def.discriminator

  const newOptions: [
    z.ZodDiscriminatedUnionOption<DiscriminatorT>,
    ...z.ZodDiscriminatedUnionOption<DiscriminatorT>[]
  ] = options.map(
    (option: z.ZodDiscriminatedUnionOption<DiscriminatorT>) => {
      const shape = option.shape
      const shapeWithoutDiscriminator = R.omit([discriminator], shape)
      // @ts-expect-error limits of typescript inference
      const newSchema = z.object({
        [discriminator]: option.shape[discriminator],
        ...shapeWithoutDiscriminator,
      }) as z.ZodDiscriminatedUnionOption<DiscriminatorT>
      return newSchema
    }
  )
  return z.discriminatedUnion(discriminator, newOptions)
}

const convertDiscriminatedUnionSchema = <
  DiscriminatorT extends string,
  SchemaT extends z.ZodDiscriminatedUnion<DiscriminatorT, any>
>(
  schema: SchemaT
) => {
  const reorderedSchema = reorderDiscriminatedUnionSchema(
    schema as unknown as z.ZodDiscriminatedUnion<any, any>
  )

  // @ts-expect-error - recursive call breaks typescript inference
  const options: [
    z.ZodDiscriminatedUnionOption<DiscriminatorT>,
    ...z.ZodDiscriminatedUnionOption<DiscriminatorT>[]
  ] = reorderedSchema._def.options.map((option) =>
    makeAgentSchema(option)
  )
  return z.discriminatedUnion(schema._def.discriminator, options)
}

// @ts-expect-error - recursive call breaks typescript inference
export const makeAgentSchema = <T extends z.ZodTypeAny>(
  schema: T
) => {
  // Handle discriminated unions first
  if (
    schema._def.typeName === 'ZodDiscriminatedUnion' ||
    schema instanceof z.ZodDiscriminatedUnion
  ) {
    return convertDiscriminatedUnionSchema(
      schema as unknown as z.ZodDiscriminatedUnion<any, any>
    )
  }

  if (schema instanceof z.ZodArray) {
    return makeAgentSchema(schema._def.type).array()
  }
  let shape = {}
  if (schema instanceof z.ZodObject) {
    shape = schema.shape
  } else {
    throw new Error(
      `makeAgentSchema: Unsupported schema type: ${schema._def.typeName}`
    )
  }
  const newShape = Object.entries<T>(shape).reduce(
    (acc, [key, value]) => {
      let newValue: z.ZodTypeAny
      let isNullable = false
      // Unwrap any nullable/optional types first
      let unwrappedValue = value
      while (
        unwrappedValue instanceof z.ZodOptional ||
        unwrappedValue instanceof z.ZodNullable
      ) {
        isNullable = true
        unwrappedValue = unwrappedValue.unwrap()
      }
      /**
       * If the value is an array, get the underlying type,
       * agent-schemafy it, and then make it an array
       */
      if (unwrappedValue instanceof z.ZodArray) {
        newValue = makeAgentSchema(unwrappedValue._def.type).array()
      } else if (
        unwrappedValue?._def?.typeName === 'ZodDiscriminatedUnion' ||
        unwrappedValue instanceof z.ZodDiscriminatedUnion
      ) {
        newValue = convertDiscriminatedUnionSchema(
          value as unknown as z.ZodDiscriminatedUnion<any, any>
        )
      } else if (unwrappedValue instanceof z.ZodObject) {
        newValue = makeAgentSchema(unwrappedValue)
      } else if (unwrappedValue instanceof z.ZodDate) {
        newValue = z
          .string()
          .describe('a string timestamp in ISO format')
      } else if (
        unwrappedValue.description === 'safeZodPositiveInteger'
      ) {
        newValue = z.number().int()
      } else if (
        unwrappedValue.description === 'safeZodPositiveIntegerOrZero'
      ) {
        newValue = z.number().int().or(z.literal(0))
      } else if (unwrappedValue.description === 'safeZodDate') {
        newValue = z.string()
      } else if (
        unwrappedValue.description === 'safeZodNullOrUndefined'
      ) {
        newValue = z.null()
      } else if (
        unwrappedValue.description === 'safeZodPositiveIntegerSchema'
      ) {
        newValue = z.number().int()
      } else if (unwrappedValue.description === 'safeZodAlwaysNull') {
        newValue = z.null()
      } else if (unwrappedValue instanceof z.ZodBoolean) {
        newValue = z.boolean()
      } else if (unwrappedValue instanceof z.ZodString) {
        /**
         * Neutralizes formatting from the client schema, like for "url"
         */
        newValue = z.string()
      } else {
        newValue = unwrappedValue
        if (key === 'ProductId') {
          newValue = z.string()
        }
        if (key === 'isDefault') {
          newValue = z.boolean()
        }
      }

      // Add nullable back if it was nullable before
      if (isNullable) {
        newValue = newValue.nullable()
      }

      acc[key] = newValue
      return acc
    },
    {} as z.ZodRawShape
  )

  return z.object(newShape)
}

/**
 * Converts a client select schema to a classifier selection criteria schema
 * @param schema
 * @returns
 */
export const classifierSelectionCriteriaFromClientSelectSchema = <
  T extends z.ZodTypeAny
>(
  schema: T
) => {
  const agentSchema = makeAgentSchema(schema)
  if (agentSchema._def.typeName === 'ZodDiscriminatedUnion') {
    const options = schema._def.options.map((option: z.ZodTypeAny) =>
      makeAgentSchema(option)
    )
    return z.discriminatedUnion(schema._def.discriminator, options)
  }
  if (agentSchema instanceof z.ZodObject) {
    return agentSchema.partial()
  } else {
    throw new Error('Unsupported schema type')
  }
}
