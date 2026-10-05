import { Pricing } from '@/components/public/Pricing';
import { FAQ } from '@/components/public/FAQ';
import { CTA } from '@/components/public/CTA';

export default function PricingPage() {
  return (
    <>
      <Pricing showTable />
      <FAQ />
      <CTA />
    </>
  );
}