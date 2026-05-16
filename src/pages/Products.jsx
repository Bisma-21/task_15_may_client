import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function fmtMoney(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function Products() {
  const { organization } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [adjustingId, setAdjustingId] = useState(null);
  const [adjustValue, setAdjustValue] = useState('');

  const defaultThreshold = organization?.defaultLowStockThreshold ?? 5;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      setProducts(data.products);
    } catch (err) {
      setError(err?.response?.data?.error || 'failed to load products');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [products, query]);

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch (err) {
      alert(err?.response?.data?.error || 'delete failed');
    }
  }

  async function handleAdjust(product) {
    const delta = Number(adjustValue);
    if (!Number.isInteger(delta) || delta === 0) {
      alert('Enter a non-zero integer (e.g. 5 or -3)');
      return;
    }
    try {
      const { data } = await api.post(`/products/${product._id}/adjust-stock`, { delta });
      setProducts((prev) => prev.map((p) => (p._id === product._id ? data.product : p)));
      setAdjustingId(null);
      setAdjustValue('');
    } catch (err) {
      alert(err?.response?.data?.error || 'adjustment failed');
    }
  }

  function isLow(p) {
    const threshold = p.lowStockThreshold ?? defaultThreshold;
    return p.quantityOnHand <= threshold;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search name or SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input w-64"
          />
          <Link to="/products/new" className="btn-primary whitespace-nowrap">
            + Add product
          </Link>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            {products.length === 0 ? (
              <>
                No products yet.{' '}
                <Link to="/products/new" className="text-brand-600 hover:text-brand-700 font-medium">
                  Add your first product
                </Link>
                .
              </>
            ) : (
              <>No products match “{query}”.</>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left border-b border-slate-200">
                  <th className="py-2.5 px-4 font-medium">Name</th>
                  <th className="py-2.5 px-4 font-medium">SKU</th>
                  <th className="py-2.5 px-4 font-medium">Quantity</th>
                  <th className="py-2.5 px-4 font-medium">Selling price</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 px-4">
                      <Link to={`/products/${p._id}`} className="text-brand-700 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-600">{p.sku}</td>
                    <td className="py-2.5 px-4">
                      {adjustingId === p._id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700 tabular-nums">{p.quantityOnHand}</span>
                          <input
                            type="number"
                            value={adjustValue}
                            onChange={(e) => setAdjustValue(e.target.value)}
                            placeholder="+/-"
                            className="input w-20 py-1 text-xs"
                            autoFocus
                          />
                          <button
                            onClick={() => handleAdjust(p)}
                            className="btn-primary px-2 py-1 text-xs"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => {
                              setAdjustingId(null);
                              setAdjustValue('');
                            }}
                            className="btn-secondary px-2 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAdjustingId(p._id);
                            setAdjustValue('');
                          }}
                          className="text-slate-900 tabular-nums hover:text-brand-700"
                          title="Click to adjust"
                        >
                          {p.quantityOnHand}
                        </button>
                      )}
                    </td>
                    <td className="py-2.5 px-4 tabular-nums">{fmtMoney(p.sellingPrice)}</td>
                    <td className="py-2.5 px-4">
                      {isLow(p) ? (
                        <span className="badge bg-red-100 text-red-700">Low stock</span>
                      ) : (
                        <span className="badge bg-emerald-100 text-emerald-700">In stock</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        to={`/products/${p._id}`}
                        className="text-sm text-slate-600 hover:text-brand-700 mr-3"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
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
