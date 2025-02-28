import { Product } from '@/db/schema/products'
import { Variant } from '@/db/schema/variants'
import { Discount } from '@/db/schema/discounts'
import { File } from '@/db/schema/files'
import { ProperNoun } from '@/db/schema/properNouns'
import { CustomerProfile } from '@/db/schema/customerProfiles'
import {
  Nouns,
  SupabaseInsertPayload,
  SupabaseUpdatePayload,
} from '@/types'

interface CreateProperNounUpsertParams<T> {
  record: T
  OrganizationId: string
}

export const databaseTablesForNoun: Record<Nouns, string> = {
  [Nouns.Product]: 'Products',
  [Nouns.Variant]: 'Variants',
  [Nouns.CustomerProfile]: 'CustomerProfiles',
  [Nouns.Discount]: 'Discounts',
  [Nouns.File]: 'Files',
}

export const productRecordToProperNounUpsert = (
  params: CreateProperNounUpsertParams<Product.Record>
): ProperNoun.Insert => {
  return {
    EntityId: params.record.id,
    entityType: Nouns.Product,
    name: params.record.name,
    OrganizationId: params.OrganizationId,
    livemode: params.record.livemode,
  }
}

export const variantRecordToProperNounUpsert = (
  params: CreateProperNounUpsertParams<Variant.Record>
): ProperNoun.Insert => {
  return {
    EntityId: params.record.id,
    entityType: Nouns.Variant,
    name: params.record.name ?? '',
    OrganizationId: params.OrganizationId,
    livemode: params.record.livemode,
  }
}

export const discountRecordToProperNounUpsert = (
  params: CreateProperNounUpsertParams<Discount.Record>
): ProperNoun.Insert => {
  return {
    EntityId: params.record.id,
    entityType: Nouns.Discount,
    name: params.record.name,
    OrganizationId: params.OrganizationId,
    livemode: params.record.livemode,
  }
}

export const fileRecordToProperNounUpsert = (
  params: CreateProperNounUpsertParams<File.Record>
): ProperNoun.Insert => {
  return {
    EntityId: params.record.id,
    entityType: Nouns.File,
    name: params.record.name,
    OrganizationId: params.OrganizationId,
    livemode: params.record.livemode,
  }
}

export const customerProfileToProperNounUpsert = (
  params: CreateProperNounUpsertParams<CustomerProfile.Record>
): ProperNoun.Insert => {
  return {
    EntityId: params.record.id,
    entityType: Nouns.CustomerProfile,
    name: params.record.name ?? params.record.email,
    OrganizationId: params.OrganizationId,
    livemode: params.record.livemode,
  }
}

export const supabasePayloadToProperNounUpsert = async (
  payload: SupabaseInsertPayload | SupabaseUpdatePayload,
  OrganizationId: string
): Promise<ProperNoun.Insert> => {
  let properNounUpsert: ProperNoun.Insert | null = null

  switch (payload.table) {
    case 'CustomerProfiles':
      properNounUpsert = customerProfileToProperNounUpsert({
        record: payload.record as CustomerProfile.Record,
        OrganizationId: (payload.record as CustomerProfile.Record)
          .OrganizationId,
      })
      break
    case 'Products':
      properNounUpsert = productRecordToProperNounUpsert({
        record: payload.record as Product.Record,
        OrganizationId: (payload.record as Product.Record)
          .OrganizationId,
      })
      break
    case 'Variants':
      properNounUpsert = variantRecordToProperNounUpsert({
        record: payload.record as Variant.Record,
        OrganizationId,
      })
      break
    default:
      throw new Error('Invalid table')
  }

  if (!properNounUpsert) {
    throw new Error('Invalid table')
  }

  return properNounUpsert
}
