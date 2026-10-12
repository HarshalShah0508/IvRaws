import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import editorial1Img from '../assets/editorial-1.webp';
import editorial3Img from '../assets/editorial-3.webp';
import editorial6Img from '../assets/editorial-6.webp';
import { api } from '../lib/api.ts';
import type { Paginated, Product } from '../lib/types.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { useHeroSlide } from '../context/HeroSlideContext.tsx';

const IMAGES = [
  // The hero's headline used to be baked into the photo's own pixels, which
  // blurs on upscale/high-DPI displays since it can never exceed the source
  // image's native resolution. It's rendered as real HTML text now (crisp at
  // any size) over a theme-aware panel, instead of relying on pixels in the
  // image — see the panel comment in renderSlide for why.
  { src: editorial6Img, alt: "IvRaws: Wear What's Next. Streetwear essentials built for movement.", objectPosition: 'center', caption: null as string | null, hero: true },
  { src: editorial1Img, alt: 'IvRaws streetwear editorial', objectPosition: 'center', caption: null as string | null, hero: false },
  { src: editorial3Img, alt: 'IvRaws streetwear editorial', objectPosition: 'center', caption: 'BUILT TO WITHSTAND', hero: false },
];

const TRANSITION_MS = 350;
const LOCK_MS = 1250;
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

interface Transition {
  from: number;
  to: number;
  dir: 1 | -1;
  armed: boolean;
}

