import { useState, useEffect, useRef } from 'react';
import AIAssistant from './AIAssistant';
import AdminOrders from './AdminOrders';

const API = import.meta.env.VITE_API_URL || 'https://citybest-1.onrender.com';
const CLOUD_NAME = 'dpzlzcyuj';
const UPLOAD_PRESET = 'citybest_products';

const EMPTY = { emoji:'📦', name:'', nameBn:'', price:'', unit:'', category:'rice', isFast:false, stock:0, isAvailable:true, image:'', variants:[] };
const EMPTY_VARIANT = { name:'', nameBn:'', price:'', image:'', emoji:'' };

function F({ label, field, type='text', form, setForm }) {
  return (
    <div style={{ marginBottom:'0.75rem' }}>
      <label style={{ fontSize:'0.8rem', color:'#666', display:'block', marginBottom:'0.25rem' }}>{label}</label>
      <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{ width:'100%', padding:'0.5rem', borderRadius:'6px', border:'1px solid #ddd', boxSizing:'border-box' }} />
    </div>
  );
}

// ── Categories Panel ──────────────────────────────────────────────────────────
function CategoriesPanel({ token }) {
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [editingCat,   setEditingCat]   = useState(null); // category id being edited
  const [catForm,      setCatForm]      = useState({});
  const [msg,          setMsg]          = useState('');
  const [uploading,    setUploading]    = useState(false);
  const imgRef = useRef();

  const headers = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/categories/all`, { headers });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch { flash('❌ Load failed'); }
    setLoading(false);
  };

  useEffect(() => { loadCategories(); }, []);

  const startEdit = (cat) => {
    setEditingCat(cat.id);
    setCatForm({ label:cat.label, emoji:cat.emoji, image:cat.image||'', bg:cat.bg, accent:cat.accent, visible:cat.visible });
  };

  const cancelEdit = () => { setEditingCat(null); setCatForm({}); };

  const saveCategory = async (id) => {
    try {
      const res  = await fetch(`${API}/api/categories/${id}`, {
        method:'PUT', headers,
        body: JSON.stringify(catForm),
      });
      const data = await res.json();
      if (data._id || data.id) {
        flash('✅ সংরক্ষিত হয়েছে!');
        setEditingCat(null);
        loadCategories();
      } else flash('❌ Error saving');
    } catch { flash('❌ Error'); }
  };

  const toggleVisible = async (cat) => {
    try {
      await fetch(`${API}/api/categories/${cat.id}`, {
        method:'PUT', headers,
        body: JSON.stringify({ ...cat, visible: !cat.visible }),
      });
      flash(cat.visible ? `⛔ ${cat.label} লুকানো হয়েছে` : `✅ ${cat.label} দেখানো হচ্ছে`);
      loadCategories();
    } catch { flash('❌ Error'); }
  };

  const uploadCatImage = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    try {
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:'POST', body:formData });
      const data = await res.json();
      if (data.secure_url) {
        setCatForm(f => ({ ...f, image: data.secure_url }));
        flash('✅ ছবি আপলোড হয়েছে!');
      }
    } catch { flash('❌ Upload failed'); }
    setUploading(false);
  };

  const ACCENT_PRESETS = [
    '#2563eb','#ca8a04','#ea580c','#15803d','#0284c7','#e11d48',
    '#7c3aed','#db2777','#0891b2','#65a30d','#d97706','#dc2626',
  ];
  const BG_PRESETS = [
    '#eff6ff','#fefce8','#fff7ed','#f0fdf4','#f0f9ff','#fff1f2',
    '#f5f3ff','#fdf2f8','#ecfeff','#f7fee7','#fffbeb','#fef2f2',
  ];

  if (loading) return <div style={{ textAlign:'center', padding:'2rem', color:'#666' }}>লোড হচ্ছে...</div>;

  return (
    <div>
      {msg && <div style={{ background:'#f0fdf4', border:'1px solid #86efac', padding:'0.75rem', borderRadius:'8px', marginBottom:'1rem', fontSize:'0.9rem' }}>{msg}</div>}

      <div style={{ display:'grid', gap:'0.6rem' }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', overflow:'hidden', opacity: cat.visible ? 1 : 0.55 }}>

            {/* Category row */}
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.85rem 1rem' }}>
              {/* Image/Emoji preview */}
              <div style={{ width:48, height:48, borderRadius:10, background:cat.bg, border:`2px solid ${cat.accent}33`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                {cat.image
                  ? <img src={cat.image} alt={cat.label} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                  : <span style={{ fontSize:24 }}>{cat.emoji}</span>
                }
              </div>

              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:'1rem', color:'#111' }}>{cat.label}</div>
                <div style={{ fontSize:'0.78rem', color:'#888', marginTop:2 }}>
                  <span style={{ background:cat.bg, color:cat.accent, padding:'2px 8px', borderRadius:20, fontWeight:600, fontSize:'0.72rem' }}>{cat.id}</span>
                  {!cat.visible && <span style={{ marginLeft:6, color:'#dc2626', fontSize:'0.72rem' }}>🙈 লুকানো</span>}
                </div>
              </div>

              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button onClick={() => toggleVisible(cat)}
                  title={cat.visible ? 'লুকাও' : 'দেখাও'}
                  style={{ padding:'0.4rem 0.7rem', background: cat.visible ? '#fef9c3' : '#f0fdf4', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem' }}>
                  {cat.visible ? '👁️' : '🙈'}
                </button>
                <button onClick={() => editingCat === cat.id ? cancelEdit() : startEdit(cat)}
                  style={{ padding:'0.4rem 0.8rem', background: editingCat===cat.id ? '#e5e7eb' : '#eff6ff', border:`1px solid ${editingCat===cat.id ? '#d1d5db' : '#bfdbfe'}`, borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>
                  {editingCat === cat.id ? '✕ বাতিল' : '✏️ Edit'}
                </button>
              </div>
            </div>

            {/* Edit panel */}
            {editingCat === cat.id && (
              <div style={{ borderTop:'1px solid #e2e8f0', padding:'1rem', background:'#f8fafc' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
                  <div>
                    <label style={{ fontSize:'0.78rem', color:'#666', display:'block', marginBottom:4 }}>নাম (বাংলা)</label>
                    <input value={catForm.label||''} onChange={e => setCatForm(f => ({ ...f, label:e.target.value }))}
                      style={{ width:'100%', padding:'0.5rem', borderRadius:'6px', border:'1px solid #ddd', boxSizing:'border-box', fontSize:'0.9rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:'0.78rem', color:'#666', display:'block', marginBottom:4 }}>Emoji (fallback)</label>
                    <input value={catForm.emoji||''} onChange={e => setCatForm(f => ({ ...f, emoji:e.target.value }))}
                      style={{ width:'100%', padding:'0.5rem', borderRadius:'6px', border:'1px solid #ddd', boxSizing:'border-box', fontSize:'1.2rem' }} />
                  </div>
                </div>

                {/* Image */}
                <div style={{ marginBottom:'0.75rem' }}>
                  <label style={{ fontSize:'0.78rem', color:'#666', display:'block', marginBottom:4 }}>ছবি</label>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem' }}>
                    <div style={{ width:52, height:52, borderRadius:10, background:catForm.bg||'#f0fdf4', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                      {catForm.image
                        ? <img src={catForm.image} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                        : <span style={{ fontSize:26 }}>{catForm.emoji}</span>
                      }
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1 }}>
                      <button onClick={() => imgRef.current.click()} disabled={uploading}
                        style={{ padding:'0.4rem 0.8rem', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>
                        {uploading ? '⏳ আপলোড হচ্ছে...' : '📷 ডিভাইস থেকে আপলোড'}
                      </button>
                      <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }}
                        onChange={e => uploadCatImage(e.target.files[0])} />
                      <input value={catForm.image||''} onChange={e => setCatForm(f => ({ ...f, image:e.target.value }))}
                        placeholder="অথবা ছবির URL পেস্ট করুন..."
                        style={{ padding:'0.4rem 0.6rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'0.8rem' }} />
                    </div>
                    {catForm.image && (
                      <button onClick={() => setCatForm(f => ({ ...f, image:'' }))}
                        style={{ padding:'0.3rem 0.6rem', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem' }}>✕</button>
                    )}
                  </div>
                </div>

                {/* Accent color */}
                <div style={{ marginBottom:'0.75rem' }}>
                  <label style={{ fontSize:'0.78rem', color:'#666', display:'block', marginBottom:6 }}>অ্যাকসেন্ট রঙ (লেখার রঙ)</label>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
                    {ACCENT_PRESETS.map(c => (
                      <div key={c} onClick={() => setCatForm(f => ({ ...f, accent:c }))}
                        style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', border: catForm.accent===c ? '3px solid #111' : '2px solid transparent', boxSizing:'border-box' }} />
                    ))}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="color" value={catForm.accent||'#16a34a'} onChange={e => setCatForm(f => ({ ...f, accent:e.target.value }))}
                      style={{ width:36, height:36, borderRadius:6, border:'none', cursor:'pointer', padding:0 }} />
                    <input value={catForm.accent||''} onChange={e => setCatForm(f => ({ ...f, accent:e.target.value }))}
                      style={{ width:90, padding:'0.4rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'0.85rem', fontFamily:'monospace' }} />
                  </div>
                </div>

                {/* Background color */}
                <div style={{ marginBottom:'1rem' }}>
                  <label style={{ fontSize:'0.78rem', color:'#666', display:'block', marginBottom:6 }}>ব্যাকগ্রাউন্ড রঙ (কার্ডের রঙ)</label>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
                    {BG_PRESETS.map(c => (
                      <div key={c} onClick={() => setCatForm(f => ({ ...f, bg:c }))}
                        style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', border: catForm.bg===c ? '3px solid #111' : '2px solid #ddd', boxSizing:'border-box' }} />
                    ))}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="color" value={catForm.bg||'#f0fdf4'} onChange={e => setCatForm(f => ({ ...f, bg:e.target.value }))}
                      style={{ width:36, height:36, borderRadius:6, border:'none', cursor:'pointer', padding:0 }} />
                    <input value={catForm.bg||''} onChange={e => setCatForm(f => ({ ...f, bg:e.target.value }))}
                      style={{ width:90, padding:'0.4rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'0.85rem', fontFamily:'monospace' }} />
                  </div>
                </div>

                {/* Live preview */}
                <div style={{ marginBottom:'1rem' }}>
                  <label style={{ fontSize:'0.78rem', color:'#666', display:'block', marginBottom:6 }}>প্রিভিউ</label>
                  <div style={{ background:catForm.bg||'#f0fdf4', border:`1.5px solid ${catForm.accent||'#16a34a'}33`, borderRadius:14, padding:'14px 8px 12px', textAlign:'center', display:'inline-flex', flexDirection:'column', alignItems:'center', gap:6, minWidth:90 }}>
                    <div style={{ width:48, height:48, borderRadius:10, background:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                      {catForm.image ? <img src={catForm.image} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} /> : <span style={{ fontSize:28 }}>{catForm.emoji}</span>}
                    </div>
                    <span style={{ fontWeight:700, fontSize:12, color:catForm.accent||'#16a34a' }}>{catForm.label}</span>
                  </div>
                </div>

                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button onClick={() => saveCategory(cat.id)}
                    style={{ padding:'0.6rem 1.4rem', background:'#16a34a', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700, fontSize:'0.9rem' }}>
                    ✓ সংরক্ষণ করুন
                  </button>
                  <button onClick={cancelEdit}
                    style={{ padding:'0.6rem 1rem', background:'#e5e7eb', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'0.9rem' }}>
                    বাতিল
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop:'1rem', padding:'0.75rem', background:'#f0fdf4', borderRadius:'8px', fontSize:'0.82rem', color:'#166534' }}>
        💡 👁️ = গ্রাহক দেখতে পাবে &nbsp;|&nbsp; 🙈 = গ্রাহক দেখতে পাবে না &nbsp;|&nbsp; ✏️ = সম্পাদনা করুন
      </div>
    </div>
  );
}

export default function AdminDashboard({ token, onLogout }) {
  const [tab,          setTab]         = useState('products');
  const [productView,  setProductView] = useState('list'); // 'list' | 'categories'
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
      await fetch(`${API}/api/liverate/toggle`, { method:'POST', headers, body: JSON.stringify({ id }) });
      flashRate(active ? '⛔ ' + name + ' hide করা হয়েছে' : '✅ ' + name + ' show করা হয়েছে');
      loadRates();
    } catch { flashRate('❌ Error'); }
  };

  const addRate = async () => {
    if (!newRate.id || !newRate.name || !newRate.price) { flashRate('❌ সব তথ্য দিন'); return; }
    try {
      const res = await fetch(`${API}/api/liverate/add`, { method:'POST', headers, body: JSON.stringify({ ...newRate, price: Number(newRate.price), active: true }) });
      const data = await res.json();
      if (data._id) { flashRate('✅ ' + data.name + ' যোগ হয়েছে!'); setShowAddForm(false); setNewRate({ type:'cylinder', id:'', name:'', price:'', unit:'১২ কেজি সিলিন্ডার', img:'' }); loadRates(); }
    } catch { flashRate('❌ Error'); }
  };

  const updateAllRates = async () => {
    try {
      let updated = 0;
      const allIds = new Set([...Object.keys(editingRates), ...Object.keys(editingImgs)]);
      for (const id of allIds) {
        const body = { id, price: Number(editingRates[id]) };
        if (editingImgs[id] !== undefined) body.img = editingImgs[id];
        const res = await fetch(`${API}/api/liverate/update`, { method:'POST', headers, body: JSON.stringify(body) });
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
      if (data.secure_url) { setEditingImgs(prev => ({ ...prev, [id]: data.secure_url })); flashRate('✅ ছবি upload হয়েছে! Save করুন।'); }
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
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock), variants: form.variants.map(v => ({ ...v, price: Number(v.price) })) };
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
  const updateVariant = (i, field, val) => setForm(f => ({ ...f, variants: f.variants.map((v, idx) => idx === i ? { ...v, [field]: val } : v) }));

  const RateCard = ({ r }) => (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'0.85rem 1rem', display:'flex', alignItems:'center', gap:'1rem', opacity: r.active ? 1 : 0.45 }}>
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
        <input type="number" value={editingRates[r.id] ?? r.price}
          onChange={e => setEditingRates(prev => ({ ...prev, [r.id]: e.target.value }))}
          style={{ width:'90px', padding:'0.4rem 0.5rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'1rem', fontWeight:600, color:'#1a9e5c', textAlign:'center' }} />
        <button onClick={() => toggleRate(r.id, r.name, r.active)}
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
          <button key={key} onClick={() => { setTab(key); if (key !== 'products') setProductView('list'); }}
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
                <div style={{ display:'grid', gap:'0.6rem' }}>{cylinders.map(r => <RateCard key={r.id} r={r} />)}</div>
              </div>
              <div style={{ marginBottom:'1rem' }}>
                <h3 style={{ margin:'0 0 1rem', color:'#1a9e5c', fontSize:'1rem' }}>🍚 চাল</h3>
                <div style={{ display:'grid', gap:'0.6rem' }}>{rices.map(r => <RateCard key={r.id} r={r} />)}</div>
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
                    <input placeholder="নাম (বাংলায়)" value={newRate.name} onChange={e => setNewRate(p => ({ ...p, name:e.target.value }))}
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
                <button onClick={() => setShowAddForm(s => !s)} style={{ padding:'0.7rem 1.2rem', background:'#fff', color:'#1a9e5c', border:'1.5px solid #1a9e5c', borderRadius:'8px', cursor:'pointer', fontSize:'0.9rem', fontWeight:600 }}>+ নতুন পণ্য যোগ করুন</button>
                <button onClick={updateAllRates} style={{ flex:1, padding:'0.7rem', background:'#1a9e5c', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'15px', fontWeight:700 }}>✓ সব দাম Save করুন</button>
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
          {/* ── Action buttons ── */}
          <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
            <button onClick={() => { setAdding(true); setEditing(null); setForm(EMPTY); setProductView('list'); }}
              style={{ padding:'0.6rem 1.2rem', background: productView==='list' && adding ? '#1d4ed8' : '#2563eb', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:600 }}>
              + Add Product
            </button>
            <button onClick={() => { setProductView(productView === 'categories' ? 'list' : 'categories'); setAdding(false); setEditing(null); }}
              style={{ padding:'0.6rem 1.2rem', background: productView==='categories' ? '#f0fdf4' : '#fff', color: productView==='categories' ? '#15803d' : '#374151', border: productView==='categories' ? '2px solid #15803d' : '1.5px solid #e2e8f0', borderRadius:'8px', cursor:'pointer', fontWeight:600 }}>
              📂 Categories {productView==='categories' ? '▲' : '▼'}
            </button>
          </div>

          {/* ── Categories panel ── */}
          {productView === 'categories' && (
            <div style={{ marginBottom:'1.5rem' }}>
              <h3 style={{ margin:'0 0 1rem', fontSize:'1rem', color:'#374151' }}>📂 ক্যাটাগরি ম্যানেজমেন্ট</h3>
              <CategoriesPanel token={token} />
            </div>
          )}

          {/* ── Add/Edit form ── */}
          {(adding || editing) && (
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'1.5rem', marginBottom:'1.5rem' }}>
              <h3 style={{ margin:'0 0 1rem' }}>{editing ? 'Edit Product' : 'New Product'}</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 1rem' }}>
                <F label="Emoji (fallback)" field="emoji"    form={form} setForm={setForm} />
                <F label="Category"         field="category" form={form} setForm={setForm} />
                <F label="Name (English)"   field="name"     form={form} setForm={setForm} />
                <F label="Name (Bangla)"    field="nameBn"   form={form} setForm={setForm} />
                <F label="Price (৳)"        field="price"    type="number" form={form} setForm={setForm} />
                <F label="Unit"             field="unit"     form={form} setForm={setForm} />
                <F label="Stock quantity"   field="stock"    type="number" form={form} setForm={setForm} />
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
                      <input placeholder="Name" value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} style={{ padding:'0.4rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'0.85rem' }} />
                      <input placeholder="Bangla name" value={v.nameBn} onChange={e => updateVariant(i, 'nameBn', e.target.value)} style={{ padding:'0.4rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'0.85rem' }} />
                      <input placeholder="Price" type="number" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} style={{ padding:'0.4rem', borderRadius:'6px', border:'1px solid #ddd', fontSize:'0.85rem' }} />
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      {v.image ? <img src={v.image} alt={v.name} style={{ width:'40px', height:'40px', objectFit:'contain', borderRadius:'6px', border:'1px solid #e2e8f0' }} />
                        : <div style={{ width:'40px', height:'40px', background:'#f1f5f9', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem' }}>{v.emoji||'📦'}</div>}
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

          {/* ── Product list ── */}
          {productView !== 'categories' && (
            loading ? <div style={{ textAlign:'center', padding:'2rem' }}>Loading...</div> : (
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
            )
          )}
          <AIAssistant products={products} token={token} onRefresh={loadProducts} />
        </>
      )}
    </div>
  );
}
