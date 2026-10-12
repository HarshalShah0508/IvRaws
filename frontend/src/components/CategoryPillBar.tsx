import type { Category } from '../lib/types.ts';

export function CategoryPillBar({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto sm:flex-wrap pb-1 mb-6">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`shrink-0 border-2 border-black dark:border-white px-4 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${
          value === '' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
        }`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.slug)}
          className={`shrink-0 border-2 border-black dark:border-white px-4 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${
            value === c.slug ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
