import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Login from './pages/Login';

const INITIAL_PRODUCTS = [
  { id:1, emoji:'🔵', name:'Gas Cylinder', nameBn:'সিলিন্ডার গ্যাস', price:1250, unit:'12 kg cylinder', category:'gas',  isFast:true,  stock:'low' },
  { id:2, emoji:'🍚', name:'Miniket Rice',  nameBn:'মিনিকেট চাল',    price:75,   unit:'per kg',         category:'rice', isFast:true,  stock:'ok'  },
];

function AppContent() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState(INITIAL_PRODUCTS.map(p => ({ ...p, qty: 0 })));
  const [showCart, setShowCart] = useState(false);

  const cartItems = products.filter(p => p.qty > 0);
  const cartTotal = cartItems.reduce((s, p) => s + p.qty, 0);

  const updateQty = (id, delta) => {
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, qty: Math.max(0, p.qty + delta) } : p)
    );
  };

  const clearCart = () => {
    setProducts(prev => prev.map(p => ({ ...p, qty: 0 })));
  };

  // Show loading spinner while Firebase checks auth state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)',
        flexDirection: 'column',
        gap: 16,
      }}>
        <span style={{ fontSize: 48 }}>🛒</span>
        <p style={{ color: '#1a9e5c', fontWeight: 700, fontSize: 18 }}>CityBest লোড হচ্ছে...</p>
      </div>
    );
  }

  // Show login page if not logged in
  if (!user) return <Login />;

  // Show main app if logged in
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
          onUpdateQty={updateQty}
          onClose={() => setShowCart(false)}
          onClearCart={clearCart}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
