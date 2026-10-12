import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { useHeroSlide } from '../context/HeroSlideContext.tsx';
import { IvrawsLogo } from './IvrawsLogo.tsx';

const HIDE_THRESHOLD_PX = 80;

export function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pastFirstSlide } = useHeroSlide();
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  // While browsing the homepage hero's 2nd/3rd slide, the page itself never
  // actually scrolls (HomePage intercepts wheel/keyboard input to drive the
  // slideshow instead) — so the scroll listener below never fires and never
  // hides the bar on its own. This covers that case directly: still parked
  // at the top of the hero (scrollY ~0) but past slide 1.
  const heroForcedHidden = pastFirstSlide && window.scrollY <= 2;

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      if (y <= HIDE_THRESHOLD_PX) {
        setHidden(false);
      } else if (y > lastScrollY.current) {
        setHidden(true);
      } else if (y < lastScrollY.current) {
        setHidden(false);
      }
      lastScrollY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header
      // Hiding this via `transform: translateY()` would only move it visually —
      // transforms don't affect layout, so the bar's reserved space in the page
      // flow would stay put and show up as a blank gap above whatever's below it.
      // `max-height` collapse genuinely removes that space when hidden.
      className={`sticky top-0 z-40 overflow-hidden bg-white border-black dark:bg-neutral-950 dark:border-white transition-all duration-300 ${
        (hidden || heroForcedHidden) && !mobileMenuOpen ? 'max-h-0 border-b-0' : 'max-h-[500px] border-b-2'
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="text-black dark:text-white" aria-label="IvRaws home" onClick={closeMenu}>
          <IvrawsLogo className="h-7 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-widest">
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

        <div className="flex md:hidden items-center gap-3">
          <Link to="/cart" className="relative text-xs font-bold uppercase tracking-widest" onClick={closeMenu}>
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
            className="w-8 h-8 flex items-center justify-center border-2 border-black dark:border-white rounded-full text-sm hover:bg-accent hover:border-accent-dark hover:text-black transition-colors"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="w-8 h-8 flex items-center justify-center border-2 border-black dark:border-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t-2 border-black dark:border-white px-4 py-4 flex flex-col gap-4 text-xs font-bold uppercase tracking-widest bg-white dark:bg-neutral-950">
          <Link to="/shop" className="hover:text-accent-dark transition-colors" onClick={closeMenu}>
            Shop
          </Link>
          {user && (
            <Link to="/orders" className="hover:text-accent-dark transition-colors" onClick={closeMenu}>
              Orders
            </Link>
          )}
          {user ? (
            <button
              type="button"
              onClick={() => {
                logout();
                closeMenu();
                navigate('/');
              }}
              className="text-left hover:text-accent-dark transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              onClick={closeMenu}
              className="inline-block bg-black text-white px-4 py-2 dark:bg-white dark:text-black hover:bg-accent hover:text-black transition-colors w-fit"
            >
              Login
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
