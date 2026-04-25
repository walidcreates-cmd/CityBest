import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const C = {
  green:      '#0e8a4a',
  greenLight: '#e6f4ed',
  greenMid:   '#1aab5f',
  bg:         '#f5f6fa',
  white:      '#ffffff',
  text:       '#111827',
  textMid:    '#4b5563',
  textLight:  '#9ca3af',
  border:     '#e5e7eb',
  orange:     '#f97316',
  orangeLight:'#fff7ed',
  red:        '#ef4444',
  redLight:   '#fef2f2',
  yellow:     '#fbbf24',
};

const FALLBACK_PRODUCTS = [
  { id:1, emoji:'🔵', name:'সিলিন্ডার গ্যাস', nameEn:'Gas Cylinder',    price:1250, unit:'12 কেজি',      category:'gas',   isFast:true,  stock:'low', rating:4.8 },
  { id:2, emoji:'🍚', name:'মিনিকেট চাল',     nameEn:'Miniket Rice',    price:75,   unit:'প্রতি কেজি',   category:'rice',  isFast:true,  stock:'ok',  rating:4.6 },
  { id:3, emoji:'🫙', name:'সয়াবিন তেল',     nameEn:'Soybean Oil',     price:165,  unit:'প্রতি লিটার',  category:'oil',   isFast:false, stock:'ok',  rating:4.5 },
  { id:4, emoji:'🥦', name:'ফুলকপি',          nameEn:'Cauliflower',     price:35,   unit:'প্রতিটি',      category:'veg',   isFast:true,  stock:'ok',  rating:4.3 },
  { id:5, emoji:'🐟', name:'রুই মাছ',         nameEn:'Rohu Fish',       price:220,  unit:'প্রতি কেজি',   category:'fish',  isFast:false, stock:'ok',  rating:4.7 },
  { id:6, emoji:'🌶️', name:'মরিচ গুঁড়া',     nameEn:'Chili Powder',    price:180,  unit:'৫০০ গ্রাম',    category:'spice', isFast:false, stock:'ok',  rating:4.4 },
  { id:7, emoji:'🍚', name:'নাজিরশাইল চাল',   nameEn:'Nazirshail Rice', price:85,   unit:'প্রতি কেজি',   category:'rice',  isFast:false, stock:'ok',  rating:4.5 },
  { id:8, emoji:'🥦', name:'আলু',             nameEn:'Potato',          price:28,   unit:'প্রতি কেজি',   category:'veg',   isFast:true,  stock:'ok',  rating:4.2 },
];

const CATEGORIES = [
  { id:'all',   label:'সব',      emoji:'🏪', bg:'#f0fdf4', accent:'#16a34a' },
  { id:'gas',   label:'গ্যাস',   emoji:'🔵', bg:'#eff6ff', accent:'#2563eb' },
  { id:'rice',  label:'চাল',     emoji:'🍚', bg:'#fefce8', accent:'#ca8a04' },
  { id:'oil',   label:'তেল',     emoji:'🫙', bg:'#fff7ed', accent:'#ea580c' },
  { id:'veg',   label:'সবজি',    emoji:'🥦', bg:'#f0fdf4', accent:'#15803d' },
  { id:'fish',  label:'মাছ',     emoji:'🐟', bg:'#f0f9ff', accent:'#0284c7' },
  { id:'spice', label:'মশলা',    emoji:'🌶️', bg:'#fff1f2', accent:'#e11d48' },
];

async function getAuthHeader(user) {
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function QtyControl({ qty, onInc, onDec }) {
  if (qty === 0) {
    return (
      <button onClick={onInc} style={{
        width:'100%', background:C.green, color:'#fff',
        border:'none', borderRadius:10, padding:'8px',
        fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
      }}>+ যোগ করুন</button>
    );
  }
  return (
    <div style={{ display:'flex', alignItems:'center', background:C.green, borderRadius:10, overflow:'hidden' }}>
      <button onClick={onDec} style={{ background:'transparent', border:'none', color:'#fff', width:34, height:34, fontSize:18, cursor:'pointer', fontWeight:700 }}>−</button>
      <span style={{ color:'#fff', fontWeight:800, fontSize:15, flex:1, textAlign:'center' }}>{qty}</span>
      <button onClick={onInc} style={{ background:'transparent', border:'none', color:'#fff', width:34, height:34, fontSize:18, cursor:'pointer', fontWeight:700 }}>+</button>
    </div>
  );
}

function ProductCard({ product, onInc, onDec }) {
  return (
    <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:14, display:'flex', flexDirection:'column', gap:7 }}>
      <div style={{ fontSize:40, textAlign:'center', lineHeight:1 }}>{product.emoji}</div>
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', minHeight:18 }}>
        {product.isFast && <span style={{ background:C.orangeLight, color:C.orange, fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:50 }}>⚡ দ্রুত</span>}
        {product.stock === 'low' && <span style={{ background:C.redLight, color:C.red, fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:50 }}>স্বল্প স্টক</span>}
      </div>
      <div style={{ fontWeight:700, fontSize:13, color:C.text, lineHeight:1.3 }}>{product.name}</div>
      <div style={{ fontSize:10, color:C.textLight }}>{product.unit}</div>
      <div style={{ display:'flex', alignItems:'center', gap:3 }}>
        <span style={{ color:C.yellow, fontSize:11 }}>★</span>
        <span style={{ fontSize:10, color:C.textMid, fontWeight:600 }}>{product.rating || '4.5'}</span>
      </div>
      <div style={{ fontWeight:800, fontSize:16, color:C.green }}>৳{product.price}</div>
      <QtyControl qty={product.qty || 0} onInc={onInc} onDec={onDec} />
    </div>
  );
}

