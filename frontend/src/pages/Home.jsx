import { useState, useRef } from 'react';
import './Home.css';
import './HomeDesktop.css';
import LocationModal from '../components/LocationModal';
import VariantPicker from '../components/VariantPicker';

const CATEGORIES = [
  { id:'all',        label:'All',        emoji:'🛒' },
  { id:'gas',        label:'Gas',        emoji:'🔥' },
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

function ProductCard({ product, onAdd, onIncrease, onDecrease }) {
  return (
    <div className="cb-product-card">
      {product.isFast && <div className="cb-badge-fast">⚡ FAST</div>}
      {product.stock === 'low' && <div className="cb-stock-low">⚠️ Low stock</div>}
      <div className="cb-product-img">
        {product.image
          ? <img src={product.image} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
          : product.emoji}
      </div>
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

export default function Home({ products, cartTotal, onUpdateQty, onOpenCart }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [address,        setAddress]        = useState(getSavedAddress);
  const [showMap,        setShowMap]        = useState(!getSavedAddress());
  const [variantProduct, setVariantProduct] = useState(null);
  const { toast, show: showToast } = useToast();

  const handleAddressSave = (loc) => {
    const addr = { area: loc.address, coords: loc.coords };
    saveAddress(addr);
    setAddress(addr);
    setShowMap(false);
    showToast(`📍 Delivering to ${loc.address}!`);
  };

  const handleAdd = (product) => {
    if (product.variants && product.variants.length > 0) {
      setVariantProduct(product);
      return;
    }
    onUpdateQty(product.id, 1);
    showToast(`✓ ${product.name} added to cart!`);
  };

  const handleDecrease = (product) => {
    onUpdateQty(product.id, -1);
    if (product.qty === 1) showToast(`✕ ${product.name} removed`);
  };

  const filteredProducts = products.filter(p => {
    const matchCat    = activeCategory === 'all' || p.category === activeCategory;
    const q           = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(q) || p.nameBn.includes(searchQuery);
    return matchCat && matchSearch;
  });

  const [sectionTitle, sectionSubtitle] = SECTION_TITLES[activeCategory] || SECTION_TITLES.all;
  const navArea = address?.area || 'Set location';
  const navSubArea = address?.area ? 'Tap to change' : 'Tap to set ↓';

  return (
    <div className="cb-root">
      {showMap && (
        <LocationModal
          onClose={() => setShowMap(false)}
          onConfirm={handleAddressSave}
        />
      )}
      {variantProduct && (
        <VariantPicker
          product={variantProduct}
          onSelect={(variant) => {
            onUpdateQty(variantProduct.id, 1, variant);
            showToast(`✓ ${variant.name} added to cart!`);
            setVariantProduct(null);
          }}
          onClose={() => setVariantProduct(null)}
        />
      )}
      <nav className="cb-nav">
        <div className="cb-nav-logo">
          <div className="cb-logo-icon">🏪</div>
          <div>
            <div className="cb-logo-text">CityBest</div>
            <div className="cb-logo-tag">Sirajganj Delivery</div>
          </div>
        </div>
        <button className="cb-nav-location" onClick={() => setShowMap(true)}>
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
      <div className="cb-search-wrap">
        <div className="cb-search-bar">
          <span className="cb-search-icon">🔍</span>
          <input type="text" placeholder='Search "চাল", "gas cylinder"...'
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && <button className="cb-search-clear" onClick={() => setSearchQuery('')}>✕</button>}
        </div>
      </div>
      <div className="cb-hero">
        <div className="cb-hero-text">
          <h1>Sirajganj's best<br />grocery. Delivered. 🚀</h1>
          <p className="cb-hero-tagline">Fast delivery across Sirajganj</p>
          <p className="cb-hero-tagline-bn">সিরাজগঞ্জে প্রথম ডেলিভারি</p>
          <button className="cb-hero-cta" onClick={onOpenCart}>Shop Now</button>
        </div>
        <div className="cb-hero-emoji">🛍</div>
      </div>
      <div className="cb-badge-row">
        <span className="cb-pill cb-pill-green">⚡ Fast Delivery</span>
        <span className="cb-pill cb-pill-orange">🔥 Best Prices</span>
        <span className="cb-pill cb-pill-blue">✓ Quality Assured</span>
      </div>
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
      <div className="cb-promo-strip">
        <div>
          <p>First order 20% OFF! 🎉</p>
          <span className="cb-promo-bn">প্রথম অর্ডারে ২০% ছাড়</span>
        </div>
        <button className="cb-promo-code" onClick={() => showToast('✅ Code CITY20 copied!')}>CITY20</button>
      </div>
      <div className="cb-section-header">
        <div>
          <div className="cb-section-title">{sectionTitle}</div>
          <div className="cb-section-sub">{sectionSubtitle}</div>
        </div>
        <button className="cb-see-all" onClick={() => showToast('More products coming!')}>See all</button>
      </div>
      <div className="cb-products-grid">
        {filteredProducts.length === 0
          ? <div className="cb-empty">😕 No products found</div>
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
      <nav className="cb-bottom-nav">
        <button className="cb-nav-item active">
          <span className="cb-nav-icon">🏠</span>
          <span className="cb-nav-label">হোম</span>
        </button>
        <button className="cb-nav-item" onClick={() => showToast('🔍 শীঘ্রই আসছে!')}>
          <span className="cb-nav-icon">🔍</span>
          <span className="cb-nav-label">খুঁজুন</span>
        </button>
        <button className="cb-nav-item" onClick={onOpenCart}>
          <span className="cb-nav-icon">📦</span>
          <span className="cb-nav-label">অর্ডার</span>
        </button>
        <button className="cb-nav-item" onClick={() => showToast('👤 শীঘ্রই আসছে!')}>
          <span className="cb-nav-icon">👤</span>
          <span className="cb-nav-label">প্রোফাইল</span>
        </button>
      </nav>
      <div className={`cb-toast ${toast.visible ? 'show' : ''}`} role="status">{toast.msg}</div>
    </div>
  );
}