import { useState, useEffect, useRef } from 'react';
import './Home.css';
import SIRAJGANJ_AREAS from '../data/sirajganjAreas.js';

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

// ── Address Picker Modal ───────────────────────────────────────────────────
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
    if (!selected && !query.trim()) return;
    const addr = { area: selected || query.trim(), houseNo: houseNo.trim(), roadNo: roadNo.trim() };
    saveAddress(addr);
    onSave(addr);
  };

  return (
    <div className="cb-modal-overlay">
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

          {query.trim() && suggestions.length === 0 && !selected && (
            <div className="cb-no-results">
              <span>🤔</span> Not found — you can still use "<strong>{query}</strong>"
              <button className="cb-use-custom" onClick={() => handlePick(query)}>Use this →</button>
            </div>
          )}
        </div>

        {step === 2 && selected && (
          <div className="cb-modal-section">
            <div className="cb-selected-area">✅ <strong>{selected}</strong>, Sirajganj Sadar</div>
            <label className="cb-modal-label" style={{marginTop:14}}>House / Apartment number <span className="cb-optional">(optional)</span></label>
            <input type="text" placeholder='e.g. "House 12", "Flat B-3"' value={houseNo}
              onChange={e => setHouseNo(e.target.value)} className="cb-modal-input cb-detail-input" />
            <label className="cb-modal-label" style={{marginTop:10}}>Road / Street <span className="cb-optional">(optional)</span></label>
            <input type="text" placeholder='e.g. "Road 4", "Main Bazar Road"' value={roadNo}
              onChange={e => setRoadNo(e.target.value)} className="cb-modal-input cb-detail-input" />
          </div>
        )}

        <button className="cb-modal-save" onClick={handleSave} disabled={!selected && !query.trim()}>
          Confirm Location ✅
        </button>
        <div className="cb-modal-note">🔒 We only deliver within Sirajganj Sadar area</div>
      </div>
    </div>
  );
}

// ── Qty Control ────────────────────────────────────────────────────────────
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

// ── Product Card ───────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, onIncrease, onDecrease }) {
  return (
    <div className="cb-product-card">
      {product.isFast     && <div className="cb-badge-fast">⚡ FAST</div>}
      {product.stock==='low' && <div className="cb-stock-low">⚠️ Low stock</div>}
      <div className="cb-product-img">{product.emoji}</div>
      <div className="cb-product-info">
        <div className="cb-product-name">{product.name}</div>
        <div className="cb-product-name-bn">{product.nameBn}</div>
        <div className="cb-product-unit">{product.unit}</div>
      </div>
      <div className="cb-product-bottom">
        <div className="cb-product-price"><span className="cb-currency">৳</span>{product.price.toLocaleString()}</div>
        <QtyControl qty={product.qty} onAdd={onAdd} onIncrease={onIncrease} onDecrease={onDecrease} />
      </div>
    </div>
  );
}

