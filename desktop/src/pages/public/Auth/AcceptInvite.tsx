import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/components/layout/public/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { authApi } from '@/api/auth';
import { useAuth } from '@/context/AuthProvider';
import { isStrongPassword } from '@/utils/validators';

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const token = params.get('token') || '';

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Missing invitation token');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    const strength = isStrongPassword(password);
    if (!strength.ok) {
      setError(`Password is too weak: ${strength.reasons.join(', ')}`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const session = await authApi.acceptInvite({
        token,
        password,
        fullName: fullName || undefined,
      });
      setSession(session);
      navigate('/app/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Accept invitation" subtitle="Set up your account">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert variant="danger">{error}</Alert>}

        <FormField label="Full name">
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
          />
        </FormField>

        <FormField label="Password" required hint="At least 8 characters with letters and numbers">
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </FormField>

        <FormField label="Confirm password" required>
          <Input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </FormField>

        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Set password and continue
        </Button>

        <p className="text-center text-sm text-text-muted">
          <Link to="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}