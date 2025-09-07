// Unit tests for EventDateParser
import { EventDateParser } from '@/lib/dateParser';

describe('EventDateParser', () => {
  const referenceDate = new Date('2024-01-15T12:00:00-06:00'); // Monday, Jan 15, 2024

  describe('parseEventDate', () => {
    test('should parse ISO format dates', () => {
      const result = EventDateParser.parseEventDate('2024-02-20T19:30:00-06:00', referenceDate);
      expect(result).toBeTruthy();
      expect(result!.confidence).toBeGreaterThan(0.9);
      expect(result!.source).toBe('ISO Format');
      expect(result!.date.getTime()).toBe(new Date('2024-02-20T19:30:00-06:00').getTime());
    });

    test('should parse US date format', () => {
      const result = EventDateParser.parseEventDate('02/20/2024', referenceDate);
      expect(result).toBeTruthy();
      expect(result!.confidence).toBeGreaterThan(0.7);
      expect(result!.date.getMonth()).toBe(1); // February (0-indexed)
      expect(result!.date.getDate()).toBe(20);
      expect(result!.date.getFullYear()).toBe(2024);
    });

    test('should parse month name format', () => {
      const result = EventDateParser.parseEventDate('February 20, 2024', referenceDate);
      expect(result).toBeTruthy();
      expect(result!.confidence).toBeGreaterThan(0.8);
      expect(result!.date.getMonth()).toBe(1);
      expect(result!.date.getDate()).toBe(20);
    });

    test('should parse "today" relative dates', () => {
      const result = EventDateParser.parseEventDate('today at 7pm', referenceDate);
      expect(result).toBeTruthy();
      expect(result!.source).toBe('Today/Tonight');
      expect(result!.date.getDate()).toBe(referenceDate.getDate());
      expect(result!.date.getHours()).toBe(19);
    });

    test('should parse "tomorrow" relative dates', () => {
      const result = EventDateParser.parseEventDate('tomorrow at 2pm', referenceDate);
      expect(result).toBeTruthy();
      expect(result!.source).toBe('Tomorrow');
      expect(result!.date.getDate()).toBe(referenceDate.getDate() + 1);
      expect(result!.date.getHours()).toBe(14);
    });

    test('should parse "this friday" relative dates', () => {
      const result = EventDateParser.parseEventDate('this friday', referenceDate);
      expect(result).toBeTruthy();
      expect(result!.source).toContain('friday');
      // Friday should be 4 days from Monday reference date
      expect(result!.date.getDay()).toBe(5); // Friday
    });

    test('should parse times with AM/PM', () => {
      const result = EventDateParser.parseEventDate('02/20/2024 at 7:30 PM', referenceDate);
      expect(result).toBeTruthy();
      expect(result!.date.getHours()).toBe(19);
      expect(result!.date.getMinutes()).toBe(30);
      expect(result!.isAllDay).toBeFalsy();
    });

    test('should handle "tonight" appropriately', () => {
      const result = EventDateParser.parseEventDate('tonight', referenceDate);
      expect(result).toBeTruthy();
      expect(result!.date.getDate()).toBe(referenceDate.getDate());
      expect(result!.date.getHours()).toBe(19); // Default to 7 PM
    });

    test('should return null for invalid dates', () => {
      const result = EventDateParser.parseEventDate('invalid date string', referenceDate);
      expect(result).toBeNull();
    });

    test('should return null for empty strings', () => {
      expect(EventDateParser.parseEventDate('', referenceDate)).toBeNull();
      expect(EventDateParser.parseEventDate(null as any, referenceDate)).toBeNull();
      expect(EventDateParser.parseEventDate(undefined as any, referenceDate)).toBeNull();
    });
  });

  describe('parseMultipleDates', () => {
    test('should parse and sort multiple dates by confidence', () => {
      const dateTexts = [
        'next friday',
        '2024-02-20T19:30:00-06:00',
        'invalid date',
        'February 20, 2024'
      ];

      const results = EventDateParser.parseMultipleDates(dateTexts, referenceDate);
      expect(results).toHaveLength(3); // Invalid date filtered out
      
      // Should be sorted by confidence (ISO format highest)
      expect(results[0].source).toBe('ISO Format');
      expect(results[0].confidence).toBeGreaterThan(results[1].confidence);
    });
  });

  describe('getBestDate', () => {
    test('should return the highest confidence date', () => {
      const dateTexts = [
        'tomorrow',
        '2024-02-20T19:30:00-06:00',
        'Feb 20 2024'
      ];

      const result = EventDateParser.getBestDate(dateTexts, referenceDate);
      expect(result).toBeTruthy();
      expect(result!.source).toBe('ISO Format');
    });

    test('should return null if no valid dates found', () => {
      const result = EventDateParser.getBestDate(['invalid', 'also invalid'], referenceDate);
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    test('should handle dates in the past gracefully', () => {
      // This would typically be filtered out by event validation
      const result = EventDateParser.parseEventDate('01/01/2020', referenceDate);
      expect(result).toBeTruthy(); // Parser should still work
      expect(result!.date.getFullYear()).toBe(2020);
    });

    test('should handle ambiguous date formats', () => {
      // 01/02/2024 could be Jan 2 or Feb 1
      const result = EventDateParser.parseEventDate('01/02/2024', referenceDate);
      expect(result).toBeTruthy();
      // Should assume MM/DD/YYYY (US format)
      expect(result!.date.getMonth()).toBe(0); // January
      expect(result!.date.getDate()).toBe(2);
    });

    test('should handle time without dates', () => {
      const result = EventDateParser.parseEventDate('7:30 PM', referenceDate);
      expect(result).toBeTruthy();
      expect(result!.date.getHours()).toBe(19);
      expect(result!.date.getMinutes()).toBe(30);
      // Should use reference date
      expect(result!.date.getDate()).toBeGreaterThanOrEqual(referenceDate.getDate());
    });
  });
});