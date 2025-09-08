import React from 'react';

// Base skeleton component
const Skeleton = ({ className = '', ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    {...props}
  />
);

// Dashboard stats skeleton
export const StatsCardSkeleton = () => (
  <div className="text-center p-6 bg-white rounded-lg shadow-sm">
    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4">
      <Skeleton className="w-6 h-6" />
    </div>
    <Skeleton className="h-8 w-16 mx-auto mb-2" />
    <Skeleton className="h-4 w-20 mx-auto" />
  </div>
);

// Event card skeleton
export const EventCardSkeleton = () => (
  <div className="card">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-4 w-20" />
    </div>
    
    <Skeleton className="h-6 w-full mb-2" />
    <Skeleton className="h-6 w-3/4 mb-2" />
    
    <div className="space-y-2 mb-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-1">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  </div>
);

// Event list skeleton
export const EventListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }, (_, i) => (
      <EventCardSkeleton key={i} />
    ))}
  </div>
);

// Dashboard skeleton
export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    {/* Header */}
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </header>

    {/* Hero Section */}
    <section className="py-16">
      <div className="max-w-4xl mx-auto text-center px-4">
        <Skeleton className="h-12 w-96 mx-auto mb-4" />
        <Skeleton className="h-6 w-full max-w-2xl mx-auto mb-2" />
        <Skeleton className="h-6 w-3/4 mx-auto mb-8" />
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-12 w-44" />
        </div>
      </div>
    </section>

    {/* Stats Section */}
    <section className="py-12 bg-white/50">
      <div className="max-w-7xl mx-auto px-4">
        <Skeleton className="h-8 w-48 mx-auto mb-8" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>

    {/* Recent Events Section */}
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        <EventListSkeleton />
      </div>
    </section>
  </div>
);

// Page loading skeleton
export const PageLoadingSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <Skeleton className="h-4 w-48 mx-auto" />
    </div>
  </div>
);

// Source list skeleton
export const SourceListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="card">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-full max-w-md mb-2" />
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Table skeleton for admin pages
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
    <table className="min-w-full divide-y divide-gray-300">
      <thead className="bg-gray-50">
        <tr>
          {Array.from({ length: columns }, (_, i) => (
            <th key={i} className="px-6 py-3">
              <Skeleton className="h-4 w-20" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {Array.from({ length: rows }, (_, i) => (
          <tr key={i}>
            {Array.from({ length: columns }, (_, j) => (
              <td key={j} className="px-6 py-4">
                <Skeleton className="h-4 w-full" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Skeleton;