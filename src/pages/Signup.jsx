import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm: '',
    organizationName: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) navigate('/', { replace: true });

  function update(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('password must be at least 6 characters');
      return;
    }
    setBusy(true);
    try {
      await signup(form.email, form.password, form.organizationName);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'signup failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <span className="text-2xl font-semibold text-slate-900">StockFlow</span>
        </div>
        <div className="card">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Create your workspace</h1>
          <p className="text-sm text-slate-500 mb-5">Sign up to start tracking your inventory.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Organization name</label>
              <input
                type="text"
                required
                value={form.organizationName}
                onChange={update('organizationName')}
                className="input"
                placeholder="My Test Store"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={update('email')}
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={update('password')}
                className="input"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.confirm}
                onChange={update('confirm')}
                className="input"
                autoComplete="new-password"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}
            <button disabled={busy} className="btn-primary w-full">
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <div className="text-sm text-slate-500 mt-5 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
