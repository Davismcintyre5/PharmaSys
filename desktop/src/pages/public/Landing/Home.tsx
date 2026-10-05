import { Hero } from '@/components/public/Hero';
import { Features } from '@/components/public/Features';
import { HowItWorks } from '@/components/public/HowItWorks';
import { StatsBand } from '@/components/public/StatsBand';
import { Testimonials } from '@/components/public/Testimonials';
import { CTA } from '@/components/public/CTA';

export default function Home() {
  return (
    <>
      <Hero />
      <Features limit={6} />
      <HowItWorks />
      <StatsBand />
      <Testimonials />
      <CTA />
    </>
  );
}