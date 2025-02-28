import { logger, task, wait } from '@trigger.dev/sdk/v3'

export const helloWorldTask = task({
  id: 'hello-world',
  run: async (payload: any, { ctx }) => {
    logger.log('Hello, world!', { payload, ctx })

    return {
      message: 'Hello, world!',
    }
  },
})
