'use client';

import LogoCloud from '@/components/ui/LogoCloud';
import { User } from '@supabase/supabase-js';
import { useBilling } from '@flowglad/next';
import { SubscriptionDemoCard } from '../SubscriptionCardDemo';

interface Props {
  user: User | null | undefined;
}

export default function Pricing({ user }: Props) {
  const billing = useBilling();
  if (!billing.loaded) {
    return (
      <section className="bg-black">
        <div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
          <div className="sm:flex sm:flex-col sm:align-center"></div>
        </div>
      </section>
    );
  } else if (billing.errors) {
    return (
      <section className="bg-black">
        <div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
          <div className="sm:flex sm:flex-col sm:align-center"></div>
        </div>
      </section>
    );
  }
  return (
    <section className="bg-black">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center"></div>
        <p className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
          {billing.loaded
            ? `Hello ${billing.customerProfile.email}!!!!`
            : 'No subscription pricing plans found. Create them in your'}
          <a
            className="text-pink-500 underline"
            href="https://dashboard.stripe.com/products"
            rel="noopener noreferrer"
            target="_blank"
          >
            Stripe Dashboard
          </a>
          .
        </p>
      </div>
      <SubscriptionDemoCard />
      <LogoCloud />
    </section>
  );
}
