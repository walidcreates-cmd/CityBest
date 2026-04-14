import { useState, useEffect, useRef } from 'react';
import AIAssistant from './AIAssistant';
import AdminOrders from './AdminOrders';

const API = import.meta.env.VITE_API_URL || 'https://citybest-1.onrender.com';
const CLOUD_NAME = 'dpzlzcyuj';
const UPLOAD_PRESET = 'citybest_products';

const EMPTY = { emoji:'📦', name:'', nameBn:'', price:'', unit:'', category:'rice', isFast:false, stock:0, isAvailable:true, image:'', variants:[] };
const EMPTY_VARIANT = { name:'', nameBn:'', price:'', image:'', emoji:'' };

// ── Moved outside component to prevent focus loss on re-render ─────────────
function F({ label, field, type='text', form, setForm }) {
  return (
    <div style={{ marginBottom:'0.75rem' }}>
      <label style={{ fontSize:'0.8rem', color:'#666', display:'block', marginBottom:'0.25rem' }}>{label}</label>
      <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{ width:'100%', padding:'0.5rem', borderRadius:'6px', border:'1px solid #ddd', boxSizing:'border-box' }} />
    </div>
  );
}

export default function AdminDashboard({ token, onLogout }) {
  const [tab,          setTab]         = useState('products');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [products,     setProducts]    = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [editing,      setEditing]     = useState(null);
  const [adding,       setAdding]      = useState(false);
  const [form,         setForm]        = useState(EMPTY);
  const [msg,          setMsg]         = useState('');
  const [uploading,    setUploading]   = useState(false);
  const [varUploading, setVarUploading]= useState(null);

  const [rates,        setRates]       = useState([]);
  const [rateLoading,  setRateLoading] = useState(false);
  const [rateMsg,      setRateMsg]     = useState('');
  const [editingRates, setEditingRates]= useState({});
  const [editingImgs,  setEditingImgs] = useState({});
  const [imgUploading, setImgUploading]= useState(null);
  const [showAddForm,  setShowAddForm] = useState(false);
  const [newRate,      setNewRate]     = useState({ type:'cylinder', id:'', name:'', price:'', unit:'১২ কেজি সিলিন্ডার', img:'' });

  const imgRef     = useRef();
  const varImgRefs = useRef({});

  const headers = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const flashRate = (m) => { setRateMsg(m); setTimeout(() => setRateMsg(''), 3000); };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  };

  const enableNotifications = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { alert('Notification permission denied'); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('BBF-OHqm_oPq0E45ZgZmyetIi5cL_CC0WYDkomEU6kB7fRaoW9kR5Y4pThhUugu1w1sVIMoEUlZ2J3Z7HGVciSM')
      });
      await fetch(`${API}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub })
      });
      alert('✅ Notifications enabled!');
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    const res  = await fetch(`${API}/api/admin/products`, { headers });
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : (data.success ? data.data : []));
    setLoading(false);
  };

  const loadRates = async () => {
    setRateLoading(true);
    try {
      const res  = await fetch(`${API}/api/liverate/all`, { headers });
      const data = await res.json();
      setRates(Array.isArray(data) ? data : []);
      const init = {};
      if (Array.isArray(data)) data.forEach(r => { init[r.id] = r.price; });
      setEditingRates(init);
    } catch { flashRate('❌ Rate load failed'); }
    setRateLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { if (tab === 'liverate') loadRates(); }, [tab]);

  const toggleRate = async (id, name, active) => {
    try {
      await fetch(`${API}/api/liverate/toggle`, {
        method:'POST', headers,
        body: JSON.stringify({ id })
      });
      flashRate(active ? '⛔ ' + name + ' hide করা হয়েছে' : '✅ ' + name + ' show করা হয়েছে');
      loadRates();
    } catch { flashRate('❌ Error'); }
  };

  const addRate = async () => {
    if (!newRate.id || !newRate.name || !newRate.price) { flashRate('❌ সব তথ্য দিন'); return; }
    try {
      const res = await fetch(`${API}/api/liverate/add`, {
        method:'POST', headers,
        body: JSON.stringify({ ...newRate, price: Number(newRate.price), active: true })
      });
      const data = await res.json();
      if (data._id) {
        flashRate('✅ ' + data.name + ' যোগ হয়েছে!');
        setShowAddForm(false);
        setNewRate({ type:'cylinder', id:'', name:'', price:'', unit:'১২ কেজি সিলিন্ডার', img:'' });
        loadRates();
      }
    } catch { flashRate('❌ Error'); }
  };

  const updateAllRates = async () => {
    try {
      let updated = 0;
      const allIds = new Set([...Object.keys(editingRates), ...Object.keys(editingImgs)]);
      for (const id of allIds) {
        const body = { id, price: Number(editingRates[id]) };
        if (editingImgs[id] !== undefined) body.img = editingImgs[id];
        const res = await fetch(`${API}/api/liverate/update`, {
          method: 'POST', headers,
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data._id) updated++;
      }
      flashRate('✅ ' + updated + 'টি পণ্যের তথ্য আপডেট হয়েছে!');
      setEditingImgs({});
      loadRates();
    } catch { flashRate('❌ Error'); }
  };

  const uploadRateImage = async (id, file) => {
    if (!file) return;
    setImgUploading(id);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    try {
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) {
        setEditingImgs(prev => ({ ...prev, [id]: data.secure_url }));
        flashRate('✅ ছবি upload হয়েছে! Save করুন।');
      }
    } catch { flashRate('❌ Upload failed'); }
    setImgUploading(null);
  };

  const uploadImage = async (file, onDone, onLoading) => {
    if (!file) return;
    onLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    try {
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) { onDone(data.secure_url); flash('✅ Image uploaded!'); }
    } catch { flash('❌ Upload failed'); }
    onLoading(false);
  };

  const handleSave = async () => {
    const url    = editing ? `${API}/api/admin/products/${editing}` : `${API}/api/admin/products`;
    const method = editing ? 'PUT' : 'POST';
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock),
      variants: form.variants.map(v => ({ ...v, price: Number(v.price) })) };
    const res  = await fetch(url, { method, headers, body: JSON.stringify(payload) });
    const data = await res.json();
    if (data._id || data.success) { flash(editing ? '✅ Updated!' : '✅ Added!'); setEditing(null); setAdding(false); setForm(EMPTY); loadProducts(); }
    else flash('❌ Error: ' + (data.error || data.message || 'Unknown error'));
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    const res  = await fetch(`${API}/api/admin/products/${id}`, { method:'DELETE', headers });
    const data = await res.json();
    if (data.success) { flash('🗑️ Deleted'); loadProducts(); }
  };

  const handleToggle = async (p) => {
    const res  = await fetch(`${API}/api/admin/products/${p._id}`, { method:'PUT', headers, body: JSON.stringify({ isAvailable: !p.isAvailable }) });
    const data = await res.json();
    if (data._id || data.success) { flash(`${!p.isAvailable ? '✅ Enabled' : '⛔ Disabled'}: ${p.name}`); loadProducts(); }
  };

  const startEdit = (p) => {
    setEditing(p._id); setAdding(false);
    setForm({ emoji:p.emoji, name:p.name, nameBn:p.nameBn, price:p.price, unit:p.unit,
      category:p.category, isFast:p.isFast, stock:p.stock, isAvailable:p.isAvailable,
      image:p.image||'', variants: p.variants || [] });
  };

  const addVariant    = () => setForm(f => ({ ...f, variants: [...f.variants, { ...EMPTY_VARIANT }] }));
  const removeVariant = (i) => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));
  const updateVariant = (i, field, val) => setForm(f => ({
    ...f, variants: f.variants.map((v, idx) => idx === i ? { ...v, [field]: val } : v)
  }));

  const RateCard = ({ r }) => (
    <div key={r.id} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'0.85rem 1rem', display:'flex', alignItems:'center', gap:'1rem', opacity: r.active ? 1 : 0.45 }}>
      <div style={{ position:'relative', cursor:'pointer' }} onClick={() => document.getElementById('img-upload-'+r.id).click()}>
        {editingImgs[r.id] || r.img
          ? <img src={editingImgs[r.id] || r.img} alt={r.name} style={{ width:'44px', height:'44px', objectFit:'contain', borderRadius:'8px', border:'1px solid #e2e8f0' }} />
          : <div style={{ width:'44px', height:'44px', background:'#f1f5f9', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>{r.type==='cylinder' ? '🔵' : '🍚'}</div>
        }
        <div style={{ position:'absolute', bottom:0, right:0, background:'#1a9e5c', borderRadius:'50%', width:'16px', height:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#fff' }}>
          {imgUploading===r.id ? '⏳' : '📷'}
        </div>
        <input id={'img-upload-'+r.id} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => uploadRateImage(r.id, e.target.files[0])} />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:600, fontSize:'0.95rem' }}>{r.name}</div>
        <div style={{ fontSize:'0.8rem', color:'#888' }}>{r.unit}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <span style={{ fontSize:'0.85rem', color:'#666' }}>৳</span>
        <input
          type="number"
          value={editingRates[r.id] ?? r.price}
          onChange={e => setEditingRates(prev => ({ ...prev, [r.id]: e.target.value }))}
          style={{ width:'90px', padding:'0.4rem 0.5rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'1rem', fontWeight:600, color:'#1a9e5c', textAlign:'center' }}
        />
        <button onClick={() => toggleRate(r.id, r.name, r.active)}
          title={r.active ? 'Customer থেকে লুকাও' : 'Customer কে দেখাও'}
          style={{ padding:'0.4rem 0.6rem', background: r.active ? '#fef9c3' : '#f0fdf4', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'0.9rem' }}>
          {r.active ? '👁️' : '🙈'}
        </button>
      </div>
    </div>
  );

  const cylinders = rates.filter(r => r.type === 'cylinder');
  const rices     = rates.filter(r => r.type === 'rice');

  return (
    <div style={{ maxWidth:'900px', margin:'0 auto', padding:'1rem', fontFamily:'sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ margin:0 }}>🏪 CityBest Admin</h1>
        <button onClick={onLogout} style={{ padding:'0.5rem 1rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:'8px', cursor:'pointer' }}>Logout</button>
      </div>

      <div style={{ display:'flex', gap:'0', marginBottom:'1.5rem', borderBottom:'2px solid #e2e8f0' }}>
        <div style={{ display:'flex', justifyContent:'flex-end', padding:'0.5rem 1rem' }}>
  <button onClick={enableNotifications} style={{ background:'#1a9e5c', color:'#fff', border:'none', borderRadius:'8px', padding:'0.4rem 1rem', fontSize:'0.85rem', cursor:'pointer' }}>
    🔔 Enable Notifications
  </button>
</div>
{[['products','📦 Products'],['orders','🧾 Orders'],['liverate','📊 Live Rate']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'0.6rem 1.4rem', border:'none', borderBottom: tab===key ? '2px solid #2563eb' : '2px solid transparent', background:'none', cursor:'pointer', fontWeight: tab===key ? 700 : 400, color: tab===key ? '#2563eb' : '#666', fontSize:'0.95rem', marginBottom:'-2px' }}>
            {label}
          </button>
        ))}
      </div>

      {msg && <div style={{ background:'#f0fdf4', border:'1px solid #86efac', padding:'0.75rem', borderRadius:'8px', marginBottom:'1rem' }}>{msg}</div>}

      {tab === 'orders' && <AdminOrders token={token} />}

      {tab === 'liverate' && (
        <div>
          {rateMsg && <div style={{ background:'#f0fdf4', border:'1px solid #86efac', padding:'0.75rem', borderRadius:'8px', marginBottom:'1rem' }}>{rateMsg}</div>}

          {rateLoading ? <div style={{ textAlign:'center', padding:'2rem' }}>Loading...</div> : (
            <>
              <div style={{ marginBottom:'1.5rem' }}>
                <h3 style={{ margin:'0 0 1rem', color:'#1a9e5c', fontSize:'1rem' }}>🔵 সিলিন্ডার গ্যাস</h3>
                <div style={{ display:'grid', gap:'0.6rem' }}>
                  {cylinders.map(r => <RateCard key={r.id} r={r} />)}
                </div>
              </div>

              <div style={{ marginBottom:'1rem' }}>
                <h3 style={{ margin:'0 0 1rem', color:'#1a9e5c', fontSize:'1rem' }}>🍚 চাল</h3>
                <div style={{ display:'grid', gap:'0.6rem' }}>
                  {rices.map(r => <RateCard key={r.id} r={r} />)}
                </div>
              </div>

              {showAddForm && (
                <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'1rem', margin:'1rem 0' }}>
                  <h4 style={{ margin:'0 0 0.75rem', fontSize:'0.95rem' }}>নতুন পণ্য যোগ করুন</h4>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.75rem' }}>
                    <select value={newRate.type} onChange={e => setNewRate(p => ({ ...p, type:e.target.value, unit: e.target.value==='cylinder' ? '১২ কেজি সিলিন্ডার' : 'প্রতি কেজি' }))}
                      style={{ padding:'0.5rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'0.9rem' }}>
                      <option value="cylinder">সিলিন্ডার গ্যাস</option>
                      <option value="rice">চাল</option>
                    </select>
                    <input placeholder="ID (e.g. titas)" value={newRate.id} onChange={e => setNewRate(p => ({ ...p, id:e.target.value.toLowerCase().replace(/\s/g,'') }))}
                      style={{ padding:'0.5rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'0.9rem' }} />
                    <input placeholder="নাম (বাংলায়, e.g. তিতাস গ্যাস)" value={newRate.name} onChange={e => setNewRate(p => ({ ...p, name:e.target.value }))}
                      style={{ padding:'0.5rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'0.9rem' }} />
                    <input placeholder="দাম (৳)" type="number" value={newRate.price} onChange={e => setNewRate(p => ({ ...p, price:e.target.value }))}
                      style={{ padding:'0.5rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'0.9rem' }} />
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button onClick={addRate} style={{ padding:'0.5rem 1.2rem', background:'#1a9e5c', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.9rem', fontWeight:600 }}>✓ যোগ করুন</button>
                    <button onClick={() => setShowAddForm(false)} style={{ padding:'0.5rem 1rem', background:'#f1f5f9', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.9rem' }}>বাতিল</button>
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:'0.75rem', margin:'1rem 0 0.75rem' }}>
                <button onClick={() => setShowAddForm(s => !s)}
                  style={{ padding:'0.7rem 1.2rem', background:'#fff', color:'#1a9e5c', border:'1.5px solid #1a9e5c', borderRadius:'8px', cursor:'pointer', fontSize:'0.9rem', fontWeight:600 }}>
                  + নতুন পণ্য যোগ করুন
                </button>
                <button onClick={updateAllRates}
                  style={{ flex:1, padding:'0.7rem', background:'#1a9e5c', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'15px', fontWeight:700 }}>
                  ✓ সব দাম Save করুন
                </button>
              </div>

              <div style={{ padding:'0.75rem', background:'#f0fdf4', borderRadius:'8px', fontSize:'0.85rem', color:'#166534' }}>
                💡 👁️ = customer দেখতে পাবে &nbsp;|&nbsp; 🙈 = customer দেখতে পাবে না &nbsp;|&nbsp; 📷 = ছবি পরিবর্তন করুন
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'products' && (
        <>
          <button onClick={() => { setAdding(true); setEditing(null); setForm(EMPTY); }}
            style={{ padding:'0.6rem 1.2rem', background:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', marginBottom:'1.5rem' }}>
            + Add Product
          </button>

          {(adding || editing) && (
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'1.5rem', marginBottom:'1.5rem' }}>
              <h3 style={{ margin:'0 0 1rem' }}>{editing ? 'Edit Product' : 'New Product'}</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 1rem' }}>
                <F label="Emoji (fallback)" field="emoji"        form={form} setForm={setForm} />
                <F label="Category"         field="category"     form={form} setForm={setForm} />
                <F label="Name (English)"   field="name"         form={form} setForm={setForm} />
                <F label="Name (Bangla)"    field="nameBn"       form={form} setForm={setForm} />
                <F label="Price (৳)"        field="price"        type="number" form={form} setForm={setForm} />
                <F label="Unit"             field="unit"         form={form} setForm={setForm} />
                <F label="Stock quantity"   field="stock"        type="number" form={form} setForm={setForm} />
              </div>

              <div style={{ marginBottom:'1rem' }}>
                <label style={{ fontSize:'0.8rem', color:'#666', display:'block', marginBottom:'0.5rem' }}>Product Image</label>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                  {form.image
                    ? <img src={form.image} alt="product" style={{ width:'64px', height:'64px', objectFit:'contain', borderRadius:'8px', border:'1px solid #e2e8f0' }} />
                    : <div style={{ width:'64px', height:'64px', background:'#f1f5f9', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>{form.emoji||'📦'}</div>
                  }
                  <div>
                    <button onClick={() => imgRef.current.click()} disabled={uploading}
                      style={{ padding:'0.5rem 1rem', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', cursor:'pointer', fontSize:'0.85rem' }}>
                      {uploading ? '⏳ Uploading...' : '📷 Upload Photo'}
                    </button>
                    {form.image && <button onClick={() => setForm(f => ({ ...f, image:'' }))} style={{ marginLeft:'0.5rem', padding:'0.5rem', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', cursor:'pointer', fontSize:'0.85rem' }}>✕</button>}
                  </div>
                </div>
                <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }}
                  onChange={e => uploadImage(e.target.files[0], (url) => setForm(f => ({ ...f, image:url })), setUploading)} />
              </div>

              <div style={{ marginBottom:'1rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                  <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#444' }}>Variants (optional)</label>
                  <button onClick={addVariant} style={{ padding:'0.3rem 0.7rem', background:'#2563eb', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem' }}>+ Add Variant</button>
                </div>
                {form.variants.map((v, i) => (
                  <div key={i} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'0.75rem', marginBottom:'0.5rem' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px', gap:'0.5rem', marginBottom:'0.5rem' }}>
                      <input placeholder="Name" value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)}
                        style={{ padding:'0.4rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'0.85rem' }} />
                      <input placeholder="Bangla name" value={v.nameBn} onChange={e => updateVariant(i, 'nameBn', e.target.value)}
                        style={{ padding:'0.4rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'0.85rem' }} />
                      <input placeholder="Price" type="number" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)}
                        style={{ padding:'0.4rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'0.85rem' }} />
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      {v.image
                        ? <img src={v.image} alt={v.name} style={{ width:'40px', height:'40px', objectFit:'contain', borderRadius:'6px', border:'1px solid #e2e8f0' }} />
                        : <div style={{ width:'40px', height:'40px', background:'#f1f5f9', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem' }}>{v.emoji||'📦'}</div>
                      }
                      <button onClick={() => { varImgRefs.current[i] && varImgRefs.current[i].click(); }} disabled={varUploading===i}
                        style={{ padding:'0.3rem 0.7rem', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem' }}>
                        {varUploading===i ? '⏳...' : '📷 Photo'}
                      </button>
                      <input ref={el => varImgRefs.current[i] = el} type="file" accept="image/*" style={{ display:'none' }}
                        onChange={e => uploadImage(e.target.files[0], (url) => updateVariant(i, 'image', url), (v) => setVarUploading(v ? i : null))} />
                      <button onClick={() => removeVariant(i)} style={{ padding:'0.3rem 0.7rem', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem', marginLeft:'auto' }}>🗑️ Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:'0.5rem' }}>
                <label><input type="checkbox" checked={form.isFast} onChange={e => setForm(f => ({ ...f, isFast: e.target.checked }))} /> ⚡ Fast</label>
                <label style={{ marginLeft:'1rem' }}><input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))} /> ✅ Available</label>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem' }}>
                <button onClick={handleSave} style={{ padding:'0.6rem 1.2rem', background:'#16a34a', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer' }}>Save</button>
                <button onClick={() => { setEditing(null); setAdding(false); }} style={{ padding:'0.6rem 1.2rem', background:'#e5e7eb', border:'none', borderRadius:'8px', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {loading ? <div style={{ textAlign:'center', padding:'2rem' }}>Loading...</div> : (
            <div style={{ display:'grid', gap:'0.75rem' }}>
              {products.map(p => (
                <div key={p._id} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'1rem', display:'flex', alignItems:'center', gap:'1rem', opacity: p.isAvailable ? 1 : 0.5 }}>
                  {p.image ? <img src={p.image} alt={p.name} style={{ width:'48px', height:'48px', objectFit:'contain', borderRadius:'6px' }} />
                    : <div style={{ fontSize:'1.8rem' }}>{p.emoji}</div>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600 }}>{p.name} <span style={{ color:'#888', fontWeight:400, fontSize:'0.85rem' }}>{p.nameBn}</span></div>
                    <div style={{ fontSize:'0.85rem', color:'#666' }}>{p.unit} · {p.category} · Stock: {p.stock} {p.isFast && '⚡'}</div>
                    {p.variants?.length > 0 && <div style={{ fontSize:'0.75rem', color:'#2563eb', marginTop:'0.2rem' }}>🔀 {p.variants.length} variants</div>}
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
        </>
      )}
    </div>
  );
}
