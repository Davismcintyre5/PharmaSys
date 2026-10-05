import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { AuthShell } from '@/components/layout/public/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthProvider';

export default function Login() {
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Email and password are required');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(form);
      // No navigate here — PublicOnlyRoute reads scope and redirects.
      // Keeps routing in one place (route guards).
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to PharmaSys">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert variant="danger">{error}</Alert>}

        <FormField label="Email" required>
          <Input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            leftIcon={<Mail size={14} />}
            placeholder="you@example.com"
          />
        </FormField>

        <FormField label="Password" required>
          <Input
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            leftIcon={<Lock size={14} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="text-text-subtle hover:text-text"
                aria-label={showPass ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
            placeholder="••••••••"
          />
        </FormField>

        <div className="flex items-center justify-end text-sm">
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Sign in
        </Button>

        <p className="pt-2 text-center text-sm text-text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}