// ── Main Home ──────────────────────────────────────────────────────────────
export default function Home({ products, cartTotal, onUpdateQty, onOpenCart }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [address,        setAddress]        = useState(getSavedAddress);
  const [showPicker,     setShowPicker]     = useState(!getSavedAddress());
  const { toast, show: showToast } = useToast();

  const handleAddressSave = (addr) => {
    setAddress(addr);
    setShowPicker(false);
    showToast(`📍 Delivering to ${addr.area}!`);
  };

  const handleAdd = (product) => {
    onUpdateQty(product.id, 1);
    showToast(`✅ ${product.name} added to cart!`);
  };

  const handleDecrease = (product) => {
    onUpdateQty(product.id, -1);
    if (product.qty === 1) showToast(`❌ ${product.name} removed`);
  };

  const filteredProducts = products.filter(p => {
    const matchCat    = activeCategory === 'all' || p.category === activeCategory;
    const q           = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(q) || p.nameBn.includes(searchQuery);
    return matchCat && matchSearch;
  });

  const [sectionTitle, sectionSubtitle] = SECTION_TITLES[activeCategory] || SECTION_TITLES.all;
  const navArea    = address?.area    || 'Set location';
  const navSubArea = address?.houseNo ? `${address.houseNo}${address.roadNo ? ', '+address.roadNo : ''}` : 'Tap to set ▾';

  return (
    <div className="cb-root">
      {showPicker && <AddressPicker onSave={handleAddressSave} initialAddress={address} />}

      {/* NAV */}
      <nav className="cb-nav">
        <div className="cb-nav-logo">
          <div className="cb-logo-icon">🏙️</div>
          <div>
            <div className="cb-logo-text">CityBest</div>
            <div className="cb-logo-tag">Sirajganj Delivery</div>
          </div>
        </div>
        <button className="cb-nav-location" onClick={() => setShowPicker(true)}>
          <span>📍</span>
          <div>
            <div className="cb-loc-city">{navArea}</div>
            <div className="cb-loc-sub">{navSubArea}</div>
          </div>
        </button>
        <button className="cb-cart-btn" onClick={onOpenCart} aria-label="Open cart">
          🛒 <span className="cb-cart-count">{cartTotal}</span>
        </button>
      </nav>

      {/* SEARCH */}
      <div className="cb-search-wrap">
        <div className="cb-search-bar">
          <span className="cb-search-icon">🔍</span>
          <input type="text" placeholder='Search "চাল", "gas cylinder"...'
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && <button className="cb-search-clear" onClick={() => setSearchQuery('')}>✕</button>}
        </div>
      </div>

      {/* HERO */}
      <div className="cb-hero">
        <div className="cb-hero-text">
          <h1>Sirajganj's best<br />grocery. Delivered. 🚀</h1>
          <p className="cb-hero-tagline">Fast delivery across Sirajganj</p>
          <p className="cb-hero-tagline-bn">সিরাজগঞ্জে দ্রুত ডেলিভারি</p>
          <button className="cb-hero-cta" onClick={onOpenCart}>Shop Now</button>
        </div>
        <div className="cb-hero-emoji">🛵</div>
      </div>

      {/* BADGES */}
      <div className="cb-badge-row">
        <span className="cb-pill cb-pill-green">⚡ Fast Delivery</span>
        <span className="cb-pill cb-pill-orange">🔥 Best Prices</span>
        <span className="cb-pill cb-pill-blue">✅ Quality Assured</span>
      </div>

      {/* CATEGORIES */}
      <div className="cb-section-header">
        <div>
          <div className="cb-section-title">Categories</div>
          <div className="cb-section-sub">আপনি কী খুঁজছেন?</div>
        </div>
        <button className="cb-see-all" onClick={() => showToast('All categories coming soon!')}>See all</button>
      </div>
      <div className="cb-cats-scroll">
        {CATEGORIES.map(cat => (
          <button key={cat.id} className={`cb-cat-pill ${activeCategory===cat.id ? 'active' : ''}`}
            onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}>
            <div className="cb-cat-icon-wrap">{cat.emoji}</div>
            <span className="cb-cat-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* PROMO */}
      <div className="cb-promo-strip">
        <div>
          <p>First order 20% OFF! 🎉</p>
          <span className="cb-promo-bn">প্রথম অর্ডারে ২০% ছাড়</span>
        </div>
        <button className="cb-promo-code" onClick={() => showToast('✂️ Code CITY20 copied!')}>CITY20</button>
      </div>

      {/* PRODUCTS */}
      <div className="cb-section-header">
        <div>
          <div className="cb-section-title">{sectionTitle}</div>
          <div className="cb-section-sub">{sectionSubtitle}</div>
        </div>
        <button className="cb-see-all" onClick={() => showToast('More products coming!')}>See all</button>
      </div>
      <div className="cb-products-grid">
        {filteredProducts.length === 0
          ? <div className="cb-empty">😔 No products found</div>
          : filteredProducts.map(product => (
              <ProductCard key={product.id} product={product}
                onAdd={() => handleAdd(product)}
                onIncrease={() => onUpdateQty(product.id, 1)}
                onDecrease={() => handleDecrease(product)}
              />
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
          <span className="cb-nav-icon">📦</span>
          <span className="cb-nav-label">Orders</span>
        </button>
        <button className="cb-nav-item" onClick={() => showToast('👤 Profile coming soon!')}>
          <span className="cb-nav-icon">👤</span>
          <span className="cb-nav-label">Profile</span>
        </button>
      </nav>

      <div className={`cb-toast ${toast.visible ? 'show' : ''}`} role="status">{toast.msg}</div>
    </div>
  );
}
