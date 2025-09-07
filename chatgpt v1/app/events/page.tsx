// Events listing page
'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { EventWithDetails } from '@/lib/types';

// Hard‑coded list of Madison neighbourhoods. These values can later be fetched from the API.
const NEIGHBORHOODS = ['East Side', 'Downtown', 'West Side', 'Near East', 'Near West'];

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ category?: string; neighborhood?: string; search?: string }>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEvents();
    // Re‑fetch when filters change
  }, [filters]);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.neighborhood) params.append('neighborhood', filters.neighborhood);
      if (filters.search) params.append('search', filters.search);
      // Always fetch future events by default (handled by API)

      const response = await fetch(`/api/events?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setEvents(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-1">Madison Events</h1>
        <p className="text-gray-600">Discover what's happening in your city</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search events"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {/* Category filter */}
        <select
          value={filters.category || ''}
          onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          <option value="food">Food & Dining</option>
          <option value="music">Music</option>
          <option value="culture">Culture</option>
          <option value="art">Art</option>
          <option value="festival">Festivals</option>
          <option value="market">Markets</option>
          <option value="nightlife">Nightlife</option>
        </select>
        {/* Neighborhood filter */}
        <select
          value={filters.neighborhood || ''}
          onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Neighbourhoods</option>
          {NEIGHBORHOODS.map((nb) => (
            <option key={nb} value={nb}>{nb}</option>
          ))}
        </select>
        {/* Search button */}
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Event list */}
      {loading ? (
        <p className="text-gray-500">Loading events...</p>
      ) : events.length === 0 ? (
        <div className="text-center text-gray-600">
          <p>No events found</p>
          <p className="text-sm">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium uppercase mr-2 ${(() => {
                  const colors: Record<string, string> = {
                    food: 'bg-orange-100 text-orange-800',
                    music: 'bg-purple-100 text-purple-800',
                    culture: 'bg-blue-100 text-blue-800',
                    art: 'bg-pink-100 text-pink-800',
                    festival: 'bg-green-100 text-green-800',
                    market: 'bg-yellow-100 text-yellow-800',
                    nightlife: 'bg-indigo-100 text-indigo-800',
                  };
                  return colors[event.category] || 'bg-gray-100 text-gray-800';
                })()} px-2 py-1 rounded`}>{event.category}</span>
                <span className="text-sm text-gray-500">
                  {new Date(event.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                  · {new Date(event.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="text-lg font-semibold leading-tight mb-1">{event.title}</h3>
              {event.description && <p className="text-gray-600 text-sm mb-2 line-clamp-2">{event.description}</p>}
              <div className="text-sm text-gray-500">
                {event.venue?.name || event.customLocation || 'Location TBD'}
                {/* Display neighbourhood if available */}
                {event.venue?.neighborhood ? ` · ${event.venue.neighborhood}` : ''}
              </div>
              {event.priceMin !== null && (
                <div className="text-sm font-medium mt-1">
                  {event.priceMin === 0
                    ? 'Free'
                    : event.priceMax && event.priceMax !== event.priceMin
                      ? `$${(event.priceMin / 100).toFixed(0)}–${(event.priceMax / 100).toFixed(0)}`
                      : `$${(event.priceMin / 100).toFixed(0)}+`}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}