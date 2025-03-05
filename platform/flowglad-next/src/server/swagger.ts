import { generateOpenApiDocument } from 'trpc-swagger'
import { appRouter } from './index'

export const createFlowgladOpenApiDocument = () =>
  generateOpenApiDocument(appRouter, {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
      },
    },
    title: 'Flowglad API',
    version: '0.0.1', // consider making this pull version from package.json
    baseUrl: 'https://app.flowglad.com',
    docsUrl: 'https://docs.flowglad.com',
  })
