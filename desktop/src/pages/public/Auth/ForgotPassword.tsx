import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '@/components/layout/public/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { authApi } from '@/api/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll send you a reset link"
    >
      {sent ? (
        <div className="space-y-4">
          <Alert variant="success" title="Check your inbox">
            If an account exists for <strong>{email}</strong>, a reset link is on the way.
          </Alert>
          <p className="text-center text-sm text-text-muted">
            <Link to="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <FormField label="Email" required>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </FormField>
          <Button type="submit" fullWidth size="lg" loading={submitting}>
            Send reset link
          </Button>
          <p className="text-center text-sm text-text-muted">
            <Link to="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}