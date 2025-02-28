# Subscription Billing

This is where most of the code for subscription billing lives.

## How it Works

Subscriptions - Subscription Items - Billing Periods - Billing Period Items - Billing Runs - Payments

## Billing Periods

Creating a subscription immediately creates a billing period.

There is only one current billing period at a time. There are never future billing periods. Transitions between billing periods are handled by the `attemptToTransitionSubscriptionBillingPeriod` function.

These transitions are atomic, and the time between billing periods is 0 seconds.

100% of the duration of a subscription, including its trial period, is represented by associated billing periods. Trial periods have their own billing periods. During these periods, a charge attempt is not made during billing runs.

## State Changes

State changes need to be robust. Each of subscriptions, billing periods, and billing runs have a set of statuses that are terminal. If one of these items reaches a terminal status, it cannot have its status changed.

This is enforced using at the application layer, because:

1. RLS would require us to RLS restrict admin transactions, which we haven't gotten around to yet
2. RLS doesn't have an easy way of comparing previous and new records in your UPDATE RLS policies

## Adjustments

Over the course of their lifetime, subscriptions may have adjustments. The best we can, we try to handle these declaratively. Adjustments are described by a new set of subscriptionItem upserts.

Any existing subscription items not found in the provided set are deleted.

Adjustments happen either immediately or at the end of the current billing period. We don't yet have a way to model changes to subscription state.

For immediate adjustments, you can optionally decide to prorate changes. This will create a new set of billing period items. Remember that previous billing period items will be preserved.

## Billing Runs

The following events always will trigger a billing run creation:

1. Whenever we create a billing period, we currently immediately schedule a billing run for it. We do not yet have a way to create billing periods where payment is collected at the end of the period.

2. Whenever we adjust a subscription with proration, we schedule a billing run.

If the billing run fails, we schedule a retry with a backoff policy. If a billing run fails and there is a balance due for the associated billing period, we mark the associated billing period as `past_due`.

Billing runs have multiple steps:

1. Calculate the total amount due for the billing period
2. Create an invoice for the billing period
3. Initiate a payment intent that automatically confirms an off-session charge
   ... (Stripe processes the payment request)
4. Process the payment intent status change: (see @/src/trigger/stripe)
   - If it succeeds, mark the billing run as succeeded
   - If it fails, mark the billing run as failed
   - Send the notifications to the customer and merchant

## Trial Periods

Trial periods are specified at the time of subscription creation. They have specific billing periods where `trialPeriod: true`.

We don't yet have a way to create a no-payment method trial period. We're working on that.