function BottomNav({ active, onTab }) {
  const tabs = [
    { id:'home',    label:'হোম',      emoji:'🏠' },
    { id:'search',  label:'খোঁজুন',   emoji:'🔍' },
    { id:'orders',  label:'অর্ডার',   emoji:'📦' },
    { id:'profile', label:'প্রোফাইল', emoji:'👤' },
  ];
  return (
    <div className="app-bottom-nav" style={{
      position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
      width:'100%', maxWidth:'100%', background:C.white,
      borderTop:`1px solid ${C.border}`, display:'flex', zIndex:150,
      paddingBottom:'env(safe-area-inset-bottom, 0px)',
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTab(t.id)} style={{
          flex:1, background:'none', border:'none', padding:'10px 0 8px',
          display:'flex', flexDirection:'column', alignItems:'center', gap:3,
          cursor:'pointer', fontFamily:'inherit',
        }}>
          <span style={{ fontSize:20 }}>{t.emoji}</span>
          <span style={{ fontSize:10, fontWeight:active===t.id?700:500, color:active===t.id?C.green:C.textLight }}>{t.label}</span>
          {active===t.id && <div style={{ width:4, height:4, background:C.green, borderRadius:'50%' }} />}
        </button>
      ))}
    </div>
  );
}

function LoadingScreen({ message = 'CityBest লোড হচ্ছে...' }) {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg, #e6f4ed 0%, #f5f6fa 100%)',
      flexDirection:'column', gap:16, fontFamily:"'Hind Siliguri', sans-serif",
    }}>
      <span style={{ fontSize:52 }}>🛒</span>
      <p style={{ color:C.green, fontWeight:700, fontSize:18 }}>{message}</p>
    </div>
  );
}


// ── Helper: Bengali digits ────────────────────────────────────────────────────
function toBnDigits(n) {
  return String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
}

