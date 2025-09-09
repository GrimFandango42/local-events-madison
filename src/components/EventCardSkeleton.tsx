import React from 'react';

interface EventCardSkeletonProps {
  count?: number;
}

export default function EventCardSkeleton({ count = 6 }: EventCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card-hover animate-pulse">
          {/* Image skeleton */}
          <div className="w-full h-48 sm:h-52 mb-4 rounded-xl bg-gray-200" />
          
          {/* Header with category and date */}
          <div className="flex items-start justify-between mb-4">
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          </div>
          
          {/* Title */}
          <div className="space-y-2 mb-3">
            <div className="h-6 bg-gray-200 rounded w-full" />
            <div className="h-6 bg-gray-200 rounded w-3/4" />
          </div>
          
          {/* Description */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
          
          {/* Footer with location and price */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
}

export function EventCardSkeletonGrid({ count = 6 }: EventCardSkeletonProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <EventCardSkeleton count={count} />
    </div>
  );
}

export function FeaturedEventsSkeleton() {
  return (
    <section className="py-16 bg-white/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-4" />
          <div className="h-5 w-80 bg-gray-200 rounded mx-auto" />
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <EventCardSkeleton count={3} />
        </div>
        
        <div className="text-center">
          <div className="h-12 w-40 bg-gray-200 rounded-lg mx-auto" />
        </div>
      </div>
    </section>
  );
}

export function RecentEventsSkeleton() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-56 bg-gray-200 rounded" />
          </div>
          <div className="h-5 w-20 bg-gray-200 rounded" />
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EventCardSkeleton count={6} />
        </div>
      </div>
    </section>
  );
}