export function StaticPage({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-display text-3xl uppercase mb-6">{title}</h1>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{body}</p>
    </div>
  );
}
