import { Skeleton } from '@/components/ui/skeleton';

interface PageLoaderProps {
  cards?: number;
  showChart?: boolean;
}

export function PageLoader({ cards = 4, showChart = true }: PageLoaderProps) {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      {showChart && <Skeleton className="h-80 rounded-xl" />}
    </div>
  );
}
