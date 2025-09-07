// Enhanced Events listing page - Best of both implementations
'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, Clock, ExternalLink, Loader2 } from 'lucide-react';
import type { EventWithDetails, EventFilters } from '@/lib/types';

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
        { id: '6', name: 'Middleton', slug: 'middleton' },
        { id: '7', name: 'Fitchburg', slug: 'fitchburg' },
      ]);
    }
  };

  const fetchEvents = async () => {
    try {
      setSearchLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
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

      const response = await fetch(`/api/events?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setError('Unable to load events. Please try again.');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: 'bg-orange-100 text-orange-800 border-orange-200',
      music: 'bg-purple-100 text-purple-800 border-purple-200',
      culture: 'bg-blue-100 text-blue-800 border-blue-200',
      art: 'bg-pink-100 text-pink-800 border-pink-200',
      festival: 'bg-green-100 text-green-800 border-green-200',
      market: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      nightlife: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      theater: 'bg-red-100 text-red-800 border-red-200',
      education: 'bg-teal-100 text-teal-800 border-teal-200',
      community: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      family: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatEventTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category?.length) count++;
    if (filters.neighborhood) count++;
    if (filters.search) count++;
    if (filters.dateFrom) count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
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
        
        {/* Enhanced Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col space-y-4">
            
            {/* Search Row */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search events by name, description, venue..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
              
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="btn-primary flex items-center gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 text-sm">{error}</div>
              <button
                onClick={() => {
                  setError(null);
                  fetchEvents();
                }}
                className="ml-auto text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading events...</p>
            </div>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`badge border ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                      {event.tags.map((tag) => (
                        <span key={tag} className="badge bg-gray-100 text-gray-600 border border-gray-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatEventDate(event.startDateTime)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatEventTime(event.startDateTime)}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 leading-tight">
                    {event.title}
                  </h3>
                  
                  {event.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {event.venue?.name || event.customLocation || 'Location TBD'}
                          {event.venue?.neighborhood && (
                            <span className="text-blue-600 ml-1">• {event.venue.neighborhood}</span>
                          )}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{formatEventTime(event.startDateTime)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {event.priceMin !== null && (
                        <span className="font-semibold text-green-600 text-sm">
                          {event.priceMin === 0 
                            ? 'Free' 
                            : event.priceMax && event.priceMax !== event.priceMin
                              ? `$${(event.priceMin / 100).toFixed(0)}-${(event.priceMax / 100).toFixed(0)}`
                              : `$${(event.priceMin / 100).toFixed(0)}+`
                          }
                        </span>
                      )}
                      
                      {(event.ticketUrl || event.sourceUrl) && (
                        <a
                          href={event.ticketUrl || event.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm font-medium hover:underline transition-colors"
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-600 mb-3">No Events Found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {getActiveFiltersCount() > 0 
                ? "No events match your current filters. Try adjusting your search criteria."
                : "No events are currently available. Check back later for new events."
              }
            </p>
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearFilters}
                className="btn-secondary"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}