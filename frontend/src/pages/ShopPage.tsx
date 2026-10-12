import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.ts';
import type { Category, ColorOption, Paginated, Product, SizeOption } from '../lib/types.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { CategoryPillBar } from '../components/CategoryPillBar.tsx';
import { QuickFilterPills } from '../components/QuickFilterPills.tsx';

const SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'best_selling', label: 'Best Selling' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'discount', label: 'Biggest Discount' },
];

const FIT_TYPES = ['SLIM', 'REGULAR', 'OVERSIZED', 'RELAXED'];
const PATTERNS = ['SOLID', 'GRAPHIC', 'STRIPED', 'TIE_DYE'];
const SLEEVE_LENGTHS = ['SLEEVELESS', 'SHORT', 'LONG'];
const GENDERS: { value: string; label: string }[] = [
  { value: 'MALE', label: 'Men' },
  { value: 'FEMALE', label: 'Women' },
  { value: 'UNISEX', label: 'Unisex' },
];
const MATERIALS = ['Cotton', 'Fleece', 'Denim', 'Flannel', 'Oxford Cotton', 'Pique Cotton', 'Cotton Twill', 'Nylon'];
const RATING_OPTIONS = [
  { value: 4, label: '4★ & up' },
  { value: 3, label: '3★ & up' },
];

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('-');
}

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

  const [material, setMaterial] = useState('');
  const [fitType, setFitType] = useState('');
  const [pattern, setPattern] = useState('');
  const [sleeveLength, setSleeveLength] = useState('');
  const [gender, setGender] = useState('');
  const [minRating, setMinRating] = useState<number | ''>('');

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const bestSellerActive = sort === 'best_selling';

  const activeFilterCount =
    [size, color, minPrice, maxPrice, q, material, fitType, pattern, sleeveLength, gender].filter(Boolean).length +
    (minRating !== '' ? 1 : 0);

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
    if (material) params.set('material', material);
    if (fitType) params.set('fitType', fitType);
    if (pattern) params.set('pattern', pattern);
    if (sleeveLength) params.set('sleeveLength', sleeveLength);
    if (gender) params.set('gender', gender);
    if (minRating !== '') params.set('minRating', String(minRating));
    params.set('limit', '24');

    setLoading(true);
    setError(null);
    api
      .get<Paginated<Product>>(`/products?${params.toString()}`)
      .then((result) => setProducts(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category, size, color, minPrice, maxPrice, onSale, newArrivals, q, sort, material, fitType, pattern, sleeveLength, gender, minRating]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl uppercase mb-6">Shop</h1>

      <CategoryPillBar categories={categories} value={category} onChange={setCategory} />

      <QuickFilterPills
        bestSellerActive={bestSellerActive}
        onSaleActive={onSale}
        newArrivalsActive={newArrivals}
        onToggleBestSeller={() => setSort(bestSellerActive ? '' : 'best_selling')}
        onToggleOnSale={() => setOnSale((v) => !v)}
        onToggleNewArrivals={() => setNewArrivals((v) => !v)}
      />

      <div className="flex items-center justify-between flex-wrap gap-3 border-b-2 border-black dark:border-white pb-3 mb-6">
        <button
          type="button"
          onClick={() => setFilterPanelOpen((v) => !v)}
          className="flex items-center gap-2 border-2 border-black dark:border-white px-3 py-2 text-xs font-bold uppercase tracking-wide hover:bg-gray-100 dark:hover:bg-neutral-800"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
            <circle cx="9" cy="6" r="1.8" fill="currentColor" />
            <circle cx="15" cy="12" r="1.8" fill="currentColor" />
            <circle cx="9" cy="18" r="1.8" fill="currentColor" />
          </svg>
          Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-2 border-2 border-black dark:border-white ${
                viewMode === 'grid' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="8" height="8" />
                <rect x="13" y="3" width="8" height="8" />
                <rect x="3" y="13" width="8" height="8" />
                <rect x="13" y="13" width="8" height="8" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`p-2 border-2 border-black dark:border-white ${
                viewMode === 'list' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border-2 border-black dark:border-white dark:bg-neutral-900 px-3 py-2 text-xs font-bold uppercase tracking-wide focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filterPanelOpen && (
        <div className="border-2 border-black dark:border-white p-5 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Search</h4>
            <input
              type="text"
              placeholder="Search..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full border-2 border-black dark:border-white dark:bg-neutral-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
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

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Fit</h4>
            <div className="flex flex-wrap gap-1.5">
              {FIT_TYPES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFitType(fitType === f ? '' : f)}
                  className={`border-2 border-black dark:border-white px-2.5 py-1 text-xs font-bold ${
                    fitType === f ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {titleCase(f)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Pattern</h4>
            <div className="flex flex-wrap gap-1.5">
              {PATTERNS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPattern(pattern === p ? '' : p)}
                  className={`border-2 border-black dark:border-white px-2.5 py-1 text-xs font-bold ${
                    pattern === p ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {titleCase(p)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Sleeve Length</h4>
            <div className="flex flex-wrap gap-1.5">
              {SLEEVE_LENGTHS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSleeveLength(sleeveLength === s ? '' : s)}
                  className={`border-2 border-black dark:border-white px-2.5 py-1 text-xs font-bold ${
                    sleeveLength === s ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {titleCase(s)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Gender</h4>
            <div className="flex flex-wrap gap-1.5">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(gender === g.value ? '' : g.value)}
                  className={`border-2 border-black dark:border-white px-2.5 py-1 text-xs font-bold ${
                    gender === g.value ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Material</h4>
            <div className="flex flex-wrap gap-1.5">
              {MATERIALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMaterial(material === m ? '' : m)}
                  className={`border-2 border-black dark:border-white px-2.5 py-1 text-xs font-bold ${
                    material === m ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Rating</h4>
            <div className="flex flex-wrap gap-1.5">
              {RATING_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setMinRating(minRating === r.value ? '' : r.value)}
                  className={`border-2 border-black dark:border-white px-2.5 py-1 text-xs font-bold ${
                    minRating === r.value ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-4 flex justify-end">
            <button
              type="button"
              onClick={() => setFilterPanelOpen(false)}
              className="border-2 border-black dark:border-white px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-gray-500 dark:text-gray-400">Loading...</p>}
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      {!loading && !error && products.length === 0 && <p className="text-gray-500 dark:text-gray-400">No products match these filters.</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
