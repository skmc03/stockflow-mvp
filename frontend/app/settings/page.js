'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Settings() {
  const [threshold, setThreshold] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) { router.push('/'); return; }
    setToken(storedToken);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token) fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setThreshold(data.defaultLowStockThreshold);
    } catch {
      setError('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ defaultLowStockThreshold: parseInt(threshold) })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed'); return; }
      setThreshold(data.defaultLowStockThreshold);
      setSuccess('Settings saved successfully.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('orgId');
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh'}}>
        <p style={{color: '#555'}}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={{backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '30px'}}>
      <div style={{maxWidth: '600px', margin: '0 auto'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
          <h1 style={{fontSize: '28px', fontWeight: 'bold', color: '#1a1a2e'}}>Settings</h1>
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

        <div style={{backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
          <h2 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a2e'}}>Inventory Settings</h2>
          <p style={{color: '#6b7280', marginBottom: '24px', fontSize: '14px'}}>
            Configure the default low stock threshold for your organization. Products without a specific threshold will use this value.
          </p>

          {error && (
            <div style={{backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px'}}>
              {error}
            </div>
          )}
          {success && (
            <div style={{backgroundColor: '#dcfce7', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px'}}>
              {success}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333'}}>
                Default Low Stock Threshold
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                min="0"
                required
                style={{width: '200px', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#333', backgroundColor: 'white', boxSizing: 'border-box'}}
              />
              <p style={{color: '#6b7280', fontSize: '13px', marginTop: '6px'}}>
                Products with quantity below this number will be flagged as low stock.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              style={{backgroundColor: saving ? '#93c5fd' : '#2563eb', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600'}}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
