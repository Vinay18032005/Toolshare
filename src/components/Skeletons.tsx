import { classNames } from '@/utils/helpers';

export function EquipmentCardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton h-48 w-full" />
          <div className="p-4 space-y-3">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="flex justify-between items-center">
              <div className="skeleton h-6 w-20" />
              <div className="skeleton h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="skeleton h-6 w-32 mb-4" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="skeleton h-96 w-full rounded-2xl" />
        <div className="space-y-4">
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={classNames('card overflow-hidden')}>
          <div className="skeleton h-48 w-full" />
          <div className="p-4 space-y-3">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="flex justify-between items-center">
              <div className="skeleton h-6 w-20" />
              <div className="skeleton h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
