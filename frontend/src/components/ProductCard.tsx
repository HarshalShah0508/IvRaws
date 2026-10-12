import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../lib/types.ts';
import { formatPrice } from '../lib/currency.ts';

export function ProductCard({ product }: { product: Product }) {
  const [saved, setSaved] = useState(false);
  const primaryImage = product.images[0]?.url;
  const secondaryImage = product.images[1]?.url;

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="aspect-[4/5] bg-gray-100 dark:bg-neutral-800 overflow-hidden relative">
        {primaryImage ? (
          <>
            <img
              src={primaryImage}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {secondaryImage && (
              <img
                src={secondaryImage}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">No image</div>
        )}

        {product.isOnSale && (
          <span className="absolute top-2 left-2 z-10 bg-accent text-black text-xs font-bold uppercase tracking-wide px-2 py-1">
            Sale
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setSaved((v) => !v);
          }}
          aria-label="Save to wishlist"
          className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          >
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
          </svg>
        </button>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</h3>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-gray-500 dark:text-gray-400"
          >
            <path d="M6 8h12l-1 12H7L6 8z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold">{formatPrice(product.basePrice)}</span>
          {product.isOnSale && product.compareAtPrice && (
            <span className="text-sm text-gray-400 dark:text-gray-500 line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </div>
        {product.reviewCount > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <span className="text-accent-dark">★</span> {Number(product.avgRating).toFixed(1)} ({product.reviewCount})
          </div>
        )}
      </div>
    </Link>
  );
}
