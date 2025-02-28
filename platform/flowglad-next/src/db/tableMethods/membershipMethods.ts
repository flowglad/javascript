import * as R from 'ramda'
import {
  Membership,
  memberships,
  membershipsInsertSchema,
  membershipsSelectSchema,
  membershipsUpdateSchema,
} from '@/db/schema/memberships'
import {
  createUpsertFunction,
  createSelectById,
  createSelectFunction,
  createInsertFunction,
  ORMMethodCreatorConfig,
  whereClauseFromObject,
  createUpdateFunction,
} from '@/db/tableUtils'
import { and, eq, sql } from 'drizzle-orm'
import {
  organizations,
  organizationsSelectSchema,
} from '../schema/organizations'
import { DbTransaction } from '@/types'
import { users, usersSelectSchema } from '../schema/users'

const config: ORMMethodCreatorConfig<
  typeof memberships,
  typeof membershipsSelectSchema,
  typeof membershipsInsertSchema,
  typeof membershipsUpdateSchema
> = {
  selectSchema: membershipsSelectSchema,
  insertSchema: membershipsInsertSchema,
  updateSchema: membershipsUpdateSchema,
}

export const selectMembershipById = createSelectById(
  memberships,
  config
)

export const upsertMembershipByUserIdAndOrganizationId =
  createUpsertFunction(
    memberships,
    [memberships.UserId, memberships.OrganizationId],
    config
  )

export const selectMemberships = createSelectFunction(
  memberships,
  config
)

export const insertMembership = createInsertFunction(
  memberships,
  config
)

export const selectMembershipAndOrganizations = async (
  selectConditions: Partial<Membership.Record>,
  transaction: DbTransaction
) => {
  let query = transaction
    .select({
      membership: memberships,
      organization: organizations,
    })
    .from(memberships)
    .innerJoin(
      organizations,
      eq(memberships.OrganizationId, organizations.id)
    )
    .$dynamic()
  if (!R.isEmpty(selectConditions)) {
    query = query.where(
      whereClauseFromObject(memberships, selectConditions)
    )
  }
  const result = await query
  return result.map(({ membership, organization }) => ({
    membership: membershipsSelectSchema.parse(membership),
    organization: organizationsSelectSchema.parse(organization),
  }))
}

export const selectMembershipsAndUsersByMembershipWhere = async (
  whereConditions: Partial<Membership.Record>,
  transaction: DbTransaction
) => {
  let query = transaction
    .select({
      membership: memberships,
      user: users,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.UserId, users.id))
    .$dynamic()
  if (!R.isEmpty(whereConditions)) {
    query = query.where(
      whereClauseFromObject(memberships, whereConditions)
    )
  }
  const result = await query
  return result.map(({ membership, user }) => ({
    membership: membershipsSelectSchema.parse(membership),
    user: usersSelectSchema.parse(user),
  }))
}

export const selectFocusedMembershipAndOrganization = async (
  UserId: string,
  transaction: DbTransaction
) => {
  const [focusedMembership] = await selectMembershipAndOrganizations(
    {
      UserId,
      focused: true,
    },
    transaction
  )
  return focusedMembership
}

export const updateMembership = createUpdateFunction(
  memberships,
  config
)
