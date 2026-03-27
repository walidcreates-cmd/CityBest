import { useState, useRef } from 'react';
import { auth } from '../firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
} from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

const MERCHANT_ID = '900701000667617966';
const DELIVERY_FEE = 30;

const MOBILE_APPS = [
  { id:'bkash',  name:'bKash',         color:'#E2136E', emoji:'💚', bg:'#fce4f0' },
  { id:'nagad',  name:'Nagad',         color:'#F26522', emoji:'🟠', bg:'#fef0e8' },
  { id:'rocket', name:'Rocket',        color:'#8B1A8B', emoji:'🚀', bg:'#f5e8f5' },
  { id:'upay',   name:'Upay',          color:'#00A651', emoji:'💚', bg:'#e8f7ef' },
  { id:'other',  name:'Other Bank App',color:'#374151', emoji:'🏦', bg:'#f3f4f6' },
];

function getSavedAddress() {
  try { return JSON.parse(localStorage.getItem('cb_address')) || {}; } catch { return {}; }
}

function useToast() {
  const [toast, setToast] = useState({ msg:'', visible:false });
  let timer;
  const show = (msg) => {
    clearTimeout(timer);
    setToast({ msg, visible:true });
    timer = setTimeout(() => setToast(t => ({ ...t, visible:false })), 2600);
  };
  return { toast, show };
}

function isLoggedIn() {
  try {
    const u = JSON.parse(localStorage.getItem('cb_user'));
    return !!(u && u.phone);
  } catch { return false; }
}

function saveUser(user) {
  try {
    localStorage.setItem('cb_user', JSON.stringify({
      uid: user.uid,
      phone: user.phoneNumber,
      email: user.email
    }));
  } catch {}
}

// ─── Cart Item ────────────────────────────────────────────────────────────────
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

// ─── Phone Login Step ─────────────────────────────────────────────────────────
function PhoneLoginStep({ onSuccess, onBack }) {
  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [step,    setStep]    = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const confirmRef            = useRef(null);

  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'ct-recaptcha', { size: 'normal' });
    return window.recaptchaVerifier.render();
  };

  const sendOtp = async () => {
    setError('');
    if (!phone || phone.length < 10) { setError('সঠিক মোবাইল নম্বর দিন'); return; }
    setLoading(true);
    try {
      await setupRecaptcha();
      const fullPhone = phone.startsWith('+') ? phone : `+88${phone}`;
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      confirmRef.current = result;
      setStep('otp');
    } catch (err) {
      setError('OTP পাঠানো সম্ভব হয়নি। আবার চেষ্টা করুন।');
      console.error(err);
      if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; }
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setError('');
    if (!otp || otp.length !== 6) { setError('৬ সংখ্যার OTP দিন'); return; }
    setLoading(true);
    try {
      const result = await confirmRef.current.confirm(otp);
      saveUser(result.user);
      onSuccess();
    } catch (err) {
      setError('OTP সঠিক নয়। আবার চেষ্টা করুন।');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>🛒</span>
          <h1 style={styles.logoText}>CityBest</h1>
          <p style={styles.tagline}>অর্ডার করতে মোবাইল নম্বর যাচাই করুন</p>
        </div>
        <div style={styles.loginNote}>
          আপনার নম্বর শুধুমাত্র অর্ডার নিশ্চিত করতে ব্যবহার করা হবে
        </div>
        {step === 'phone' && (<>
          <p style={styles.label}>মোবাইল নম্বর দিন</p>
          <div style={styles.inputRow}>
            <span style={styles.prefix}>+88</span>
            <input style={styles.input} type="tel" placeholder="01XXXXXXXXX"
              value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} maxLength={11} />
          </div>
          <div id="ct-recaptcha" style={{margin:'10px 0'}} />
          <button style={{...styles.btn, opacity: loading ? 0.7 : 1}} onClick={sendOtp} disabled={loading}>
            {loading ? 'পাঠানো হচ্ছে...' : 'OTP পাঠান'}
          </button>
        </>)}
        {step === 'otp' && (<>
          <p style={styles.label}>আপনার ফোনে আসা OTP দিন</p>
          <p style={{color:'#1a9e5c', fontWeight:700, marginBottom:14}}>+88{phone}</p>
          <input style={{...styles.input, width:'100%', textAlign:'center', fontSize:24, letterSpacing:8}}
            type="number" placeholder="------" value={otp}
            onChange={e => setOtp(e.target.value)} maxLength={6} />
          <button style={{...styles.btn, opacity: loading ? 0.7 : 1}} onClick={verifyOtp} disabled={loading}>
            {loading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
          </button>
          <button style={styles.backBtn} onClick={() => setStep('phone')}>← নম্বর পরিবর্তন করুন</button>
        </>)}
        {error && <div style={styles.error}>{error}</div>}
        <button style={styles.backBtn} onClick={onBack}>← কার্টে ফিরুন</button>
      </div>
    </div>
  );
}

