function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 border-2 border-black dark:border-white px-4 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${
        active ? 'bg-accent border-accent-dark text-black' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
      }`}
    >
      {label}
    </button>
  );
}

export function QuickFilterPills({
  bestSellerActive,
  onSaleActive,
  newArrivalsActive,
  onToggleBestSeller,
  onToggleOnSale,
  onToggleNewArrivals,
}: {
  bestSellerActive: boolean;
  onSaleActive: boolean;
  newArrivalsActive: boolean;
  onToggleBestSeller: () => void;
  onToggleOnSale: () => void;
  onToggleNewArrivals: () => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto sm:flex-wrap pb-1 mb-6">
      <Pill label="Best Sellers" active={bestSellerActive} onClick={onToggleBestSeller} />
      <Pill label="On Sale" active={onSaleActive} onClick={onToggleOnSale} />
      <Pill label="New Arrivals" active={newArrivalsActive} onClick={onToggleNewArrivals} />
    </div>
  );
}
