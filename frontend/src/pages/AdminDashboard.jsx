import { useState, useEffect, useRef } from 'react';
import AIAssistant from './AIAssistant';

const API = import.meta.env.VITE_API_URL || 'https://citybest-1.onrender.com';
const CLOUD_NAME = 'dpzlzcyuj';
const UPLOAD_PRESET = 'citybest_products';

const EMPTY = { emoji:'📦', name:'', nameBn:'', price:'', unit:'', category:'rice', isFast:false, stock:0, isAvailable:true, image:'' };

export default function AdminDashboard({ token, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null);
  const [adding,   setAdding]   = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [msg,      setMsg]      = useState('');
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef();

  const headers = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const loadProducts = async () => {
    setLoading(true);
    const res  = await fetch(`${API}/api/products`);
    const data = await res.json();
    setProducts(data.success ? data.data : []);
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    try {
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) {
        setForm(f => ({ ...f, image: data.secure_url }));
        flash('✅ Image uploaded!');
      }
    } catch { flash('❌ Image upload failed'); }
    setUploading(false);
  };

  const handleSave = async () => {
    const url    = editing ? `${API}/api/products/${editing}` : `${API}/api/products`;
    const method = editing ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers, body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) }) });
    const data   = await res.json();
    if (data.success) { flash(editing ? '✅ Updated!' : '✅ Added!'); setEditing(null); setAdding(false); setForm(EMPTY); loadProducts(); }
    else flash('❌ Error: ' + data.message);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    const res  = await fetch(`${API}/api/products/${id}`, { method:'DELETE', headers });
    const data = await res.json();
    if (data.success) { flash('🗑️ Deleted'); loadProducts(); }
  };

  const handleToggle = async (p) => {
    const res  = await fetch(`${API}/api/products/${p._id}`, { method:'PUT', headers, body: JSON.stringify({ isAvailable: !p.isAvailable }) });
    const data = await res.json();
    if (data.success) { flash(`${!p.isAvailable ? '✅ Enabled' : '⛔ Disabled'}: ${p.name}`); loadProducts(); }
  };

  const startEdit = (p) => {
    setEditing(p._id); setAdding(false);
    setForm({ emoji:p.emoji, name:p.name, nameBn:p.nameBn, price:p.price, unit:p.unit, category:p.category, isFast:p.isFast, stock:p.stock, isAvailable:p.isAvailable, image:p.image||'' });
  };

  const F = ({ label, field, type='text' }) => (
    <div style={{ marginBottom:'0.75rem' }}>
      <label style={{ fontSize:'0.8rem', color:'#666', display:'block', marginBottom:'0.25rem' }}>{label}</label>
      <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{ width:'100%', padding:'0.5rem', borderRadius:'6px', border:'1px solid #ddd', boxSizing:'border-box' }} />
    </div>
  );

  return (
    <div style={{ maxWidth:'900px', margin:'0 auto', padding:'1rem', fontFamily:'sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ margin:0 }}>🏪 CityBest Admin</h1>
        <button onClick={onLogout} style={{ padding:'0.5rem 1rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:'8px', cursor:'pointer' }}>Logout</button>
      </div>

      {msg && <div style={{ background:'#f0fdf4', border:'1px solid #86efac', padding:'0.75rem', borderRadius:'8px', marginBottom:'1rem' }}>{msg}</div>}

      <button onClick={() => { setAdding(true); setEditing(null); setForm(EMPTY); }}
        style={{ padding:'0.6rem 1.2rem', background:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', marginBottom:'1.5rem' }}>
        + Add Product
      </button>

      {(adding || editing) && (
        <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'1.5rem', marginBottom:'1.5rem' }}>
          <h3 style={{ margin:'0 0 1rem' }}>{editing ? 'Edit Product' : 'New Product'}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 1rem' }}>
            <F label="Emoji (fallback)" field="emoji" />
            <F label="Category" field="category" />
            <F label="Name (English)" field="name" />
            <F label="Name (Bangla)" field="nameBn" />
            <F label="Price (৳)" field="price" type="number" />
            <F label="Unit" field="unit" />
            <F label="Stock quantity" field="stock" type="number" />
          </div>

          {/* Image Upload */}
          <div style={{ marginBottom:'1rem' }}>
            <label style={{ fontSize:'0.8rem', color:'#666', display:'block', marginBottom:'0.5rem' }}>Product Image</label>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
              {form.image
                ? <img src={form.image} alt="product" style={{ width:'64px', height:'64px', objectFit:'contain', borderRadius:'8px', border:'1px solid #e2e8f0' }} />
                : <div style={{ width:'64px', height:'64px', background:'#f1f5f9', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>{form.emoji || '📦'}</div>
              }
              <div>
                <button onClick={() => imgRef.current.click()} disabled={uploading}
                  style={{ padding:'0.5rem 1rem', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', cursor:'pointer', fontSize:'0.85rem' }}>
                  {uploading ? '⏳ Uploading...' : '📷 Upload Photo'}
                </button>
                {form.image && <button onClick={() => setForm(f => ({ ...f, image:'' }))} style={{ marginLeft:'0.5rem', padding:'0.5rem', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', cursor:'pointer', fontSize:'0.85rem' }}>✕ Remove</button>}
                <div style={{ fontSize:'0.75rem', color:'#888', marginTop:'0.25rem' }}>JPG, PNG — max 5MB</div>
              </div>
            </div>
            <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleImageUpload(e.target.files[0])} />
          </div>

          <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.5rem' }}>
            <label><input type="checkbox" checked={form.isFast} onChange={e => setForm(f => ({ ...f, isFast: e.target.checked }))} /> ⚡ Fast delivery</label>
            <label style={{ marginLeft:'1rem' }}><input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))} /> ✅ Available</label>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem' }}>
            <button onClick={handleSave} style={{ padding:'0.6rem 1.2rem', background:'#16a34a', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer' }}>Save</button>
            <button onClick={() => { setEditing(null); setAdding(false); }} style={{ padding:'0.6rem 1.2rem', background:'#e5e7eb', border:'none', borderRadius:'8px', cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign:'center', padding:'2rem' }}>Loading products...</div> : (
        <div style={{ display:'grid', gap:'0.75rem' }}>
          {products.map(p => (
            <div key={p._id} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'1rem', display:'flex', alignItems:'center', gap:'1rem', opacity: p.isAvailable ? 1 : 0.5 }}>
              {p.image
                ? <img src={p.image} alt={p.name} style={{ width:'48px', height:'48px', objectFit:'contain', borderRadius:'6px' }} />
                : <div style={{ fontSize:'1.8rem' }}>{p.emoji}</div>
              }
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600 }}>{p.name} <span style={{ color:'#888', fontWeight:400, fontSize:'0.85rem' }}>{p.nameBn}</span></div>
                <div style={{ fontSize:'0.85rem', color:'#666' }}>{p.unit} · {p.category} · Stock: {p.stock} {p.isFast && '⚡'}</div>
              </div>
              <div style={{ fontWeight:700, fontSize:'1.1rem', color:'#2563eb' }}>৳{p.price}</div>
              <button onClick={() => handleToggle(p)} style={{ padding:'0.4rem 0.8rem', background: p.isAvailable ? '#fef9c3' : '#f0fdf4', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem' }}>
                {p.isAvailable ? '⛔ Disable' : '✅ Enable'}
              </button>
              <button onClick={() => startEdit(p)} style={{ padding:'0.4rem 0.8rem', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem' }}>✏️ Edit</button>
              <button onClick={() => handleDelete(p._id, p.name)} style={{ padding:'0.4rem 0.8rem', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem' }}>🗑️</button>
            </div>
          ))}
        </div>
      )}

      <AIAssistant products={products} token={token} onRefresh={loadProducts} />
    </div>
  );
}