// ─── Payment Step ─────────────────────────────────────────────────────────────
function PaymentStep({ total, onSuccess, onBack }) {
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const { toast, show: showToast } = useToast();

  const handlePay = async () => {
    if (!selected) { showToast('পেমেন্ট পদ্ধতি বেছে নিন'); return; }
    if (selected === 'cod') { onSuccess('Cash on Delivery'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/bkash-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, merchantId: MERCHANT_ID, method: selected }),
      });
      const data = await res.json();
      if (data.bkashURL) window.location.href = data.bkashURL;
      else { showToast('পেমেন্ট শুরু করা যায়নি'); setLoading(false); }
    } catch { showToast('সংযোগ সমস্যা'); setLoading(false); }
  };

  return (
    <div className="ct-payment-wrap">
      <div className="ct-pay-header">
        <button className="ct-back-btn" onClick={onBack}>← Back</button>
        <span className="ct-pay-title">Choose Payment</span>
      </div>

      <div className="ct-pay-amount-box">
        <div className="ct-pay-amount-label">Total to pay</div>
        <div className="ct-pay-amount-val">৳{total.toLocaleString()}</div>
      </div>

      <div className="ct-app-grid">
        {MOBILE_APPS.map(app => (
          <button key={app.id}
            className={`ct-app-btn ${selected === app.id ? 'ct-app-selected' : ''}`}
            style={{ background: selected === app.id ? app.bg : '#fff', borderColor: selected === app.id ? app.color : '#e5e7eb' }}
            onClick={() => setSelected(app.id)}>
            <span className="ct-app-emoji">{app.emoji}</span>
            <span className="ct-app-name" style={{ color: app.color }}>{app.name}</span>
          </button>
        ))}
      </div>

      <button
        className={`ct-cod-btn ${selected === 'cod' ? 'ct-app-selected' : ''}`}
        onClick={() => setSelected('cod')}
        style={{ background: selected === 'cod' ? '#f0fdf4' : '#fff' }}>
        <span style={{fontSize:28}}>💵</span>
        <div>
          <div className="ct-cod-title">Cash on Delivery</div>
          <div className="ct-cod-sub">Pay when rider arrives at your door</div>
        </div>
        <span>→</span>
      </button>

      {toast.visible && <div className="ct-toast show">{toast.msg}</div>}

      <button className="ct-paid-btn" onClick={handlePay} disabled={loading}
        style={{margin:'16px', width:'calc(100% - 32px)', padding:'16px', background: loading ? '#9ca3af' : '#1a9e5c', color:'#fff', border:'none', borderRadius:14, fontSize:16, fontWeight:800, cursor:'pointer'}}>
        {loading ? 'Processing...' : `Pay ৳${total.toLocaleString()}`}
      </button>
    </div>
  );
}

// ─── Order Success ────────────────────────────────────────────────────────────
function OrderSuccess({ order, onContinue }) {
  return (
    <div className="ct-success">
      <div className="ct-success-icon">🎉</div>
      <h2 className="ct-success-title">Order Placed!</h2>
      <p className="ct-success-sub">অর্ডার সফল হয়েছে</p>
      <div className="ct-success-card">
        <div className="ct-success-row"><span>Order ID</span><span>#{order.id}</span></div>
        <div className="ct-success-row"><span>Payment</span><span>{order.payment}</span></div>
        <div className="ct-success-row"><span>Total</span><span>৳{order.total}</span></div>
        <div className="ct-success-row"><span>Deliver to</span><span>{order.area}</span></div>
        <div className="ct-success-row"><span>Status</span><span>✅ Confirmed</span></div>
      </div>
      <p className="ct-success-note">🛵 Your order is being prepared.<br/>Our rider will deliver to your address soon!</p>
      <button className="ct-continue-btn" onClick={onContinue}>Continue Shopping →</button>
    </div>
  );
}

// ─── Main Cart ────────────────────────────────────────────────────────────────
export default function Cart({ cartItems, onIncrease, onDecrease, onClose }) {
  const [view,  setView]  = useState('cart');
  const [order, setOrder] = useState(null);
  const { toast, show: showToast } = useToast();
  const address = getSavedAddress();

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const total    = subtotal + DELIVERY_FEE;

  const handlePaymentSuccess = async (method) => {
    const user = JSON.parse(localStorage.getItem('cb_user') || '{}');
    const newOrder = {
      id: Math.random().toString(36).substr(2,8).toUpperCase(),
      payment: method,
      total,
      area: address.area || 'Unknown',
      phone: user.phone || '',
      items: cartItems,
    };
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newOrder),
      });
    } catch (e) { console.error(e); }
    setOrder(newOrder);
    setView('success');
  };

  if (cartItems.length === 0 && view === 'cart') return (
    <div className="ct-empty">
      <div className="ct-empty-icon">🛒</div>
      <p>কার্ট খালি আছে</p>
      <button className="ct-continue-btn" onClick={onClose}>শপিং করুন</button>
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
  card: { background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:380, boxShadow:'0 4px 24px rgba(0,0,0,0.10)' },
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