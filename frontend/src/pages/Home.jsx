import { useState, useEffect, useRef } from 'react';
import './Home.css';
import SIRAJGANJ_AREAS from '../data/sirajganjAreas.js';
import { auth } from '../firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';

const CATEGORIES = [
  { id:'all',        label:'All',        emoji:'🛒' },
  { id:'gas',        label:'Gas',        emoji:'🔵' },
  { id:'rice',       label:'Rice',       emoji:'🍚' },
  { id:'vegetables', label:'Vegetables', emoji:'🥦' },
  { id:'fish',       label:'Fish',       emoji:'🐟' },
  { id:'dairy',      label:'Dairy',      emoji:'🥛' },
];

const SECTION_TITLES = {
  all:        ["Today's Essentials", 'আজকের প্রয়োজনীয় পণ্য'],
  gas:        ['Gas Cylinders',      'গ্যাস সিলিন্ডার'],
  rice:       ['Rice & Grains',      'চাল ও শস্য'],
  vegetables: ['Fresh Vegetables',   'তাজা সবজি'],
  fish:       ['Fresh Fish',         'তাজা মাছ'],
  dairy:      ['Dairy Products',     'দুগ্ধজাত পণ্য'],
};

function useToast() {
  const [toast, setToast] = useState({ msg:'', visible:false });
  const timer = useRef();
  const show = (msg) => {
    clearTimeout(timer.current);
    setToast({ msg, visible:true });
    timer.current = setTimeout(() => setToast(t => ({ ...t, visible:false })), 2600);
  };
  return { toast, show };
}

function getSavedAddress() {
  try { return JSON.parse(localStorage.getItem('cb_address')); } catch { return null; }
}

function saveAddress(addr) {
  try { localStorage.setItem('cb_address', JSON.stringify(addr)); } catch {}
}

function isPhoneVerified() {
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
      email: user.email,
    }));
  } catch {}
}

