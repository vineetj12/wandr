export default function TripCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-14 rounded-full" />
      </div>
      <div className="skeleton h-10 w-full rounded-lg" />
      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
        <div className="skeleton h-8 w-28 rounded-lg" />
        <div className="skeleton h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}
