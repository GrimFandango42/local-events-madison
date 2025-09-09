// Type definitions for the Local Events platform
import type { Venue, EventSource, Event, ScrapingLog } from '@prisma/client';
import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// NextAuth type extensions for Google Calendar integration
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
  }
}

// Extended types with relations
export type VenueWithSources = Venue & {
  eventSources: EventSource[];
  events: Event[];
  _count: {
    events: number;
    eventSources: number;
  };
};

export type EventWithDetails = Event & {
  venue?: Venue;
  source?: EventSource;
};

export type EventSourceWithStats = EventSource & {
  venue?: Venue;
  _count: {
    events: number;
    scrapingLogs: number;
  };
  recentLogs: ScrapingLog[];
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasMore?: boolean;
    hasPrev: boolean;
  };
}

// Event filtering and search
export interface EventFilters {
  category?: string[];
  dateFrom?: string;
  dateTo?: string;
  venueId?: string;
  tags?: string[];
  priceMax?: number;
  search?: string;
  neighborhood?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in meters
  };
}

export interface SourceFilters {
  sourceType?: string[];
  status?: string[];
  venueId?: string;
  search?: string;
}

// Scraping configuration types
export interface ScrapingConfig {
  method: 'mcp_playwright' | 'crawlee' | 'crawl4ai';
  selectors?: {
    container: string;
    title: string;
    date: string;
    time?: string;
    description?: string;
    price?: string;
    image?: string;
    location?: string;
  };
  waitTime?: number;
  specialHandling?: 'spa' | 'calendar' | 'iframe' | 'ajax';
  userAgent?: string;
  timeout?: number;
}

export interface ExtractionRules {
  eventKeywords: string[];
  dateFormats: string[];
  pricePatterns: string[];
  categoryMappings: Record<string, string>;
}

// MCP Event Collection types
export interface CollectionResult {
  success: boolean;
  eventsFound: EventData[];
  error?: string;
  metadata: {
    source: EventSource;
    duration: number;
    contentHash: string;
    statusCode?: number;
  };
}

export interface EventData {
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime?: Date;
  location?: string;
  category: string;
  price?: string;
  imageUrl?: string;
  sourceUrl: string;
  tags: string[];
  venue?: string;
}

// User source submission types
export interface NewSourceSubmission {
  suggestedName: string;
  url: string;
  sourceType: string;
  venueName?: string;
  expectedEventTypes?: string[];
  submissionReason?: string;
  userEmail?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalSources: number;
  activeSources: number;
  failedSources: number;
  totalEvents: number;
  eventsLast7Days: number;
  avgSuccessRate: number;
  topPerformingSources: EventSourceWithStats[];
  recentEvents: EventWithDetails[];
}

// Venue management
export interface VenueStats {
  totalVenues: number;
  venuesByType: Record<string, number>;
  venuesWithEvents: number;
  topEventVenues: VenueWithSources[];
}

export default {};