// ─── Address Picker ───────────────────────────────────────────────────────────
function AddressPicker({ onSave, initialAddress }) {
  const [query,       setQuery]       = useState(initialAddress?.area || '');
  const [suggestions, setSuggestions] = useState([]);
  const [selected,    setSelected]    = useState(initialAddress?.area || '');
  const [houseNo,     setHouseNo]     = useState(initialAddress?.houseNo || '');
  const [roadNo,      setRoadNo]      = useState(initialAddress?.roadNo  || '');
  const [step,        setStep]        = useState(initialAddress ? 2 : 1);
  const inputRef = useRef();

  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  const handleSearch = (val) => {
    setQuery(val); setSelected('');
    if (!val.trim()) { setSuggestions([]); return; }
    const q = val.toLowerCase();
    setSuggestions(SIRAJGANJ_AREAS.filter(a => a.toLowerCase().includes(q)).slice(0, 6));
  };

  const handlePick = (area) => {
    setSelected(area); setQuery(area); setSuggestions([]); setStep(2);
  };

  const handleSave = () => {
    const addr = { area: selected || query.trim(), houseNo, roadNo };
    saveAddress(addr);
    onSave(addr);
  };

  return (
    <div className="cb-modal">
      <div className="cb-modal-header">
        <div className="cb-modal-icon">📍</div>
        <div>
          <div className="cb-modal-title">Where do you live?</div>
          <div className="cb-modal-sub">আপনি কোথায় থাকেন?</div>
        </div>
      </div>

      <div className="cb-modal-section">
        <label className="cb-modal-label">Area / Village name</label>
        <div className="cb-modal-search">
          <span>🔍</span>
          <input ref={inputRef} type="text" placeholder='Type area name e.g. "Janpur"'
            value={query} onChange={e => handleSearch(e.target.value)} className="cb-modal-input" />
          {query && <button className="cb-modal-clear" onClick={() => { setQuery(''); setSelected(''); setSuggestions([]); setStep(1); }}>✕</button>}
        </div>

        {suggestions.length > 0 && (
          <div className="cb-suggestions">
            {suggestions.map(area => (
              <button key={area} className="cb-suggestion-item" onClick={() => handlePick(area)}>
                <span className="cb-sug-pin">📍</span>
                <div>
                  <div className="cb-sug-name">{area}</div>
                  <div className="cb-sug-sub">Sirajganj Sadar</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="cb-modal-save" onClick={handleSave} disabled={!selected && !query.trim()}>
        Confirm Location ✅
      </button>
      <div className="cb-modal-note">🔒 We only deliver within Sirajganj Sadar area</div>
    </div>
  );
}

// ─── Phone OTP Modal ──────────────────────────────────────────────────────────
function PhoneOtpModal({ onSuccess, onSkip }) {
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
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'home-recaptcha', { size: 'normal' });
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
    <div style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:20,padding:28,width:'100%',maxWidth:360,boxShadow:'0 4px 24px rgba(0,0,0,0.15)'}}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:40}}>📱</div>
          <h2 style={{fontSize:22,fontWeight:800,color:'#1a9e5c',margin:'8px 0 4px'}}>নম্বর যাচাই করুন</h2>
          <p style={{color:'#6b7280',fontSize:14}}>ডেলিভারি নিশ্চিত করতে আপনার মোবাইল নম্বর দিন</p>
        </div>

        {step === 'phone' && (<>
          <p style={{fontWeight:600,marginBottom:8,color:'#374151'}}>মোবাইল নম্বর</p>
          <div style={{display:'flex',alignItems:'center',border:'2px solid #1a9e5c',borderRadius:10,overflow:'hidden',marginBottom:14}}>
            <span style={{padding:'12px 10px',background:'#f0fdf4',color:'#1a9e5c',fontWeight:700}}>+88</span>
            <input style={{flex:1,padding:'12px 10px',border:'none',outline:'none',fontSize:16}}
              type="tel" placeholder="01XXXXXXXXX"
              value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} maxLength={11} />
          </div>
          <div id="home-recaptcha" style={{margin:'10px 0'}} />
          <button style={{width:'100%',padding:13,background:'#1a9e5c',color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:600,cursor:'pointer',opacity:loading?0.7:1}}
            onClick={sendOtp} disabled={loading}>
            {loading ? 'পাঠানো হচ্ছে...' : 'OTP পাঠান'}
          </button>
        </>)}

        {step === 'otp' && (<>
          <p style={{fontWeight:600,marginBottom:8,color:'#374151'}}>OTP দিন</p>
          <p style={{color:'#1a9e5c',fontWeight:700,marginBottom:14}}>+88{phone}</p>
          <input style={{width:'100%',padding:'12px',border:'2px solid #1a9e5c',borderRadius:10,fontSize:24,textAlign:'center',letterSpacing:8,outline:'none',boxSizing:'border-box'}}
            type="number" placeholder="------" value={otp}
            onChange={e => setOtp(e.target.value)} maxLength={6} />
          <button style={{width:'100%',marginTop:14,padding:13,background:'#1a9e5c',color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:600,cursor:'pointer',opacity:loading?0.7:1}}
            onClick={verifyOtp} disabled={loading}>
            {loading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন ✅'}
          </button>
          <button style={{width:'100%',marginTop:8,padding:10,background:'transparent',border:'none',color:'#888',fontSize:14,cursor:'pointer'}}
            onClick={() => setStep('phone')}>← নম্বর পরিবর্তন করুন</button>
        </>)}

        {error && <div style={{marginTop:14,color:'#e53935',fontSize:14,textAlign:'center',fontWeight:600}}>{error}</div>}
        <button style={{width:'100%',marginTop:12,padding:10,background:'transparent',border:'none',color:'#9ca3af',fontSize:13,cursor:'pointer'}}
          onClick={onSkip}>এখন না, পরে করব</button>
      </div>
    </div>
  );
}

