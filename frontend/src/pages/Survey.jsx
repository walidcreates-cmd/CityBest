import { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://citybest-1.onrender.com';
const SESSION_KEY = 'cb_survey_auth';

// ── Category colours ──────────────────────────────────────────────────────
const CAT = {
  gas:     { bg: '#e8f5e9', accent: '#1A7A45', label: 'Gas'      },
  grain:   { bg: '#e3f2fd', accent: '#1565C0', label: 'Grain'    },
  veg:     { bg: '#fff3e0', accent: '#E65100', label: 'Vegetable' },
  protein: { bg: '#fce4ec', accent: '#B71C1C', label: 'Protein'  },
  pantry:  { bg: '#f3e5f5', accent: '#6A1B9A', label: 'Pantry'   },
};

const PRODUCTS = [
  { key:'rice',         label:'Rice (চাল)',          unit:'kg/mo',    priceUnit:'৳/kg',   daily:false, cat:'grain'   },
  { key:'whiteRice',    label:'White Rice',           unit:'kg/mo',    priceUnit:'৳/kg',   daily:false, cat:'grain'   },
  { key:'potato',       label:'Potato (আলু)',         unit:'kg/mo',    priceUnit:'৳/kg',   daily:false, cat:'veg'     },
  { key:'onion',        label:'Onion (পেঁয়াজ)',      unit:'kg/mo',    priceUnit:'৳/kg',   daily:false, cat:'veg'     },
  { key:'oil',          label:'Oil (তেল)',            unit:'Ltr/day',  priceUnit:'৳/Ltr',  daily:true,  cat:'pantry'  },
  { key:'palmOil',      label:'Palm Oil',             unit:'kg/mo',    priceUnit:'৳/kg',   daily:false, cat:'pantry'  },
  { key:'flour',        label:'Flour (আটা)',          unit:'pack/mo',  priceUnit:'৳/pack', daily:false, cat:'grain'   },
  { key:'chicken',      label:'Chicken (মুরগি)',      unit:'kg/day',   priceUnit:'৳/kg',   daily:true,  cat:'protein' },
  { key:'eggs',         label:'Eggs (ডিম)',           unit:'cage/day', priceUnit:'৳/cage', daily:true,  cat:'protein' },
  { key:'beef',         label:'Beef (গরু)',           unit:'kg/day',   priceUnit:'৳/kg',   daily:true,  cat:'protein' },
  { key:'mutton',       label:'Mutton (খাসি)',        unit:'kg/day',   priceUnit:'৳/kg',   daily:true,  cat:'protein' },
  { key:'dal',          label:'Dal (ডাল)',            unit:'kg/mo',    priceUnit:'৳/kg',   daily:false, cat:'pantry'  },
  { key:'sugar',        label:'Sugar (চিনি)',         unit:'kg/mo',    priceUnit:'৳/kg',   daily:false, cat:'pantry'  },
  { key:'spices',       label:'Spices (মশলা)',        unit:'kg/mo',    priceUnit:'৳/kg',   daily:false, cat:'pantry'  },
  { key:'teaLeaves',    label:'Tea Leaves (চা)',      unit:'kg/mo',    priceUnit:'৳/kg',   daily:false, cat:'pantry'  },
  { key:'garlicGinger', label:'Garlic+Ginger',        unit:'kg/mo',    priceUnit:'৳/kg',   daily:false, cat:'veg'     },
  { key:'greenChili',   label:'Green Chili (মরিচ)',   unit:'kg/mo',    priceUnit:'৳/kg',   daily:false, cat:'veg'     },
];

const EMPTY_FORM = {
  surveyDate: new Date().toISOString().slice(0,10),
  staffName: '', merchantName: '', mobileNo: '', shopName: '',
  businessType: '', area: '',
  gasCylindersPerMonth: '', gasBrand: '', gasPricePerCylinder: '', gasDelivery: 'Free',
  ...Object.fromEntries(PRODUCTS.flatMap(p => [
    [`${p.key}Qty`, ''], [`${p.key}Price`, '']
  ]).map(([k,v]) => {
    const field = k.replace(/Qty$/, p.key==='oil'||p.key==='chicken'||p.key==='eggs'||p.key==='beef'||p.key==='mutton' ? 'QtyPerDay' : 'Qty');
    return [field === k ? k : field, v];
  })),
  // fix daily fields manually
  oilQtyPerDay:'', oilPrice:'',
  chickenQtyPerDay:'', chickenPrice:'',
  eggsQtyPerDay:'', eggsPrice:'',
  beefQtyPerDay:'', beefPrice:'',
  muttonQtyPerDay:'', muttonPrice:'',
  riceQty:'', ricePrice:'',
  whiteRiceQty:'', whiteRicePrice:'',
  potatoQty:'', potatoPrice:'',
  onionQty:'', onionPrice:'',
  palmOilQty:'', palmOilPrice:'',
  flourQty:'', flourPrice:'',
  dalQty:'', dalPrice:'',
  sugarQty:'', sugarPrice:'',
  spicesQty:'', spicesPrice:'',
  teaLeavesQty:'', teaLeavesPrice:'',
  garlicGingerQty:'', garlicGingerPrice:'',
  greenChiliQty:'', greenChiliPrice:'',
  interestedInCityBest: 'Maybe',
  productsInterested: '', followUpStatus: 'New', followUpDate: '', notes: '',
};

function fmt(n) {
  if (!n) return '০';
  return Math.round(n).toLocaleString('en-IN');
}

function calcMerchantTotals(m) {
  if (!m) return {};
  const gasTotal     = (m.gasCylindersPerMonth||0) * (m.gasPricePerCylinder||0);
  const grainTotal   = m.grainTotal || 0;
  const vegTotal     = m.vegTotal || 0;
  const pantryTotal  = m.pantryTotal || 0;
  const proteinTotal = m.proteinTotal || 0;
  return { gasTotal, grainTotal, vegTotal, pantryTotal, proteinTotal,
           grandTotal: gasTotal + grainTotal + vegTotal + pantryTotal + proteinTotal };
}

// ── Mini bar chart using divs ─────────────────────────────────────────────
function BarChart({ data, height = 140 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height, padding:'0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ fontSize:10, color:'#555', fontWeight:600 }}>
            {d.value > 0 ? `৳${fmt(d.value)}` : ''}
          </div>
          <div style={{
            width:'100%', background: d.color, borderRadius:'4px 4px 0 0',
            height: Math.max((d.value/max)*100, d.value>0?4:0) + '%',
            minHeight: d.value>0?4:0, transition:'height 0.4s ease',
          }}/>
          <div style={{ fontSize:10, color:'#666', textAlign:'center', lineHeight:1.2 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Horizontal bar ────────────────────────────────────────────────────────
function HBar({ value, max, color, label, spend }) {
  const pct = max > 0 ? (value/max)*100 : 0;
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
        <span style={{ color:'#333', fontWeight:500 }}>{label}</span>
        <span style={{ color:'#888' }}>৳{fmt(spend)}</span>
      </div>
      <div style={{ background:'#f0f0f0', borderRadius:4, height:10, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, background:color, height:'100%', borderRadius:4, transition:'width 0.4s' }}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function Survey() {
  const [authed, setAuthed]         = useState(!!sessionStorage.getItem(SESSION_KEY));
  const [password, setPassword]     = useState('');
  const [pwError, setPwError]       = useState('');
  const [pwLoading, setPwLoading]   = useState(false);

  const [view, setView]             = useState('dashboard'); // 'dashboard' | 'entry' | 'customers' | 'edit'
  const [merchants, setMerchants]   = useState([]);
  const [aggregates, setAggregates] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [searchQ, setSearchQ]       = useState('');
  const formRef = useRef(null);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setPwLoading(true); setPwError('');
    try {
      const res = await fetch(`${API}/api/survey/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, '1');
        setAuthed(true);
      } else {
        setPwError('পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।');
      }
    } catch {
      setPwError('সার্ভারে সংযোগ হচ্ছে না।');
    }
    setPwLoading(false);
  };

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/survey/stats/dashboard`, {
        headers: { 'x-survey-token': sessionStorage.getItem(SESSION_KEY) || '1' },
      });
      const data = await res.json();
      setMerchants(data.merchants || []);
      setAggregates(data.aggregates || null);
      if (data.merchants?.length) setSelectedMerchant(data.merchants[0]);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { if (authed) loadData(); }, [authed]);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.merchantName || !form.mobileNo) {
      setSaveMsg('❌ নাম এবং মোবাইল নম্বর দিন।'); return;
    }
    setSaving(true); setSaveMsg('');
    try {
      const url    = editingId ? `${API}/api/survey/${editingId}` : `${API}/api/survey`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-survey-token': sessionStorage.getItem(SESSION_KEY) || '1',
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaveMsg('✅ সংরক্ষিত হয়েছে!');
        setForm(EMPTY_FORM); setEditingId(null);
        await loadData();
        setTimeout(() => { setSaveMsg(''); setView('dashboard'); }, 1500);
      } else {
        setSaveMsg('❌ সংরক্ষণ ব্যর্থ হয়েছে।');
      }
    } catch { setSaveMsg('❌ সার্ভার ত্রুটি।'); }
    setSaving(false);
  };

  const handleEdit = (m) => {
    const original = merchants.find(x => x._id === m._id);
    // re-fetch full data for editing
    fetch(`${API}/api/survey/${m._id}`, {
      headers: { 'x-survey-token': sessionStorage.getItem(SESSION_KEY)||'1' },
    }).then(r=>r.json()).then(data => {
      setForm({ ...EMPTY_FORM, ...data });
      setEditingId(m._id);
      setView('entry');
      setTimeout(() => formRef.current?.scrollIntoView({ behavior:'smooth' }), 100);
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('এই মার্চেন্ট মুছে ফেলবেন?')) return;
    await fetch(`${API}/api/survey/${id}`, {
      method: 'DELETE',
      headers: { 'x-survey-token': sessionStorage.getItem(SESSION_KEY)||'1' },
    });
    await loadData();
    if (selectedMerchant?._id === id) setSelectedMerchant(merchants[0] || null);
  };

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#e8f5e9,#f1f8e9)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'40px 32px', width:'100%', maxWidth:380, boxShadow:'0 8px 40px rgba(0,0,0,0.10)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:44 }}>📋</div>
          <h1 style={{ margin:'8px 0 4px', fontSize:24, fontWeight:800, color:'#1A7A45', fontFamily:'Hind Siliguri,sans-serif' }}>CityBest Survey</h1>
          <p style={{ margin:0, color:'#888', fontSize:13 }}>স্টাফ অ্যাক্সেস পোর্টাল</p>
        </div>
        <p style={{ fontSize:14, fontWeight:600, color:'#444', marginBottom:8 }}>পাসওয়ার্ড দিন</p>
        <input
          type="password" placeholder="••••••••"
          value={password} onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&handleLogin()}
          style={{ width:'100%', padding:'12px 14px', fontSize:16, border:'2px solid #e0e0e0', borderRadius:10, outline:'none', boxSizing:'border-box', marginBottom:12, fontFamily:'inherit' }}
        />
        <button onClick={handleLogin} disabled={pwLoading}
          style={{ width:'100%', padding:14, background:'#1A7A45', color:'#fff', border:'none', borderRadius:10, fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'Hind Siliguri,sans-serif' }}>
          {pwLoading ? 'যাচাই হচ্ছে...' : 'প্রবেশ করুন'}
        </button>
        {pwError && <p style={{ color:'#e53935', fontSize:13, textAlign:'center', marginTop:12 }}>{pwError}</p>}
      </div>
    </div>
  );

  // ── Nav ───────────────────────────────────────────────────────────────────
  const navItems = [
    { id:'dashboard', label:'📊 ড্যাশবোর্ড' },
    { id:'customers', label:'👤 প্রতি কাস্টমার' },
    { id:'list',      label:'📋 মার্চেন্ট তালিকা' },
    { id:'entry',     label:'➕ নতুন এন্ট্রি' },
  ];

  const S = { fontFamily:'Hind Siliguri,Arial,sans-serif', minHeight:'100vh', background:'#f5f7fa' };

  const filteredMerchants = merchants.filter(m =>
    !searchQ || m.merchantName?.toLowerCase().includes(searchQ.toLowerCase()) ||
    m.businessType?.toLowerCase().includes(searchQ.toLowerCase()) ||
    m.area?.toLowerCase().includes(searchQ.toLowerCase())
  );

  // Per-customer chart data
  const selTotals = selectedMerchant ? {
    gasTotal:     (selectedMerchant.gasCylindersPerMonth||0)*(selectedMerchant.gasPricePerCylinder||0),
    grainTotal:   selectedMerchant.grainTotal||0,
    vegTotal:     selectedMerchant.vegTotal||0,
    pantryTotal:  selectedMerchant.pantryTotal||0,
    proteinTotal: selectedMerchant.proteinTotal||0,
  } : {};
  const selGrandTotal = Object.values(selTotals).reduce((a,b)=>a+b,0);

  return (
    <div style={S}>
      {/* Header */}
      <div style={{ background:'#1A7A45', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>🛒</span>
          <span style={{ color:'#fff', fontWeight:800, fontSize:16 }}>CityBest Survey</span>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => { setView(n.id); if(n.id!=='entry'){setEditingId(null);setForm(EMPTY_FORM);} }}
              style={{ padding:'10px 12px', background: view===n.id ? 'rgba(255,255,255,0.25)':'transparent',
                color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              {n.label}
            </button>
          ))}
          <button onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}
            style={{ padding:'10px 12px', background:'transparent', color:'rgba(255,255,255,0.7)', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            লগআউট
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'20px 16px' }}>

        {/* ── DASHBOARD VIEW ───────────────────────────────────────────── */}
        {view === 'dashboard' && (
          <div>
            {loading ? <p style={{ textAlign:'center', color:'#888', padding:40 }}>ডেটা লোড হচ্ছে...</p> : (
              <>
                {/* KPI Cards */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:24 }}>
                  {[
                    { label:'মোট মার্চেন্ট', value: aggregates?.totalMerchants||0, color:'#1A7A45', icon:'👥' },
                    { label:'HIGH Priority', value: aggregates?.highPriority||0,    color:'#C62828', icon:'🔴' },
                    { label:'আগ্রহী (Yes)',   value: aggregates?.interested||0,     color:'#1565C0', icon:'✅' },
                    { label:'মোট গ্যাস/মাস', value: (aggregates?.totalGasCylinders||0)+' cyl', color:'#00695C', icon:'🔵' },
                    { label:'মোট বাজার ৳/মাস', value:'৳'+fmt(aggregates?.totalMarket||0), color:'#6A1B9A', icon:'💰' },
                  ].map((k,i) => (
                    <div key={i} style={{ background:'#fff', borderRadius:12, padding:'16px 18px', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', borderTop:`4px solid ${k.color}` }}>
                      <div style={{ fontSize:22 }}>{k.icon}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:k.color, margin:'6px 0 2px' }}>{k.value}</div>
                      <div style={{ fontSize:12, color:'#888' }}>{k.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
                  {/* Merchant spend comparison */}
                  <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                    <h3 style={{ margin:'0 0 16px', fontSize:14, color:'#333' }}>💰 মার্চেন্ট অনুযায়ী মোট খরচ/মাস</h3>
                    <BarChart height={160} data={merchants.slice(0,8).map(m => ({
                      label: (m.merchantName||'').substring(0,8),
                      value: m.grandTotal||0,
                      color: '#1A7A45',
                    }))}/>
                  </div>

                  {/* Product demand totals */}
                  <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                    <h3 style={{ margin:'0 0 16px', fontSize:14, color:'#333' }}>🗺️ পণ্য অনুযায়ী মোট খরচ/মাস</h3>
                    {aggregates && (() => {
                      const items = [
                        { label:'গ্যাস',    value: merchants.reduce((s,m)=>s+(m.gasTotal||0),0),       color:'#1A7A45' },
                        { label:'শস্য',     value: merchants.reduce((s,m)=>s+(m.grainTotal||0),0),     color:'#1565C0' },
                        { label:'সবজি',     value: merchants.reduce((s,m)=>s+(m.vegTotal||0),0),       color:'#E65100' },
                        { label:'আমিষ',     value: merchants.reduce((s,m)=>s+(m.proteinTotal||0),0),   color:'#B71C1C' },
                        { label:'প্যান্ট্রি',value: merchants.reduce((s,m)=>s+(m.pantryTotal||0),0),  color:'#6A1B9A' },
                      ];
                      return <BarChart height={160} data={items}/>;
                    })()}
                  </div>
                </div>

                {/* Gas brand table */}
                <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', marginBottom:20 }}>
                  <h3 style={{ margin:'0 0 16px', fontSize:14, color:'#333' }}>🔵 গ্যাস ব্র্যান্ড মার্কেট শেয়ার</h3>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead>
                        <tr style={{ background:'#1A5276', color:'#fff' }}>
                          {['ব্র্যান্ড','মার্চেন্ট','% শেয়ার','গড় মূল্য ৳','মোট গ্যাস ৳/মাস'].map(h=>(
                            <th key={h} style={{ padding:'10px 14px', textAlign:'center', fontWeight:700 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(aggregates?.byBrand||{}).map(([brand,d],i)=>(
                          <tr key={brand} style={{ background: i%2===0?'#EBF5FB':'#fff' }}>
                            <td style={{ padding:'8px 14px', fontWeight:700, color:'#1A5276' }}>{brand}</td>
                            <td style={{ padding:'8px 14px', textAlign:'center' }}>{d.count}</td>
                            <td style={{ padding:'8px 14px', textAlign:'center' }}>
                              {aggregates.totalMerchants ? Math.round(d.count/aggregates.totalMerchants*100)+'%' : '—'}
                            </td>
                            <td style={{ padding:'8px 14px', textAlign:'center' }}>৳{fmt(d.avgPrice)}</td>
                            <td style={{ padding:'8px 14px', textAlign:'center', fontWeight:700, color:'#1A7A45' }}>৳{fmt(d.totalSpend)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Product demand map */}
                <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                  <h3 style={{ margin:'0 0 16px', fontSize:14, color:'#333' }}>📦 পণ্যভিত্তিক মোট চাহিদা ও খরচ</h3>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead>
                        <tr style={{ background:'#1A7A45', color:'#fff' }}>
                          {['পণ্য','ইউনিট','মোট পরিমাণ/মাস','মোট খরচ ৳/মাস','ক্যাটাগরি'].map(h=>(
                            <th key={h} style={{ padding:'10px 14px', textAlign:'center', fontWeight:700 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[{key:'gas',label:'🔵 গ্যাস সিলিন্ডার',unit:'cylinders',cat:'gas'},...PRODUCTS].map((p,i)=>{
                          const d = p.key==='gas'
                            ? { totalQty: aggregates?.totalGasCylinders||0, totalSpend: merchants.reduce((s,m)=>s+(m.gasTotal||0),0) }
                            : aggregates?.productTotals?.[p.key];
                          if (!d) return null;
                          const catInfo = CAT[p.cat||'grain'];
                          return (
                            <tr key={p.key} style={{ background: i%2===0?'#f8fffe':'#fff' }}>
                              <td style={{ padding:'8px 14px', fontWeight:600 }}>{p.label}</td>
                              <td style={{ padding:'8px 14px', textAlign:'center', color:'#888', fontSize:11 }}>{p.unit}</td>
                              <td style={{ padding:'8px 14px', textAlign:'center', fontWeight:700 }}>{fmt(d.totalQty * (d.daily?30:1))}</td>
                              <td style={{ padding:'8px 14px', textAlign:'center', fontWeight:700, color:'#1A7A45' }}>৳{fmt(d.totalSpend)}</td>
                              <td style={{ padding:'8px 14px', textAlign:'center' }}>
                                <span style={{ background:catInfo.bg, color:catInfo.accent, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>{catInfo.label}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── PER-CUSTOMER VIEW ─────────────────────────────────────────── */}
        {view === 'customers' && (
          <div>
            {/* Merchant selector */}
            <div style={{ background:'#fff', borderRadius:12, padding:16, marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#333' }}>👤 মার্চেন্ট বেছে নিন:</span>
              <select value={selectedMerchant?._id||''} onChange={e => setSelectedMerchant(merchants.find(m=>m._id===e.target.value))}
                style={{ padding:'8px 14px', borderRadius:8, border:'2px solid #1A7A45', fontSize:14, color:'#1A7A45', fontWeight:700, outline:'none', fontFamily:'inherit', background:'#f0faf4', cursor:'pointer' }}>
                {merchants.map(m => <option key={m._id} value={m._id}>{m.merchantName} — {m.businessType}</option>)}
              </select>
              {selectedMerchant && (
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>handleEdit(selectedMerchant)}
                    style={{ padding:'8px 14px', background:'#1A7A45', color:'#fff', border:'none', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>✏️ সম্পাদনা</button>
                </div>
              )}
            </div>

            {selectedMerchant && (
              <>
                {/* KPI Cards */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:16 }}>
                  {[
                    { label:'ব্যবসার ধরন',    value: selectedMerchant.businessType||'—',   color:'#1565C0' },
                    { label:'এলাকা',           value: selectedMerchant.area||'—',            color:'#00695C' },
                    { label:'আগ্রহ',           value: selectedMerchant.interestedInCityBest||'—', color:'#E65100' },
                    { label:'গ্যাস সিলিন্ডার', value: (selectedMerchant.gasCylindersPerMonth||0)+' cyl', color:'#1A7A45' },
                    { label:'গ্যাস খরচ/মাস',  value:'৳'+fmt(selTotals.gasTotal),            color:'#1A5276' },
                    { label:'মোট খরচ/মাস',    value:'৳'+fmt(selGrandTotal),                 color:'#1A7A45' },
                  ].map((k,i)=>(
                    <div key={i} style={{ background:'#fff', borderRadius:10, padding:'14px 16px', boxShadow:'0 2px 6px rgba(0,0,0,0.07)', borderLeft:`4px solid ${k.color}` }}>
                      <div style={{ fontSize:11, color:'#888', marginBottom:4 }}>{k.label}</div>
                      <div style={{ fontSize:16, fontWeight:800, color:k.color }}>{k.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  {/* Spend by category bar chart */}
                  <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                    <h3 style={{ margin:'0 0 16px', fontSize:14, color:'#333' }}>📊 ক্যাটাগরি অনুযায়ী খরচ/মাস</h3>
                    <BarChart height={160} data={[
                      { label:'গ্যাস',    value: selTotals.gasTotal||0,     color:'#1A7A45' },
                      { label:'শস্য',     value: selTotals.grainTotal||0,   color:'#1565C0' },
                      { label:'সবজি',     value: selTotals.vegTotal||0,     color:'#E65100' },
                      { label:'আমিষ',     value: selTotals.proteinTotal||0, color:'#B71C1C' },
                      { label:'প্যান্ট্রি',value:selTotals.pantryTotal||0,  color:'#6A1B9A' },
                    ]}/>
                  </div>

                  {/* % breakdown horizontal bars */}
                  <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                    <h3 style={{ margin:'0 0 16px', fontSize:14, color:'#333' }}>📈 খরচের অনুপাত</h3>
                    {[
                      { label:'🔵 গ্যাস',     value: selTotals.gasTotal||0,     color:'#1A7A45' },
                      { label:'🌾 শস্য',      value: selTotals.grainTotal||0,   color:'#1565C0' },
                      { label:'🥦 সবজি',      value: selTotals.vegTotal||0,     color:'#E65100' },
                      { label:'🍗 আমিষ',      value: selTotals.proteinTotal||0, color:'#B71C1C' },
                      { label:'🛢️ প্যান্ট্রি', value: selTotals.pantryTotal||0,  color:'#6A1B9A' },
                    ].map((item,i) => (
                      <HBar key={i} value={item.value} max={selGrandTotal} color={item.color} label={item.label} spend={item.value}/>
                    ))}
                    <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #eee', display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:700 }}>
                      <span style={{ color:'#1A7A45' }}>মোট</span>
                      <span style={{ color:'#1A7A45' }}>৳{fmt(selGrandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Product breakdown cards */}
                <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                  <h3 style={{ margin:'0 0 16px', fontSize:14, color:'#333' }}>📦 প্রতিটি পণ্যের বিস্তারিত</h3>
                  {/* Gas card first */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
                    {selectedMerchant.gasCylindersPerMonth > 0 && (
                      <div style={{ background:CAT.gas.bg, borderRadius:10, padding:14, borderTop:`3px solid ${CAT.gas.accent}` }}>
                        <div style={{ fontSize:11, color:CAT.gas.accent, fontWeight:700, marginBottom:6, textTransform:'uppercase' }}>গ্যাস</div>
                        <div style={{ fontSize:15, fontWeight:700, color:'#222' }}>🔵 Gas Cylinder</div>
                        <div style={{ fontSize:12, color:'#555', margin:'4px 0' }}>{selectedMerchant.gasCylindersPerMonth} cylinders/mo</div>
                        <div style={{ fontSize:12, color:'#555' }}>৳{fmt(selectedMerchant.gasPricePerCylinder)}/cyl</div>
                        <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${CAT.gas.accent}44`, fontSize:13, fontWeight:700, color:CAT.gas.accent }}>
                          ৳{fmt(selTotals.gasTotal)}/mo
                        </div>
                      </div>
                    )}
                    {PRODUCTS.map(p => {
                      const d = selectedMerchant.products?.[p.key];
                      if (!d || d.qty === 0) return null;
                      const catInfo = CAT[p.cat];
                      const moTotal = d.daily ? d.qty*d.price*30 : d.qty*d.price;
                      return (
                        <div key={p.key} style={{ background:catInfo.bg, borderRadius:10, padding:14, borderTop:`3px solid ${catInfo.accent}` }}>
                          <div style={{ fontSize:11, color:catInfo.accent, fontWeight:700, marginBottom:6, textTransform:'uppercase' }}>{catInfo.label}</div>
                          <div style={{ fontSize:14, fontWeight:700, color:'#222' }}>{p.label}</div>
                          <div style={{ fontSize:12, color:'#555', margin:'4px 0' }}>
                            {d.qty} {p.unit}{d.daily ? ' → '+(d.qty*30)+'/mo' : ''}
                          </div>
                          <div style={{ fontSize:12, color:'#555' }}>৳{fmt(d.price)} {p.priceUnit}</div>
                          <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${catInfo.accent}44`, fontSize:13, fontWeight:700, color:catInfo.accent }}>
                            ৳{fmt(moTotal)}/mo
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── LIST VIEW ─────────────────────────────────────────────────── */}
        {view === 'list' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
              <h2 style={{ margin:0, fontSize:18, color:'#1A7A45' }}>📋 সকল মার্চেন্ট ({merchants.length})</h2>
              <input placeholder="🔍 নাম, এলাকা বা ব্যবসার ধরন খুঁজুন..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                style={{ padding:'8px 14px', borderRadius:8, border:'1.5px solid #ccc', fontSize:13, width:260, outline:'none', fontFamily:'inherit' }}/>
            </div>
            <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#1A7A45', color:'#fff' }}>
                      {['মার্চেন্ট নাম','ব্যবসা','এলাকা','গ্যাস/মাস','মোট খরচ ৳/মাস','আগ্রহ','স্ট্যাটাস','অ্যাকশন'].map(h=>(
                        <th key={h} style={{ padding:'12px 14px', textAlign:'left', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMerchants.map((m,i)=>(
                      <tr key={m._id} style={{ background:i%2===0?'#f8fffe':'#fff', borderBottom:'1px solid #eee' }}>
                        <td style={{ padding:'10px 14px', fontWeight:700, color:'#1A5276' }}>{m.merchantName}<br/><span style={{fontSize:11,color:'#888',fontWeight:400}}>{m.shopName}</span></td>
                        <td style={{ padding:'10px 14px' }}>{m.businessType}</td>
                        <td style={{ padding:'10px 14px', color:'#555' }}>{m.area}</td>
                        <td style={{ padding:'10px 14px', textAlign:'center', fontWeight:700, color:'#1A7A45' }}>{m.gasCylindersPerMonth}</td>
                        <td style={{ padding:'10px 14px', textAlign:'right', fontWeight:700, color:'#1A7A45' }}>৳{fmt(m.grandTotal)}</td>
                        <td style={{ padding:'10px 14px', textAlign:'center' }}>
                          <span style={{ background: m.interestedInCityBest==='Yes'?'#e8f5e9':m.interestedInCityBest==='Maybe'?'#fff3e0':'#ffebee',
                            color: m.interestedInCityBest==='Yes'?'#1A7A45':m.interestedInCityBest==='Maybe'?'#E65100':'#C62828',
                            padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                            {m.interestedInCityBest}
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px', textAlign:'center' }}>
                          <span style={{ background:'#e3f2fd', color:'#1565C0', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700 }}>{m.followUpStatus}</span>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={()=>{setSelectedMerchant(m);setView('customers');}}
                              style={{ padding:'5px 10px', background:'#e8f5e9', color:'#1A7A45', border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>👁️</button>
                            <button onClick={()=>handleEdit(m)}
                              style={{ padding:'5px 10px', background:'#e3f2fd', color:'#1565C0', border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>✏️</button>
                            <button onClick={()=>handleDelete(m._id)}
                              style={{ padding:'5px 10px', background:'#ffebee', color:'#C62828', border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredMerchants.length === 0 && (
                      <tr><td colSpan={8} style={{ padding:30, textAlign:'center', color:'#888' }}>কোনো মার্চেন্ট পাওয়া যায়নি</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── DATA ENTRY FORM ───────────────────────────────────────────── */}
        {view === 'entry' && (
          <div ref={formRef}>
            <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
              <h2 style={{ margin:'0 0 20px', color:'#1A7A45', fontSize:18 }}>
                {editingId ? '✏️ মার্চেন্ট সম্পাদনা' : '➕ নতুন মার্চেন্ট এন্ট্রি'}
              </h2>

              {/* Section: Identity */}
              <SectionHeader color="#1A7A45" title="👤 মার্চেন্ট পরিচয়"/>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:20 }}>
                <Field label="Survey Date" value={form.surveyDate} onChange={v=>setF('surveyDate',v)} type="date"/>
                <Field label="Staff Name (স্টাফ নাম)" value={form.staffName} onChange={v=>setF('staffName',v)}
                  type="select" options={['Rahim','Karim','Nasrin','Other']}/>
                <Field label="Merchant Name* (নাম)" value={form.merchantName} onChange={v=>setF('merchantName',v)} required/>
                <Field label="Mobile No* (মোবাইল)" value={form.mobileNo} onChange={v=>setF('mobileNo',v)} type="tel"/>
                <Field label="Shop Name (দোকানের নাম)" value={form.shopName} onChange={v=>setF('shopName',v)}/>
                <Field label="Business Type (ব্যবসার ধরন)" value={form.businessType} onChange={v=>setF('businessType',v)}
                  type="select" options={['Restaurant','Food Cart','Tea Stall','Bakery','Hotel','Other']}/>
                <Field label="Area / Location (এলাকা)" value={form.area} onChange={v=>setF('area',v)}/>
              </div>

              {/* Section: Gas */}
              <SectionHeader color="#1A5276" title="🔵 গ্যাস ডেটা"/>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:20 }}>
                <Field label="Gas/Month (সিলিন্ডার)" value={form.gasCylindersPerMonth} onChange={v=>setF('gasCylindersPerMonth',v)} type="number"/>
                <Field label="Cylinder Brand (ব্র্যান্ড)" value={form.gasBrand} onChange={v=>setF('gasBrand',v)}
                  type="select" options={['Omera','Jamuna','Fresh','Bengal','Igash','Green','Delta','Other']}/>
                <Field label="Price/Cylinder (৳)" value={form.gasPricePerCylinder} onChange={v=>setF('gasPricePerCylinder',v)} type="number"/>
                <Field label="Delivery" value={form.gasDelivery} onChange={v=>setF('gasDelivery',v)}
                  type="select" options={['Free','Paid']}/>
              </div>

              {/* Section: Food Products */}
              {['grain','veg','protein','pantry'].map(catKey => {
                const catProds = PRODUCTS.filter(p=>p.cat===catKey);
                const catInfo  = CAT[catKey];
                return (
                  <div key={catKey}>
                    <SectionHeader color={catInfo.accent} title={`${catKey==='grain'?'🌾':catKey==='veg'?'🥦':catKey==='protein'?'🍗':'🛢️'} ${catInfo.label} পণ্যসমূহ`}/>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:14, marginBottom:20 }}>
                      {catProds.map(p => {
                        const qKey = p.daily
                          ? `${p.key}QtyPerDay`
                          : `${p.key}Qty`;
                        const pKey = `${p.key}Price`;
                        const qtyVal   = form[qKey]   || '';
                        const priceVal = form[pKey]    || '';
                        const total    = p.daily
                          ? (Number(qtyVal)||0)*(Number(priceVal)||0)*30
                          : (Number(qtyVal)||0)*(Number(priceVal)||0);
                        return (
                          <div key={p.key} style={{ background:catInfo.bg, borderRadius:10, padding:14, border:`1.5px solid ${catInfo.accent}33` }}>
                            <div style={{ fontSize:13, fontWeight:700, color:catInfo.accent, marginBottom:10 }}>{p.label}</div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                              <div>
                                <label style={{ fontSize:11, color:'#555', display:'block', marginBottom:4 }}>Qty ({p.unit})</label>
                                <input type="number" min="0" value={qtyVal} onChange={e=>setF(qKey,e.target.value)}
                                  style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box', outline:'none', fontFamily:'inherit' }}/>
                              </div>
                              <div>
                                <label style={{ fontSize:11, color:'#555', display:'block', marginBottom:4 }}>Price ({p.priceUnit})</label>
                                <input type="number" min="0" value={priceVal} onChange={e=>setF(pKey,e.target.value)}
                                  style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box', outline:'none', fontFamily:'inherit' }}/>
                              </div>
                            </div>
                            {total > 0 && (
                              <div style={{ marginTop:8, fontSize:12, fontWeight:700, color:catInfo.accent }}>
                                মাসিক মোট: ৳{fmt(total)}{p.daily?' (×30)':''}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Section: Lead */}
              <SectionHeader color="#CA6F1E" title="🎯 লিড ও ফলো-আপ"/>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:24 }}>
                <Field label="CityBest-এ আগ্রহী?" value={form.interestedInCityBest} onChange={v=>setF('interestedInCityBest',v)}
                  type="select" options={['Yes','Maybe','No']}/>
                <Field label="কোন পণ্যে আগ্রহী" value={form.productsInterested} onChange={v=>setF('productsInterested',v)} placeholder="Gas, Rice, Potato..."/>
                <Field label="Follow-up Status" value={form.followUpStatus} onChange={v=>setF('followUpStatus',v)}
                  type="select" options={['New','Contacted','Converted','Lost']}/>
                <Field label="Follow-up Date" value={form.followUpDate} onChange={v=>setF('followUpDate',v)} type="date"/>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ fontSize:12, color:'#555', display:'block', marginBottom:6, fontWeight:600 }}>Notes (মন্তব্য)</label>
                  <textarea value={form.notes} onChange={e=>setF('notes',e.target.value)} rows={3}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box', resize:'vertical', outline:'none', fontFamily:'inherit' }}/>
                </div>
              </div>

              {/* Submit */}
              <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                <button onClick={handleSubmit} disabled={saving}
                  style={{ padding:'14px 32px', background: saving?'#aaa':'#1A7A45', color:'#fff', border:'none', borderRadius:10, fontSize:16, fontWeight:700, cursor: saving?'default':'pointer', fontFamily:'inherit' }}>
                  {saving ? 'সংরক্ষণ হচ্ছে...' : editingId ? '✅ আপডেট করুন' : '✅ সংরক্ষণ করুন'}
                </button>
                {editingId && (
                  <button onClick={()=>{setEditingId(null);setForm(EMPTY_FORM);}}
                    style={{ padding:'14px 24px', background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                    বাতিল
                  </button>
                )}
                {saveMsg && <span style={{ fontSize:14, fontWeight:700, color: saveMsg.startsWith('✅')?'#1A7A45':'#C62828' }}>{saveMsg}</span>}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function SectionHeader({ title, color }) {
  return (
    <div style={{ background:color, color:'#fff', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:700, marginBottom:14 }}>
      {title}
    </div>
  );
}

function Field({ label, value, onChange, type='text', options=[], required=false, placeholder='' }) {
  const base = { width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box', outline:'none', fontFamily:'inherit' };
  return (
    <div>
      <label style={{ fontSize:12, color:'#555', display:'block', marginBottom:5, fontWeight:600 }}>{label}{required&&<span style={{color:'#e53935'}}> *</span>}</label>
      {type==='select' ? (
        <select value={value} onChange={e=>onChange(e.target.value)} style={base}>
          <option value="">— বেছে নিন —</option>
          {options.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={base}/>
      )}
    </div>
  );
}
