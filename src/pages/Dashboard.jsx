import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

function StatCard({ label, value, sublabel }) {
  return (
    <div className="card">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      {sublabel && <div className="mt-1 text-xs text-slate-500">{sublabel}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await api.get('/dashboard');
        if (!cancelled) setData(data);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || 'failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (error)
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
        {error}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <Link to="/products/new" className="btn-primary">
          + Add product
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total products" value={data.totalProducts} />
        <StatCard label="Total units in stock" value={data.totalQuantity} />
        <StatCard
          label="Low stock items"
          value={data.lowStock.length}
          sublabel={`default threshold: ${data.defaultLowStockThreshold}`}
        />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Low stock items</h2>
          <Link to="/products" className="text-sm text-brand-600 hover:text-brand-700">
            View all products →
          </Link>
        </div>
        {data.lowStock.length === 0 ? (
          <div className="text-sm text-slate-500 py-6 text-center">
            No products at or below their low-stock threshold. 🎉
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">SKU</th>
                  <th className="py-2 pr-4 font-medium">Quantity</th>
                  <th className="py-2 pr-4 font-medium">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4">
                      <Link to={`/products/${p.id}`} className="text-brand-700 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{p.sku}</td>
                    <td className="py-2 pr-4">
                      <span className="badge bg-red-100 text-red-700">{p.quantityOnHand}</span>
                    </td>
                    <td className="py-2 pr-4 text-slate-600">{p.lowStockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
