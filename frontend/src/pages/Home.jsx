import { useState, useEffect, useRef } from 'react';
import './Home.css';
import LocationModal from '../components/LocationModal';

const CATEGORIES = [
  { id:'all',        label:'All',        emoji:'ðŸ›’' },
  { id:'gas',        label:'Gas',        emoji:'ðŸ”¥' },
  { id:'rice',       label:'Rice',       emoji:'ðŸš' },
  { id:'vegetables', label:'Vegetables', emoji:'ðŸ¥¦' },
  { id:'fish',       label:'Fish',       emoji:'ðŸŸ' },
  { id:'dairy',      label:'Dairy',      emoji:'ðŸ¥›' },
];

const SECTION_TITLES = {
  all:        ["Today's Essentials", 'à¦†à¦œà¦•à§‡à¦° à¦ªà§à¦°à¦¯à¦¼à§‹à¦œà¦¨à§€à¦¯à¦¼ à¦ªà¦£à§à¦¯'],
  gas:        ['Gas Cylinders',      'à¦—à§à¦¯à¦¾à¦¸ à¦¸à¦¿à¦²à¦¿à¦¨à§à¦¡à¦¾à¦°'],
  rice:       ['Rice & Grains',      'à¦šà¦¾à¦² à¦“ à¦¶à¦¸à§à¦¯'],
  vegetables: ['Fresh Vegetables',   'à¦¤à¦¾à¦œà¦¾ à¦¸à¦¬à¦œà¦¿'],
  fish:       ['Fresh Fish',         'à¦¤à¦¾à¦œà¦¾ à¦®à¦¾à¦›'],
  dairy:      ['Dairy Products',     'à¦¦à§à¦—à§à¦§à¦œà¦¾à¦¤ à¦ªà¦£à§à¦¯'],
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
      <button className="cb-qty-btn" onClick={onDecrease}>âˆ’</button>
      <span className="cb-qty-num">{qty}</span>
      <button className="cb-qty-btn" onClick={onIncrease}>+</button>
    </div>
  );
}

function ProductCard({ product, onAdd, onIncrease, onDecrease }) {
  return (
    <div className="cb-product-card">
      {product.isFast     && <div className="cb-badge-fast">âš¡ FAST</div>}
      {product.stock==='low' && <div className="cb-stock-low">âš ï¸ Low stock</div>}
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
        <div className="cb-product-price"><span className="cb-currency">à§³</span>{product.price.toLocaleString()}</div>
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
  const { toast, show: showToast } = useToast();

  const handleAddressSave = (loc) => {
    const addr = { area: loc.address, coords: loc.coords };
    saveAddress(addr);
    setAddress(addr);
    setShowMap(false);
    showToast(`ðŸ“ Delivering to ${loc.address}!`);
  };

  const handleAdd = (product) => {
    onUpdateQty(product.id, 1);
    showToast(`âœ“ ${product.name} added to cart!`);
  };

  const handleDecrease = (product) => {
    onUpdateQty(product.id, -1);
    if (product.qty === 1) showToast(`âœ• ${product.name} removed`);
  };

  const filteredProducts = products.filter(p => {
    const matchCat    = activeCategory === 'all' || p.category === activeCategory;
    const q           = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(q) || p.nameBn.includes(searchQuery);
    return matchCat && matchSearch;
  });

  const [sectionTitle, sectionSubtitle] = SECTION_TITLES[activeCategory] || SECTION_TITLES.all;
  const navArea = address?.area || 'Set location';
  const navSubArea = address?.area ? 'Tap to change' : 'Tap to set â†“';

  return (
    <div className="cb-root">
      {showMap && (
        <LocationModal
          onClose={() => setShowMap(false)}
          onConfirm={handleAddressSave}
        />
      )}
      <nav className="cb-nav">
        <div className="cb-nav-logo">
          <div className="cb-logo-icon">ðŸª</div>
          <div>
            <div className="cb-logo-text">CityBest</div>
            <div className="cb-logo-tag">Sirajganj Delivery</div>
          </div>
        </div>
        <button className="cb-nav-location" onClick={() => setShowMap(true)}>
          <span>ðŸ“</span>
          <div>
            <div className="cb-loc-city">{navArea}</div>
            <div className="cb-loc-sub">{navSubArea}</div>
          </div>
        </button>
        <button className="cb-cart-btn" onClick={onOpenCart} aria-label="Open cart">
          ðŸ›’ <span className="cb-cart-count">{cartTotal}</span>
        </button>
      </nav>
      <div className="cb-search-wrap">
        <div className="cb-search-bar">
          <span className="cb-search-icon">ðŸ”</span>
          <input type="text" placeholder='Search "à¦šà¦¾à¦²", "gas cylinder"...'
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && <button className="cb-search-clear" onClick={() => setSearchQuery('')}>âœ•</button>}
        </div>
      </div>
      <div className="cb-hero">
        <div className="cb-hero-text">
          <h1>Sirajganj's best<br />grocery. Delivered. ðŸš€</h1>
          <p className="cb-hero-tagline">Fast delivery across Sirajganj</p>
          <p className="cb-hero-tagline-bn">à¦¸à¦¿à¦°à¦¾à¦œà¦—à¦žà§à¦œà§‡ à¦ªà§à¦°à¦¥à¦® à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿</p>
          <button className="cb-hero-cta" onClick={onOpenCart}>Shop Now</button>
        </div>
        <div className="cb-hero-emoji">ðŸ›</div>
      </div>
      <div className="cb-badge-row">
        <span className="cb-pill cb-pill-green">âš¡ Fast Delivery</span>
        <span className="cb-pill cb-pill-orange">ðŸ”¥ Best Prices</span>
        <span className="cb-pill cb-pill-blue">âœ“ Quality Assured</span>
      </div>
      <div className="cb-section-header">
        <div>
          <div className="cb-section-title">Categories</div>
          <div className="cb-section-sub">à¦†à¦ªà¦¨à¦¿ à¦•à§€ à¦–à§à¦à¦œà¦›à§‡à¦¨?</div>
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
          <p>First order 20% OFF! ðŸŽ‰</p>
          <span className="cb-promo-bn">à¦ªà§à¦°à¦¥à¦® à¦…à¦°à§à¦¡à¦¾à¦°à§‡ à§¨à§¦% à¦›à¦¾à¦¡à¦¼</span>
        </div>
        <button className="cb-promo-code" onClick={() => showToast('âœ… Code CITY20 copied!')}>CITY20</button>
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
          ? <div className="cb-empty">ðŸ˜• No products found</div>
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
          <span className="cb-nav-icon">ðŸ </span>
          <span className="cb-nav-label">Home</span>
        </button>
        <button className="cb-nav-item" onClick={() => showToast('ðŸ” Search coming soon!')}>
          <span className="cb-nav-icon">ðŸ”</span>
          <span className="cb-nav-label">Search</span>
        </button>
        <button className="cb-nav-item" onClick={onOpenCart}>
          <span className="cb-nav-icon">ðŸ“¦</span>
          <span className="cb-nav-label">Orders</span>
        </button>
        <button className="cb-nav-item" onClick={() => showToast('ðŸ‘¤ Profile coming soon!')}>
          <span className="cb-nav-icon">ðŸ‘¤</span>
          <span className="cb-nav-label">Profile</span>
        </button>
      </nav>
      <div className={`cb-toast ${toast.visible ? 'show' : ''}`} role="status">{toast.msg}</div>
    </div>
  );
}
