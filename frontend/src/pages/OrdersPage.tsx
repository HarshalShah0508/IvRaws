import { useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import type { Order } from '../lib/types.ts';

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-accent text-black',
  DELIVERED: 'bg-accent text-black',
  SHIPPED: 'bg-black text-white dark:bg-white dark:text-black',
  PROCESSING: 'bg-black text-white dark:bg-white dark:text-black',
  PENDING_PAYMENT: 'bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:text-gray-300',
  CANCELLED: 'bg-gray-200 text-gray-500 dark:bg-neutral-700 dark:text-gray-400',
  PAYMENT_FAILED: 'bg-gray-200 text-gray-500 dark:bg-neutral-700 dark:text-gray-400',
  REFUNDED: 'bg-gray-200 text-gray-500 dark:bg-neutral-700 dark:text-gray-400',
};

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Order[]>('/orders')
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-10 text-gray-500 dark:text-gray-400">Loading...</div>;
  if (orders.length === 0)
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500 dark:text-gray-400">No orders yet.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl uppercase mb-8">Your Orders</h1>
      <div className="space-y-5">
        {orders.map((order) => (
          <div key={order.id} className="border-2 border-black dark:border-white p-5">
            <div className="flex items-center justify-between">
              <span className="font-bold">{order.orderNumber}</span>
              <span
                className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 ${
                  STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-300'
                }`}
              >
                {order.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 mt-3 space-y-0.5">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.productName} ({item.variantSku}) × {item.quantity}
                </li>
              ))}
            </ul>
            <p className="font-bold mt-3">Total: ${order.total}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
