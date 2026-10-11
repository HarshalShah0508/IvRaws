import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-black text-white mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <span className="font-display text-xl uppercase">IvRaws</span>
          <p className="text-sm text-gray-400 mt-3">
            Fashion for the next generation. Built for movement, made to stand out.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/shop" className="hover:text-accent transition-colors">
                All Products
              </Link>
            </li>
            <li>
              <Link to="/shop?onSale=true" className="hover:text-accent transition-colors">
                Sale
              </Link>
            </li>
            <li>
              <Link to="/shop?newArrivals=true" className="hover:text-accent transition-colors">
                New Arrivals
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Account</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/orders" className="hover:text-accent transition-colors">
                Orders
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-accent transition-colors">
                Login
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Help</h4>
          <p className="text-sm text-gray-400">Use the chat bubble for shipping, returns & sizing questions.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} IvRaws. All rights reserved.
      </div>
    </footer>
  );
}
