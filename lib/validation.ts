// API validation schemas using Zod (2025 TypeScript best practices)
import { z } from 'zod';

// Event filters validation schema
export const EventFiltersSchema = z.object({
  category: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  venueId: z.string().cuid().optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  priceMax: z.number().positive().max(10000).optional(),
  search: z.string().min(1).max(200).optional(),
  neighborhood: z.string().min(1).max(100).optional(),
});

// Pagination validation schema
export const PaginationSchema = z.object({
  page: z.number().int().positive().max(1000).default(1),
  pageSize: z.number().int().positive().max(100).default(12),
  limit: z.number().int().positive().max(100).optional(),
});

// Venue creation/update schema
export const VenueSchema = z.object({
  name: z.string().min(1).max(200),
  venueType: z.string().min(1).max(50).default('venue'),
  address: z.string().min(1).max(500).optional(),
  city: z.string().min(1).max(100).default('Madison'),
  state: z.string().length(2).default('WI'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  neighborhood: z.string().min(1).max(100).optional(),
  website: z.string().url().optional(),
  phoneNumber: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/).optional(),
  email: z.string().email().optional(),
  description: z.string().max(2000).optional(),
  priceRange: z.string().max(50).optional(),
  hostsEvents: z.boolean().default(true),
  eventCalendarUrl: z.string().url().optional(),
});

// Event creation/update schema  
export const EventSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  category: z.enum([
    'music', 'food', 'culture', 'sports', 'family', 'nightlife',
    'arts', 'community', 'business', 'education', 'health', 'other'
  ]).default('other'),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime().optional(),
  timezone: z.string().default('America/Chicago'),
  allDay: z.boolean().default(false),
  venueId: z.string().cuid().optional(),
  customLocation: z.string().min(1).max(300).optional(),
  price: z.string().max(50).optional(),
  ticketUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.string().max(500).default(''),
  sourceUrl: z.string().url().optional(),
  status: z.enum(['published', 'draft', 'archived']).default('published'),
});

// Event source schema
export const EventSourceSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  sourceType: z.string().min(1).max(50).default('venue'),
  venueId: z.string().cuid().optional(),
  scrapingConfig: z.string().transform((str) => {
    try { return JSON.parse(str); } catch { return {}; }
  }).default('{}'),
  extractionRules: z.string().transform((str) => {
    try { return JSON.parse(str); } catch { return {}; }
  }).default('{}'),
  isActive: z.boolean().default(true),
  status: z.enum(['active', 'paused', 'failed']).default('active'),
});

// Rate limiting schema
export const RateLimitSchema = z.object({
  windowMs: z.number().positive().default(15 * 60 * 1000), // 15 minutes
  maxRequests: z.number().positive().default(100),
  message: z.string().default('Too many requests'),
});

// Environment validation schema
export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1).refine((url) => {
    return url.startsWith('file:') || url.startsWith('postgresql:') || url.startsWith('mysql:');
  }, 'DATABASE_URL must be a valid database connection string'),
  REDIS_URL: z.string().optional(),
  LOCAL_EVENTS_API_URL: z.string().url().optional(),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
});

// Security validation helpers
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

export const validateObjectId = (id: string): boolean => {
  return z.string().cuid().safeParse(id).success;
};

export const validateUrl = (url: string): boolean => {
  return z.string().url().safeParse(url).success;
};

// Request validation middleware type
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
};

export const validateRequest = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
};

// Custom validation functions for complex business logic
export const validateEventDateRange = (startDate: string, endDate?: string): boolean => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  
  if (isNaN(start.getTime())) return false;
  if (end && (isNaN(end.getTime()) || end <= start)) return false;
  
  return true;
};

export const validateCoordinates = (lat?: number, lng?: number): boolean => {
  if ((lat !== undefined && lng === undefined) || (lat === undefined && lng !== undefined)) {
    return false; // Both or neither must be provided
  }
  
  if (lat !== undefined && lng !== undefined) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
  
  return true;
};