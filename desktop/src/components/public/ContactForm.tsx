import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { useSite } from '@/context/SiteProvider';

export function ContactForm() {
  const { brand } = useSite();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(null);
    const body = encodeURIComponent(`From: ${form.name} <${form.email}>\n\n${form.message}`);
    const subject = encodeURIComponent(form.subject || 'Contact from PharmaSys website');
    window.location.href = `mailto:${brand?.supportEmail || ''}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {sent && (
        <Alert variant="success" title="Message ready">
          Your mail client should open. If not, email us directly at {brand?.supportEmail}.
        </Alert>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" required>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Your full name"
          />
        </FormField>
        <FormField label="Email" required>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
          />
        </FormField>
      </div>

      <FormField label="Subject">
        <Input
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="How can we help?"
        />
      </FormField>

      <FormField label="Message" required>
        <Textarea
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Tell us a bit about your pharmacy…"
        />
      </FormField>

      <Button type="submit" size="lg">Send message</Button>
    </form>
  );
}