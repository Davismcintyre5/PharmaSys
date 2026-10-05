import { useEffect, useState } from 'react';
import { LineChart, RefreshCw, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { aiApi } from '@/api/ai';
import { useToast } from '@/hooks/useToast';
import { formatRelativeTime } from '@/utils/format';
import type { AiInsight } from '@/types';

export default function AiForecast() {
  const toast = useToast();
  const [forecast, setForecast] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(refresh = false) {
    const res = await aiApi.forecast(refresh).catch((e) => {
      toast.error(e?.message || 'Could not load forecast');
      return null;
    });
    setForecast(res);
    return res;
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function regenerate() {
    setRefreshing(true);
    try {
      await load(true);
      toast.success('Forecast regenerated');
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const text = forecast?.payload?.text;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Stock forecast"
        subtitle="Which drugs are likely to run out soon"
        actions={
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={14} />}
            loading={refreshing}
            onClick={regenerate}
          >
            Regenerate
          </Button>
        }
      />

      {!text ? (
        <Card>
          <EmptyState
            icon={<LineChart size={22} />}
            title="No forecast yet"
            description="Generate a stock forecast to see which drugs are running low."
            action={
              <Button leftIcon={<TrendingDown size={14} />} loading={refreshing} onClick={regenerate}>
                Generate forecast
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LineChart size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">7-day forecast</p>
              {forecast?.generatedAt && (
                <p className="text-[10px] text-text-subtle">
                  Generated {formatRelativeTime(forecast.generatedAt)}
                </p>
              )}
            </div>
            {forecast?.model && (
              <span className="text-[10px] text-text-subtle">{forecast.model}</span>
            )}
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-text">
            {text}
          </div>
        </Card>
      )}
    </div>
  );
}