import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API = import.meta.env.VITE_API_URL || 'https://citybest-1.onrender.com';
const MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const CATEGORIES = ['inventory','rent','salary','delivery','tech','misc'];
const CAT_BN = { inventory:'ইনভেন্টরি', rent:'ভাড়া', salary:'বেতন', delivery:'ডেলিভারি', tech:'টেক', misc:'অন্যান্য' };

function getAdminToken() {
  return localStorage.getItem('adminToken') || '';
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` };
}

export default function Finance() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
  const [summary, setSummary] = useState(null);
  const [yearlyData, setYearlyData] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ category: 'inventory', amount: '', note: '', date: new Date().toISOString().slice(0,10) });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sr, yr, er] = await Promise.all([
        fetch(`${API}/api/finance/summary?month=${selectedMonth}`, { headers: authHeaders() }),
        fetch(`${API}/api/finance/yearly?year=${selectedMonth.slice(0,4)}`, { headers: authHeaders() }),
        fetch(`${API}/api/finance/expenses?month=${selectedMonth}`, { headers: authHeaders() }),
      ]);
      if (sr.ok) setSummary(await sr.json());
      if (yr.ok) { const y = await yr.json(); setYearlyData(y.map((d, i) => ({ name: MONTHS[i].slice(0,3), revenue: d.revenue, expenses: d.expenses, profit: d.profit }))); }
      if (er.ok) setExpenses(await er.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [selectedMonth]);

  const addExpense = async () => {
    if (!form.amount || !form.date) return alert('পরিমাণ ও তারিখ দিন');
    setSubmitting(true);
    await fetch(`${API}/api/finance/expenses`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
    setForm({ category: 'inventory', amount: '', note: '', date: new Date().toISOString().slice(0,10) });
    await fetchAll();
    setSubmitting(false);
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('মুছে ফেলবেন?')) return;
    await fetch(`${API}/api/finance/expenses/${id}`, { method: 'DELETE', headers: authHeaders() });
    await fetchAll();
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>💰 CityBest Finance</h1>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={s.monthPicker} />
      </div>

      {/* KPI Cards */}
      {summary && (
        <div style={s.kpiRow}>
          <div style={s.kpiCard}>
            <p style={s.kpiLabel}>মোট আয়</p>
            <p style={{...s.kpiValue, color:'#1a9e5c'}}>৳{(summary.revenue||0).toLocaleString()}</p>
          </div>
          <div style={s.kpiCard}>
            <p style={s.kpiLabel}>মোট খরচ</p>
            <p style={{...s.kpiValue, color:'#e53935'}}>৳{(summary.expenses||0).toLocaleString()}</p>
          </div>
          <div style={s.kpiCard}>
            <p style={s.kpiLabel}>নিট মুনাফা</p>
            <p style={{...s.kpiValue, color: (summary.profit||0) >= 0 ? '#1a9e5c' : '#e53935'}}>৳{(summary.profit||0).toLocaleString()}</p>
          </div>
          <div style={s.kpiCard}>
            <p style={s.kpiLabel}>মার্জিন</p>
            <p style={{...s.kpiValue, color:'#1565c0'}}>{summary.margin}%</p>
          </div>
          <div style={s.kpiCard}>
            <p style={s.kpiLabel}>অর্ডার</p>
            <p style={{...s.kpiValue, color:'#6a1b9a'}}>{summary.orderCount}টি</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>{selectedMonth.slice(0,4)} সালের আয় ও খরচ</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={yearlyData} margin={{ top:8, right:8, left:0, bottom:0 }}>
            <XAxis dataKey="name" tick={{ fontSize:11 }} />
            <YAxis tick={{ fontSize:11 }} />
            <Tooltip formatter={v => `৳${v.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="revenue" name="আয়" fill="#1a9e5c" radius={[4,4,0,0]} />
            <Bar dataKey="expenses" name="খরচ" fill="#e53935" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Add Expense */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>খরচ যোগ করুন</h2>
        <div style={s.formRow}>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={s.input}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_BN[c]}</option>)}
          </select>
          <input type="number" placeholder="পরিমাণ (৳)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} style={s.input} />
          <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={s.input} />
          <input type="text" placeholder="নোট (ঐচ্ছিক)" value={form.note} onChange={e => setForm({...form, note: e.target.value})} style={{...s.input, flex:2}} />
          <button onClick={addExpense} disabled={submitting} style={s.btn}>{submitting ? '...' : 'যোগ করুন'}</button>
        </div>
      </div>

      {/* Expense Table */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>খরচের তালিকা — {MONTHS[parseInt(selectedMonth.slice(5,7))-1]}</h2>
        {loading ? <p style={{color:'#888'}}>লোড হচ্ছে...</p> : expenses.length === 0 ? <p style={{color:'#888'}}>কোনো খরচ নেই</p> : (
          <div style={{overflowX:'auto'}}>
            <table style={s.table}>
              <thead>
                <tr style={{background:'#f5f5f5'}}>
                  <th style={s.th}>তারিখ</th>
                  <th style={s.th}>ক্যাটাগরি</th>
                  <th style={s.th}>পরিমাণ</th>
                  <th style={s.th}>নোট</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e._id} style={{borderBottom:'1px solid #f0f0f0'}}>
                    <td style={s.td}>{new Date(e.date).toLocaleDateString('bn-BD')}</td>
                    <td style={s.td}>{CAT_BN[e.category]}</td>
                    <td style={{...s.td, color:'#e53935', fontWeight:700}}>৳{e.amount.toLocaleString()}</td>
                    <td style={s.td}>{e.note || '—'}</td>
                    <td style={s.td}><button onClick={() => deleteExpense(e._id)} style={s.delBtn}>মুছুন</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight:'100vh', background:'#f8f9fa', fontFamily:"'Hind Siliguri', sans-serif", padding:16 },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 },
  title: { fontSize:22, fontWeight:700, color:'#1a9e5c', margin:0 },
  monthPicker: { padding:'8px 12px', borderRadius:8, border:'1.5px solid #e0e0e0', fontSize:14, fontFamily:'inherit' },
  kpiRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:12, marginBottom:16 },
  kpiCard: { background:'#fff', borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
  kpiLabel: { fontSize:12, color:'#888', margin:'0 0 4px', fontWeight:500 },
  kpiValue: { fontSize:20, fontWeight:700, margin:0 },
  card: { background:'#fff', borderRadius:12, padding:16, marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
  cardTitle: { fontSize:15, fontWeight:700, color:'#333', margin:'0 0 14px' },
  formRow: { display:'flex', gap:8, flexWrap:'wrap' },
  input: { flex:1, minWidth:100, padding:'9px 12px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:14, fontFamily:'inherit' },
  btn: { padding:'9px 20px', background:'#1a9e5c', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:14 },
  th: { padding:'8px 12px', textAlign:'left', fontWeight:600, color:'#555', fontSize:13 },
  td: { padding:'10px 12px', color:'#333' },
  delBtn: { padding:'4px 10px', background:'#fff0f0', color:'#e53935', border:'1px solid #ffcdd2', borderRadius:6, cursor:'pointer', fontSize:12, fontFamily:'inherit' },
};