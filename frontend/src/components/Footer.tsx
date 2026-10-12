import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IvrawsLogo } from './IvrawsLogo.tsx';

const SOCIAL_LINKS = [{ name: 'Instagram', href: '#' }];

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="bg-black text-white dark:bg-neutral-900 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-1">
          <IvrawsLogo className="h-6 w-auto text-white" />
          <p className="text-sm text-gray-400 mt-3">
            Fashion for the next generation. Built for movement, made to stand out.
          </p>
          <div className="flex items-center gap-3 mt-4">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="text-xs font-bold uppercase tracking-wide text-gray-400 hover:text-accent transition-colors"
              >
                {social.name}
              </a>
            ))}
          </div>
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
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Policies</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/about" className="hover:text-accent transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link to="/shipping" className="hover:text-accent transition-colors">
                Shipping
              </Link>
            </li>
            <li>
              <Link to="/returns" className="hover:text-accent transition-colors">
                Returns
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-accent transition-colors">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-accent transition-colors">
                Terms
              </Link>
            </li>
          </ul>
        </div>
        <div className="col-span-2 md:col-span-1">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Stay In The Loop</h4>
          {subscribed ? (
            <p className="text-sm text-accent">Thanks — you're on the list.</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribed(true);
              }}
              className="flex"
            >
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 bg-transparent border-2 border-white/30 px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="shrink-0 bg-accent text-black font-bold uppercase tracking-wide text-xs px-3 py-2 hover:bg-white transition-colors"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} IvRaws. All rights reserved.
      </div>
    </footer>
  );
}
