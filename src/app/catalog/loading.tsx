export default function LoadingCatalog() {
  return (
    <div className="space-y-6">
      <div className="h-11 w-full rounded-full border border-border-subtle bg-white animate-pulse" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border-subtle bg-white p-4"
          >
            <div className="mb-4 aspect-[4/3] w-full animate-pulse rounded-xl bg-zinc-200" />
            <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
            <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
}