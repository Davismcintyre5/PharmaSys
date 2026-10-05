import { Features } from '@/components/public/Features';
import { HowItWorks } from '@/components/public/HowItWorks';
import { StatsBand } from '@/components/public/StatsBand';
import { CTA } from '@/components/public/CTA';

export default function FeaturesPage() {
  return (
    <>
      <Features />
      <HowItWorks />
      <StatsBand />
      <CTA />
    </>
  );
}