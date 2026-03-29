import { useState, useEffect } from 'react';
import './Cart.css';
import PaymentStep from './PaymentStep';
import OrderSuccess from './OrderSuccess';

const DELIVERY_FEE = 60;

function getSavedAddress() {
  try { return JSON.parse(localStorage.getItem('cb_address'))?.area || ''; } catch { return ''; }
}

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
        <div className="ct-item-price">{String.fromCharCode(2547)}{(item.price * item.qty).toLocaleString()}</div>
        <div className="ct-qty-ctrl">
          <button className="ct-qty-btn" onClick={() => onDecrease(item.id)}>{String.fromCharCode(8722)}</button>
          <span className="ct-qty-num">{item.qty}</span>
          <button className="ct-qty-btn" onClick={() => onIncrease(item.id)}>+</button>
        </div>
      </div>
    </div>
  );
}

export default function Cart({ cartItems, onClose, onIncrease, onDecrease, isLoggedIn }) {
  const [view, setView] = useState('cart');
  const [order, setOrder] = useState(null);
  const [t, setT] = useState({});

  useEffect(() => {
    fetch('/strings.json').then(r => r.json()).then(setT).catch(() => {});
  }, []);

  const handlePaymentSuccess = (orderData) => {
    setOrder(orderData);
    setView('success');
  };

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + DELIVERY_FEE;

  if (cartItems.length === 0 && view === 'cart') return (
    <div className="ct-empty">
      <div className="ct-empty-icon">🛒</div>
      <p>{t.emptyCart || 'Cart is empty'}</p>
      <button className="ct-continue-btn" onClick={onClose}>{t.continueShopping || 'Continue'}</button>
    </div>
  );

  return (
    <div className="ct-wrap">
      {view === 'cart' && (<>
        <div className="ct-header">
          <span className="ct-title">{t.cartTitle || 'Cart'}</span>
          <button className="ct-close-btn" onClick={onClose}>{String.fromCharCode(10005)}</button>
        </div>
        <div className="ct-items">
          {cartItems.map(item => (
            <CartItem key={item.id} item={item} onIncrease={onIncrease} onDecrease={onDecrease} />
          ))}
        </div>
        <div className="ct-summary">
          <div className="ct-summary-row"><span>Subtotal</span><span>{String.fromCharCode(2547)}{subtotal.toLocaleString()}</span></div>
          <div className="ct-summary-row"><span>Delivery</span><span>{String.fromCharCode(2547)}{DELIVERY_FEE}</span></div>
          <div className="ct-summary-row ct-summary-total"><span>Total</span><span>{String.fromCharCode(2547)}{total.toLocaleString()}</span></div>
        </div>
        <div className="ct-checkout-wrap">
          <button className="ct-checkout-btn" onClick={() => setView('payment')}>
            <span>Proceed to Payment</span>
            <span>{String.fromCharCode(2547)}{total.toLocaleString()} {String.fromCharCode(8594)}</span>
          </button>
        </div>
      </>)}
      {view === 'payment' && (
        <PaymentStep
          total={total}
          onSuccess={handlePaymentSuccess}
          onBack={() => setView('cart')}
          savedAddress={getSavedAddress()}
          cartItems={cartItems}
        />
      )}
      {view === 'success' && (
        <OrderSuccess order={order} onClose={onClose} />
      )}
    </div>
  );
}