import React, { memo } from 'react';
import Image from 'next/image';
import { MapPin, Calendar, Clock } from 'lucide-react';
import type { EventWithDetails } from '@/lib/types';

interface EventCardProps {
  event: EventWithDetails;
  priority?: boolean; // For LCP optimization
}

const EventCard = memo(function EventCard({ event, priority = false }: EventCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  return (
    <article className="card hover:shadow-md transition-shadow duration-200 focus-within:ring-2 focus-within:ring-blue-500">
      {/* Event Image */}
      {event.imageUrl && (
        <div className="relative w-full h-48 mb-4 rounded-t-lg overflow-hidden">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              // Hide broken images
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <span className="badge badge-info" role="text" aria-label={`Category: ${event.category}`}>
          {event.category}
        </span>
        <div className="text-right text-sm text-gray-500">
          <div className="flex items-center gap-1" title={`Event date: ${formatDate(event.startDateTime)}`}>
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <time dateTime={event.startDateTime}>
              {formatDate(event.startDateTime)}
            </time>
          </div>
          {!event.allDay && (
            <div className="flex items-center gap-1 mt-1" title={`Event time: ${formatTime(event.startDateTime)}`}>
              <Clock className="w-4 h-4" aria-hidden="true" />
              <time dateTime={event.startDateTime}>
                {formatTime(event.startDateTime)}
              </time>
            </div>
          )}
        </div>
      </div>
      
      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2" title={event.title}>
        {event.title}
      </h4>
      
      {event.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={event.description}>
          {event.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-gray-500 min-w-0">
          <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="truncate" title={event.venue?.name || event.customLocation || 'Location TBD'}>
            {event.venue?.name || event.customLocation || 'TBD'}
          </span>
        </div>
        
        {event.price && (
          <span className="text-green-600 font-medium flex-shrink-0 ml-2" title={`Price: ${event.price}`}>
            {String(event.price).toLowerCase().includes('free') ? 'Free' : String(event.price)}
          </span>
        )}
      </div>

      {/* Optional: Add click handler for navigation */}
      {event.sourceUrl && (
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10"
          aria-label={`View details for ${event.title}`}
        >
          <span className="sr-only">View event details</span>
        </a>
      )}
    </article>
  );
});

export default EventCard;