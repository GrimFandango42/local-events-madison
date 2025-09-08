// Events listing page with EventCard grid layout
'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin } from 'lucide-react';
import type { EventWithDetails, EventFilters } from '@/lib/types';
import EventCard from '@/components/EventCard';

interface Neighborhood {
  id: string;
  name: string;
  slug: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch neighborhoods on component mount
  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  // Fetch events when filters change
  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchNeighborhoods = async () => {
    try {
      const response = await fetch('/api/neighborhoods');
      const data = await response.json();
      if (data.success) {
        setNeighborhoods(data.data || []);
      }
    } catch (error) {
      console.warn('Failed to fetch neighborhoods:', error);
      // Fallback to hardcoded Madison neighborhoods
      setNeighborhoods([
        { id: '1', name: 'Downtown', slug: 'downtown' },
        { id: '2', name: 'East Side', slug: 'east-side' },
        { id: '3', name: 'West Side', slug: 'west-side' },
        { id: '4', name: 'Near East', slug: 'near-east' },
        { id: '5', name: 'Near West', slug: 'near-west' },
      ]);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category?.[0]) params.append('category', filters.category[0]);
      if (filters.neighborhood) params.append('neighborhood', filters.neighborhood);
      
      const response = await fetch(`/api/events?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data || []);
      } else {
        setError(data.error || 'Failed to load events');
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setError('Unable to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchLoading(true);
    setFilters({ ...filters, search: searchTerm });
    setTimeout(() => setSearchLoading(false), 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category?.length) count++;
    if (filters.neighborhood) count++;
    if (filters.search) count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="glass border-b border-white/20 shadow-soft">
        <div className="max-w-7xl mx-auto mobile-padding py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="slide-up">
              <h1 className="heading-lg">Madison Events</h1>
              <p className="text-subtle mt-2 text-lg">Discover what's happening in your city</p>
            </div>
            <div className="text-left sm:text-right scale-in animation-delay-200">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                <span className="text-3xl font-bold text-blue-600">{events.length}</span>
                <span className="text-sm font-medium text-blue-700">
                  {events.length === 1 ? 'Event found' : 'Events found'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mobile-padding py-8">
        {/* Enhanced Search and Filters */}
        <div className="card shadow-soft mb-8 fade-in animation-delay-400">
          <div className="mobile-spacing">
            {/* Enhanced Search Row */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="event-search" className="sr-only">Search events</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    id="event-search"
                    type="text"
                    placeholder="Search events by name, description, venue..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="input-search group-focus-within:shadow-glow"
                  />
                </div>
              </div>
              
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="btn-primary mobile-touch-target disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searchLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span className="hidden sm:inline ml-2">Search</span>
              </button>
            </div>

            {/* Enhanced Filters Row */}
            <div className="filters-grid">
              {/* Category Filter */}
              <div>
                <label htmlFor="category-filter" className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
                <select
                  id="category-filter"
                  value={filters.category?.[0] || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    category: e.target.value ? [e.target.value] : undefined 
                  })}
                  className="input"
                >
                  <option value="">🎯 All Categories</option>
                  <option value="food">🍽️ Food & Dining</option>
                  <option value="music">🎵 Music</option>
                  <option value="culture">🏛️ Culture</option>
                  <option value="art">🎨 Art</option>
                  <option value="theater">🎭 Theater</option>
                  <option value="festival">🎪 Festivals</option>
                  <option value="market">🏪 Markets</option>
                  <option value="nightlife">🌃 Nightlife</option>
                  <option value="education">📚 Education</option>
                  <option value="community">🏘️ Community</option>
                  <option value="family">👨‍👩‍👧‍👦 Family</option>
                </select>
              </div>
              
              {/* Neighborhood Filter */}
              <div>
                <label htmlFor="neighborhood-filter" className="block text-sm font-semibold text-gray-700 mb-3">Neighborhood</label>
                <select
                  id="neighborhood-filter"
                  value={filters.neighborhood || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    neighborhood: e.target.value || undefined 
                  })}
                  className="input"
                >
                  <option value="">📍 All Neighborhoods</option>
                  {neighborhoods.map((neighborhood) => (
                    <option key={neighborhood.id} value={neighborhood.name}>
                      {neighborhood.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {getActiveFiltersCount() > 0 && (
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="btn-secondary w-full mobile-touch-target"
                  >
                    🗑️ Clear Filters ({getActiveFiltersCount()})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 slide-up">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-lg">⚠️</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 mb-1">Something went wrong</h4>
                <p className="text-red-600 text-sm leading-relaxed">{error}</p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  fetchEvents();
                }}
                className="btn-small bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Events List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4 fade-in">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <div>
                <p className="text-lg font-medium text-gray-700">Loading amazing events...</p>
                <p className="text-sm text-gray-500">This should just take a moment</p>
              </div>
            </div>
          </div>
        ) : events.length > 0 ? (
          <div className="events-grid">
            {events.map((event, index) => (
              <div key={event.id} className="fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <EventCard 
                  event={event} 
                  priority={index < 3} // Prioritize first 3 images for LCP
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 slide-up">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-gray-700">No Events Found</h3>
                <p className="text-gray-500 leading-relaxed">
                  {getActiveFiltersCount() > 0 
                    ? "No events match your current filters. Try adjusting your search criteria to discover more events."
                    : "No events are currently available. Check back later for new exciting events in Madison!"
                  }
                </p>
              </div>
              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={clearFilters}
                  className="btn-primary"
                >
                  🔄 Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}