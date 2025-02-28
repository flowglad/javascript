// vitest.setup.ts
import { stripeServer } from './mocks/stripeServer'
import { triggerServer } from './mocks/triggerServer'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { seedDatabase } from './seedDatabase'

// Start the mock server before all tests
beforeAll(async () => {
  stripeServer.listen()
  triggerServer.listen()
  await seedDatabase()
})

// Reset handlers after each test (optional, but recommended)
afterEach(() => stripeServer.resetHandlers())

// Stop the mock server after all tests
afterAll(async () => {
  stripeServer.close()
  triggerServer.close()
  //   await dropDatabase()
})
