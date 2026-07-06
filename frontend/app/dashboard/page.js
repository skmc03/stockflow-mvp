'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const orgId = localStorage.getItem('orgId');
    if (!token || !orgId) {
      router.push('/');
      return;
    }
    fetchProducts(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load products. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('orgId');
    router.push('/');
  };

  // Issue #8 fixed: use strict < so a product at exactly threshold is NOT flagged
  const lowStockProducts = products.filter(p => p.quantityOnHand < (p.lowStockThreshold ?? 5));

  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh'}}>
        <p style={{color: '#555', fontSize: '16px'}}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div style={{display: 'flex', gap: '8px'}}>
          <button
            onClick={() => router.push('/settings')}
            style={{backgroundColor: '#6c757d', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px'}}
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            style={{backgroundColor: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px'}}
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div style={{backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px'}}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-100 p-4 rounded">
          <p className="text-gray-600">Total Products</p>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <p className="text-gray-600">Total Quantity</p>
          <p className="text-2xl font-bold">{products.reduce((sum, p) => sum + p.quantityOnHand, 0)}</p>
        </div>
        <div className="bg-red-100 p-4 rounded">
          <p className="text-gray-600">Low Stock Items</p>
          <p className="text-2xl font-bold">{lowStockProducts.length}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Low Stock Items</h2>
        {lowStockProducts.length === 0 ? (
          <p style={{color: '#6b7280', padding: '16px 0'}}>No low stock items. All products are well stocked.</p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">SKU</th>
                <th className="p-2 text-left">Quantity</th>
                <th className="p-2 text-left">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map(p => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.sku}</td>
                  <td className="p-2" style={{color: '#dc2626', fontWeight: '600'}}>{p.quantityOnHand}</td>
                  <td className="p-2">{p.lowStockThreshold ?? 5}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button
        onClick={() => router.push('/products')}
        className="bg-blue-600 text-white p-2 rounded"
      >
        Manage Products
      </button>
    </div>
  );
}
