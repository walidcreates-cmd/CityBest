import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://citybest-1.onrender.com';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('cb_admin_token', data.token);
        onLogin(data.token);
      } else {
        setError('Wrong password. Try again.');
      }
    } catch {
      setError('Connection failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#f5f5f5' }}>
      <div style={{ background:'#fff', padding:'2rem', borderRadius:'12px', boxShadow:'0 2px 16px #0001', width:'320px' }}>
        <div style={{ fontSize:'2rem', textAlign:'center', marginBottom:'0.5rem' }}>🔐</div>
        <h2 style={{ textAlign:'center', marginBottom:'1.5rem', color:'#1a1a1a' }}>Admin Login</h2>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{ width:'100%', padding:'0.75rem', borderRadius:'8px', border:'1px solid #ddd', fontSize:'1rem', boxSizing:'border-box', marginBottom:'1rem' }}
        />
        {error && <div style={{ color:'red', fontSize:'0.85rem', marginBottom:'0.75rem' }}>{error}</div>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width:'100%', padding:'0.75rem', background:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', fontSize:'1rem', cursor:'pointer' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </div>
  );
}
