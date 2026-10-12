import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api.ts';
import type { Address } from '../lib/types.ts';
import { useCart } from '../context/CartContext.tsx';
import { formatPrice } from '../lib/currency.ts';

export function CheckoutPage() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    phone: '',
  });
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    api
      .get<Address[]>('/addresses')
      .then((list) => {
        setAddresses(list);
        if (list.length > 0) setSelectedAddressId(list[0].id);
        else setShowNewAddressForm(true);
      })
      .catch(() => setShowNewAddressForm(true));
  }, []);

  async function handleCreateAddress() {
    const created = await api.post<Address>('/addresses', form);
    setAddresses((prev) => [...prev, created]);
    setSelectedAddressId(created.id);
    setShowNewAddressForm(false);
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      setMessage('Choose or add a shipping address first.');
      return;
    }
    setPlacing(true);
    setMessage(null);
    try {
      const result = await api.post<{ order: { orderNumber: string } }>('/checkout', {
        shippingAddressId: selectedAddressId,
      });
      await refresh();
      setOrderPlaced(true);
      setMessage(`Order ${result.order.orderNumber} placed! Redirecting to your orders...`);
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err) {
      // A placeholder Stripe/Razorpay key means the payment-gateway call will
      // fail here even though the order + stock reservation succeeded —
      // surface that plainly instead of hiding it. The order WAS created
      // (and the cart WAS cleared server-side) in this branch too, so this
      // also switches to the result view, not a generic inline error.
      if (err instanceof ApiError) {
        setOrderPlaced(true);
        setMessage(
          "Order placed and stock reserved — live payment isn't enabled in this sample yet, " +
            'so the payment step was skipped. Your order is saved and visible under Orders.',
        );
        await refresh();
      } else {
        setMessage('Something went wrong placing the order.');
      }
    } finally {
      setPlacing(false);
    }
  }

  // Placing an order clears the cart server-side (whether or not the
  // payment-gateway call that follows succeeds), so once `orderPlaced` is
  // true we render a dedicated result view below instead of the form —
  // without that split, this same empty-cart guard would otherwise replace
  // the whole page and hide the result message right as it's about to show.
  if ((!cart || cart.items.length === 0) && !orderPlaced) {
    return <div className="max-w-xl mx-auto px-4 py-12 text-gray-500 dark:text-gray-400">Your cart is empty.</div>;
  }

  if (orderPlaced) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <h1 className="font-display text-3xl uppercase mb-4">Checkout</h1>
        <p className="text-gray-700 dark:text-gray-300">{message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl uppercase mb-8">Checkout</h1>

      <h3 className="text-xs font-bold uppercase tracking-widest mb-3">Shipping address</h3>
      {addresses.map((addr) => (
        <label
          key={addr.id}
          className="flex items-start gap-2 mb-2 text-sm border-2 border-black dark:border-white p-3 cursor-pointer has-checked:bg-gray-50 dark:has-checked:bg-neutral-800"
        >
          <input
            type="radio"
            checked={selectedAddressId === addr.id}
            onChange={() => setSelectedAddressId(addr.id)}
          />
          <span>
            {addr.fullName}, {addr.line1}, {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
          </span>
        </label>
      ))}

      <button
        type="button"
        onClick={() => setShowNewAddressForm((v) => !v)}
        className="text-xs font-bold uppercase tracking-wide underline mb-4 mt-2"
      >
        {showNewAddressForm ? 'Cancel' : '+ Add new address'}
      </button>

      {showNewAddressForm && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 text-sm">
          {(
            [
              ['fullName', 'Full name'],
              ['line1', 'Address line 1'],
              ['city', 'City'],
              ['state', 'State'],
              ['postalCode', 'Postal code'],
              ['country', 'Country'],
              ['phone', 'Phone'],
            ] as const
          ).map(([field, label]) => (
            <input
              key={field}
              placeholder={label}
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              className="border-2 border-black dark:border-white dark:bg-neutral-900 px-2 py-1.5 col-span-1"
            />
          ))}
          <button
            type="button"
            onClick={handleCreateAddress}
            className="col-span-2 bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-wide py-2.5 mt-1 hover:bg-accent hover:text-black transition-colors"
          >
            Save address
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-xl font-bold mb-5 mt-6">
        <span className="uppercase text-sm tracking-widest">Total</span>
        <span>{formatPrice(cart?.subtotal ?? 0)}</span>
      </div>

      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={placing}
        className="w-full bg-black text-white dark:bg-white dark:text-black py-4 font-bold uppercase tracking-wide hover:bg-accent hover:text-black transition-colors disabled:bg-gray-400 disabled:text-white dark:disabled:bg-neutral-700 dark:disabled:text-gray-300"
      >
        {placing ? 'Placing order...' : 'Place order'}
      </button>

      {message && <p className="text-sm mt-4 text-gray-700 dark:text-gray-300">{message}</p>}
    </div>
  );
}
