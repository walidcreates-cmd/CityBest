import { useState, useEffect } from 'react';

export default function PaymentStep({ total, onSuccess, onBack, savedAddress, cartItems }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState(savedAddress || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [t, setT] = useState({});

  useEffect(() => {
    fetch('/strings.json').then(r => r.json()).then(setT).catch(() => {});
  }, []);

  const API = 'https://citybest-1.onrender.com';
  const DELIVERY_FEE = 30;

  const placeOrder = async () => {

    if (!name || !address || !phone) { setError('সব তথ্য দিন'); return; }
    setLoading(true);
    const subtotal = total - DELIVERY_FEE;
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: address,
          customerName: name,
          customerPhone: phone,
          total,
          subtotal,
          deliveryFee: DELIVERY_FEE,
          paymentMethod: 'Cash on Delivery',
          items: cartItems.map(i => ({
            productId: i.id,
            name: i.name,
            nameBn: i.nameBn || '',
            emoji: i.emoji || '📦',
            image: i.selectedVariantImage || i.image || '',
            variantName: i.selectedVariantName || '',
            qty: i.qty,
            price: i.price,
            unit: i.unit || '',
          })),
        })
      });
      const data = await res.json();
      if (data.success || data._id || data.id) {
        onSuccess(data);
      } else {
        setError(data.message || 'অর্ডার হয়নি');
      }
    } catch { setError('সার্ভার সমস্যা'); }
    setLoading(false);
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.title}>অর্ডার করুন</span>
        <button style={s.back} onClick={onBack}>{String.fromCharCode(8592)}</button>
      </div>
      <div style={s.body}>
        <div style={s.totalBox}>
          মোট: {String.fromCharCode(2547)}{total.toLocaleString()} (ক্যাশ অন ডেলিভারি)
        </div>
        <div style={s.label}>আপনার নাম</div>
        <input style={s.input} placeholder="নাম লিখুন" value={name}
          onChange={e => setName(e.target.value)} />
        <div style={s.label}>ডেলিভারি ঠিকানা</div>
        <input style={s.input} placeholder="পূর্ণ ঠিকানা লিখুন" value={address}
          onChange={e => setAddress(e.target.value)} />
        <div style={s.label}>মোবাইল নম্বর</div>
        <input style={s.input} placeholder="01XXXXXXXXX" value={phone}
          onChange={e => setPhone(e.target.value)} type="tel" />
        {error && <div style={s.error}>{error}</div>}
        <button style={s.btn} onClick={placeOrder} disabled={loading}>
          {loading ? 'অর্ডার হচ্ছে...' : 'অর্ডার নিশ্চিত করুন'}
        </button>
      </div>
    </div>
  );
}

const s = {
  wrap: { display:'flex', flexDirection:'column', height:'100%' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #e5e7eb' },
  title: { fontSize:18, fontWeight:700, color:'#1a9e5c' },
  back: { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#6b7280' },
  body: { padding:20, overflowY:'auto' },
  totalBox: { background:'#f0fdf4', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:15, fontWeight:600, color:'#1a9e5c', textAlign:'center' },
  label: { fontWeight:600, marginBottom:6, color:'#374151', fontSize:14 },
  input: { width:'100%', padding:'11px 14px', border:'1.5px solid #d1d5db', borderRadius:10, fontSize:15, marginBottom:14, boxSizing:'border-box', fontFamily:'inherit', outline:'none' },
  btn: { width:'100%', padding:'13px', background:'#1a9e5c', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit', marginTop:6 },
  error: { color:'#e53935', fontSize:13, marginBottom:10, textAlign:'center' },
};