import { useEffect, useRef, useState } from 'react';
import { Bot, Send, X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { Spinner } from '@/components/ui/Spinner';
import { publicApi } from '@/api/public';
import { cn } from '@/components/ui/_cn';

interface Message {
  from: 'user' | 'ai';
  text: string;
  at: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<{ enabled: boolean; greeting: string; disclaimer: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    publicApi.chat.getInfo().then((data) => {
      setInfo(data);
      if (data.enabled && data.greeting) {
        setMessages([{ from: 'ai', text: data.greeting, at: new Date().toISOString() }]);
      }
    }).catch(() => setInfo(null));
  }, []);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (!info?.enabled) return null;

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages((prev) => [...prev, { from: 'user', text, at: new Date().toISOString() }]);
    setSending(true);
    try {
      const res = await publicApi.chat.send(text);
      setMessages((prev) => [...prev, { from: 'ai', text: res.reply, at: new Date().toISOString() }]);
    } catch {
      setMessages((prev) => [...prev, { from: 'ai', text: 'Sorry, something went wrong. Try again later.', at: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg"
        aria-label="Open chat"
      >
        <Bot size={20} />
      </button>

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[520px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-primary" />
              <span className="text-sm font-semibold text-text">PharmaSys Assistant</span>
            </div>
            <IconButton aria-label="Close chat" size="sm" onClick={() => setOpen(false)}>
              <X size={16} />
            </IconButton>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                    m.from === 'user'
                      ? 'bg-primary text-primary-fg'
                      : 'bg-surface-2 text-text'
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-surface-2 px-3 py-2">
                  <Spinner size="sm" />
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
              <IconButton aria-label="Send" variant="solid" type="submit" disabled={sending}>
                <Send size={14} />
              </IconButton>
            </form>
            {info.disclaimer && (
              <p className="mt-2 text-[10px] leading-tight text-text-subtle">{info.disclaimer}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}