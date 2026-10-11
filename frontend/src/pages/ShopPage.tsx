import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.ts';
import type { Category, ColorOption, Paginated, Product, SizeOption } from '../lib/types.ts';
import { ProductCard } from '../components/ProductCard.tsx';

const SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'best_selling', label: 'Best Selling' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'discount', label: 'Biggest Discount' },
];

export function ShopPage() {
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [size, setSize] = useState(searchParams.get('size') ?? '');
  const [color, setColor] = useState(searchParams.get('color') ?? '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onSale, setOnSale] = useState(searchParams.get('onSale') === 'true');
  const [newArrivals, setNewArrivals] = useState(searchParams.get('newArrivals') === 'true');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState(searchParams.get('sort') ?? '');

  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(() => undefined);
    api.get<SizeOption[]>('/sizes').then(setSizes).catch(() => undefined);
    api.get<ColorOption[]>('/colors').then(setColors).catch(() => undefined);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (size) params.set('size', size);
    if (color) params.set('color', color);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (onSale) params.set('onSale', 'true');
    if (newArrivals) params.set('newArrivals', 'true');
    if (q) params.set('q', q);
    if (sort) params.set('sort', sort);
    params.set('limit', '24');

    setLoading(true);
    setError(null);
    api
      .get<Paginated<Product>>(`/products?${params.toString()}`)
      .then((result) => setProducts(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category, size, color, minPrice, maxPrice, onSale, newArrivals, q, sort]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 flex gap-10">
      <aside className="w-56 shrink-0 space-y-7 text-sm">
        <div>
          <input
            type="text"
            placeholder="Search..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full border-2 border-black dark:border-white dark:bg-neutral-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Category</h4>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border-2 border-black dark:border-white dark:bg-neutral-900 px-2 py-1.5"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Size</h4>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSize(size === s.label ? '' : s.label)}
                className={`border-2 border-black dark:border-white px-2.5 py-1 text-xs font-bold ${
                  size === s.label ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Color</h4>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.name}
                onClick={() => setColor(color === c.name ? '' : c.name)}
                className={`w-7 h-7 rounded-full border-2 ${
                  color === c.name ? 'border-accent-dark ring-2 ring-black dark:ring-white' : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: c.hexCode }}
              />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Price</h4>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full border-2 border-black dark:border-white dark:bg-neutral-900 px-2 py-1.5"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full border-2 border-black dark:border-white dark:bg-neutral-900 px-2 py-1.5"
            />
          </div>
        </div>

        <div className="space-y-2.5 text-xs font-bold uppercase tracking-wide">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={onSale}
              onChange={(e) => setOnSale(e.target.checked)}
              className="w-4 h-4 accent-black"
            />
            On Sale
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newArrivals}
              onChange={(e) => setNewArrivals(e.target.checked)}
              className="w-4 h-4 accent-black"
            />
            New Arrivals
          </label>
        </div>
      </aside>

      <main className="flex-1">
        <div className="flex items-end justify-between mb-8">
          <h1 className="font-display text-3xl uppercase">Shop</h1>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border-2 border-black dark:border-white dark:bg-neutral-900 px-3 py-2 text-xs font-bold uppercase tracking-wide"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-gray-500 dark:text-gray-400">Loading...</p>}
        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
        {!loading && !error && products.length === 0 && <p className="text-gray-500 dark:text-gray-400">No products match these filters.</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </div>
  );
}
