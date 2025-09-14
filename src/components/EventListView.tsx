'use client';

import React, { memo, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { MapPin, Calendar, Clock, Plus, ExternalLink } from 'lucide-react';
import { useSession } from 'next-auth/react';
import type { EventWithDetails } from '@/lib/types';
import dynamic from 'next/dynamic';
import FavoriteButton from './FavoriteButton';
import Link from 'next/link';
import { getCategoryColorClass, getCategoryTheme } from '@/lib/categoryColors';

const CalendarPreviewModal = dynamic(() => import('./CalendarPreviewModal'), {
  ssr: false,
  loading: () => null
});

interface EventListViewProps {
  event: EventWithDetails;
  priority?: boolean;
  onFavorite?: (event: EventWithDetails) => void;
  isFavorite?: boolean;
}

const EventListView = memo(function EventListView({
  event,
  priority = false,
  onFavorite,
  isFavorite = false
}: EventListViewProps) {
  const { data: session, status } = useSession();
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  
  const formattedDate = useMemo(() => {
    try {
      const d = typeof event.startDateTime === 'string' ? new Date(event.startDateTime) : event.startDateTime;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }, [event.startDateTime]);

  const formattedTime = useMemo(() => {
    try {
      const d = typeof event.startDateTime === 'string' ? new Date(event.startDateTime) : event.startDateTime;
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  }, [event.startDateTime]);

  const shortDate = useMemo(() => {
    try {
      const d = typeof event.startDateTime === 'string' ? new Date(event.startDateTime) : event.startDateTime;
      return {
        day: d.getDate().toString(),
        month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
      };
    } catch {
      return { day: '?', month: '?' };
    }
  }, [event.startDateTime]);

  const { colorClass } = getCategoryColorClass(event.category);
  const categoryTheme = getCategoryTheme(event.category);

  const handleAddToCalendar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCalendarModal(true);
  }, []);

  const displayLocation = event.venue?.name || event.customLocation || 'Location TBA';
  const displayAddress = event.venue?.address || '';

  return (
    <>
      <article className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 p-4 relative group cursor-pointer">
        <div className="flex gap-4">
          {/* Date Badge */}
          <div className="flex-shrink-0">
            <div className={`w-16 h-16 rounded-lg ${categoryTheme.gradient} text-white flex flex-col items-center justify-center shadow-sm`}>
              <span className="text-xs font-medium opacity-90">{shortDate.month}</span>
              <span className="text-lg font-bold leading-none">{shortDate.day}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                    {event.category}
                  </span>
                  {event.price && (
                    <span className="text-sm font-semibold text-green-600">
                      {event.price}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {event.title}
                </h3>

                {/* Description */}
                {event.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {/* Event Details */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formattedDate}</span>
                    {formattedTime && (
                      <>
                        <Clock className="w-4 h-4 text-gray-400 ml-2" />
                        <span>{formattedTime}</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate max-w-[200px]" title={`${displayLocation}${displayAddress ? ` - ${displayAddress}` : ''}`}>
                      {displayLocation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-start gap-2 relative z-20">
                {/* Favorite Button */}
                {onFavorite ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onFavorite(event);
                    }}
                    className={`p-2 rounded-lg transition-all ${
                      isFavorite
                        ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-pink-50 hover:text-pink-500'
                    }`}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                ) : (
                  <FavoriteButton
                    eventId={event.id}
                    eventTitle={event.title}
                    className="text-gray-400 hover:text-red-500"
                  />
                )}

                {/* Add to Calendar */}
                {status === 'authenticated' && (
                  <button
                    onClick={handleAddToCalendar}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Add to Calendar"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}

                {/* External Link */}
                {event.sourceUrl && (
                  <Link
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View Event Details"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clickable overlay for navigation - same as EnhancedEventCard */}
        {event.sourceUrl && (
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-10"
            aria-label={`View details for ${event.title}`}
          >
            <span className="sr-only">View event details for {event.title}</span>
          </a>
        )}
      </article>

      {/* Calendar Modal */}
      {showCalendarModal && (
        <CalendarPreviewModal
          event={event}
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
        />
      )}
    </>
  );
});

export default EventListView;