// ─── Qty Control ──────────────────────────────────────────────────────────────
function QtyControl({ qty, onAdd, onIncrease, onDecrease }) {
  if (qty === 0) return <button className="cb-add-btn" onClick={onAdd}>+</button>;
  return (
    <div className="cb-qty-ctrl">
      <button className="cb-qty-btn" onClick={onDecrease}>−</button>
      <span className="cb-qty-num">{qty}</span>
      <button className="cb-qty-btn" onClick={onIncrease}>+</button>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, onIncrease, onDecrease }) {
  return (
    <div className="cb-product-card">
      {product.isFast && <div className="cb-badge-fast">⚡ FAST</div>}
      <div className="cb-product-emoji">{product.emoji}</div>
      <div className="cb-product-name">{product.name}</div>
      <div className="cb-product-name-bn">{product.nameBn}</div>
      <div className="cb-product-unit">{product.unit}</div>
      <div className="cb-product-bottom">
        <div className="cb-product-price">৳{product.price}</div>
        <QtyControl qty={product.qty || 0} onAdd={() => onAdd(product)} onIncrease={() => onIncrease(product.id)} onDecrease={() => onDecrease(product.id)} />
      </div>
    </div>
  );
}

// ─── Main Home ────────────────────────────────────────────────────────────────
export default function Home({ products, onUpdateQty, onOpenCart, cartCount }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [address,        setAddress]        = useState(getSavedAddress);
  const [showPicker,     setShowPicker]     = useState(!getSavedAddress());
  const [showOtp,        setShowOtp]        = useState(false);
  const { toast, show: showToast } = useToast();

  const handleAddressSave = (addr) => {
    setAddress(addr);
    setShowPicker(false);
    if (!isPhoneVerified()) {
      setShowOtp(true);
    } else {
      showToast(`🚴 Delivering to ${addr.area}!`);
    }
  };

  const handleOtpSuccess = () => {
    setShowOtp(false);
    showToast(`🚴 Delivering to ${address?.area}! নম্বর যাচাই সম্পন্ন ✅`);
  };

  const handleAdd = (product) => {
    onUpdateQty(product.id, 1);
    showToast(`✅ ${product.name} added to cart!`);
  };

  const handleDecrease = (product) => {
    onUpdateQty(product.id, -1);
    if (product.qty === 1) showToast(`🗑 ${product.name} removed`);
  };

  const filteredProducts = products.filter(p => {
    const matchCat    = activeCategory === 'all' || p.category === activeCategory;
    const q           = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(q) || p.nameBn.includes(searchQuery);
    return matchCat && matchSearch;
  });

  const [sectionTitle, sectionSubtitle] = SECTION_TITLES[activeCategory] || SECTION_TITLES.all;
  const navArea    = address?.area || 'Set location';
  const navSubArea = address?.houseNo ? `${address.houseNo}${address.roadNo ? ', '+address.roadNo : ''}` : 'Tap to set →';

  return (
    <div className="cb-wrap">
      {/* NAV */}
      <nav className="cb-nav">
        <div className="cb-nav-logo">
          <span className="cb-logo-icon">🛒</span>
          <div>
            <div className="cb-logo-name">CityBest</div>
            <div className="cb-logo-sub">SIRAJGANJ DELIVERY</div>
          </div>
        </div>
        <button className="cb-nav-location" onClick={() => setShowPicker(true)}>
          <span className="cb-nav-dot">●</span>
          <div>
            <div className="cb-nav-area">{navArea}</div>
            <div className="cb-nav-sub">{navSubArea}</div>
          </div>
        </button>
        <button className="cb-cart-btn" onClick={onOpenCart}>
          🛒 <span className="cb-cart-count">{cartCount}</span>
        </button>
      </nav>

      {/* SEARCH */}
      <div className="cb-search-wrap">
        <span className="cb-search-icon">🔍</span>
        <input className="cb-search-input" type="text"
          placeholder='Search "চাল", "gas cylinder"...'
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {/* HERO */}
      <div className="cb-hero">
        <div className="cb-hero-text">
          <h2 className="cb-hero-title">Sirajganj's best grocery. Delivered. 🚀</h2>
          <p className="cb-hero-sub">Fast delivery across Sirajganj</p>
          <p className="cb-hero-sub-bn">সিরাজগঞ্জে দ্রুত ডেলিভারি</p>
          <button className="cb-hero-btn" onClick={onOpenCart}>Shop Now</button>
        </div>
        <div className="cb-hero-img">🛵</div>
      </div>

      {/* BADGES */}
      <div className="cb-badges">
        <span className="cb-badge">⚡ Fast Delivery</span>
        <span className="cb-badge">🔥 Best Prices</span>
        <span className="cb-badge">✅ Quality Assured</span>
      </div>

      {/* CATEGORIES */}
      <div className="cb-section-header">
        <div>
          <div className="cb-section-title">Categories</div>
          <div className="cb-section-sub">আপনি কী খুঁজছেন?</div>
        </div>
        <button className="cb-see-all">See all</button>
      </div>
      <div className="cb-categories">
        {CATEGORIES.map(cat => (
          <button key={cat.id}
            className={`cb-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}>
            <span className="cb-cat-emoji">{cat.emoji}</span>
            <span className="cb-cat-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* PROMO */}
      <div className="cb-promo">
        <div>
          <div className="cb-promo-title">First order 20% OFF! 🎉</div>
          <div className="cb-promo-sub">প্রথম অর্ডারে ২০% ছাড়</div>
        </div>
        <div className="cb-promo-code">CITY20</div>
      </div>

      {/* PRODUCTS */}
      <div className="cb-section-header">
        <div>
          <div className="cb-section-title">{sectionTitle}</div>
          <div className="cb-section-sub">{sectionSubtitle}</div>
        </div>
        <button className="cb-see-all">See all</button>
      </div>
      <div className="cb-products">
        {filteredProducts.length === 0
          ? <div className="cb-empty-cat">No products found</div>
          : filteredProducts.map(p => (
            <ProductCard key={p.id} product={p}
              onAdd={handleAdd}
              onIncrease={(id) => onUpdateQty(id, 1)}
              onDecrease={(id) => { const pr = products.find(x => x.id === id); if (pr) handleDecrease(pr); }} />
          ))
        }
      </div>

      <div className="cb-spacer" />

      {/* BOTTOM NAV */}
      <nav className="cb-bottom-nav">
        <button className="cb-nav-item active">
          <span className="cb-nav-icon">🏠</span>
          <span className="cb-nav-label">Home</span>
        </button>
        <button className="cb-nav-item" onClick={() => showToast('🔍 Search coming soon!')}>
          <span className="cb-nav-icon">🔍</span>
          <span className="cb-nav-label">Search</span>
        </button>
        <button className="cb-nav-item" onClick={onOpenCart}>
          <span className="cb-nav-icon">🛒</span>
          <span className="cb-nav-label">Orders</span>
        </button>
        <button className="cb-nav-item" onClick={() => showToast('👤 Profile coming soon!')}>
          <span className="cb-nav-icon">👤</span>
          <span className="cb-nav-label">Profile</span>
        </button>
      </nav>

      <div className={`cb-toast ${toast.visible ? 'show' : ''}`} role="status">{toast.msg}</div>

      {/* ADDRESS PICKER MODAL */}
      {showPicker && (
        <div className="cb-overlay">
          <AddressPicker onSave={handleAddressSave} initialAddress={address} />
        </div>
      )}

      {/* PHONE OTP MODAL */}
      {showOtp && (
        <PhoneOtpModal
          onSuccess={handleOtpSuccess}
          onSkip={() => { setShowOtp(false); showToast(`🚴 Delivering to ${address?.area}!`); }}
        />
      )}
    </div>
  );
}