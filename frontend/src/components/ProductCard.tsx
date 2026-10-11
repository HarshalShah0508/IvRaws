import { Link } from 'react-router-dom';
import type { Product } from '../lib/types.ts';

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0]?.url;

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="aspect-[4/5] bg-gray-100 overflow-hidden relative">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
        )}
        {product.isOnSale && (
          <span className="absolute top-2 left-2 bg-accent text-black text-xs font-bold uppercase tracking-wide px-2 py-1">
            Sale
          </span>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold">${product.basePrice}</span>
          {product.isOnSale && product.compareAtPrice && (
            <span className="text-sm text-gray-400 line-through">${product.compareAtPrice}</span>
          )}
        </div>
        {product.reviewCount > 0 && (
          <div className="text-xs text-gray-500 mt-0.5">
            <span className="text-accent-dark">★</span> {Number(product.avgRating).toFixed(1)} ({product.reviewCount})
          </div>
        )}
      </div>
    </Link>
  );
}
