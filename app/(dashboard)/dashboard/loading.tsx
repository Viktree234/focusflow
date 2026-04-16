export default function Loading() {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-white/10 rounded"></div>
          <div className="h-8 w-48 bg-white/10 rounded"></div>
        </div>
        <div className="h-12 w-32 bg-white/10 rounded-xl"></div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5"></div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="h-80 bg-white/5 rounded-2xl border border-white/5"></div>
        <div className="h-80 bg-white/5 rounded-2xl border border-white/5"></div>
      </div>

      <div className="h-64 bg-white/5 rounded-2xl border border-white/5"></div>
    </div>
  );
}