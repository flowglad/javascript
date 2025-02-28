import { kebabCase } from 'change-case'

// Define route patterns with parameter mapping
export type RouteConfig = {
  procedure: string
  pattern: RegExp
  // Function to extract params from URL and build tRPC input
  mapParams: (matches: string[], body?: any) => any
}

export const trpcToRest = (
  procedureName: string,
  params?: {
    routeParams?: string[]
  }
): Record<string, RouteConfig> => {
  // Split procedure name into entity and action
  const [rawEntity, action] = procedureName.split('.')
  const entity = kebabCase(rawEntity)
  if (!entity || !action) {
    throw new Error(
      `Invalid procedure name: ${procedureName}. Expected format: entity.action`
    )
  }

  // Special cases for utility endpoints
  if (entity === 'utils') {
    return {
      [`GET /${entity}/${action}`]: {
        procedure: procedureName,
        pattern: new RegExp(`^${entity}\/${action}$`),
        mapParams: () => undefined,
      },
    }
  }

  // Handle common CRUD operations
  switch (action) {
    case 'list':
      const listIdKey = params?.routeParams?.[0] ?? 'id'
      return {
        [`GET /${entity}/:${listIdKey}`]: {
          procedure: procedureName,
          pattern: new RegExp(`^${entity}$`),
          mapParams: () => undefined,
        },
      }

    case 'create':
      return {
        [`POST /${entity}`]: {
          procedure: procedureName,
          pattern: new RegExp(`^${entity}$`),
          mapParams: (_, body) => body,
        },
      }

    case 'update':
      const updateIdKey = params?.routeParams?.[0] ?? 'id'
      return {
        [`PUT /${entity}/:${updateIdKey}`]: {
          procedure: procedureName,
          pattern: new RegExp(`^${entity}\/([^\\/]+)$`),
          mapParams: (matches, body) => ({
            [updateIdKey]: matches[1],
            ...body,
          }),
        },
      }

    case 'delete':
      const deleteIdKey = params?.routeParams?.[0] ?? 'id'
      return {
        [`DELETE /${entity}/:${deleteIdKey}`]: {
          procedure: procedureName,
          pattern: new RegExp(`^${entity}\/([^\\/]+)$`),
          mapParams: (matches) => ({
            [deleteIdKey]: matches[1],
          }),
        },
      }

    case 'get':
      const getIdKey = params?.routeParams?.[0] ?? 'id'
      return {
        [`GET /${entity}/:${getIdKey}`]: {
          procedure: procedureName,
          pattern: new RegExp(`^${entity}\/([^\\/]+)$`),
          mapParams: (matches) => ({
            [getIdKey]: matches[0],
          }),
        },
      }

    // Handle special cases for nested resources or custom actions
    default:
      // Check if it's a nested resource getter (like getRevenue)
      if (action.startsWith('get')) {
        const resource = action.slice(3).toLowerCase()
        return {
          [`GET /${entity}/:id/${resource}`]: {
            procedure: procedureName,
            pattern: new RegExp(
              `^${entity}\/([^\\/]+)\/${resource}$`
            ),
            mapParams: (matches) => ({
              [`${entity}Id`]: matches[1],
            }),
          },
        }
      }

      // For other custom actions, create a POST endpoint
      return {
        [`POST /${entity}/:id/${action}`]: {
          procedure: procedureName,
          pattern: new RegExp(`^${entity}\/([^\\/]+)\/${action}$`),
          mapParams: (matches, body) => ({
            id: matches[1],
            ...body,
          }),
        },
      }
  }
}
