import { IdNumberParam, Nullish } from '@/types'
import core from './core'
import { z } from 'zod'

export type CalWebhookTriggerEvent =
  | 'BOOKING_CREATED'
  | 'BOOKING_RESHEDULED'
  | 'BOOKING_CANCELLED'
  | 'MEETING_ENDED'

export interface Attendee {
  email: string
  name: string
  timeZone: string
}

export interface CalWebhookBody {
  triggerEvent: CalWebhookTriggerEvent
  createdAt: string
  payload: CalWebhookPayload
}

export interface CalWebhookPayload {
  type: string
  title: string
  description?: Nullish<string>
  additionalNotes?: Nullish<string>
  customInputs?: Nullish<Record<string, unknown>>
  startTime: string
  endTime: string
  organizer: Attendee
  responses?: {
    name: {
      label: string
      value: string
    }
    email: {
      label: string
      value: string
    }
    location: {
      label: string
      value: {
        optionValue: string
        value: string
      }
    }
    notes: {
      label: string
    }
    guests: {
      label: string
    }
    rescheduleReason: {
      label: string
    }
  }
  userFieldsResponses: Record<string, unknown>
  attendees: Attendee[]
  eventTypeId: number
  eventTitle: string
  eventDescription?: Nullish<string>
  bookingId: number
  status: string
  metadata?: {
    videoCallUrl?: string
    id?: string
  }
}

export interface CalEventType extends IdNumberParam {
  slug: string
  title: string
  id: number
  /**
   * We persist this on the event so that we can use it to reconcile
   * a kickoff call with the purchase it's associated with at the time
   * the MEETING_ENDED webhook comes in.
   */
  metadata: {
    purchaseId?: number
  }
}

const calAPIURL = (endpoint: string, apiKey: string) =>
  `https://api.cal.com/v1/${endpoint}?apiKey=${apiKey}`

const adminCalAPIURL = (endpoint: string) =>
  calAPIURL(
    endpoint,
    core.envVariable('AGREE_CUSTOMER_SUCCESS_CAL_API_KEY')
    /**
     * uncomment this when Hannah gets back into office
     */
    // core.envVariable('SUCCESS_LEAD_CAL_API_KEY')
  )

const deleteCalEvent = (id: number) => {
  return core.fetch(adminCalAPIURL(`event-types/${id}`), {
    method: 'DELETE',
  })
}

const safeSchedulingUsername = (maybeUsername: string) => {
  return maybeUsername.replace(/.*cal.com\//g, '')
}

const calAttendeeZodSchema = z.object({
  email: z.string(),
  name: z.string(),
  timeZone: z.string(),
})

const labelValueZodSchema = z.object({
  label: z.string(),
  value: z.string(),
})

const optionalLabelValueZodSchema = labelValueZodSchema.optional()

const calPayloadResponsesZodSchema = z
  .object({
    name: labelValueZodSchema,
    email: labelValueZodSchema,
    location: z.object({
      label: z.string(),
      value: z.object({
        optionValue: z.string(),
        value: z.string(),
      }),
    }),
    notes: z.object({
      label: z.string(),
    }),
    guests: z.object({
      label: z.string(),
    }),
    ['How did we meet?']: optionalLabelValueZodSchema,
    ['how-did-we-meet']: optionalLabelValueZodSchema,
    ['How-did-we-meet-']: optionalLabelValueZodSchema,
    rescheduleReason: z.object({
      label: z.string(),
    }),
  })
  .optional()

const calPayloadZodSchema: z.ZodObject<
  Record<string, z.ZodTypeAny>,
  'strip',
  z.ZodTypeAny,
  CalWebhookPayload,
  CalWebhookPayload
> = z.object({
  type: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  additionalNotes: z.string().nullable(),
  customInputs: z.object({}).nullable(),
  startTime: z.string(),
  endTime: z.string(),
  organizer: calAttendeeZodSchema,
  responses: calPayloadResponsesZodSchema,
  userFieldsResponses: z.object({}),
  attendees: z.array(calAttendeeZodSchema),
  eventTypeId: z.number(),
  eventTitle: z.string(),
  eventDescription: z.string().optional().nullish(),
  bookingId: z.number(),
  status: z.string(),
  metadata: z
    .object({
      videoCallUrl: z.string().optional(),
      airtableRecordId: z.string().optional(),
    })
    .optional(),
})

const calPayloadParser = z.object({
  triggerEvent: z.string(),
  createdAt: z.string(),
  payload: calPayloadZodSchema,
})

/**
 * Used to determine whether a given event type is a dev event,
 * as we don't have a "Dev" environment in cal, and will therefore be sending
 * booking webhook events to our prod environment,
 * regardless of whether they're meant for prod
 */
const isDevEventType = (title: string) => title.includes('__DEV__')

const calMethods = {
  safeSchedulingUsername,
  deleteCalEvent,
  isDevEventType,
  calAPIURL,
  calPayloadZodSchema,
  calPayloadParser,
}

export default calMethods
