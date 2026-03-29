const fs = require('fs');

const content = `import { useState } from 'react';
import Home from './pages/Home';
import Cart from './pages/Cart';

const INITIAL_PRODUCTS = [
  { id:1, emoji:'\uD83D\uDD35', name:'Gas Cylinder', nameBn:'\u09B8\u09BF\u09B2\u09BF\u09A8\u09CD\u09A1\u09BE\u09B0 \u0997\u09CD\u09AF\u09BE\u09B8', price:1250, unit:'12 kg cylinder', category:'gas', isFast:true, stock:'low' },
  { id:2, emoji:'\uD83C\uDF5A', name:'Miniket Rice', nameBn:'\u09AE\u09BF\u09A8\u09BF\u0995\u09C7\u099F \u099A\u09BE\u09B2', price:75, unit:'per kg', category:'rice', isFast:true, stock:'ok' },
];

export default function App() {
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
`;

fs.writeFileSync('frontend/src/App.jsx', content, 'utf8');
console.log('Done! App.jsx rewritten');