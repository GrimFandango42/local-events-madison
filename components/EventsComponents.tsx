import React, { memo, useMemo } from 'react';
import { MapPin, Clock, ExternalLink } from 'lucide-react';
import type { EventWithDetails } from '@/lib/types';

// Memoized EventCard component for performance
const EventCard = memo(function EventCard({ event }: { event: EventWithDetails }) {
  const getCategoryColor = useMemo(() => (category: string) => {
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
  }, []);

  const formatEventDate = useMemo(() => (input: string | Date) => {
    const date = new Date(input as any);
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
  }, []);

  const formatEventTime = useMemo(() => (input: string | Date) => {
    return new Date(input as any).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  const eventDate = formatEventDate(event.startDateTime);
  const eventTime = formatEventTime(event.startDateTime);
  const categoryColor = getCategoryColor(event.category);
  const tags = useMemo(() => 
    (event.tags || '').split(',').filter(tag => tag.trim()), 
    [event.tags]
  );

  return (
    <article className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span 
              className={`badge border ${categoryColor}`}
              role="text" 
              aria-label={`Category: ${event.category}`}
            >
              {event.category}
            </span>
            {tags.map((tag) => (
              <span 
                key={tag.trim()} 
                className="badge bg-gray-100 text-gray-600 border border-gray-200"
                role="text"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-lg font-semibold text-gray-900">
              <time dateTime={event.startDateTime} title={`Event date: ${eventDate}`}>
                {eventDate}
              </time>
            </div>
            <div className="text-sm text-gray-600">
              <time dateTime={event.startDateTime} title={`Event time: ${eventTime}`}>
                {eventTime}
              </time>
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
              <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span className="truncate" title={event.venue?.name || event.customLocation || 'Location TBD'}>
                {event.venue?.name || event.customLocation || 'Location TBD'}
                {event.venue?.neighborhood && (
                  <span className="text-blue-600 ml-1">• {event.venue.neighborhood}</span>
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <time dateTime={event.startDateTime}>
                {eventTime}
              </time>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {event.price && (
              <span className="font-semibold text-green-600 text-sm" title={`Price: ${event.price}`}>
                {String(event.price).toLowerCase().includes('free') ? 'Free' : String(event.price)}
              </span>
            )}
            
            {(event.ticketUrl || event.sourceUrl) && (
              <a
                href={(event.ticketUrl ?? undefined) || (event.sourceUrl ?? undefined)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm font-medium hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label={`View details for ${event.title}`}
              >
                <span>View Details</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

// Memoized EventsList component
const EventsList = memo(function EventsList({ events }: { events: EventWithDetails[] }) {
  return (
    <div className="space-y-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
});

// Memoized search filters component
const SearchFilters = memo(function SearchFilters({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  neighborhoods,
  onSearch,
  searchLoading,
  onClearFilters,
  activeFiltersCount,
  onKeyPress
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: any;
  setFilters: (filters: any) => void;
  neighborhoods: any[];
  onSearch: () => void;
  searchLoading: boolean;
  onClearFilters: () => void;
  activeFiltersCount: number;
  onKeyPress: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <div className="flex flex-col space-y-4">
        
        {/* Search Row */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search events by name, description, venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={onKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                aria-label="Search events"
              />
            </div>
          </div>
          
          <button
            onClick={onSearch}
            disabled={searchLoading}
            className="btn-primary flex items-center justify-center gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
            type="button"
            aria-label="Search events"
          >
            {searchLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            Search
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4">
          
          {/* Category Filter */}
          <div className="flex-1">
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category-filter"
              value={filters.category?.[0] || ''}
              onChange={(e) => setFilters({ 
                ...filters, 
                category: e.target.value ? [e.target.value] : undefined 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter by category"
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
            <label htmlFor="neighborhood-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Neighborhood
            </label>
            <select
              id="neighborhood-filter"
              value={filters.neighborhood || ''}
              onChange={(e) => setFilters({ 
                ...filters, 
                neighborhood: e.target.value || undefined 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter by neighborhood"
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
          {activeFiltersCount > 0 && (
            <div className="flex items-end">
              <button
                onClick={onClearFilters}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                type="button"
                aria-label={`Clear all filters (${activeFiltersCount} active)`}
              >
                Clear Filters ({activeFiltersCount})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export { EventCard, EventsList, SearchFilters };