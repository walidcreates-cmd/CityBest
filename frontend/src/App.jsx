import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Cart from './pages/Cart';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

const API = import.meta.env.VITE_API_URL || 'https://citybest-1.onrender.com';

function isAdminRoute() {
  return window.location.pathname === '/admin';
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('cb_admin_token'));

  useEffect(() => {
    if (isAdminRoute()) { setLoading(false); return; }
    fetch(`${API}/api/products`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setProducts(res.data.map(p => ({ ...p, id: p._id, qty: 0 })));
      })
      .catch(err => console.error('Failed to load products:', err))
      .finally(() => setLoading(false));
  }, []);

  const cartItems = products.filter(p => p.qty > 0);
  const cartTotal = cartItems.reduce((s, p) => s + p.qty, 0);

  const updateQty = (id, delta) => {
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, qty: Math.max(0, p.qty + delta) } : p)
    );
  };

  const clearCart = () => setProducts(prev => prev.map(p => ({ ...p, qty: 0 })));

  const handleLogout = () => {
    localStorage.removeItem('cb_admin_token');
    setAdminToken(null);
  };

  if (isAdminRoute()) {
    if (!adminToken) return <AdminLogin onLogin={setAdminToken} />;
    return <AdminDashboard token={adminToken} onLogout={handleLogout} />;
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontSize:'2rem' }}>
      🛒
    </div>
  );

  return (
    <>
      {!showCart ? (
        <Home
          products={products}
          cartTotal={cartTotal}
          onUpdateQty={updateQty}
          onOpenCart={() => setShowCart(true)}
        />
      ) : (
        <Cart
          cartItems={cartItems}
          onIncrease={(id) => updateQty(id, 1)}
          onDecrease={(id) => updateQty(id, -1)}
          onClose={() => { setShowCart(false); clearCart(); }}
          isLoggedIn={() => false}
        />
      )}
    </>
  );
}
