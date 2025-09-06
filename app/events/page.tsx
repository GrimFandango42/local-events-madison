// Events listing page
'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import type { EventWithDetails, EventFilters } from '@/lib/types';

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EventFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
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
      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`/api/events?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: 'bg-orange-100 text-orange-800',
      music: 'bg-purple-100 text-purple-800',
      culture: 'bg-blue-100 text-blue-800',
      art: 'bg-pink-100 text-pink-800',
      festival: 'bg-green-100 text-green-800',
      market: 'bg-yellow-100 text-yellow-800',
      nightlife: 'bg-indigo-100 text-indigo-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
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
              <p className="text-sm text-gray-600">Events found</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search events by name, description, venue..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="lg:w-48">
              <select
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
                <option value="festival">Festivals</option>
                <option value="market">Markets</option>
                <option value="nightlife">Nightlife</option>
              </select>
            </div>
            
            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="btn-primary flex items-center gap-2 px-6"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

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
              <div key={event.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`badge ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                      {event.tags.map((tag) => (
                        <span key={tag} className="badge bg-gray-100 text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatEventDate(event.startDateTime)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatEventTime(event.startDateTime)}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  
                  {event.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{event.venue?.name || event.customLocation || 'Location TBD'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatEventTime(event.startDateTime)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {event.priceMin !== null && (
                        <span className="font-semibold text-green-600">
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
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Events Found</h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or check back later for new events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}