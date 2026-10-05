import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/components/layout/public/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { authApi } from '@/api/auth';
import { isStrongPassword } from '@/utils/validators';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Missing reset token');
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
      await authApi.resetPassword({ token, newPassword: password });
      navigate('/login?reset=1', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose something strong and unique">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert variant="danger">{error}</Alert>}

        <FormField label="New password" required>
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
          Reset password
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