import { useState } from 'react';
import PaymentStep from './PaymentStep';
import OrderSuccess from './OrderSuccess';

const DELIVERY_FEE = 60;

function CartItem({ item, onIncrease, onDecrease }) {
  return (
    <div className="ct-item">
      <div className="ct-item-emoji">{item.emoji}</div>
      <div className="ct-item-info">
        <div className="ct-item-name">{item.name}</div>
        <div className="ct-item-name-bn">{item.nameBn}</div>
        <div className="ct-item-unit">{item.unit}</div>
      </div>
      <div className="ct-item-right">
        <div className="ct-item-price">৳{(item.price * item.qty).toLocaleString()}</div>
        <div className="ct-qty-ctrl">
          <button className="ct-qty-btn" onClick={() => onDecrease(item.id)}>−</button>
          <span className="ct-qty-num">{item.qty}</span>
          <button className="ct-qty-btn" onClick={() => onIncrease(item.id)}>+</button>
        </div>
      </div>
    </div>
  );
}

function PhoneLoginStep({ onSuccess, onBack }) {
  const [phone, setPhone] = useState('');
  const [otp,   setOtp]   = useState('');
  const [step,  setStep]  = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const API = 'https://citybest-1.onrender.com';

  const sendOtp = async () => {
    setError('');
    if (!phone || phone.length < 10) { setError('সঠিক ফোন নম্বর দিন'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '88' + phone })
      });
      const data = await res.json();
      if (data.success) { setStep('otp'); }
      else { setError(data.message || 'OTP পাঠানো যায়নি'); }
    } catch { setError('সার্ভার সমস্যা, আবার চেষ্টা করুন'); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setError('');
    if (!otp || otp.length < 4) { setError('OTP কোড দিন'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '88' + phone, otp })
      });
      const data = await res.json();
      if (data.success) { onSuccess({ phone }); }
      else { setError(data.message || 'OTP সঠিক নয়'); }
    } catch { setError('সার্ভার সমস্যা, আবার চেষ্টা করুন'); }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>🛒</div>
          <div style={styles.logoText}>CityBest</div>
          {step === 'phone' ? (
            <div style={styles.tagline}>আপনার ফোন নম্বর দিয়ে লগইন করুন</div>
          ) : (
            <div style={styles.tagline}>OTP কোড দিন</div>
          )}
        </div>

        {step === 'phone' && (
          <div style={styles.loginNote}>
            আপনার মোবাইলে একটি OTP কোড পাঠানো হবে।<br />
            কোডটি দিয়ে আপনার অর্ডার নিশ্চিত করুন।<br />
            ডেলিভারি পেতে সঠিক নম্বর দিন।
          </div>
        )}

        {step === 'otp' && (
          <div style={styles.loginNote}>
            আপনার {phone} নম্বরে OTP পাঠানো হয়েছে।<br />
            কোডটি নিচে লিখুন।
          </div>
        )}

        {step === 'phone' && (
          <>
            <div style={styles.label}>আপনার মোবাইল নম্বর</div>
            <div style={styles.inputRow}>
              <span style={styles.prefix}>+88</span>
              <input
                style={styles.input}
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={11}
              />
            </div>
            <button style={styles.btn} onClick={sendOtp} disabled={loading}>
              {loading ? 'পাঠানো হচ্ছে...' : 'OTP পাঠান'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div style={styles.label}>OTP কোড</div>
            <div style={styles.inputRow}>
              <input
                style={{...styles.input, paddingLeft:14}}
                type="tel"
                placeholder="৬ সংখ্যার কোড"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
              />
            </div>
            <button style={styles.btn} onClick={verifyOtp} disabled={loading}>
              {loading ? 'যাচাই হচ্ছে...' : 'কোড যাচাই করুন'}
            </button>
          </>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <button style={styles.backBtn} onClick={onBack}>← পেছনে যান</button>
      </div>
    </div>
  );
}

export default function Cart({ cartItems, onClose, onIncrease, onDecrease, isLoggedIn, onLoginSuccess }) {
  const [view, setView]   = useState('cart');
  const [order, setOrder] = useState(null);

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const total    = subtotal + DELIVERY_FEE;

  const handlePaymentSuccess = (orderData) => {
    setOrder(orderData);
    setView('success');
  };

  if (cartItems.length === 0 && view === 'cart') return (
    <div className="ct-empty">
      <div className="ct-empty-icon">🛒</div>
      <p>আপনার কার্ট খালি আছে</p>
      <button className="ct-continue-btn" onClick={onClose}>কেনাকাটা চালিয়ে যান</button>
    </div>
  );

  return (
    <div className="ct-wrap">
      {view === 'cart' && (<>
        <div className="ct-header">
          <span className="ct-title">আপনার কার্ট</span>
          <button className="ct-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="ct-items">
          {cartItems.map(item => (
            <CartItem key={item.id} item={item} onIncrease={onIncrease} onDecrease={onDecrease} />
          ))}
        </div>
        <div className="ct-summary">
          <div className="ct-summary-row"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
          <div className="ct-summary-row"><span>Delivery</span><span>৳{DELIVERY_FEE}</span></div>
          <div className="ct-summary-row ct-summary-total"><span>Total</span><span>৳{total.toLocaleString()}</span></div>
        </div>
        <div className="ct-checkout-wrap">
          <button className="ct-checkout-btn" onClick={() => setView(isLoggedIn() ? 'payment' : 'login')}>
            <span>Proceed to Payment</span>
            <span>৳{total.toLocaleString()} →</span>
          </button>
        </div>
      </>)}

      {view === 'login' && (
        <PhoneLoginStep
          onSuccess={() => setView('payment')}
          onBack={() => setView('cart')}
        />
      )}

      {view === 'payment' && (
        <PaymentStep total={total} onSuccess={handlePaymentSuccess} onBack={() => setView('cart')} />
      )}

      {view === 'success' && order && (
        <OrderSuccess order={order} onContinue={onClose} />
      )}
    </div>
  );
}

const styles = {
  page: { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#f0fdf4', padding:16 },
  card: { background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:380, boxShadow:'0 4px 24px rgba(0,0,0,.10)' },
  logoWrap: { textAlign:'center', marginBottom:18 },
  logoIcon: { fontSize:36 },
  logoText: { fontSize:26, fontWeight:800, color:'#1a9e5c', margin:'4px 0' },
  tagline: { color:'#6b7280', fontSize:14 },
  loginNote: { background:'#f0fdf4', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#374151', marginBottom:16, textAlign:'center' },
  label: { fontWeight:600, marginBottom:8, color:'#374151' },
  inputRow: { display:'flex', alignItems:'center', border:'2px solid #1a9e5c', borderRadius:10, overflow:'hidden', marginBottom:14 },
  prefix: { padding:'12px 10px', background:'#f0fdf4', color:'#1a9e5c', fontWeight:700, fontSize:15 },
  input: { flex:1, padding:'12px 10px', border:'none', outline:'none', fontSize:16, fontFamily:'inherit' },
  btn: { width:'100%', padding:'13px', background:'#1a9e5c', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' },
  backBtn: { width:'100%', marginTop:12, padding:'10px', background:'transparent', border:'none', color:'#888', fontSize:14, cursor:'pointer', fontFamily:'inherit' },
  error: { marginTop:14, color:'#e53935', fontSize:14, textAlign:'center', fontWeight:600 },
};