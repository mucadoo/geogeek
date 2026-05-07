import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-[90px] w-full" />
      <main className="container-custom mt-8 mb-20 flex-grow px-4">
        
        {/* Hero Section Skeleton */}
        <div className="mb-12 flex items-center gap-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64 rounded" />
            <Skeleton className="h-10 w-16 rounded" />
          </div>
        </div>

        {/* Bottom Section (Grid) Skeleton */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          
          {/* Summary Skeleton */}
          <section className="space-y-4 lg:col-span-8">
            <Skeleton className="mb-6 h-5 w-24" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </section>

          {/* Table Sidebar Skeleton */}
          <section className="lg:col-span-4">
            <Skeleton className="mb-6 h-5 w-24" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </section>

        </div>
      </main>
    </div>
  );
}
