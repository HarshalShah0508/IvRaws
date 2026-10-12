import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="font-display text-7xl uppercase">404</p>
      <p className="font-display text-2xl uppercase mt-4 mb-3">Page not found</p>
      <p className="text-gray-500 dark:text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="inline-block bg-black text-white dark:bg-white dark:text-black px-6 py-3 font-bold uppercase tracking-wide text-sm hover:bg-accent hover:text-black transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
