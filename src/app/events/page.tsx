// Events listing page with EventCard grid layout
'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin } from 'lucide-react';
import type { EventWithDetails, EventFilters } from '@/lib/types';
import EventCard from '@/components/EventCard';
import { EventCardSkeletonGrid } from '@/components/EventCardSkeleton';
import { MobileBottomNav } from '@/components/MobileNavigation';
import ImprovedErrorState, { LoadingError, EmptyState } from '@/components/ImprovedErrorStates';
import SearchAutocomplete from '@/components/SearchAutocomplete';

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
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Madison Events</h1>
              <p className="text-gray-600 mt-1">Discover what's happening in your city</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{events.length}</p>
              <p className="text-sm text-gray-600">
                {events.length === 1 ? 'Event found' : 'Events found'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col space-y-4">
            {/* Search Row */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <SearchAutocomplete
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSearch={(term) => {
                    setSearchTerm(term);
                    setSearchLoading(true);
                    setFilters({ ...filters, search: term });
                    setTimeout(() => setSearchLoading(false), 500);
                  }}
                  placeholder="Search events by name, description, venue..."
                />
              </div>
              
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="btn-primary flex items-center gap-2 px-6 py-3 min-h-[48px] mobile-touch-target disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Category Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category?.[0] || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    category: e.target.value ? [e.target.value] : undefined 
                  })}
                  className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="category-filter"
                >
                  <option value="">All Categories</option>
                  <option value="food">Food & Dining</option>
                  <option value="music">Music</option>
                  <option value="culture">Culture</option>
                  <option value="art">Art</option>
                  <option value="theater">Theater</option>
                  <option value="festival">Festivals</option>
                  <option value="market">Markets</option>
                  <option value="nightlife">Nightlife</option>
                  <option value="education">Education</option>
                  <option value="community">Community</option>
                  <option value="family">Family</option>
                </select>
              </div>
              
              {/* Neighborhood Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Neighborhood</label>
                <select
                  value={filters.neighborhood || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    neighborhood: e.target.value || undefined 
                  })}
                  className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="neighborhood-filter"
                >
                  <option value="">All Neighborhoods</option>
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
                    className="px-4 py-3 min-h-[48px] mobile-touch-target text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    Clear Filters ({getActiveFiltersCount()})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6">
            <LoadingError 
              title="Failed to load events"
              onRetry={() => {
                setError(null);
                fetchEvents();
              }}
            />
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <EventCardSkeletonGrid count={9} />
        ) : events.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, index) => (
              <EventCard 
                key={event.id} 
                event={event} 
                priority={index < 3} // Prioritize first 3 images for LCP
              />
            ))}
          </div>
        ) : (
          <div className="py-16">
            <ImprovedErrorState
              type={getActiveFiltersCount() > 0 ? "search" : "notFound"}
              title={getActiveFiltersCount() > 0 ? "No Results Found" : "No Events Available"}
              message={getActiveFiltersCount() > 0 
                ? "No events match your current filters. Try adjusting your search criteria."
                : "No events are currently available. Check back later for new events."
              }
              actionLabel={getActiveFiltersCount() > 0 ? "Clear All Filters" : "Browse All Categories"}
              onAction={getActiveFiltersCount() > 0 ? clearFilters : undefined}
              showHomeButton={getActiveFiltersCount() === 0}
            />
          </div>
        )}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav currentPath="/events" />
    </div>
  );
}