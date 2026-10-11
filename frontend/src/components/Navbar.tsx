import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';

export function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-black dark:bg-neutral-950 dark:border-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="font-display text-2xl tracking-tight uppercase">
          IvRaws
        </Link>
        <nav className="flex items-center gap-7 text-xs font-bold uppercase tracking-widest">
          <Link to="/shop" className="hover:text-accent-dark transition-colors">
            Shop
          </Link>
          {user && (
            <Link to="/orders" className="hover:text-accent-dark transition-colors">
              Orders
            </Link>
          )}
          <Link to="/cart" className="hover:text-accent-dark transition-colors relative">
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-3 -right-4 bg-black text-accent text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="w-8 h-8 flex items-center justify-center border-2 border-black dark:border-white rounded-full text-sm normal-case hover:bg-accent hover:border-accent-dark hover:text-black transition-colors"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {user ? (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="uppercase hover:text-accent-dark transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-black text-white px-4 py-2 dark:bg-white dark:text-black hover:bg-accent hover:text-black transition-colors"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