// PPT-style push slides: the outgoing image slides fully up and out while
// the incoming one slides up into place from below, both on one short CSS
// transform transition — a real "slide" motion, not a page scroll (the
// document's own scrollY never moves while browsing slides) and not an
// instant cut either. Only once past the last slide does real scrolling
// take over, to reveal the footer below.
export function HomePage() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [mounted, setMounted] = useState(false);
  const activeIndexRef = useRef(0);
  const transitioningRef = useRef(false);
  const lockRef = useRef(false);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const { setPastFirstSlide } = useHeroSlide();

  useEffect(() => {
    api
      .get<Paginated<Product>>('/products?newArrivals=true&limit=8')
      .then((result) => setNewArrivals(result.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setPastFirstSlide(activeIndex > 0);
  }, [activeIndex, setPastFirstSlide]);

  useEffect(() => {
    return () => setPastFirstSlide(false);
  }, [setPastFirstSlide]);

  const stepTo = useCallback((dir: 1 | -1) => {
    if (transitioningRef.current || lockRef.current) return;
    const next = activeIndexRef.current + dir;
    if (next < 0 || next > IMAGES.length - 1) return;

    transitioningRef.current = true;
    lockRef.current = true;
    setTransition({ from: activeIndexRef.current, to: next, dir, armed: false });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransition((t) => (t ? { ...t, armed: true } : t));
      });
    });

    window.setTimeout(() => {
      activeIndexRef.current = next;
      setActiveIndex(next);
      setTransition(null);
      transitioningRef.current = false;
      window.setTimeout(() => {
        lockRef.current = false;
      }, LOCK_MS - TRANSITION_MS);
    }, TRANSITION_MS);
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    const n = IMAGES.length;

    function onWheel(e: WheelEvent) {
      const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      if (!dir) return;

      if (dir > 0 && activeIndexRef.current < n - 1) {
        e.preventDefault();
        stepTo(1);
      } else if (dir < 0 && activeIndexRef.current > 0 && window.scrollY <= 2) {
        e.preventDefault();
        stepTo(-1);
      }
      // dir>0 at the last slide, or dir<0 while scrolled into the footer,
      // falls through to native scrolling.
    }

    function onKeyDown(e: KeyboardEvent) {
      const forward = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ';
      const back = e.key === 'ArrowUp' || e.key === 'PageUp';
      if (!forward && !back) return;

      if (forward && activeIndexRef.current < n - 1) {
        e.preventDefault();
        stepTo(1);
      } else if (back && activeIndexRef.current > 0 && window.scrollY <= 2) {
        e.preventDefault();
        stepTo(-1);
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [stepTo]);

  function slideStyle(role: 'active' | 'from' | 'to', dir?: 1 | -1, armed?: boolean): CSSProperties {
    if (role === 'active') return { transform: 'translateY(0%)' };
    const offscreen = dir === 1 ? '100%' : '-100%';
    if (role === 'from') {
      const exitTo = dir === 1 ? '-100%' : '100%';
      return { transform: `translateY(${armed ? exitTo : '0%'})`, transition: `transform ${TRANSITION_MS}ms ${EASE}` };
    }
    return { transform: `translateY(${armed ? '0%' : offscreen})`, transition: `transform ${TRANSITION_MS}ms ${EASE}` };
  }

  function renderSlide(index: number, style: CSSProperties, captionVisible: boolean) {
    const img = IMAGES[index];
    return (
      <div className="absolute inset-0 w-full h-full bg-neutral-950" style={style}>
        <img
          src={img.src}
          alt={img.alt}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
            img.hero ? '' : index % 2 === 1 ? 'animate-kenburns' : 'animate-kenburns-out'
          }`}
          style={{ objectPosition: img.objectPosition }}
        />
        {img.hero && (
          <>
            {/* Always dark, regardless of site theme — this panel's only job
                is hiding the old baked-in headline pixels in the source
                photo, so it must stay near-opaque through its first half. */}
            <div
              className="absolute inset-y-0 right-0 w-full pointer-events-none transition-opacity duration-300 ease-out"
              style={{
                opacity: captionVisible ? 1 : 0,
                background: 'linear-gradient(to left, #0a0a0a 0%, #0a0a0a 33%, rgba(10,10,10,0) 39%)',
              }}
            />
            <div
              className="absolute top-1/2 right-6 md:right-12 left-6 max-w-md ml-auto text-right pointer-events-none transition-all duration-300 ease-out"
              style={{ opacity: captionVisible ? 1 : 0, transform: `translateY(calc(-50% + ${captionVisible ? 0 : 16}px))` }}
            >
              <h1 className="font-display uppercase leading-[0.95] text-white text-5xl md:text-7xl tracking-tight">
                Wear
                <br />
                What&apos;s
                <br />
                <span className="text-accent">Next</span>
              </h1>
              <p className="mt-4 text-sm md:text-base text-gray-100 max-w-xs ml-auto">
                Streetwear essentials built for movement. New drops, bold fits, zero compromise.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/shop');
                }}
                className="pointer-events-auto mt-6 bg-accent text-black font-bold uppercase tracking-wide text-sm px-7 py-3 hover:bg-white transition-colors"
              >
                Shop Now
              </button>
            </div>
          </>
        )}
        {img.caption && (
          <>
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none transition-opacity duration-300 ease-out"
              style={{ opacity: captionVisible ? 1 : 0 }}
            />
            <div
              className="absolute bottom-24 left-6 md:left-12 pointer-events-none transition-all duration-300 ease-out"
              style={{ opacity: captionVisible ? 1 : 0, transform: `translateY(${captionVisible ? 0 : 16}px)` }}
            >
              <div
                className="h-0.5 bg-accent mb-3 transition-transform duration-300 ease-out"
                style={{ width: 56, transform: `scaleX(${captionVisible ? 1 : 0})`, transformOrigin: 'left' }}
              />
              <p className="font-display text-2xl md:text-4xl text-white tracking-tight drop-shadow-lg">{img.caption}</p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative transition-opacity duration-1000 ease-out" style={{ opacity: mounted ? 1 : 0 }}>
      <div className="relative h-screen w-full overflow-hidden cursor-pointer" onClick={() => navigate('/shop')}>
        {transition
          ? (
            <>
              {renderSlide(transition.from, slideStyle('from', transition.dir, transition.armed), !transition.armed)}
              {renderSlide(transition.to, slideStyle('to', transition.dir, transition.armed), transition.armed)}
            </>
          )
          : renderSlide(activeIndex, slideStyle('active'), true)}
      </div>

      {newArrivals.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="font-display text-3xl uppercase mb-8">New Arrivals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <Link
              to="/shop"
              className="bg-accent text-black font-bold uppercase tracking-wide text-sm px-7 py-3 hover:bg-white transition-colors"
            >
              Shop All
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
