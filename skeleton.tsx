export function DetailSkeleton() {
  return (
    <main aria-busy="true">
      <div className="bg-sky">
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-12 sm:px-6">
          <div className="h-12 w-2/3 animate-pulse rounded bg-white/50" />
          <div className="mt-4 h-6 w-1/2 animate-pulse rounded bg-white/40" />
        </div>
        <div className="bands" aria-hidden />
      </div>
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-16 sm:px-6">
        <div className="h-5 w-full animate-pulse rounded bg-muted" />
        <div className="h-5 w-11/12 animate-pulse rounded bg-muted" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
      </div>
    </main>
  );
}
