import { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

const MERCHANT_ID  = '900701000667617966';
const DELIVERY_FEE = 30;
const googleProvider = new GoogleAuthProvider();

const MOBILE_APPS = [
  { id:'bkash',  name:'bKash',         color:'#E2136E', emoji:'💚', bg:'#fce4f0' },
  { id:'nagad',  name:'Nagad',          color:'#F26522', emoji:'🟠', bg:'#fef0e8' },
  { id:'rocket', name:'Rocket',         color:'#8B1A8B', emoji:'🚀', bg:'#f5e8f5' },
  { id:'upay',   name:'Upay',           color:'#00A651', emoji:'💳', bg:'#e8f7ef' },
  { id:'other',  name:'Other Bank App', color:'#374151', emoji:'🏦', bg:'#f3f4f6' },
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

// ── Cart Item ──────────────────────────────────────────────────────────────
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

// ── Phone Login Step ───────────────────────────────────────────────────────
function PhoneLoginStep({ onSuccess, onBack }) {
  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [step,    setStep]    = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const confirmRef            = useRef(null);
  const { toast, show: showToast } = useToast();

  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'ct-recaptcha', {
      size: 'normal',
    });
    return window.recaptchaVerifier.render();
  };

  const sendOtp = async () => {
    setError('');
    if (!phone || phone.length < 10) { setError('সঠিক ফোন নম্বর দিন'); return; }
    setLoading(true);
    try {
      await setupRecaptcha();
      const fullPhone = phone.startsWith('+') ? phone : `+88${phone}`;
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      confirmRef.current = result;
      setStep('otp');
    } catch (err) {
      setError('OTP পাঠানো যায়নি। আবার চেষ্টা করুন।');
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
    } catch {
      setError('OTP ভুল হয়েছে। আবার চেষ্টা করুন।');
    }
    setLoading(false);
  };

  const signInGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      saveUser(result.user);
      onSuccess();
    } catch {
      setError('Google লগইন ব্যর্থ হয়েছে।');
    }
    setLoading(false);
  };

  return (
    <div style={styles.loginWrap}>
      <div className="ct-pay-header">
        <button className="ct-back-btn" onClick={onBack}>← Back</button>
        <div className="ct-pay-title">লগইন করুন</div>
      </div>

      <div style={styles.loginNote}>
        অর্ডার দিতে আপনার ফোন নম্বর দিয়ে লগইন করুন
      </div>

      {step === 'phone' && (<>
        <p style={styles.label}>মোবাইল নম্বর দিন</p>
        <div style={styles.inputRow}>
          <span style={styles.prefix}>+88</span>
          <input style={styles.input} type="tel" placeholder="01XXXXXXXXX"
            value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} maxLength={11} />
        </div>
        <div id="ct-recaptcha" style={{margin:'10px 0'}} />
        <button style={{...styles.btn, opacity: loading ? 0.7 : 1}}
          onClick={sendOtp} disabled={loading}>
          {loading ? 'পাঠানো হচ্ছে...' : 'OTP পাঠান'}
        </button>
        <div style={styles.divider}>অথবা</div>
        <button style={styles.googleBtn} onClick={signInGoogle} disabled={loading}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="G" style={{width:20, marginRight:10}} />
          Google দিয়ে লগইন করুন
        </button>
      </>)}

      {step === 'otp' && (<>
        <p style={styles.label}>আপনার ফোনে OTP পাঠানো হয়েছে</p>
        <p style={{color:'#1a9e5c', fontWeight:700, marginBottom:14}}>+88{phone}</p>
        <input style={{...styles.input, width:'100%', textAlign:'center', fontSize:24, letterSpacing:8}}
          type="number" placeholder="------" value={otp}
          onChange={e => setOtp(e.target.value.slice(0,6))} maxLength={6} />
        <button style={{...styles.btn, marginTop:16, opacity: loading ? 0.7 : 1}}
          onClick={verifyOtp} disabled={loading}>
          {loading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
        </button>
        <button style={styles.backBtn} onClick={() => { setStep('phone'); setOtp(''); setError(''); }}>
          ← নম্বর পরিবর্তন করুন
        </button>
      </>)}

      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  loginWrap: { padding: '0 4px' },
  loginNote: { background:'#f0faf5', border:'1px solid #c3e6d0', borderRadius:10,
    padding:'12px 16px', fontSize:14, color:'#2d7a50', marginBottom:20, textAlign:'center' },
  label: { fontSize:15, color:'#444', marginBottom:10, fontWeight:600 },
  inputRow: { display:'flex', alignItems:'center', border:'2px solid #e0e0e0',
    borderRadius:10, overflow:'hidden', marginBottom:14 },
  prefix: { padding:'12px 10px', background:'#f5f5f5', color:'#555',
    fontWeight:700, fontSize:15, borderRight:'1px solid #e0e0e0' },
  input: { flex:1, border:'none', outline:'none', padding:'12px 14px', fontSize:16 },
  btn: { width:'100%', padding:14, background:'#1a9e5c', color:'#fff', border:'none',
    borderRadius:10, fontSize:16, fontWeight:700, cursor:'pointer' },
  divider: { textAlign:'center', margin:'16px 0', color:'#bbb', fontSize:13 },
  googleBtn: { width:'100%', padding:13, background:'#fff', color:'#333',
    border:'2px solid #e0e0e0', borderRadius:10, fontSize:15, fontWeight:600,
    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  backBtn: { width:'100%', marginTop:10, padding:10, background:'transparent',
    border:'none', color:'#888', fontSize:14, cursor:'pointer' },
  error: { marginTop:12, color:'#e53935', fontSize:14, textAlign:'center', fontWeight:600 },
};

// ── Payment Step ───────────────────────────────────────────────────────────
function PaymentStep({ total, onSuccess, onBack }) {
  const [method,      setMethod]      = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [step,        setStep]        = useState(1);
  const [trxId,       setTrxId]       = useState('');
  const [copied,      setCopied]      = useState(false);
  const { toast, show: showToast }    = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(MERCHANT_ID).then(() => {
      setCopied(true); showToast('✅ Merchant ID copied!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleMobileSelect = (app) => { setSelectedApp(app); setMethod('mobile'); setStep(2); };
  const handleCOD = () => { setMethod('cod'); setStep(3); };

  const handleConfirm = () => {
    if (method === 'cod') { onSuccess({ method:'Cash on Delivery', trxId:'COD' }); return; }
    if (!trxId.trim() || trxId.trim().length < 6) { showToast('⚠️ Please enter a valid Transaction ID'); return; }
    onSuccess({ method: selectedApp?.name || 'Mobile Banking', trxId: trxId.trim().toUpperCase() });
  };

  return (
    <div className="ct-payment-wrap">
      {step === 1 && (<>
        <div className="ct-pay-header">
          <button className="ct-back-btn" onClick={onBack}>← Back</button>
          <div className="ct-pay-title">Choose Payment</div>
        </div>
        <div className="ct-pay-amount-box">
          <div className="ct-pay-amount-label">Total to pay</div>
          <div className="ct-pay-amount-val">৳{total.toLocaleString()}</div>
        </div>
        <div className="ct-section-label">💚 Mobile Banking</div>
        <div className="ct-section-sub">bKash, Nagad, Rocket & more — all use same Merchant ID</div>
        <div className="ct-app-grid">
          {MOBILE_APPS.map(app => (
            <button key={app.id} className="ct-app-btn"
              style={{ background: app.bg, borderColor: app.color+'33' }}
              onClick={() => handleMobileSelect(app)}>
              <span className="ct-app-emoji">{app.emoji}</span>
              <span className="ct-app-name" style={{ color: app.color }}>{app.name}</span>
            </button>
          ))}
        </div>
        <button className="ct-card-btn" disabled>
          <span style={{fontSize:22}}>💳</span>
          <div style={{flex:1}}>
            <div className="ct-card-title">Card / Internet Banking</div>
            <div className="ct-card-sub">Coming soon</div>
          </div>
          <span className="ct-coming-pill">Soon</span>
        </button>
        <button className="ct-cod-btn" onClick={handleCOD}>
          <span style={{fontSize:28}}>💵</span>
          <div style={{flex:1}}>
            <div className="ct-cod-title">Cash on Delivery</div>
            <div className="ct-cod-sub">Pay when rider arrives at your door</div>
          </div>
          <span style={{fontSize:20}}>→</span>
        </button>
      </>)}

      {step === 2 && selectedApp && (<>
        <div className="ct-pay-header">
          <button className="ct-back-btn" onClick={() => setStep(1)}>← Back</button>
          <div className="ct-pay-title">Pay with {selectedApp.name}</div>
        </div>
        <div className="ct-pay-amount-box">
          <div className="ct-pay-amount-label">Amount to pay</div>
          <div className="ct-pay-amount-val">৳{total.toLocaleString()}</div>
          <div className="ct-no-charge">✅ চার্জ প্রযোজ্য নয় — No extra charge!</div>
        </div>
        <div className="ct-steps-list">
          {[
            `Open your ${selectedApp.name} app`,
            'Tap "Payment" or "পেমেন্ট"',
            'Enter or paste the Merchant ID below',
            `Enter amount: ৳${total.toLocaleString()}`,
            'Enter your PIN and complete payment',
            'Note your Transaction ID from success screen',
          ].map((text, i) => (
            <div key={i} className="ct-step-row">
              <div className="ct-step-num">{i+1}</div>
              <div className="ct-step-text">{text}</div>
            </div>
          ))}
        </div>
        <div className="ct-merchant-box">
          <div className="ct-merchant-top">
            <span className="ct-merchant-label">🏪 CITY BEST — Merchant ID</span>
            <span className="ct-merchant-city">Sirajganj Sadar</span>
          </div>
          <div className="ct-merchant-row">
            <div className="ct-merchant-id">{MERCHANT_ID}</div>
            <button className={`ct-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
              {copied ? '✅' : '📋 Copy'}
            </button>
          </div>
        </div>
        <button className="ct-paid-btn" onClick={() => setStep(3)}>
          I've paid — Enter Transaction ID →
        </button>
      </>)}

      {step === 3 && (<>
        <div className="ct-pay-header">
          <button className="ct-back-btn" onClick={() => method==='cod' ? setStep(1) : setStep(2)}>← Back</button>
          <div className="ct-pay-title">{method==='cod' ? 'Confirm Order' : 'Confirm Payment'}</div>
        </div>
        {method === 'cod' ? (
          <div className="ct-cod-confirm">
            <div style={{fontSize:60, textAlign:'center', marginBottom:12}}>💵</div>
            <div className="ct-cod-confirm-title">Cash on Delivery</div>
            <div className="ct-cod-confirm-sub">
              Our rider will collect <strong>৳{total.toLocaleString()}</strong> when your order arrives.
            </div>
            <div className="ct-cod-note">🕐 Please keep exact change ready</div>
          </div>
        ) : (<>
          <div className="ct-trx-label">Enter Transaction ID from your {selectedApp?.name} success screen</div>
          <div className="ct-trx-example">Example: <span>DCR0ITSG18</span></div>
          <input type="text" className="ct-trx-input"
            placeholder="Enter Transaction ID e.g. DCR0ITSG18"
            value={trxId} onChange={e => setTrxId(e.target.value.toUpperCase())} maxLength={20} />
          <div className="ct-trx-note">✅ No extra charge was applied to your payment</div>
        </>)}
        <button className="ct-confirm-btn" onClick={handleConfirm}>
          {method==='cod' ? '✅ Place Order — Cash on Delivery' : '✅ Confirm Payment & Place Order'}
        </button>
      </>)}

      <div className={`ct-toast ${toast.visible ? 'show' : ''}`}>{toast.msg}</div>
    </div>
  );
}

// ── Order Success ──────────────────────────────────────────────────────────
function OrderSuccess({ order, onContinue }) {
  return (
    <div className="ct-success">
      <div className="ct-success-anim">🎉</div>
      <div className="ct-success-title">Order Placed!</div>
      <div className="ct-success-bn">অর্ডার সফল হয়েছে</div>
      <div className="ct-success-card">
        {[
          ['Order ID',   `#${order.id}`],
          ['Payment',    order.method],
          ...(order.trxId !== 'COD' ? [['TrxID', order.trxId]] : []),
          ['Total',      `৳${order.total.toLocaleString()}`],
          ['Deliver to', order.area],
          ['Status',     '✅ Confirmed'],
        ].map(([label, value]) => (
          <div key={label} className="ct-success-row">
            <span className="ct-success-label">{label}</span>
            <span className="ct-success-value">{value}</span>
          </div>
        ))}
      </div>
      <div className="ct-success-note">
        🛵 Your order is being prepared.<br/>
        Our rider will deliver to your address soon!
      </div>
      <button className="ct-continue-btn" onClick={onContinue}>Continue Shopping →</button>
    </div>
  );
}

// ── localStorage user helpers ─────────────────────────────────────────────
function isLoggedIn() {
  try { return !!localStorage.getItem('cb_user'); } catch { return false; }
}
function saveUser(user) {
  try { localStorage.setItem('cb_user', JSON.stringify({ uid: user.uid, phone: user.phoneNumber, email: user.email })); } catch {}
}

// ── Main Cart ──────────────────────────────────────────────────────────────
export default function Cart({ cartItems, onUpdateQty, onClose, onClearCart }) {
  const [view,  setView]  = useState('cart');
  const [order, setOrder] = useState(null);
  const address  = getSavedAddress();
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const total    = subtotal + DELIVERY_FEE;

  const handlePaymentSuccess = async ({ method, trxId }) => {
    const newOrder = {
      id:    Math.random().toString(36).substr(2,8).toUpperCase(),
      method, trxId, total,
      area:  address.area || 'Sirajganj',
      items: cartItems,
      time:  new Date().toISOString(),
    };
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area:          address.area    || 'Sirajganj',
          houseNo:       address.houseNo || '',
          roadNo:        address.roadNo  || '',
          items:         cartItems.map(i => ({
            name: i.name, nameBn: i.nameBn,
            emoji: i.emoji, price: i.price,
            qty: i.qty, unit: i.unit,
          })),
          subtotal, deliveryFee: DELIVERY_FEE, total,
          paymentMethod: method, transactionId: trxId || null,
        }),
      });
      const data = await res.json();
      if (data.success) newOrder.id = data.data._id.toString().slice(-8).toUpperCase();
    } catch (err) {
      console.error('Order save error:', err);
    }
    setOrder(newOrder);
    setView('success');
    onClearCart();
  };

  if (cartItems.length === 0 && view === 'cart') return (
    <div className="ct-root">
      <div className="ct-header">
        <button className="ct-close-btn" onClick={onClose}>←</button>
        <div className="ct-header-title">My Cart</div>
        <div/>
      </div>
      <div className="ct-empty">
        <div style={{fontSize:64, marginBottom:12}}>🛒</div>
        <div className="ct-empty-title">Your cart is empty</div>
        <div className="ct-empty-sub">Add some products to get started!</div>
        <button className="ct-shop-btn" onClick={onClose}>Start Shopping →</button>
      </div>
    </div>
  );

  return (
    <div className="ct-root">
      {view === 'cart' && (<>
        <div className="ct-header">
          <button className="ct-close-btn" onClick={onClose}>←</button>
          <div className="ct-header-title">My Cart 🛒</div>
          <div className="ct-item-count">{cartItems.reduce((s,i)=>s+i.qty,0)} items</div>
        </div>
        <div className="ct-address-bar">
          <span style={{fontSize:16}}>📍</span>
          <div>
            <div className="ct-address-label">Delivering to</div>
            <div className="ct-address-val">
              {address.area || 'Set location'}
              {address.houseNo ? `, ${address.houseNo}` : ''}
              {address.roadNo  ? `, ${address.roadNo}`  : ''}
            </div>
          </div>
        </div>
        <div className="ct-items">
          {cartItems.map(item => (
            <CartItem key={item.id} item={item}
              onIncrease={id => onUpdateQty(id, 1)}
              onDecrease={id => onUpdateQty(id, -1)}
            />
          ))}
        </div>
        <div className="ct-summary">
          <div className="ct-summary-title">Order Summary</div>
          <div className="ct-summary-row"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
          <div className="ct-summary-row"><span>Delivery fee</span><span>৳{DELIVERY_FEE}</span></div>
          <div className="ct-summary-divider"/>
          <div className="ct-summary-row ct-summary-total"><span>Total</span><span>৳{total.toLocaleString()}</span></div>
        </div>
        <div className="ct-checkout-wrap">
          <button className="ct-checkout-btn" onClick={() => setView(isLoggedIn() ? 'payment' : 'login')}>
            <span>Proceed to Payment</span>
            <span>৳{total.toLocaleString()} →</span>
          </button>
        </div>
      </>)}

      {/* Login step — only shown if not logged in */}
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
