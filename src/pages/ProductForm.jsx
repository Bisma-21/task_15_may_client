import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client.js';

const empty = {
  name: '',
  sku: '',
  description: '',
  quantityOnHand: 0,
  costPrice: '',
  sellingPrice: '',
  lowStockThreshold: '',
};

export default function ProductForm({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        if (cancelled) return;
        const p = data.product;
        setForm({
          name: p.name || '',
          sku: p.sku || '',
          description: p.description || '',
          quantityOnHand: p.quantityOnHand ?? 0,
          costPrice: p.costPrice ?? '',
          sellingPrice: p.sellingPrice ?? '',
          lowStockThreshold: p.lowStockThreshold ?? '',
        });
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || 'failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  function update(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description?.trim() || '',
      quantityOnHand: Number(form.quantityOnHand) || 0,
      costPrice: form.costPrice === '' ? null : Number(form.costPrice),
      sellingPrice: form.sellingPrice === '' ? null : Number(form.sellingPrice),
      lowStockThreshold:
        form.lowStockThreshold === '' ? null : Number(form.lowStockThreshold),
    };
    try {
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/products');
    } catch (err) {
      const data = err?.response?.data;
      if (data?.error === 'duplicate value' && data?.fields?.sku) {
        setError('A product with this SKU already exists.');
      } else {
        setError(data?.error || 'failed to save product');
      }
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      navigate('/products');
    } catch (err) {
      setError(err?.response?.data?.error || 'delete failed');
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          {isEdit ? 'Edit product' : 'New product'}
        </h1>
        <Link to="/products" className="text-sm text-slate-600 hover:text-brand-700">
          ← Back to products
        </Link>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={update('name')}
              className="input"
            />
          </div>
          <div>
            <label className="label">SKU</label>
            <input
              type="text"
              required
              value={form.sku}
              onChange={update('sku')}
              className="input font-mono text-sm"
            />
          </div>
          <div>
            <label className="label">Quantity on hand</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.quantityOnHand}
              onChange={update('quantityOnHand')}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description (optional)</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={update('description')}
              className="input"
            />
          </div>
          <div>
            <label className="label">Cost price (optional)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={update('costPrice')}
              className="input"
            />
          </div>
          <div>
            <label className="label">Selling price (optional)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.sellingPrice}
              onChange={update('sellingPrice')}
              className="input"
            />
          </div>
          <div>
            <label className="label">Low-stock threshold (optional)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.lowStockThreshold}
              onChange={update('lowStockThreshold')}
              className="input"
              placeholder="Falls back to org default"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div>
            {isEdit && (
              <button type="button" onClick={onDelete} className="btn-danger">
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/products" className="btn-secondary">
              Cancel
            </Link>
            <button disabled={busy} className="btn-primary">
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
