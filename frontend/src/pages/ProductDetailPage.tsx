import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api.ts';
import type { Product, Review } from '../lib/types.ts';
import { useCart } from '../context/CartContext.tsx';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api
      .get<Product>(`/products/${slug}`)
      .then((p) => {
        setProduct(p);
        setSelectedSize(p.variants[0]?.size.label ?? '');
        setSelectedColor(p.variants[0]?.color.name ?? '');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load product'));
    api.get<Review[]>(`/products/${slug}/reviews`).then(setReviews).catch(() => undefined);
  }, [slug]);

  if (error) return <div className="max-w-4xl mx-auto px-4 py-10 text-red-600">{error}</div>;
  if (!product) return <div className="max-w-4xl mx-auto px-4 py-10 text-gray-500">Loading...</div>;

  const sizes = [...new Map(product.variants.map((v) => [v.size.label, v.size])).values()];
  const colors = [...new Map(product.variants.map((v) => [v.color.name, v.color])).values()];
  const matchingVariant = product.variants.find((v) => v.size.label === selectedSize && v.color.name === selectedColor);
  const available = matchingVariant ? matchingVariant.stockQuantity - matchingVariant.reservedQuantity : 0;
  const images = matchingVariant?.images?.length ? matchingVariant.images : product.images;

  async function handleAddToCart() {
    if (!matchingVariant) return;
    setStatus(null);
    try {
      await addItem(matchingVariant.id, 1);
      setStatus('Added to cart.');
    } catch (err) {
      setStatus(err instanceof ApiError ? err.message : 'Could not add to cart');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-12">
      <div>
        <div className="aspect-[4/5] bg-gray-100 overflow-hidden mb-3 relative">
          {images[activeImage] ? (
            <img src={images[activeImage].url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
          )}
          {product.isOnSale && (
            <span className="absolute top-3 left-3 bg-accent text-black text-xs font-bold uppercase tracking-wide px-2.5 py-1">
              Sale
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveImage(i)}
              className={`w-16 h-16 overflow-hidden border-2 ${i === activeImage ? 'border-black' : 'border-transparent'}`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <h1 className="font-display text-3xl uppercase leading-tight">{product.name}</h1>
        {product.reviewCount > 0 && (
          <div className="text-sm text-gray-500 mt-2">
            <span className="text-accent-dark">★</span> {Number(product.avgRating).toFixed(1)} ({product.reviewCount}{' '}
            review{product.reviewCount === 1 ? '' : 's'})
          </div>
        )}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-2xl font-bold">${matchingVariant?.price ?? product.basePrice}</span>
          {product.isOnSale && product.compareAtPrice && (
            <span className="text-lg text-gray-400 line-through">${product.compareAtPrice}</span>
          )}
        </div>
        <p className="text-gray-600 mt-4 text-sm">{product.description}</p>

        {(product.material || product.fitType || product.pattern || product.sleeveLength) && (
          <dl className="mt-4 text-sm text-gray-600 space-y-1">
            {product.material && <div><dt className="inline font-medium">Material: </dt><dd className="inline">{product.material}</dd></div>}
            {product.fitType && <div><dt className="inline font-medium">Fit: </dt><dd className="inline">{product.fitType}</dd></div>}
            {product.pattern && <div><dt className="inline font-medium">Pattern: </dt><dd className="inline">{product.pattern}</dd></div>}
            {product.sleeveLength && <div><dt className="inline font-medium">Sleeve: </dt><dd className="inline">{product.sleeveLength}</dd></div>}
          </dl>
        )}

        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2.5">Size</h4>
          <div className="flex gap-2">
            {sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSize(s.label)}
                className={`border-2 border-black px-3.5 py-1.5 text-sm font-bold ${
                  selectedSize === s.label ? 'bg-black text-white' : 'hover:bg-gray-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2.5">Color</h4>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.name}
                onClick={() => setSelectedColor(c.name)}
                className={`w-8 h-8 rounded-full border-2 ${
                  selectedColor === c.name ? 'border-accent-dark ring-2 ring-black' : 'border-gray-300'
                }`}
                style={{ backgroundColor: c.hexCode }}
              />
            ))}
          </div>
        </div>

        <div className="mt-7">
          {matchingVariant && available > 0 ? (
            <p className="text-sm text-gray-500 mb-2">{available} in stock</p>
          ) : (
            <p className="text-sm text-red-500 mb-2">Out of stock for this combination</p>
          )}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!matchingVariant || available <= 0}
            className="bg-black text-white px-8 py-3 font-bold uppercase tracking-wide text-sm hover:bg-accent hover:text-black transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
          {status && <p className="text-sm mt-2 text-gray-600">{status}</p>}
        </div>

        <div className="mt-10 border-t-2 border-black pt-6">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3">Reviews</h3>
          {reviews.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="text-sm">
                <div className="font-medium">
                  <span className="text-accent-dark">
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </span>{' '}
                  — {review.user.firstName ?? 'Customer'}
                </div>
                {review.comment && <p className="text-gray-600 mt-0.5">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
