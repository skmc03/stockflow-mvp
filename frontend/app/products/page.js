'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const EMPTY_FORM = { name: '', sku: '', description: '', quantityOnHand: 0, costPrice: '', sellingPrice: '', lowStockThreshold: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) { router.push('/'); return; }
    setToken(storedToken);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token) fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load products. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('orgId');
    router.push('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `${API_URL}/api/products/${editing}` : `${API_URL}/api/products`;

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        // Issue #10 fixed: only send the fields the API expects, not id/organizationId/timestamps
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          quantityOnHand: parseInt(formData.quantityOnHand) || 0,
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
          sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
          lowStockThreshold: formData.lowStockThreshold ? parseInt(formData.lowStockThreshold) : null
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed'); return; }
      setFormData(EMPTY_FORM);
      setEditing(null);
      await fetchProducts();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Delete failed');
        return;
      }
      await fetchProducts();
    } catch {
      setError('Network error. Please try again.');
    }
  };

  const handleEdit = (p) => {
    setEditing(p.id);
    // Issue #10 fixed: only copy form-relevant fields, not id/organizationId/timestamps
    setFormData({
      name: p.name,
      sku: p.sku,
      description: p.description || '',
      quantityOnHand: p.quantityOnHand,
      costPrice: p.costPrice ?? '',
      sellingPrice: p.sellingPrice ?? '',
      lowStockThreshold: p.lowStockThreshold ?? ''
    });
  };

  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh'}}>
        <p style={{color: '#555'}}>Loading products...</p>
      </div>
    );
  }

  return (
    <div style={{backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '30px'}}>
      <div style={{maxWidth: '900px', margin: '0 auto'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
          <h1 style={{fontSize: '28px', fontWeight: 'bold', color: '#1a1a2e'}}>Products</h1>
          <div style={{display: 'flex', gap: '8px'}}>
            <button onClick={() => router.push('/dashboard')}
              style={{backgroundColor: '#6c757d', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer'}}>
              Dashboard
            </button>
            <button onClick={handleLogout}
              style={{backgroundColor: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer'}}>
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div style={{backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px'}}>
            {error}
          </div>
        )}

        <div style={{backgroundColor: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
          <h2 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1a1a2e'}}>{editing ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontWeight: '600', color: '#333'}}>Product Name *</label>
                <input type="text" placeholder="Enter product name" value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#333', backgroundColor: 'white', boxSizing: 'border-box'}} required />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontWeight: '600', color: '#333'}}>SKU *</label>
                <input type="text" placeholder="Enter SKU" value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  style={{width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#333', backgroundColor: 'white', boxSizing: 'border-box'}} required />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontWeight: '600', color: '#333'}}>Quantity</label>
                <input type="number" placeholder="0" value={formData.quantityOnHand} min="0"
                  onChange={(e) => setFormData({...formData, quantityOnHand: e.target.value})}
                  style={{width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#333', backgroundColor: 'white', boxSizing: 'border-box'}} />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontWeight: '600', color: '#333'}}>Selling Price</label>
                <input type="number" placeholder="0.00" value={formData.sellingPrice} min="0" step="0.01"
                  onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                  style={{width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#333', backgroundColor: 'white', boxSizing: 'border-box'}} />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontWeight: '600', color: '#333'}}>Cost Price</label>
                <input type="number" placeholder="0.00" value={formData.costPrice} min="0" step="0.01"
                  onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                  style={{width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#333', backgroundColor: 'white', boxSizing: 'border-box'}} />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontWeight: '600', color: '#333'}}>Low Stock Threshold</label>
                <input type="number" placeholder="5" value={formData.lowStockThreshold} min="0"
                  onChange={(e) => setFormData({...formData, lowStockThreshold: e.target.value})}
                  style={{width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#333', backgroundColor: 'white', boxSizing: 'border-box'}} />
              </div>
            </div>
            <div style={{marginTop: '16px', display: 'flex', gap: '8px'}}>
              <button type="submit" disabled={saving} style={{backgroundColor: saving ? '#93c5fd' : '#2563eb', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600'}}>
                {saving ? 'Saving...' : (editing ? 'Update' : 'Add Product')}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(null); setFormData(EMPTY_FORM); setError(''); }}
                  style={{backgroundColor: '#6c757d', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600'}}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div style={{backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{backgroundColor: '#1a1a2e', color: 'white'}}>
                <th style={{padding: '14px', textAlign: 'left'}}>Name</th>
                <th style={{padding: '14px', textAlign: 'left'}}>SKU</th>
                <th style={{padding: '14px', textAlign: 'left'}}>Qty</th>
                <th style={{padding: '14px', textAlign: 'left'}}>Price</th>
                <th style={{padding: '14px', textAlign: 'left'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan="5" style={{padding: '24px', textAlign: 'center', color: '#888'}}>No products yet. Add your first product above.</td></tr>
              )}
              {products.map((p, i) => (
                <tr key={p.id} style={{backgroundColor: i % 2 === 0 ? 'white' : '#f8f9fa', borderBottom: '1px solid #eee'}}>
                  <td style={{padding: '12px', fontWeight: '600', color: '#1a1a2e'}}>{p.name}</td>
                  <td style={{padding: '12px', color: '#555'}}>{p.sku}</td>
                  <td style={{padding: '12px'}}>
                    <span style={{
                      backgroundColor: p.quantityOnHand < (p.lowStockThreshold ?? 5) ? '#fee2e2' : '#dcfce7',
                      color: p.quantityOnHand < (p.lowStockThreshold ?? 5) ? '#dc2626' : '#16a34a',
                      padding: '4px 10px', borderRadius: '20px', fontWeight: '600', fontSize: '13px'
                    }}>
                      {p.quantityOnHand}
                    </span>
                  </td>
                  <td style={{padding: '12px', color: '#555'}}>Rs.{p.sellingPrice ?? 0}</td>
                  <td style={{padding: '12px'}}>
                    <button onClick={() => handleEdit(p)} style={{backgroundColor: '#2563eb', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', marginRight: '8px', fontSize: '13px'}}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} style={{backgroundColor: '#dc2626', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px'}}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
