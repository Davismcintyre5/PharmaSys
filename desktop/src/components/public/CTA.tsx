import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CTA() {
  return (
    <section className="border-b border-border bg-primary py-16 text-primary-fg sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">
          Ready to modernise your pharmacy?
        </h2>
        <p className="mt-3 text-base opacity-90">
          Start your free trial today. No credit card required.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
              rightIcon={<ArrowRight size={16} />}
            >
              Create free account
            </Button>
          </Link>
          <Link to="/contact">
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Talk to sales
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}