'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import ViewToggle from '@/components/ViewToggle';
import { useViewMode } from '@/contexts/ViewModeContext';
import FavoriteButton from '@/components/FavoriteButton';

interface Event {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  venue?: {
    name: string;
  };
  category: string;
  price?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { viewMode } = useViewMode();

  useEffect(() => {
    console.log('EventsPage useEffect started');

    const fetchEvents = async () => {
      try {
        console.log('Making API call to /api/events');
        const response = await fetch('/api/events');
        console.log('API response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API response data:', data);

        if (data.success) {
          setEvents(data.data || []);
          console.log('Events loaded:', data.data?.length || 0);
        } else {
          throw new Error(data.error || 'Failed to load events');
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError(err instanceof Error ? err.message : 'Unable to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  console.log('Render - loading:', loading, 'events:', events.length, 'error:', error);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Madison Events</h1>
                <p className="text-gray-600 mt-1">Discover what's happening in your city</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ViewToggle />
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{events.length}</p>
                <p className="text-sm text-gray-600">
                  {events.length === 1 ? 'Event found' : 'Events found'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold">Error loading events</p>
            <p className="text-red-600 mt-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Events List */}
        {!loading && !error && (
          <div>
            {events.length > 0 ? (
              <div className={viewMode === 'grid'
                ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
                : 'space-y-4'
              }>
                {events.map((event) => (
                  viewMode === 'grid' ? (
                    // Grid View - Card Layout
                    <div key={event.id} className="bg-white rounded-lg shadow border p-6" data-testid="event-card">
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {event.category}
                        </span>
                        {event.price && (
                          <span className="text-green-600 font-semibold text-sm">
                            {event.price}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-lg mb-2 text-gray-900">
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {event.description}
                        </p>
                      )}

                      <div className="flex justify-between items-end">
                        <div className="text-sm text-gray-500">
                          <p className="mb-1">
                            📅 {new Date(event.startDateTime).toLocaleDateString()}
                          </p>
                          {event.venue && (
                            <p>📍 {event.venue.name}</p>
                          )}
                        </div>
                        <FavoriteButton
                          eventId={event.id}
                          eventTitle={event.title}
                          className="shrink-0"
                        />
                      </div>
                    </div>
                  ) : (
                    // List View - Horizontal Layout
                    <div key={event.id} className="bg-white rounded-lg shadow border p-4 flex items-center gap-4" data-testid="event-list-item">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-lg text-gray-900">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {event.category}
                            </span>
                            {event.price && (
                              <span className="text-green-600 font-semibold text-sm">
                                {event.price}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>📅 {new Date(event.startDateTime).toLocaleDateString()}</span>
                            {event.venue && (
                              <span>📍 {event.venue.name}</span>
                            )}
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <FavoriteButton
                        eventId={event.id}
                        eventTitle={event.title}
                        className="shrink-0"
                      />
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg">No events found</p>
                <p className="text-gray-500 mt-2">Check back later for new events</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}