// ── GasOrderSection: inline brand picker + order form ────────────────────────
function GasOrderSection({ user }) {
  const [brands,     setBrands]     = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [qty,        setQty]        = useState(1);
  const [step,       setStep]       = useState('brands');
  const [name,       setName]       = useState('');
  const [phone,      setPhone]      = useState('');
  const [address,    setAddress]    = useState('');
  const [note,       setNote]       = useState('');
  const [lat,        setLat]        = useState('');
  const [lng,        setLng]        = useState('');
  const [gpsState,   setGpsState]   = useState('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    if (user && user.phoneNumber) setPhone(user.phoneNumber.replace(/^\+88/, ''));
  }, [user]);

  useEffect(() => {
    fetch(API_BASE + '/api/liverate')
      .then(r => r.json())
      .then(data => setBrands(data.filter(r => r.type === 'cylinder')))
      .catch(() => setBrands([
        { id:'omera',       name:'ওমেরা',     unit:'১২ কেজি সিলিন্ডার', price:1250, img:'https://res.cloudinary.com/dpzlzcyuj/image/upload/v1774787034/a7nheq7xjpljr9sshn4f.png' },
        { id:'bashundhara', name:'বসুন্ধরা',  unit:'১২ কেজি সিলিন্ডার', price:1260, img:'https://res.cloudinary.com/dpzlzcyuj/image/upload/v1774787467/ijav7iuuwfnzwu9n0pfd.png' },
        { id:'jamuna',      name:'যমুনা',     unit:'১২ কেজি সিলিন্ডার', price:1240, img:'https://res.cloudinary.com/dpzlzcyuj/image/upload/v1774787626/nsa6ubcgvqyqibrzkwwl.png' },
        { id:'fresh',       name:'ফ্রেশ',     unit:'১২ কেজি সিলিন্ডার', price:1255, img:'https://res.cloudinary.com/dpzlzcyuj/image/upload/v1774786508/o9hi5htwvmcrunb9s2ph.png' },
        { id:'laugfs',      name:'লাউগফস',    unit:'১২ কেজি সিলিন্ডার', price:1245, img:'' },
        { id:'beximco',     name:'বেক্সিমকো', unit:'১২ কেজি সিলিন্ডার', price:1250, img:'' },
      ]));
  }, []);

  const getGPS = () => {
    if (!navigator.geolocation) return;
    setGpsState('loading');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        setLat(pos.coords.latitude); setLng(pos.coords.longitude);
        try {
          const r = await fetch('https://nominatim.openstreetmap.org/reverse?lat=' + pos.coords.latitude + '&lon=' + pos.coords.longitude + '&format=json&accept-language=bn');
          const d = await r.json();
          if (d.display_name) setAddress(d.display_name);
        } catch {}
        setGpsState('done');
      },
      () => setGpsState('fail'),
      { timeout:10000, enableHighAccuracy:true }
    );
  };

  const submitOrder = async () => {
    if (!name.trim())              { setError('নাম দিন'); return; }
    if (!phone || phone.length<10) { setError('সঠিক মোবাইল নম্বর দিন'); return; }
    if (!address.trim())           { setError('ডেলিভারি ঠিকানা দিন'); return; }
    setError(''); setSubmitting(true);
    try {
      await fetch(API_BASE + '/api/orders', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ uid:user?user.uid:'guest', items:[{ productId:selected.id, name:selected.name, qty, price:selected.price }], customerName:name, total:selected.price*qty, address, phone, note, lat, lng, paymentMethod:'cod' }),
      });
      setStep('success');
    } catch { setError('অর্ডার দেওয়া যায়নি। আবার চেষ্টা করুন।'); }
    setSubmitting(false);
  };

  const reset = () => {
    setSelected(null); setQty(1); setStep('brands'); setName('');
    setAddress(''); setNote(''); setLat(''); setLng(''); setGpsState('idle'); setError('');
    if (!(user && user.phoneNumber)) setPhone('');
  };

  const inp = { width:'100%', border:'1.5px solid '+C.border, borderRadius:10, padding:'10px 12px', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box', color:C.text };

  if (step === 'brands') return (
    <div style={{ margin:'12px 16px 0' }}>
      <div style={{ fontWeight:800, fontSize:14, color:C.text, marginBottom:10 }}>������ ব্র্যান্ড বেছে অর্ডার করুন</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {brands.map(b => (
          <div key={b.id} onClick={() => setSelected(b)} style={{ border:'2px solid '+(selected&&selected.id===b.id?C.green:C.border), borderRadius:14, padding:12, background:selected&&selected.id===b.id?C.greenLight:C.white, cursor:'pointer', textAlign:'center', position:'relative', transition:'all 0.15s' }}>
            {selected&&selected.id===b.id && <div style={{ position:'absolute', top:8, right:8, width:20, height:20, background:C.green, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700 }}>✓</div>}
            <div style={{ width:64, height:64, margin:'0 auto 8px', borderRadius:10, background:'#f8f8f8', border:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
              {b.img ? <img src={b.img} alt={b.name} style={{ width:'100%', height:'100%', objectFit:'contain' }} /> : <span style={{ fontSize:32 }}>������</span>}
            </div>
            <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{b.name}</div>
            <div style={{ fontSize:11, color:C.textLight, marginTop:2 }}>{b.unit}</div>
            <div style={{ fontWeight:800, fontSize:15, color:C.green, marginTop:4 }}>৳{toBnDigits(b.price.toLocaleString())}</div>
          </div>
        ))}
      </div>
      {selected && <div style={{ marginTop:10, background:C.greenLight, border:'1px solid #a5d6a7', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}><div style={{ width:24, height:24, background:C.green, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12 }}>✓</div><div style={{ fontSize:13, color:'#2e7d32', fontWeight:600 }}>{selected.name} — ৳{toBnDigits(selected.price)} / সিলিন্ডার</div></div>}
      <button onClick={() => { if (!selected) { alert('প্রথমে একটি ব্র্যান্ড বেছে নিন'); return; } setStep('form'); }} style={{ width:'100%', marginTop:10, background:C.green, color:'#fff', border:'none', borderRadius:12, padding:'13px', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>������️ অর্ডার করুন</button>
    </div>
  );

  if (step === 'form' && selected) return (
    <div style={{ margin:'12px 16px 0', background:C.white, borderRadius:14, border:'1px solid '+C.border, padding:16, display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:C.greenLight, borderRadius:10, padding:'10px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:40, height:40, borderRadius:8, background:'#fff', border:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            {selected.img ? <img src={selected.img} alt={selected.name} style={{ width:'100%', height:'100%', objectFit:'contain' }} /> : <span style={{ fontSize:24 }}>������</span>}
          </div>
          <div><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{selected.name}</div><div style={{ fontSize:12, color:C.textLight }}>{selected.unit}</div></div>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10 }}>
          <span style={{ fontSize:13, color:C.textMid, fontWeight:600 }}>পরিমাণ</span>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setQty(q => Math.max(1,q-1))} style={{ width:34, height:34, border:'2px solid '+C.green, borderRadius:'50%', background:'none', color:C.green, fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>−</button>
            <span style={{ fontWeight:800, fontSize:20, minWidth:24, textAlign:'center' }}>{toBnDigits(qty)}</span>
            <button onClick={() => setQty(q => q+1)} style={{ width:34, height:34, border:'2px solid '+C.green, borderRadius:'50%', background:'none', color:C.green, fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>+</button>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:'1px solid #c8e6c9' }}>
          <span style={{ fontWeight:700, fontSize:14 }}>মোট</span>
          <span style={{ fontWeight:800, fontSize:18, color:C.green }}>৳{toBnDigits((selected.price*qty).toLocaleString())}</span>
        </div>
      </div>
      <div><label style={{ fontSize:13, color:C.textMid, fontWeight:600, display:'block', marginBottom:5 }}>������ আপনার নাম *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="পূর্ণ নাম লিখুন" style={inp} /></div>
      <div><label style={{ fontSize:13, color:C.textMid, fontWeight:600, display:'block', marginBottom:5 }}>������ মোবাইল নম্বর *</label><input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} placeholder="01XXXXXXXXX" maxLength={11} style={inp} /></div>
      <div>
        <label style={{ fontSize:13, color:C.textMid, fontWeight:600, display:'block', marginBottom:5 }}>������ ডেলিভারি ঠিকানা *</label>
        <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} placeholder="বাড়ি নং, মহল্লা, সিরাজগঞ্জ সদর" style={{ ...inp, resize:'none' }} />
        <button onClick={getGPS} disabled={gpsState==='loading'} style={{ marginTop:6, width:'100%', background:gpsState==='done'?'#c8e6c9':C.greenLight, color:C.green, border:'1.5px dashed '+C.green, borderRadius:10, padding:'9px', fontSize:13, fontWeight:700, fontFamily:'inherit', cursor:'pointer' }}>
          {gpsState==='idle'&&'������ আমার লোকেশন ব্যবহার করুন'}{gpsState==='loading'&&'⏳ লোকেশন খোঁজা হচ্ছে...'}{gpsState==='done'&&'✅ লোকেশন পাওয়া গেছে'}{gpsState==='fail'&&'❌ লোকেশন পাওয়া যায়নি'}
        </button>
      </div>
      <div><label style={{ fontSize:13, color:C.textMid, fontWeight:600, display:'block', marginBottom:5 }}>������ বিশেষ নির্দেশনা (ঐচ্ছিক)</label><input value={note} onChange={e => setNote(e.target.value)} placeholder="যেমন: গেটের বাইরে রাখুন" style={inp} /></div>
      <div style={{ background:C.greenLight, border:'1px solid #a5d6a7', borderRadius:10, padding:'10px 14px', display:'flex', gap:10 }}><span style={{ fontSize:18 }}>������️</span><span style={{ fontSize:13, color:'#2e7d32', lineHeight:1.5 }}><strong>ক্যাশ অন ডেলিভারি</strong> — পণ্য হাতে পেয়ে টাকা দিন।</span></div>
      {error && <div style={{ background:C.redLight, borderRadius:10, padding:'10px 14px', color:C.red, fontSize:14, fontWeight:600 }}>{error}</div>}
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={() => { setStep('brands'); setError(''); }} style={{ flex:1, background:C.bg, border:'1px solid '+C.border, borderRadius:10, padding:'12px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:C.textMid }}>← ফিরে যান</button>
        <button onClick={submitOrder} disabled={submitting} style={{ flex:2, background:submitting?'#9ca3af':C.green, color:'#fff', border:'none', borderRadius:10, padding:'12px', fontSize:15, fontWeight:700, cursor:submitting?'not-allowed':'pointer', fontFamily:'inherit' }}>
          {submitting?'অর্ডার দেওয়া হচ্ছে...':'✓ অর্ডার নিশ্চিত করুন'}
        </button>
      </div>
    </div>
  );

  if (step === 'success') return (
    <div style={{ margin:'12px 16px 0', background:C.white, borderRadius:14, border:'1px solid '+C.border, padding:24, textAlign:'center' }}>
      <div style={{ width:72, height:72, background:C.greenLight, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto 14px' }}>✅</div>
      <div style={{ fontWeight:800, fontSize:20, color:C.text }}>অর্ডার হয়েছে!</div>
      <div style={{ color:C.textMid, fontSize:13, marginTop:6, lineHeight:1.6 }}>আপনার অর্ডার পেয়েছি।<br/>{phone} নম্বরে কনফার্মেশন কল পাবেন।</div>
      <div style={{ margin:'14px 0', background:C.greenLight, border:'1px solid #c8e6c9', borderRadius:12, padding:14, textAlign:'left' }}>
        {[['পণ্য', selected?selected.name:''], ['পরিমাণ', toBnDigits(qty)+' সিলিন্ডার'], ['ঠিকানা', address], ['মোট', '৳'+toBnDigits((selected?selected.price*qty:0).toLocaleString())]].map(pair => (
          <div key={pair[0]} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:13 }}>
            <span style={{ color:C.textLight }}>{pair[0]}</span>
            <span style={{ fontWeight:600, color:C.text, textAlign:'right', maxWidth:'60%' }}>{pair[1]}</span>
          </div>
        ))}
      </div>
      <a href="tel:01764101555" style={{ display:'inline-flex', alignItems:'center', gap:6, color:C.green, fontSize:15, fontWeight:700, textDecoration:'none', marginBottom:14 }}>������ 01764-101555</a><br/>
      <button onClick={reset} style={{ background:'none', border:'2px solid '+C.green, color:C.green, borderRadius:12, padding:'10px 28px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>আবার অর্ডার করুন</button>
    </div>
  );

  return null;
}

// ── CategoryPage ──────────────────────────────────────────────────────────────
function CategoryPage({ category, products, onUpdateQty, onBack, onCategoryNav, onTab, activeTab, user, categories }) {
  const catProducts = category.id === 'all' ? products : products.filter(p => p.category === category.id);
  const allCats   = categories && categories.length > 0 ? categories : CATEGORIES.filter(c => c.id !== 'all');
  const otherCats = allCats.filter(c => c.id !== category.id);

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Hind Siliguri', sans-serif", paddingBottom:130 }}>
      <div style={{ background:C.green, padding:'14px 16px 12px', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:100 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:50, width:36, height:36, fontSize:18, cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <div>
          <div style={{ color:'#fff', fontWeight:800, fontSize:18 }}>{category.emoji} {category.label}</div>
          <div style={{ color:'rgba(255,255,255,0.75)', fontSize:10, marginTop:1 }}>{toBnDigits(catProducts.length)} টি পণ্য</div>
        </div>
      </div>

      {category.id === 'gas' && <GasOrderSection user={user} />}

      {catProducts.length > 0 && (
        <>
          <div style={{ padding:'14px 16px 8px', fontWeight:800, fontSize:14, color:C.text }}>������️ {category.label} পণ্য</div>
          <div style={{ display:'grid', gridTemplateColumns:window.innerWidth>=768?'repeat(4,1fr)':'1fr 1fr', gap:12, padding:'0 16px' }}>
            {catProducts.map(p => (
              <ProductCard key={p.id||p._id} product={p}
                onInc={() => onUpdateQty(p.id||p._id, 1)}
                onDec={() => onUpdateQty(p.id||p._id, -1)}
              />
            ))}
          </div>
        </>
      )}

      {catProducts.length === 0 && category.id !== 'gas' && (
        <div style={{ textAlign:'center', padding:'60px 32px' }}>
          <div style={{ fontSize:56 }}>{category.emoji}</div>
          <div style={{ fontWeight:700, fontSize:17, color:C.text, marginTop:14 }}>শীঘ্রই আসছে</div>
          <div style={{ color:C.textLight, fontSize:13, marginTop:6 }}>এই ক্যাটাগরি শীঘ্রই যোগ হবে</div>
        </div>
      )}

      <div style={{ padding:'20px 16px 8px' }}>
        <div style={{ fontWeight:800, fontSize:14, color:C.text, marginBottom:12 }}>অন্যান্য ক্যাটাগরি</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
          {otherCats.map(cat => (
            <button key={cat.id} onClick={() => onCategoryNav(cat)} style={{ background:cat.bg, border:'1.5px solid '+cat.accent+'33', borderRadius:14, padding:'12px 8px', cursor:'pointer', fontFamily:'inherit', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              {cat.image ? <img src={cat.image} alt={cat.label} style={{ width:36, height:36, objectFit:'contain' }} /> : <span style={{ fontSize:28 }}>{cat.emoji || '🛒'}</span>}
              <span style={{ fontWeight:700, fontSize:12, color:cat.accent }}>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav active={activeTab} onTab={onTab} />
    </div>
  );
}

function HomePage({ products, onUpdateQty, onCart, onTab, activeTab, onCategoryOpen, categories }) {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('all');

  const cartCount  = products.reduce((s,p) => s + (p.qty||0), 0);
  const cartAmount = products.reduce((s,p) => s + p.price * (p.qty||0), 0);

  const filtered = products.filter(p => {
    const matchCat    = category === 'all' || p.category === category;
    const matchSearch = p.name.includes(search) || (p.nameEn||'').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Hind Siliguri', sans-serif", maxWidth:'100%', margin:'0 auto', paddingBottom:130 }}>
      <div style={{ background:C.green, padding:'14px 16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, gap:12 }}>
        <div>
          <div style={{ color:'#fff', fontWeight:800, fontSize:21, lineHeight:1 }}>CityBest</div>
          <div style={{ color:'rgba(255,255,255,0.75)', fontSize:10, marginTop:2 }}>সিরাজগঞ্জ • দ্রুত ডেলিভারি</div>
        </div>
        <div style={{ flex:1, background:'rgba(255,255,255,0.18)', borderRadius:10, display:'flex', alignItems:'center', padding:'8px 12px', gap:8 }}>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="পণ্য খুঁজুন..." style={{ border:'none', outline:'none', flex:1, fontSize:13, fontFamily:'inherit', background:'transparent', color:'#fff' }} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => onTab('profile')} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:50, width:38, height:38, fontSize:17, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>👤</button>
          <button onClick={onCart} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:50, width:38, height:38, fontSize:17, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
            🛒
            {cartCount > 0 && <span style={{ position:'absolute', top:-2, right:-2, background:C.orange, color:'#fff', borderRadius:50, width:17, height:17, fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{cartCount}</span>}
          </button>
        </div>
      </div>

      {!search && (
        <div style={{ padding:'12px 16px 0' }}>
          <div style={{ background:`linear-gradient(135deg, ${C.green}, ${C.greenMid})`, borderRadius:16, padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', overflow:'hidden' }}>
            <div>
              <div style={{ color:'#fff', fontWeight:800, fontSize:17, lineHeight:1.3 }}>৩০ মিনিটে<br/>ডেলিভারি! ⚡</div>
              <div style={{ color:'rgba(255,255,255,0.85)', fontSize:11, marginTop:5 }}>প্রথম অর্ডারে ৫০ টাকা ছাড়</div>
              <div style={{ marginTop:9, background:C.orange, borderRadius:8, padding:'5px 12px', color:'#fff', fontSize:11, fontWeight:700, display:'inline-block' }}>অর্ডার করুন →</div>
            </div>
            <div style={{ fontSize:54, opacity:0.9 }}>🛵</div>
          </div>
        </div>
      )}

      {!search && (
        <>
          <div style={{ padding:'16px 16px 6px', fontWeight:800, fontSize:14, color:C.text }}>ক্যাটাগরি</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10, padding:'0 16px 4px' }}>
            {(categories && categories.length > 0 ? categories : CATEGORIES.filter(c => c.id !== 'all')).map(cat => (
              <button key={cat.id} onClick={() => onCategoryOpen(cat)} style={{ background:cat.bg, border:'1.5px solid '+cat.accent+'33', borderRadius:16, padding:0, cursor:'pointer', fontFamily:'inherit', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:0, boxShadow:'0 2px 8px rgba(0,0,0,0.05)', overflow:'hidden' }}>
                {cat.image ? <img src={cat.image} alt={cat.label} style={{ width:'100%', height:80, objectFit:'cover', display:'block' }} /> : <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', background:cat.bg }}><span style={{ fontSize:32 }}>{cat.emoji || '🛒'}</span></div>}
                <span style={{ fontWeight:700, fontSize:12, color:cat.accent, padding:'6px 4px 8px', display:'block', width:'100%' }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {!search && (
        <div style={{ padding:'12px 0 0' }}>
          <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                flexShrink:0, background:category===cat.id?C.green:C.white,
                color:category===cat.id?'#fff':C.textMid,
                border:`1.5px solid ${category===cat.id?C.green:C.border}`,
                borderRadius:50, padding:'6px 13px', fontSize:12,
                fontWeight:category===cat.id?700:500, cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', gap:5,
              }}>
                <span style={{ fontSize:13 }}>{cat.emoji}</span>{cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px 8px' }}>
        <div style={{ fontWeight:800, fontSize:15, color:C.text }}>
          {search ? `"${search}" এর ফলাফল: ${filtered.length} টি` : '🛒 সব পণ্য'}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: window.innerWidth >= 768 ? 'repeat(4, 1fr)' : '1fr 1fr', gap:12, padding:'0 16px' }}>
        {filtered.map(p => (
          <ProductCard key={p.id} product={p}
            onInc={() => onUpdateQty(p.id, 1)}
            onDec={() => onUpdateQty(p.id, -1)}
          />
        ))}
      </div>

      {cartCount > 0 && (
        <div style={{ position:'fixed', bottom:70, left:'50%', transform:'translateX(-50%)', width:'calc(100% - 32px)', maxWidth:398, zIndex:200 }}>
          <button onClick={onCart} style={{
            width:'100%', background:C.green, color:'#fff', border:'none',
            borderRadius:16, padding:'14px 20px', display:'flex', alignItems:'center',
            justifyContent:'space-between', cursor:'pointer', fontFamily:'inherit',
            boxShadow:'0 8px 24px rgba(14,138,74,0.35)',
          }}>
            <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:8, padding:'4px 10px', fontSize:13, fontWeight:700 }}>{cartCount} টি</div>
            <div style={{ fontWeight:800, fontSize:15 }}>🛒 কার্ট দেখুন</div>
            <div style={{ fontWeight:800, fontSize:14 }}>৳{cartAmount}</div>
          </button>
        </div>
      )}

      <BottomNav active={activeTab} onTab={onTab} />
    </div>
  );
}

function CartPage({ items, onUpdateQty, onBack, onCheckout }) {
  const subtotal = items.reduce((s,p) => s + p.price * p.qty, 0);
  const delivery = subtotal > 500 ? 0 : 40;
  const total    = subtotal + delivery;

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Hind Siliguri', sans-serif", maxWidth:'100%', margin:'0 auto', paddingBottom:20 }}>
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:100 }}>
        <button onClick={onBack} style={{ background:C.bg, border:'none', borderRadius:50, width:38, height:38, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <div style={{ fontWeight:800, fontSize:18, color:C.text }}>আমার কার্ট</div>
        <div style={{ marginLeft:'auto', background:C.greenLight, color:C.green, borderRadius:50, padding:'3px 12px', fontSize:13, fontWeight:700 }}>{items.length} টি পণ্য</div>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 32px' }}>
          <div style={{ fontSize:64 }}>🛒</div>
          <div style={{ fontWeight:700, fontSize:18, color:C.text, marginTop:16 }}>কার্ট খালি</div>
          <button onClick={onBack} style={{ marginTop:24, background:C.green, color:'#fff', border:'none', borderRadius:12, padding:'12px 28px', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>কেনাকাটা করুন</button>
        </div>
      ) : (
        <>
          <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            {items.map(item => (
              <div key={item.id} style={{ background:C.white, borderRadius:14, border:`1px solid ${C.border}`, padding:14, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ fontSize:34 }}>{item.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{item.name}</div>
                  <div style={{ fontSize:11, color:C.textLight, marginTop:2 }}>{item.unit}</div>
                  <div style={{ fontWeight:800, fontSize:15, color:C.green, marginTop:4 }}>৳{item.price}</div>
                </div>
                <QtyControl qty={item.qty} onInc={() => onUpdateQty(item.id, 1)} onDec={() => onUpdateQty(item.id, -1)} />
              </div>
            ))}
          </div>

          {delivery > 0 && (
            <div style={{ margin:'0 16px', background:C.orangeLight, borderRadius:10, padding:'10px 14px', fontSize:13, color:C.orange, fontWeight:600 }}>
              🚚 আরো ৳{500 - subtotal} এর কেনাকাটা করলে বিনামূল্যে ডেলিভারি!
            </div>
          )}

          <div style={{ margin:'12px 16px 0', background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:16 }}>
            <div style={{ fontWeight:800, fontSize:15, color:C.text, marginBottom:12 }}>অর্ডার সারসংক্ষেপ</div>
            {[['পণ্যের দাম', `৳${subtotal}`], ['ডেলিভারি চার্জ', delivery===0?'বিনামূল্যে ✅':`৳${delivery}`]].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ color:C.textMid, fontSize:14 }}>{l}</span>
                <span style={{ fontWeight:600, fontSize:14, color:l==='ডেলিভারি চার্জ'&&delivery===0?C.green:C.text }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontWeight:800, fontSize:16, color:C.text }}>মোট</span>
              <span style={{ fontWeight:800, fontSize:18, color:C.green }}>৳{total}</span>
            </div>
          </div>

          <div style={{ padding:'16px' }}>
            <button onClick={() => onCheckout(total)} style={{ width:'100%', background:C.green, color:'#fff', border:'none', borderRadius:14, padding:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
              অর্ডার দিন → ৳{total}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function CheckoutPage({ cartItems, total, user, onBack, onSuccess }) {
  const [address,    setAddress]    = useState('');
  const [phone,      setPhone]      = useState('');
  const [payMethod,  setPayMethod]  = useState('cod');
  const [loading,    setLoading]    = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [error,      setError]      = useState('');

  const pickLocation = () => {
    if (!navigator.geolocation) { setError('আপনার ব্রাউজার লোকেশন সাপোর্ট করে না'); return; }
    setLocLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=bn`);
          const data = await res.json();
          setAddress(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch {
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        setLocLoading(false);
      },
      () => { setError('লোকেশন পাওয়া যায়নি। ঠিকানা নিজে লিখুন।'); setLocLoading(false); },
      { timeout:10000, enableHighAccuracy:true }
    );
  };

  const placeOrder = async () => {
    if (!address.trim()) { setError('ঠিকানা দিন'); return; }
    if (!phone.trim())   { setError('ফোন নম্বর দিন'); return; }
    setLoading(true);
    setError('');
    try {
      const headers = await getAuthHeader(user);
      const body = {
        items: cartItems.map(p => ({ productId: p.id, name: p.name, price: p.price, qty: p.qty })),
        total, deliveryAddress: address, phone, paymentMethod: payMethod,
      };
      const res = await fetch(`${API_BASE}/api/orders`, { method:'POST', headers, body:JSON.stringify(body) });
      if (!res.ok) throw new Error('Order failed');
      onSuccess();
    } catch (err) {
      console.error(err);
      setError('অর্ডার দেওয়া যায়নি। আবার চেষ্টা করুন।');
    }
    setLoading(false);
  };

  const inputStyle = { width:'100%', border:`1.5px solid ${C.border}`, borderRadius:10, padding:'10px 12px', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box', color:C.text };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Hind Siliguri', sans-serif", maxWidth:'100%', margin:'0 auto', paddingBottom:32 }}>
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:100 }}>
        <button onClick={onBack} style={{ background:C.bg, border:'none', borderRadius:50, width:38, height:38, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <div style={{ fontWeight:800, fontSize:18, color:C.text }}>ডেলিভারি তথ্য</div>
      </div>

      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:C.white, borderRadius:14, border:`1px solid ${C.border}`, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:12 }}>📍 ডেলিভারি ঠিকানা</div>

          <textarea value={address} onChange={e => setAddress(e.target.value)}
            placeholder="আপনার সম্পূর্ণ ঠিকানা লিখুন..." rows={3}
            style={{ ...inputStyle, resize:'none', marginBottom:10 }} />

          <button onClick={pickLocation} disabled={locLoading} style={{
            width:'100%', background:locLoading?C.bg:C.greenLight, color:C.green,
            border:`1.5px dashed ${C.green}`, borderRadius:10, padding:'10px 14px',
            fontSize:14, fontWeight:700, cursor:locLoading?'not-allowed':'pointer',
            fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center',
            gap:8, marginBottom:10,
          }}>
            {locLoading ? '⏳ লোকেশন খোঁজা হচ্ছে...' : '📍 আমার লোকেশন ব্যবহার করুন'}
          </button>

          <input value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="ফোন নম্বর" style={inputStyle} />
        </div>

        <div style={{ background:C.white, borderRadius:14, border:`1px solid ${C.border}`, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:12 }}>💳 পেমেন্ট পদ্ধতি</div>
          {[
            { id:'cod',   label:'ক্যাশ অন ডেলিভারি', emoji:'💵' },
            { id:'bkash', label:'বিকাশ',              emoji:'📱' },
            { id:'nagad', label:'নগদ',                emoji:'📱' },
          ].map(m => (
            <button key={m.id} onClick={() => setPayMethod(m.id)} style={{
              width:'100%', background:payMethod===m.id?C.greenLight:C.bg,
              border:`2px solid ${payMethod===m.id?C.green:C.border}`,
              borderRadius:12, padding:'11px 14px', display:'flex', alignItems:'center',
              gap:12, cursor:'pointer', fontFamily:'inherit', marginBottom:8, textAlign:'left',
            }}>
              <span style={{ fontSize:20 }}>{m.emoji}</span>
              <span style={{ fontWeight:600, fontSize:14, color:C.text }}>{m.label}</span>
              {payMethod===m.id && <span style={{ marginLeft:'auto', color:C.green, fontWeight:800 }}>✓</span>}
            </button>
          ))}
        </div>

        {error && <div style={{ background:C.redLight, borderRadius:10, padding:'10px 14px', color:C.red, fontSize:14, fontWeight:600 }}>{error}</div>}

        <button onClick={placeOrder} disabled={loading} style={{
          width:'100%', background:loading?'#9ca3af':C.green, color:'#fff',
          border:'none', borderRadius:14, padding:16, fontSize:16,
          fontWeight:800, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit',
        }}>
          {loading ? 'অর্ডার দেওয়া হচ্ছে...' : `অর্ডার নিশ্চিত করুন • ৳${total}`}
        </button>
      </div>
    </div>
  );
}

function OrderSuccess({ onHome }) {
  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Hind Siliguri', sans-serif", maxWidth:'100%', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:32 }}>
        <div style={{ fontSize:80 }}>✅</div>
        <div style={{ fontWeight:800, fontSize:24, color:C.text, marginTop:20 }}>অর্ডার হয়েছে!</div>
        <div style={{ color:C.textMid, fontSize:15, marginTop:10, lineHeight:1.6 }}>
          আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।<br/>৩০ মিনিটের মধ্যে ডেলিভারি পাবেন।
        </div>
        <div style={{ margin:'24px 0', background:C.greenLight, borderRadius:14, padding:16, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:32 }}>🛵</span>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontWeight:700, color:C.green, fontSize:14 }}>ডেলিভারি চলছে...</div>
            <div style={{ color:C.textMid, fontSize:12, marginTop:2 }}>আনুমানিক সময়: ২৫-৩০ মিনিট</div>
          </div>
        </div>
        <button onClick={onHome} style={{ background:C.green, color:'#fff', border:'none', borderRadius:14, padding:'14px 36px', fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
          হোমে যান
        </button>
      </div>
    </div>
  );
}

function OrdersPage({ user, onTab }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeader(user);
        const res     = await fetch(`${API_BASE}/api/orders`, { headers });
        if (res.ok) setOrders(await res.json());
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const statusColor = { pending:'#f97316', confirmed:'#0e8a4a', delivered:'#4b5563', cancelled:'#ef4444' };
  const statusLabel = { pending:'অপেক্ষায়', confirmed:'নিশ্চিত', delivered:'ডেলিভারি হয়েছে', cancelled:'বাতিল' };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Hind Siliguri', sans-serif", maxWidth:'100%', margin:'0 auto', paddingBottom:80 }}>
      <div style={{ background:C.green, padding:'14px 16px 12px' }}>
        <div style={{ color:'#fff', fontWeight:800, fontSize:19 }}>আমার অর্ডার</div>
        <div style={{ color:'rgba(255,255,255,0.75)', fontSize:10, marginTop:2 }}>CityBest</div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 32px', color:C.textMid }}>লোড হচ্ছে...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 32px' }}>
          <div style={{ fontSize:56 }}>📦</div>
          <div style={{ fontWeight:700, fontSize:18, color:C.text, marginTop:16 }}>কোনো অর্ডার নেই</div>
          <div style={{ color:C.textLight, fontSize:13, marginTop:8 }}>এখনো কোনো অর্ডার দেননি</div>
          <button onClick={() => onTab('home')} style={{ marginTop:20, background:C.green, color:'#fff', border:'none', borderRadius:12, padding:'12px 24px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>কেনাকাটা শুরু করুন</button>
        </div>
      ) : (
        <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
          {orders.map((order, i) => (
            <div key={order.id || i} style={{ background:C.white, borderRadius:14, border:`1px solid ${C.border}`, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:12, color:C.textLight }}>#{(order.id||'').slice(-6).toUpperCase()}</div>
                <span style={{ background:`${statusColor[order.status]}20`, color:statusColor[order.status], fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:50 }}>
                  {statusLabel[order.status] || order.status}
                </span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
                {(order.items||[]).map((item, j) => (
                  <span key={j} style={{ fontSize:12, color:C.textMid, background:C.bg, borderRadius:8, padding:'3px 8px' }}>{item.name} ×{item.qty}</span>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:C.textLight }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('bn-BD') : ''}</span>
                <span style={{ fontWeight:800, fontSize:16, color:C.green }}>৳{order.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <BottomNav active="orders" onTab={onTab} />
    </div>
  );
}

function ProfilePage({ user, onLogout, onTab }) {
  const displayName = user.displayName || user.phoneNumber || user.email || 'ব্যবহারকারী';
  const initials    = displayName.slice(0,2).toUpperCase();

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Hind Siliguri', sans-serif", maxWidth:'100%', margin:'0 auto', paddingBottom:80 }}>
      <div style={{ background:C.green, padding:'14px 16px 12px' }}>
        <div style={{ color:'#fff', fontWeight:800, fontSize:19 }}>প্রোফাইল</div>
      </div>

      <div style={{ margin:'16px', background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:20, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:56, height:56, borderRadius:'50%', background:C.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:C.green }}>
          {user.photoURL ? <img src={user.photoURL} alt="" style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover' }} /> : initials}
        </div>
        <div>
          <div style={{ fontWeight:700, fontSize:16, color:C.text }}>{displayName}</div>
          <div style={{ fontSize:13, color:C.textLight, marginTop:3 }}>{user.email || user.phoneNumber || ''}</div>
        </div>
      </div>

      {[
        { emoji:'📦', label:'আমার অর্ডার',       action: () => onTab('orders') },
        { emoji:'📍', label:'ডেলিভারি ঠিকানা',   action: () => {} },
        { emoji:'🔔', label:'নোটিফিকেশন',        action: () => {} },
        { emoji:'❓', label:'সাহায্য ও সাপোর্ট', action: () => {} },
      ].map(item => (
        <button key={item.label} onClick={item.action} style={{
          width:'calc(100% - 32px)', margin:'0 16px 10px', background:C.white,
          border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 16px',
          display:'flex', alignItems:'center', gap:14, cursor:'pointer', fontFamily:'inherit', textAlign:'left',
        }}>
          <span style={{ fontSize:20 }}>{item.emoji}</span>
          <span style={{ fontWeight:600, fontSize:15, color:C.text, flex:1 }}>{item.label}</span>
          <span style={{ color:C.textLight, fontSize:16 }}>›</span>
        </button>
      ))}

      <button onClick={onLogout} style={{
        width:'calc(100% - 32px)', margin:'8px 16px 0', background:C.redLight,
        border:`1px solid ${C.red}30`, borderRadius:14, padding:'14px 16px',
        display:'flex', alignItems:'center', gap:14, cursor:'pointer', fontFamily:'inherit',
      }}>
        <span style={{ fontSize:20 }}>🚪</span>
        <span style={{ fontWeight:700, fontSize:15, color:C.red }}>লগআউট</span>
      </button>

      <BottomNav active="profile" onTab={onTab} />
    </div>
  );
}

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [products,    setProducts]    = useState([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [view,        setView]        = useState('home');
  const [activeTab,   setActiveTab]   = useState('home');
  const [orderTotal,  setOrderTotal]  = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [categories,  setCategories]  = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_BASE}/api/products`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.map(p => ({ ...p, qty:0 })));
        } else throw new Error('API unavailable');
      } catch {
        setProducts(FALLBACK_PRODUCTS.map(p => ({ ...p, qty:0 })));
      }
      setProdLoading(false);
    })();
  }, []);

  // Fetch categories from backend, fallback to hardcoded
  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setCategories(data);
      })
      .catch(() => {}); // silently fall back to hardcoded CATEGORIES
  }, []);

  const updateQty = (id, delta) => {
    setProducts(prev => prev.map(p => p.id===id || p._id===id ? { ...p, qty:Math.max(0,(p.qty||0)+delta) } : p));
  };

  const clearCart = () => setProducts(prev => prev.map(p => ({ ...p, qty:0 })));
  const cartItems = products.filter(p => p.qty > 0);

  const handleTab = (tab) => {
    setActiveTab(tab);
    setActiveCategory(null);
    setView(tab==='orders'?'orders':tab==='profile'?'profile':'home');
  };

  const openCategory = (cat) => {
    setActiveCategory(cat);
    setView('category');
  };

  if (loading)     return <LoadingScreen />;
  if (window.location.pathname === '/admin') {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) return <AdminLogin onLogin={(t) => { localStorage.setItem('adminToken', t); window.location.reload(); }} />;
  return <AdminDashboard token={adminToken} onLogout={() => { localStorage.removeItem('adminToken'); window.location.reload(); }} />;
}
if (prodLoading) return <LoadingScreen message="পণ্য লোড হচ্ছে..." />;

  if (view === 'success')  return <OrderSuccess onHome={() => { clearCart(); setView('home'); setActiveTab('home'); }} />;
  if (view === 'checkout' && !user) return <Login />;
  if (view === 'checkout') return <CheckoutPage cartItems={cartItems} total={orderTotal} user={user} onBack={() => setView('cart')} onSuccess={() => setView('success')} />;
  if (view === 'cart')     return <CartPage items={cartItems} onUpdateQty={updateQty} onBack={() => setView('home')} onCheckout={(total) => { setOrderTotal(total); setView('checkout'); }} />;
  if (view === 'orders')   return <OrdersPage user={user} onTab={handleTab} />;
  if (view === 'profile')  return <ProfilePage user={user} onLogout={logout} onTab={handleTab} />;

  if (view === 'category' && activeCategory) return (
    <CategoryPage
      category={activeCategory}
      products={products}
      onUpdateQty={updateQty}
      onBack={() => setView('home')}
      onCategoryNav={(cat) => { setActiveCategory(cat); }}
      onTab={handleTab}
      activeTab={activeTab}
      user={user}
    />
  );
  return <HomePage products={products} onUpdateQty={updateQty} onCart={() => setView('cart')} onTab={handleTab} activeTab={activeTab} onCategoryOpen={openCategory} categories={categories}/>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}



