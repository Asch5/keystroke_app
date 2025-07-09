/**
 * Loading skeleton component for list detail page
 * Shows skeleton elements while data is loading
 */
export function ListDetailLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-content-border rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-content-border rounded animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
