import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const { organization, updateOrganization } = useAuth();
  const [threshold, setThreshold] = useState(
    organization?.defaultLowStockThreshold ?? 5
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/settings');
        setThreshold(data.organization.defaultLowStockThreshold);
        updateOrganization(data.organization);
      } catch (err) {
        setError(err?.response?.data?.error || 'failed to load settings');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const { data } = await api.put('/settings', {
        defaultLowStockThreshold: Number(threshold),
      });
      updateOrganization(data.organization);
      setSuccess('Settings saved.');
    } catch (err) {
      setError(err?.response?.data?.error || 'failed to save settings');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Inventory defaults</h2>
        <p className="text-sm text-slate-500 mb-4">
          Products without a custom low-stock threshold use this default value.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Default low-stock threshold</label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="input"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
              {success}
            </div>
          )}
          <button disabled={busy} className="btn-primary">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Organization</h2>
        <div className="text-sm text-slate-600">
          <div>
            <span className="text-slate-500">Name:</span>{' '}
            <span className="font-medium">{organization?.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
