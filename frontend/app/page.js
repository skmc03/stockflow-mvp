'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin
      ? { email, password }
      : { email, password, organizationName: orgName };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('orgId', String(data.orgId));
      router.push('/dashboard');
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{textAlign: 'center', marginBottom: '32px'}}>
          <h1 style={{fontSize: '32px', fontWeight: 'bold', color: '#1a1a2e'}}>StockFlow</h1>
          <p style={{color: '#888', marginTop: '4px'}}>Inventory Management System</p>
        </div>

        <div style={{display: 'flex', backgroundColor: '#f0f2f5', borderRadius: '8px', padding: '4px', marginBottom: '24px'}}>
          <button onClick={() => { setIsLogin(true); setError(''); }} style={{
            flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            backgroundColor: isLogin ? 'white' : 'transparent',
            color: isLogin ? '#1a1a2e' : '#888',
            fontWeight: isLogin ? '600' : '400',
            boxShadow: isLogin ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
          }}>Login</button>
          <button onClick={() => { setIsLogin(false); setError(''); }} style={{
            flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            backgroundColor: !isLogin ? 'white' : 'transparent',
            color: !isLogin ? '#1a1a2e' : '#888',
            fontWeight: !isLogin ? '600' : '400',
            boxShadow: !isLogin ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
          }}>Sign Up</button>
        </div>

        {error && (
          <div style={{backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px'}}>Organization Name</label>
              <input type="text" placeholder="Enter your organization name"
                value={orgName} onChange={(e) => setOrgName(e.target.value)}
                style={{width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#333', backgroundColor: 'white', outline: 'none', boxSizing: 'border-box'}}
                required />
            </div>
          )}

          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px'}}>Email Address</label>
            <input type="email" placeholder="Enter your email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={{width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#333', backgroundColor: 'white', outline: 'none', boxSizing: 'border-box'}}
              required />
          </div>

          <div style={{marginBottom: '24px'}}>
            <label style={{display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px'}}>Password</label>
            <input type="password" placeholder={isLogin ? 'Enter your password' : 'Min. 6 characters'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={{width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#333', backgroundColor: 'white', outline: 'none', boxSizing: 'border-box'}}
              required minLength={6} />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', backgroundColor: loading ? '#93c5fd' : '#2563eb',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}
