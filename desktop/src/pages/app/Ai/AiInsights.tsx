import { useEffect, useState } from 'react';
import { Bot, RefreshCw, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { aiApi } from '@/api/ai';
import { useToast } from '@/hooks/useToast';
import { formatRelativeTime } from '@/utils/format';
import type { AiInsight } from '@/types';

export default function AiInsights() {
  const toast = useToast();
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(refresh = false) {
    const res = await aiApi.insights(refresh).catch((e) => {
      toast.error(e?.message || 'Could not load insights');
      return null;
    });
    setInsight(res);
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
      toast.success('Insight regenerated');
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

  const text = insight?.payload?.text;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="AI insights"
        subtitle="Weekly performance summary for your pharmacy"
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
            icon={<Bot size={22} />}
            title="No insight yet"
            description="Generate your first weekly insight to see how the pharmacy is doing."
            action={
              <Button leftIcon={<Sparkles size={14} />} loading={refreshing} onClick={regenerate}>
                Generate insight
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">Weekly insight</p>
              {insight?.generatedAt && (
                <p className="text-[10px] text-text-subtle">
                  Generated {formatRelativeTime(insight.generatedAt)}
                </p>
              )}
            </div>
            {insight?.model && (
              <span className="text-[10px] text-text-subtle">{insight.model}</span>
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