import { useEffect, useState } from 'react';

const MESSAGES = ['Free Shipping', 'Cash On Delivery Available', 'Easy 30-Day Returns'];
const INTERVAL_MS = 3000;

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="bg-black text-white dark:bg-white dark:text-black text-center text-[11px] font-bold uppercase tracking-widest py-2 px-4 overflow-hidden">
      <span key={index} className="inline-block animate-announcement">
        {MESSAGES[index]}
      </span>
    </div>
  );
}
