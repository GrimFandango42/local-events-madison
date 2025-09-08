import React, { memo } from 'react';
import Image from 'next/image';
import { MapPin, Calendar, Clock } from 'lucide-react';
import type { EventWithDetails } from '@/lib/types';

interface EventCardProps {
  event: EventWithDetails;
  priority?: boolean; // For LCP optimization
}

const EventCard = memo(function EventCard({ event, priority = false }: EventCardProps) {
  const formatDate = (dateInput: Date | string) => {
    try {
      const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateInput: Date | string) => {
    try {
      const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  return (
    <article className="card-hover focus-within:ring-2 focus-within:ring-blue-500 group fade-in">
      {/* Event Image */}
      {event.imageUrl && (
        <div className="relative w-full h-48 sm:h-52 mb-4 rounded-xl overflow-hidden bg-gray-100">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              // Hide broken images gracefully
              const target = e.target as HTMLImageElement;
              const parent = target.parentElement;
              if (parent) {
                parent.classList.add('hidden');
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <span className="badge-category badge-info capitalize" role="text" aria-label={`Category: ${event.category}`}>
          {event.category}
        </span>
        <div className="text-right text-sm text-gray-500 space-y-1">
          <div className="flex items-center gap-1.5" title={`Event date: ${formatDate(event.startDateTime)}`}>
            <Calendar className="w-4 h-4 text-blue-500" aria-hidden="true" />
            <time 
              dateTime={(event.startDateTime instanceof Date) ? event.startDateTime.toISOString() : event.startDateTime}
              className="font-medium"
            >
              {formatDate(event.startDateTime)}
            </time>
          </div>
          {!event.allDay && (
            <div className="flex items-center gap-1.5" title={`Event time: ${formatTime(event.startDateTime)}`}>
              <Clock className="w-4 h-4 text-purple-500" aria-hidden="true" />
              <time 
                dateTime={(event.startDateTime instanceof Date) ? event.startDateTime.toISOString() : event.startDateTime}
                className="font-medium"
              >
                {formatTime(event.startDateTime)}
              </time>
            </div>
          )}
        </div>
      </div>
      
      <h4 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg leading-tight group-hover:text-blue-600 transition-colors duration-200" title={event.title}>
        {event.title}
      </h4>
      
      {event.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed" title={event.description}>
          {event.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-gray-500 min-w-0">
          <MapPin className="w-4 h-4 flex-shrink-0 text-red-500" aria-hidden="true" />
          <span className="truncate font-medium" title={event.venue?.name || event.customLocation || 'Location TBD'}>
            {event.venue?.name || event.customLocation || 'TBD'}
          </span>
        </div>
        
        {event.price && (
          <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2 border border-green-200" title={`Price: ${event.price}`}>
            {String(event.price).toLowerCase().includes('free') ? '🎉 Free' : String(event.price)}
          </span>
        )}
      </div>

      {/* Enhanced click handler for navigation */}
      {event.sourceUrl && (
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10 mobile-touch-target"
          aria-label={`View details for ${event.title}`}
        >
          <span className="sr-only">View event details for {event.title}</span>
        </a>
      )}
    </article>
  );
});

export default EventCard;
