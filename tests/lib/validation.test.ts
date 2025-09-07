// Modern validation testing with Vitest (2025 best practices)
import { describe, it, expect } from 'vitest';
import {
  EventFiltersSchema,
  PaginationSchema,
  VenueSchema,
  EventSchema,
  validateRequest,
  sanitizeHtml,
  validateObjectId,
  validateUrl,
  validateEventDateRange,
  validateCoordinates,
} from '@/lib/validation';

describe('Validation Schemas', () => {
  describe('EventFiltersSchema', () => {
    it('should validate valid event filters', () => {
      const validFilters = {
        category: ['music', 'food'],
        dateFrom: '2025-09-10T00:00:00.000Z',
        dateTo: '2025-09-17T23:59:59.999Z',
        search: 'concert',
        neighborhood: 'Downtown',
      };

      const result = validateRequest(EventFiltersSchema, validFilters);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validFilters);
    });

    it('should reject invalid date formats', () => {
      const invalidFilters = {
        dateFrom: 'not-a-date',
        dateTo: '2025-09-17',
      };

      const result = validateRequest(EventFiltersSchema, invalidFilters);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle optional fields correctly', () => {
      const minimalFilters = {};
      
      const result = validateRequest(EventFiltersSchema, minimalFilters);
      expect(result.success).toBe(true);
    });
  });

  describe('PaginationSchema', () => {
    it('should apply default values', () => {
      const result = validateRequest(PaginationSchema, {});
      
      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(1);
      expect(result.data?.pageSize).toBe(12);
    });

    it('should enforce maximum limits', () => {
      const result = validateRequest(PaginationSchema, {
        page: 1001, // Over limit
        pageSize: 101, // Over limit
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject negative values', () => {
      const result = validateRequest(PaginationSchema, {
        page: -1,
        pageSize: 0,
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('VenueSchema', () => {
    it('should validate complete venue data', () => {
      const venueData = {
        name: 'The Majestic Theatre',
        venueType: 'theater',
        address: '115 King St, Madison, WI 53703',
        city: 'Madison',
        state: 'WI',
        zipCode: '53703',
        latitude: 43.0731,
        longitude: -89.4012,
        neighborhood: 'Downtown',
        website: 'https://majesticmadison.com',
        phoneNumber: '(608) 255-0901',
        email: 'info@majesticmadison.com',
      };

      const result = validateRequest(VenueSchema, venueData);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalVenue = {
        name: 'Test Venue',
      };

      const result = validateRequest(VenueSchema, minimalVenue);
      expect(result.success).toBe(true);
      expect(result.data?.venueType).toBe('venue');
      expect(result.data?.city).toBe('Madison');
      expect(result.data?.state).toBe('WI');
    });

    it('should validate phone number format', () => {
      const invalidPhone = {
        name: 'Test Venue',
        phoneNumber: '608-555-1234', // Wrong format
      };

      const result = validateRequest(VenueSchema, invalidPhone);
      expect(result.success).toBe(false);
    });

    it('should validate zip code format', () => {
      const validZips = ['53703', '53703-1234'];
      const invalidZips = ['5370', 'ABCDE', '537032'];

      validZips.forEach(zip => {
        const result = validateRequest(VenueSchema, {
          name: 'Test Venue',
          zipCode: zip,
        });
        expect(result.success).toBe(true);
      });

      invalidZips.forEach(zip => {
        const result = validateRequest(VenueSchema, {
          name: 'Test Venue',
          zipCode: zip,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('EventSchema', () => {
    it('should validate complete event data', () => {
      const eventData = {
        title: 'Madison Symphony Orchestra Concert',
        description: 'A beautiful evening of classical music',
        category: 'music',
        startDateTime: '2025-09-15T19:30:00.000Z',
        endDateTime: '2025-09-15T22:00:00.000Z',
        price: '$35-65',
        ticketUrl: 'https://example.com/tickets',
      };

      const result = validateRequest(EventSchema, eventData);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalEvent = {
        title: 'Test Event',
        startDateTime: '2025-09-15T19:30:00.000Z',
      };

      const result = validateRequest(EventSchema, minimalEvent);
      expect(result.success).toBe(true);
      expect(result.data?.category).toBe('other');
      expect(result.data?.timezone).toBe('America/Chicago');
      expect(result.data?.status).toBe('published');
    });

    it('should validate event categories', () => {
      const validCategories = ['music', 'food', 'culture', 'sports'];
      const invalidCategory = 'invalid-category';

      validCategories.forEach(category => {
        const result = validateRequest(EventSchema, {
          title: 'Test Event',
          startDateTime: '2025-09-15T19:30:00.000Z',
          category,
        });
        expect(result.success).toBe(true);
      });

      const result = validateRequest(EventSchema, {
        title: 'Test Event',
        startDateTime: '2025-09-15T19:30:00.000Z',
        category: invalidCategory,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Validation Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeHtml(input);
      expect(result).toBe('Hello World');
    });

    it('should remove all HTML tags', () => {
      const input = '<div><p>Hello <strong>World</strong></p></div>';
      const result = sanitizeHtml(input);
      expect(result).toBe('Hello World');
    });

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml('   ')).toBe('');
    });
  });

  describe('validateObjectId', () => {
    it('should validate CUID format', () => {
      const validIds = [
        'cmf9qsp1i0000u6vp5s4blq3x',
        'cmf9qthpk0000149moapp3732',
      ];

      validIds.forEach(id => {
        expect(validateObjectId(id)).toBe(true);
      });
    });

    it('should reject invalid formats', () => {
      const invalidIds = [
        'short',
        '123456789012345678901234567890',
        'invalid-chars-!@#',
        '',
      ];

      invalidIds.forEach(id => {
        expect(validateObjectId(id)).toBe(false);
      });
    });
  });

  describe('validateUrl', () => {
    it('should validate proper URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://majesticmadison.com/events',
      ];

      validUrls.forEach(url => {
        expect(validateUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com', // Not http/https
        'javascript:alert(1)',
        '',
      ];

      invalidUrls.forEach(url => {
        expect(validateUrl(url)).toBe(false);
      });
    });
  });

  describe('validateEventDateRange', () => {
    it('should validate proper date ranges', () => {
      const validRanges = [
        ['2025-09-15T19:00:00Z', '2025-09-15T22:00:00Z'],
        ['2025-09-15T19:00:00Z'], // End date optional
      ];

      validRanges.forEach(([start, end]) => {
        expect(validateEventDateRange(start, end)).toBe(true);
      });
    });

    it('should reject invalid date ranges', () => {
      const invalidRanges = [
        ['invalid-date'],
        ['2025-09-15T22:00:00Z', '2025-09-15T19:00:00Z'], // End before start
        ['2025-09-15T19:00:00Z', 'invalid-end-date'],
      ];

      invalidRanges.forEach(([start, end]) => {
        expect(validateEventDateRange(start, end)).toBe(false);
      });
    });
  });

  describe('validateCoordinates', () => {
    it('should validate proper coordinate pairs', () => {
      const validCoordinates = [
        [43.0731, -89.4012], // Madison coordinates
        [0, 0], // Valid edge case
        [90, 180], // Max values
        [-90, -180], // Min values
      ];

      validCoordinates.forEach(([lat, lng]) => {
        expect(validateCoordinates(lat, lng)).toBe(true);
      });
    });

    it('should accept undefined coordinates', () => {
      expect(validateCoordinates()).toBe(true);
    });

    it('should reject partial coordinates', () => {
      expect(validateCoordinates(43.0731)).toBe(false);
      expect(validateCoordinates(undefined, -89.4012)).toBe(false);
    });

    it('should reject out-of-range coordinates', () => {
      const invalidCoordinates = [
        [91, 0], // Latitude too high
        [-91, 0], // Latitude too low
        [0, 181], // Longitude too high
        [0, -181], // Longitude too low
      ];

      invalidCoordinates.forEach(([lat, lng]) => {
        expect(validateCoordinates(lat, lng)).toBe(false);
      });
    });
  });
});