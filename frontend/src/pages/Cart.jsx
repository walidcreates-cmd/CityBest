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
  { id:'bkash',  name:'bKash',         color:'#E2136E', emoji:'ðŸ’š', bg:'#fce4f0' },
  { id:'nagad',  name:'Nagad',         color:'#F26522', emoji:'ðŸŸ ', bg:'#fef0e8' },
  { id:'rocket', name:'Rocket',        color:'#8B1A8B', emoji:'ðŸš€', bg:'#f5e8f5' },
  { id:'upay',   name:'Upay',          color:'#00A651', emoji:'ðŸ’š', bg:'#e8f7ef' },
  { id:'other',  name:'Other Bank App',color:'#374151', emoji:'ðŸ¦', bg:'#f3f4f6' },
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

// â”€â”€â”€ Cart Item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        <div className="ct-item-price">à§³{(item.price * item.qty).toLocaleString()}</div>
        <div className="ct-qty-ctrl">
          <button className="ct-qty-btn" onClick={() => onDecrease(item.id)}>âˆ’</button>
          <span className="ct-qty-num">{item.qty}</span>
          <button className="ct-qty-btn" onClick={() => onIncrease(item.id)}>+</button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Phone Login Step â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    if (!phone || phone.length < 10) { setError('à¦¸à¦ à¦¿à¦• à¦®à§‹à¦¬à¦¾à¦‡à¦² à¦¨à¦®à§à¦¬à¦° à¦¦à¦¿à¦¨'); return; }
    setLoading(true);
    try {
      await setupRecaptcha();
      const fullPhone = phone.startsWith('+') ? phone : `+88${phone}`;
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      confirmRef.current = result;
      setStep('otp');
    } catch (err) {
      setError('OTP à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¸à¦®à§à¦­à¦¬ à¦¹à¦¯à¦¼à¦¨à¦¿à¥¤ à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤');
      console.error(err);
      if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; }
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setError('');
    if (!otp || otp.length !== 6) { setError('à§¬ à¦¸à¦‚à¦–à§à¦¯à¦¾à¦° OTP à¦¦à¦¿à¦¨'); return; }
    setLoading(true);
    try {
      const result = await confirmRef.current.confirm(otp);
      saveUser(result.user);
      onSuccess();
    } catch (err) {
      setError('OTP à¦¸à¦ à¦¿à¦• à¦¨à¦¯à¦¼à¥¤ à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>ðŸ›’</span>
          <h1 style={styles.logoText}>CityBest</h1>
          <p style={styles.tagline}>à¦…à¦°à§à¦¡à¦¾à¦° à¦•à¦°à¦¤à§‡ à¦®à§‹à¦¬à¦¾à¦‡à¦² à¦¨à¦®à§à¦¬à¦° à¦¯à¦¾à¦šà¦¾à¦‡ à¦•à¦°à§à¦¨</p>
        </div>
        <div style={styles.loginNote}>
          à¦†à¦ªà¦¨à¦¾à¦° à¦¨à¦®à§à¦¬à¦° à¦¶à§à¦§à§à¦®à¦¾à¦¤à§à¦° à¦…à¦°à§à¦¡à¦¾à¦° à¦¨à¦¿à¦¶à§à¦šà¦¿à¦¤ à¦•à¦°à¦¤à§‡ à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦° à¦•à¦°à¦¾ à¦¹à¦¬à§‡
        </div>
        {step === 'phone' && (<>
          <p style={styles.label}>à¦®à§‹à¦¬à¦¾à¦‡à¦² à¦¨à¦®à§à¦¬à¦° à¦¦à¦¿à¦¨</p>
          <div style={styles.inputRow}>
            <span style={styles.prefix}>+88</span>
            <input style={styles.input} type="tel" placeholder="01XXXXXXXXX"
              value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} maxLength={11} />
          </div>
          <div id="ct-recaptcha" style={{margin:'10px 0'}} />
          <button style={{...styles.btn, opacity: loading ? 0.7 : 1}} onClick={sendOtp} disabled={loading}>
            {loading ? 'à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à¦šà§à¦›à§‡...' : 'OTP à¦ªà¦¾à¦ à¦¾à¦¨'}
          </button>
        </>)}
        {step === 'otp' && (<>
          <p style={styles.label}>à¦†à¦ªà¦¨à¦¾à¦° à¦«à§‹à¦¨à§‡ à¦†à¦¸à¦¾ OTP à¦¦à¦¿à¦¨</p>
          <p style={{color:'#1a9e5c', fontWeight:700, marginBottom:14}}>+88{phone}</p>
          <input style={{...styles.input, width:'100%', textAlign:'center', fontSize:24, letterSpacing:8}}
            type="number" placeholder="------" value={otp}
            onChange={e => setOtp(e.target.value)} maxLength={6} />
          <button style={{...styles.btn, opacity: loading ? 0.7 : 1}} onClick={verifyOtp} disabled={loading}>
            {loading ? 'à¦¯à¦¾à¦šà¦¾à¦‡ à¦¹à¦šà§à¦›à§‡...' : 'à¦¯à¦¾à¦šà¦¾à¦‡ à¦•à¦°à§à¦¨'}
          </button>
          <button style={styles.backBtn} onClick={() => setStep('phone')}>â† à¦¨à¦®à§à¦¬à¦° à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à§à¦¨</button>
        </>)}
        {error && <div style={styles.error}>{error}</div>}
        <button style={styles.backBtn} onClick={onBack}>â† à¦•à¦¾à¦°à§à¦Ÿà§‡ à¦«à¦¿à¦°à§à¦¨</button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Payment Step â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PaymentStep({ total, onSuccess, onBack }) {
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const { toast, show: showToast } = useToast();

  const handlePay = async () => {
    if (!selected) { showToast('à¦ªà§‡à¦®à§‡à¦¨à§à¦Ÿ à¦ªà¦¦à§à¦§à¦¤à¦¿ à¦¬à§‡à¦›à§‡ à¦¨à¦¿à¦¨'); return; }
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
      else { showToast('à¦ªà§‡à¦®à§‡à¦¨à§à¦Ÿ à¦¶à§à¦°à§ à¦•à¦°à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿'); setLoading(false); }
    } catch { showToast('à¦¸à¦‚à¦¯à§‹à¦— à¦¸à¦®à¦¸à§à¦¯à¦¾'); setLoading(false); }
  };

  return (
    <div style={{background:'#f9fafb', minHeight:'100%', display:'flex', flexDirection:'column'}}>
      {/* Header */}
      <div style={{display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#fff', borderBottom:'1px solid #e5e7eb', position:'sticky', top:0, zIndex:10}}>
        <button onClick={onBack} style={{background:'#f3f4f6', border:'none', padding:'7px 13px', borderRadius:20, fontSize:13, fontWeight:700, cursor:'pointer', color:'#374151'}}>â† Back</button>
        <span style={{fontSize:16, fontWeight:900, color:'#111827'}}>Choose Payment</span>
      </div>

      {/* Amount */}
      <div style={{background:'#1a9e5c', margin:14, borderRadius:14, padding:18, textAlign:'center'}}>
        <div style={{color:'rgba(255,255,255,.85)', fontSize:12, fontWeight:600, marginBottom:4}}>Total to pay</div>
        <div style={{color:'#fff', fontSize:32, fontWeight:900}}>à§³{total.toLocaleString()}</div>
      </div>

      {/* Mobile Banking */}
      <div style={{padding:'0 16px', marginBottom:8}}>
        <div style={{fontSize:13, fontWeight:700, color:'#374151', marginBottom:4}}>ðŸ’š Mobile Banking</div>
        <div style={{fontSize:12, color:'#6b7280', marginBottom:12}}>bKash, Nagad, Rocket & more â€” all use same Merchant ID</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          {MOBILE_APPS.map(app => (
            <button key={app.id} onClick={() => setSelected(app.id)}
              style={{display:'flex', alignItems:'center', gap:8, padding:'12px 14px', borderRadius:12, border:`2px solid ${selected === app.id ? app.color : '#e5e7eb'}`, background: selected === app.id ? app.bg : '#fff', cursor:'pointer', fontFamily:'inherit'}}>
              <span style={{fontSize:20}}>{app.emoji}</span>
              <span style={{fontSize:13, fontWeight:800, color:app.color}}>{app.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cash on Delivery */}
      <div style={{padding:'0 16px', marginBottom:16}}>
        <button onClick={() => setSelected('cod')}
          style={{width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px', borderRadius:14, border:`2px solid ${selected === 'cod' ? '#1a9e5c' : '#e5e7eb'}`, background: selected === 'cod' ? '#f0fdf4' : '#fff', cursor:'pointer', fontFamily:'inherit'}}>
          <span style={{fontSize:28}}>ðŸ’µ</span>
          <div style={{textAlign:'left', flex:1}}>
            <div style={{fontSize:15, fontWeight:800, color:'#111827'}}>Cash on Delivery</div>
            <div style={{fontSize:12, color:'#6b7280'}}>Pay when rider arrives at your door</div>
          </div>
          <span style={{color:'#1a9e5c', fontWeight:700}}>â†’</span>
        </button>
      </div>

      {/* Pay Button */}
      <div style={{padding:'0 16px'}}>
        <button onClick={handlePay} disabled={loading}
          style={{width:'100%', padding:16, background: loading ? '#9ca3af' : '#1a9e5c', color:'#fff', border:'none', borderRadius:14, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'inherit'}}>
          {loading ? 'Processing...' : `Pay à§³${total.toLocaleString()}`}
        </button>
      </div>

      {toast.visible && <div style={{position:'fixed', bottom:76, left:'50%', transform:'translateX(-50%)', background:'#111827', color:'#fff', padding:'10px 20px', borderRadius:22, fontSize:13, fontWeight:700, whiteSpace:'nowrap'}}>{toast.msg}</div>}
    </div>
  );
}

// â”€â”€â”€ Order Success â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OrderSuccess({ order, onContinue }) {
  return (
    <div className="ct-success">
      <div className="ct-success-icon">ðŸŽ‰</div>
      <h2 className="ct-success-title">Order Placed!</h2>
      <p className="ct-success-sub">à¦…à¦°à§à¦¡à¦¾à¦° à¦¸à¦«à¦² à¦¹à¦¯à¦¼à§‡à¦›à§‡</p>
      <div className="ct-success-card">
        <div className="ct-success-row"><span>Order ID</span><span>#{order.id}</span></div>
        <div className="ct-success-row"><span>Payment</span><span>{order.payment}</span></div>
        <div className="ct-success-row"><span>Total</span><span>à§³{order.total}</span></div>
        <div className="ct-success-row"><span>Deliver to</span><span>{order.area}</span></div>
        <div className="ct-success-row"><span>Status</span><span>âœ… Confirmed</span></div>
      </div>
      <p className="ct-success-note">ðŸ›µ Your order is being prepared.<br/>Our rider will deliver to your address soon!</p>
      <button className="ct-continue-btn" onClick={onContinue}>Continue Shopping â†’</button>
    </div>
  );
}

// â”€â”€â”€ Main Cart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      <div className="ct-empty-icon">ðŸ›’</div>
      <p>à¦•à¦¾à¦°à§à¦Ÿ à¦–à¦¾à¦²à¦¿ à¦†à¦›à§‡</p>
      <button className="ct-continue-btn" onClick={onClose}>à¦¶à¦ªà¦¿à¦‚ à¦•à¦°à§à¦¨</button>
    </div>
  );

  return (
    <div className="ct-wrap">
      {view === 'cart' && (<>
        <div className="ct-header">
          <span className="ct-title">à¦†à¦ªà¦¨à¦¾à¦° à¦•à¦¾à¦°à§à¦Ÿ</span>
          <button className="ct-close-btn" onClick={onClose}>âœ•</button>
        </div>
        <div className="ct-items">
          {cartItems.map(item => (
            <CartItem key={item.id} item={item} onIncrease={onIncrease} onDecrease={onDecrease} />
          ))}
        </div>
        <div className="ct-summary">
          <div className="ct-summary-row"><span>Subtotal</span><span>à§³{subtotal.toLocaleString()}</span></div>
          <div className="ct-summary-row"><span>Delivery</span><span>à§³{DELIVERY_FEE}</span></div>
          <div className="ct-summary-row ct-summary-total"><span>Total</span><span>à§³{total.toLocaleString()}</span></div>
        </div>
        <div className="ct-checkout-wrap">
          <button className="ct-checkout-btn" onClick={() => setView(isLoggedIn() ? 'payment' : 'login')}>
            <span>Proceed to Payment</span>
            <span>à§³{total.toLocaleString()} â†’</span>
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