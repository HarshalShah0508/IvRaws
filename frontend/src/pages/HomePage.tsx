import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.ts';
import type { Category, Paginated, Product } from '../lib/types.ts';
import { ProductCard } from '../components/ProductCard.tsx';

function ProductRow({ title, products, viewAllHref }: { title: string; products: Product[]; viewAllHref: string }) {
  if (products.length === 0) return null;
  return (
    <section className="max-w-6xl mx-auto px-4 py-14">
      <div className="flex items-end justify-between mb-6">
        <h2 className="font-display text-2xl md:text-3xl uppercase">{title}</h2>
        <Link to={viewAllHref} className="text-xs font-bold uppercase tracking-widest hover:text-accent-dark">
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [onSale, setOnSale] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);

  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(() => undefined);
    api
      .get<Paginated<Product>>('/products?sort=best_selling&limit=4')
      .then((r) => setBestSellers(r.data))
      .catch(() => undefined);
    api
      .get<Paginated<Product>>('/products?onSale=true&limit=4')
      .then((r) => setOnSale(r.data))
      .catch(() => undefined);
    api
      .get<Paginated<Product>>('/products?newArrivals=true&sort=newest&limit=4')
      .then((r) => setNewArrivals(r.data))
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <section className="bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-24 md:py-32">
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] uppercase">
            Wear What&apos;s <span className="text-accent">Next</span>
          </h1>
          <p className="text-gray-400 mt-6 max-w-md text-lg">
            Streetwear essentials built for movement. New drops, bold fits, zero compromise.
          </p>
          <Link
            to="/shop"
            className="inline-block mt-8 bg-accent text-black font-bold uppercase tracking-wide px-8 py-4 hover:bg-white transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.slug}`}
              className={`group flex items-center justify-center py-20 md:py-28 ${
                i % 2 === 0 ? 'bg-gray-100' : 'bg-accent'
              }`}
            >
              <span className="font-display text-3xl md:text-4xl uppercase group-hover:tracking-wide transition-all">
                {c.name}
              </span>
            </Link>
          ))}
        </section>
      )}

      <ProductRow title="Best Sellers" products={bestSellers} viewAllHref="/shop?sort=best_selling" />
      <ProductRow title="On Sale" products={onSale} viewAllHref="/shop?onSale=true" />
      <ProductRow title="New Arrivals" products={newArrivals} viewAllHref="/shop?newArrivals=true" />
    </div>
  );
}
