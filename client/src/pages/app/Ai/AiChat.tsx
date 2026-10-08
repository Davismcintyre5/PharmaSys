import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Send, Sparkles, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Spinner } from '@/components/ui/Spinner';
import { aiApi } from '@/api/ai';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/components/ui/_cn';

interface MessageDetails {
  max?: number;
  used?: number;
  planCode?: string;
  planName?: string;
}

interface Message {
  from: 'user' | 'ai';
  text: string;
  at: string;
  error?: boolean;
  details?: MessageDetails;
}

const SUGGESTIONS = [
  'What were my top selling drugs this week?',
  'Which items should I reorder?',
  "Summarize today's sales",
  'Any drugs close to expiry?',
];

export default function AiChat() {
  const toast = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [quota, setQuota] = useState<{
    used: number;
    max: number;
    remaining: number | null;
    unlimited: boolean;
  } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiApi.quota().then(setQuota).catch(() => null);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;

    setInput('');
    setMessages((prev) => [
      ...prev,
      { from: 'user', text: msg, at: new Date().toISOString() },
    ]);
    setSending(true);
    try {
      const res = await aiApi.chat(msg);
      setMessages((prev) => [
        ...prev,
        { from: 'ai', text: res.reply, at: new Date().toISOString() },
      ]);
      aiApi.quota().then(setQuota).catch(() => null);
    } catch (e: any) {
      const errorMsg = e?.message || 'Something went wrong. Try again.';
      toast.error(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          from: 'ai',
          text: errorMsg,
          at: new Date().toISOString(),
          error: true,
          details: e?.details || undefined,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function deleteMessage(index: number) {
    setMessages((prev) => prev.filter((_, i) => i !== index));
  }

  function clearChat() {
    setMessages([]);
  }

  const quotaExhausted =
    quota !== null && !quota.unlimited && quota.remaining === 0;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="AI assistant"
        subtitle="Ask anything about your pharmacy"
        actions={
          <div className="flex items-center gap-3">
            {quota && (
              <span
                className={cn(
                  'text-xs',
                  quotaExhausted ? 'font-medium text-danger' : 'text-text-muted'
                )}
              >
                {quota.unlimited
                  ? 'Unlimited'
                  : `${quota.remaining ?? 0} / ${quota.max} left today`}
              </span>
            )}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Trash2 size={14} />}
                onClick={clearChat}
              >
                Clear
              </Button>
            )}
          </div>
        }
      />

      <Card plain>
        <div className="space-y-4 p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot size={22} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text">Ask me anything</p>
                <p className="mt-1 text-xs text-text-muted">
                  I can help with stock, sales, expiries, and reorders.
                </p>
              </div>
              <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs text-text-muted transition-colors hover:border-primary/40 hover:text-text"
                  >
                    <Sparkles size={12} className="shrink-0 text-primary" />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'group flex items-start gap-2',
                m.from === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {m.from === 'ai' && (
                <button
                  type="button"
                  onClick={() => deleteMessage(i)}
                  className="mt-1.5 shrink-0 rounded p-1 text-text-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                  aria-label="Delete message"
                >
                  <Trash2 size={12} />
                </button>
              )}

              <div
                className={cn(
                  'max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm',
                  m.from === 'user'
                    ? 'bg-primary text-primary-fg'
                    : m.error
                      ? 'border border-danger/30 bg-danger/5 text-danger'
                      : 'bg-surface-2 text-text'
                )}
              >
                <div>{m.text}</div>

                {m.error && m.details?.planCode && (
                  <div className="mt-2">
                    {user?.role === 'owner' ? (
                      <Link
                        to="/app/billing"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Upgrade plan <ArrowRight size={12} />
                      </Link>
                    ) : (
                      <p className="text-xs text-text-muted">
                        Ask the pharmacy owner to upgrade for more AI calls.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {m.from === 'user' && (
                <button
                  type="button"
                  onClick={() => deleteMessage(i)}
                  className="mt-1.5 shrink-0 rounded p-1 text-text-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                  aria-label="Delete message"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2">
                <Spinner size="sm" />
                <span className="text-xs text-text-muted">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
              disabled={sending}
            />
            <IconButton
              aria-label="Send"
              variant="solid"
              type="submit"
              disabled={sending || !input.trim()}
            >
              <Send size={14} />
            </IconButton>
          </form>
        </div>
      </Card>
    </div>
  );
}