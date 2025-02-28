import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod.mjs'
import { z } from 'zod'

export class GatherInputsAgent<T extends z.ZodObject<any>> {
  private schema: T
  private openai: OpenAI
  private inputs: z.infer<T>

  constructor(schema: T, context: Record<string, any> = {}) {
    this.schema = schema
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.inputs = {} as z.infer<T>
  }

  async gatherInputs(prompt: string): Promise<z.infer<T>> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that extracts structured data from user prompts.
          You must extract values that match the required schema.
          If a value is unclear or missing, leave it undefined.
          Preserve any existing input values that were already provided.`,
        },
        {
          role: 'user',
          content: `Schema:
          ${this.schema.toString()}
          
          Current inputs:
          ${JSON.stringify(this.inputs, null, 2)}
          
          User prompt: "${prompt}"
          
          Please extract any missing values from the prompt and merge with existing inputs.`,
        },
      ],
      response_format: zodResponseFormat(this.schema, 'inputs'),
    })

    const result = completion.choices[0].message
    // Merge new inputs with existing
    this.inputs = {
      ...this.inputs,
      ...result,
    }

    return this.inputs
  }
}
