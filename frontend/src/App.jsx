import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Cart from './pages/Cart';

const INITIAL_PRODUCTS = [
  { id:1, emoji:'🔵', name:'Gas Cylinder', nameBn:'সিলিন্ডার গ্যাস', price:1250, unit:'12 kg cylinder', category:'gas',  isFast:true,  stock:'low' },
  { id:2, emoji:'🍚', name:'Miniket Rice',  nameBn:'মিনিকেট চাল',    price:75,   unit:'per kg',         category:'rice', isFast:true,  stock:'ok'  },
];

function AppContent() {
  const [products,  setProducts]  = useState(INITIAL_PRODUCTS.map(p => ({ ...p, qty:0 })));
  const [showCart,  setShowCart]  = useState(false);

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