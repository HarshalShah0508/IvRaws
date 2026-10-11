import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export function CartPage() {
  const { cart, updateItem, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="font-display text-2xl uppercase mb-3">Your cart is empty</p>
        <Link
          to="/shop"
          className="inline-block mt-2 bg-black text-white dark:bg-white dark:text-black px-6 py-3 font-bold uppercase tracking-wide text-sm hover:bg-accent hover:text-black transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl uppercase mb-8">Your Cart</h1>
      <div className="space-y-5">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b-2 border-black dark:border-white pb-5">
            <div>
              <Link to={`/products/${item.product.slug}`} className="font-bold hover:text-accent-dark">
                {item.product.name}
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {item.size} / {item.color} — {item.sku}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">${item.unitPrice} each</p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={0}
                max={item.availableStock}
                value={item.quantity}
                onChange={(e) => updateItem(item.id, Number(e.target.value))}
                className="w-16 border-2 border-black dark:border-white dark:bg-neutral-900 px-2 py-1.5 text-center"
              />
              <span className="font-bold w-16 text-right">${item.lineTotal.toFixed(2)}</span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white text-xs font-bold uppercase tracking-wide"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-8 text-xl font-bold">
        <span className="uppercase text-sm tracking-widest font-bold">Subtotal</span>
        <span>${cart.subtotal.toFixed(2)}</span>
      </div>

      <button
        type="button"
        onClick={() => navigate(user ? '/checkout' : '/login')}
        className="mt-6 w-full bg-black text-white dark:bg-white dark:text-black py-4 font-bold uppercase tracking-wide hover:bg-accent hover:text-black transition-colors"
      >
        {user ? 'Checkout' : 'Login to Checkout'}
      </button>
    </div>
  );
}
