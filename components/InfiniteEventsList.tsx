import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import type { EventWithDetails, EventFilters } from '@/lib/types';
import { EventsList } from './EventsComponents';
import { EventListSkeleton } from './LoadingSkeletons';

interface InfiniteEventsListProps {
  filters: EventFilters;
  pageSize?: number;
  onError: (error: string) => void;
}

interface EventsResponse {
  success: boolean;
  data: EventWithDetails[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

const InfiniteEventsList = memo(function InfiniteEventsList({
  filters,
  pageSize = 12,
  onError
}: InfiniteEventsListProps) {
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const observerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch events with pagination
  const fetchEvents = useCallback(async (page: number, isLoadMore: boolean = false) => {
    try {
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setEvents([]); // Clear events for new search
      }

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      
      if (filters.category?.length) {
        params.append('category', filters.category.join(','));
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }
      if (filters.neighborhood) {
        params.append('neighborhood', filters.neighborhood);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`/api/events?${params}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: EventsResponse = await response.json();

      if (data.success) {
        if (isLoadMore) {
          setEvents(prev => [...prev, ...data.data]);
        } else {
          setEvents(data.data);
        }
        
        setHasMore(data.pagination.hasMore);
        setTotal(data.pagination.total);
        setCurrentPage(page);
      } else {
        onError(data.error || 'Failed to fetch events');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, this is expected
        return;
      }
      
      console.error('Failed to fetch events:', error);
      onError('Unable to load events. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, pageSize, onError]);

  // Load more events when intersection observer triggers
  const loadMoreEvents = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchEvents(currentPage + 1, true);
    }
  }, [currentPage, hasMore, loadingMore, fetchEvents]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreEvents();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Load more when 100px before reaching the bottom
        threshold: 0.1,
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, loadMoreEvents]);

  // Reset and fetch events when filters change
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchEvents(1, false);
  }, [fetchEvents]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Loading state for initial load
  if (loading && events.length === 0) {
    return <EventListSkeleton count={pageSize} />;
  }

  // Empty state
  if (!loading && events.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-6" />
        <h3 className="text-xl font-semibold text-gray-600 mb-3">No Events Found</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          No events match your current search criteria. Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Results summary */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          Showing {events.length} of {total.toLocaleString()} events
        </p>
        {total > events.length && (
          <p className="text-sm text-gray-500">
            Scroll down to load more
          </p>
        )}
      </div>

      {/* Events list */}
      <EventsList events={events} />

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading more events...</span>
          </div>
        </div>
      )}

      {/* End of results */}
      {!hasMore && events.length > 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-600 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            You've seen all the events
          </div>
        </div>
      )}

      {/* Intersection observer target */}
      <div 
        ref={observerRef} 
        className="h-10 flex items-center justify-center"
        aria-hidden="true"
      />
    </div>
  );
});

export default InfiniteEventsList;