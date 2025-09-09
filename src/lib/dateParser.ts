// Enhanced date parsing utility for event dates
import { DateTime } from 'luxon';

interface ParsedDate {
  date: Date;
  confidence: number;
  source: string;
  isAllDay?: boolean;
}

export class EventDateParser {
  private static readonly MADISON_TIMEZONE = 'America/Chicago';

  // Common date patterns with confidence scores
  private static readonly DATE_PATTERNS = [
    // ISO formats (highest confidence)
    { pattern: /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/, confidence: 0.95, source: 'ISO' },
    { pattern: /^(\d{4}-\d{2}-\d{2})/, confidence: 0.90, source: 'ISO Date' },
    
    // Standard US formats
    { pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})/, confidence: 0.85, source: 'US Format' },
    { pattern: /(\d{1,2})-(\d{1,2})-(\d{4})/, confidence: 0.85, source: 'US Format' },
    
    // Month name formats
    { pattern: /(\w+)\s+(\d{1,2}),?\s+(\d{4})/, confidence: 0.80, source: 'Month Name' },
    { pattern: /(\d{1,2})\s+(\w+)\s+(\d{4})/, confidence: 0.80, source: 'Day Month Year' },
    
    // Relative dates (medium confidence)
    { pattern: /\b(today|tonight)\b/i, confidence: 0.70, source: 'Relative' },
    { pattern: /\b(tomorrow)\b/i, confidence: 0.70, source: 'Relative' },
    { pattern: /\b(this\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i, confidence: 0.65, source: 'Relative' },
    { pattern: /\b(next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i, confidence: 0.65, source: 'Relative' },
    { pattern: /\b(this\s+(?:week|weekend))\b/i, confidence: 0.60, source: 'Relative' },
    
    // Day of week patterns
    { pattern: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, confidence: 0.55, source: 'Day of Week' },
  ];

  // Time patterns
  private static readonly TIME_PATTERNS = [
    { pattern: /(\d{1,2}):(\d{2})\s*(am|pm)/i, confidence: 0.90, source: '12-hour' },
    { pattern: /(\d{1,2}):(\d{2})/, confidence: 0.80, source: '24-hour' },
    { pattern: /(\d{1,2})\s*(am|pm)/i, confidence: 0.75, source: 'Hour only' },
    { pattern: /\b(\d{1,2})\s*o'?clock\b/i, confidence: 0.70, source: 'O\'clock' },
  ];

  static parseEventDate(dateText: string, referenceDate = new Date()): ParsedDate | null {
    if (!dateText || typeof dateText !== 'string') return null;
    
    const cleanText = dateText.trim().toLowerCase();
    if (!cleanText) return null;

    // Try multiple parsing strategies
    const strategies = [
      () => this.parseISOFormat(dateText),
      () => this.parseRelativeDate(cleanText, referenceDate),
      () => this.parseStandardFormats(dateText),
      () => this.parseNaturalLanguage(cleanText, referenceDate),
      () => this.parseTimeOnly(cleanText, referenceDate),
    ];

    for (const strategy of strategies) {
      try {
        const result = strategy();
        if (result && this.isValidDate(result.date)) {
          return result;
        }
      } catch (error) {
        // Continue to next strategy
        continue;
      }
    }

    return null;
  }

  private static parseISOFormat(dateText: string): ParsedDate | null {
    const isoPattern = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?)/;
    const match = dateText.match(isoPattern);
    
    if (match) {
      const date = new Date(match[1]);
      if (!isNaN(date.getTime())) {
        return {
          date: this.toMadisonTime(date),
          confidence: 0.95,
          source: 'ISO Format'
        };
      }
    }

    return null;
  }

  private static parseRelativeDate(cleanText: string, referenceDate: Date): ParsedDate | null {
    const now = DateTime.fromJSDate(referenceDate).setZone(this.MADISON_TIMEZONE);
    
    // Today/Tonight
    if (/\b(today|tonight)\b/.test(cleanText)) {
      const timeMatch = this.extractTime(cleanText);
      const date = timeMatch 
        ? now.set({ hour: timeMatch.hour, minute: timeMatch.minute }).toJSDate()
        : now.set({ hour: 19, minute: 0 }).toJSDate(); // Default to 7 PM
      
      return {
        date,
        confidence: 0.85,
        source: 'Today/Tonight',
        isAllDay: !timeMatch
      };
    }

    // Tomorrow
    if (/\btomorrow\b/.test(cleanText)) {
      const timeMatch = this.extractTime(cleanText);
      const tomorrow = now.plus({ days: 1 });
      const date = timeMatch
        ? tomorrow.set({ hour: timeMatch.hour, minute: timeMatch.minute }).toJSDate()
        : tomorrow.set({ hour: 19, minute: 0 }).toJSDate();
      
      return {
        date,
        confidence: 0.85,
        source: 'Tomorrow',
        isAllDay: !timeMatch
      };
    }

    // This/Next + Day of week
    const dayMatch = cleanText.match(/\b(this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dayMatch) {
      const [, thisNext, dayName] = dayMatch;
      const targetDay = this.getDayOfWeek(dayName);
      const currentDay = now.weekday;
      
      let daysToAdd = targetDay - currentDay;
      if (thisNext === 'next' || (thisNext === 'this' && daysToAdd <= 0)) {
        daysToAdd += 7;
      }
      
      const timeMatch = this.extractTime(cleanText);
      const targetDate = now.plus({ days: daysToAdd });
      const date = timeMatch
        ? targetDate.set({ hour: timeMatch.hour, minute: timeMatch.minute }).toJSDate()
        : targetDate.set({ hour: 19, minute: 0 }).toJSDate();
      
      return {
        date,
        confidence: 0.75,
        source: `${thisNext} ${dayName}`,
        isAllDay: !timeMatch
      };
    }

    return null;
  }

  private static parseStandardFormats(dateText: string): ParsedDate | null {
    // MM/DD/YYYY or M/D/YYYY
    const usDateMatch = dateText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (usDateMatch) {
      const [, month, day, year] = usDateMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      if (!isNaN(date.getTime())) {
        const timeMatch = this.extractTime(dateText);
        if (timeMatch) {
          date.setHours(timeMatch.hour, timeMatch.minute, 0, 0);
        }
        
        return {
          date: this.toMadisonTime(date),
          confidence: 0.80,
          source: 'US Date Format',
          isAllDay: !timeMatch
        };
      }
    }

    // Month name formats
    const monthNameMatch = dateText.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (monthNameMatch) {
      const [, monthName, day, year] = monthNameMatch;
      const monthNum = this.parseMonthName(monthName);
      
      if (monthNum !== -1) {
        const date = new Date(parseInt(year), monthNum, parseInt(day));
        
        if (!isNaN(date.getTime())) {
          const timeMatch = this.extractTime(dateText);
          if (timeMatch) {
            date.setHours(timeMatch.hour, timeMatch.minute, 0, 0);
          }
          
          return {
            date: this.toMadisonTime(date),
            confidence: 0.85,
            source: 'Month Name Format',
            isAllDay: !timeMatch
          };
        }
      }
    }

    return null;
  }

  private static parseNaturalLanguage(cleanText: string, referenceDate: Date): ParsedDate | null {
    const now = DateTime.fromJSDate(referenceDate).setZone(this.MADISON_TIMEZONE);
    
    // This weekend
    if (/\bthis\s+weekend\b/.test(cleanText)) {
      const saturday = now.set({ weekday: 6 }); // Saturday
      return {
        date: saturday.set({ hour: 19, minute: 0 }).toJSDate(),
        confidence: 0.60,
        source: 'This Weekend',
        isAllDay: true
      };
    }

    // Next week
    if (/\bnext\s+week\b/.test(cleanText)) {
      const nextWeek = now.plus({ weeks: 1 });
      return {
        date: nextWeek.set({ hour: 19, minute: 0 }).toJSDate(),
        confidence: 0.50,
        source: 'Next Week',
        isAllDay: true
      };
    }

    return null;
  }

  private static parseTimeOnly(cleanText: string, referenceDate: Date): ParsedDate | null {
    const timeMatch = this.extractTime(cleanText);
    if (timeMatch) {
      const date = new Date(referenceDate);
      date.setHours(timeMatch.hour, timeMatch.minute, 0, 0);
      
      // If the time has passed today, assume it's for tomorrow
      if (date <= referenceDate) {
        date.setDate(date.getDate() + 1);
      }
      
      return {
        date: this.toMadisonTime(date),
        confidence: 0.40,
        source: 'Time Only'
      };
    }
    
    return null;
  }

  private static extractTime(text: string): { hour: number; minute: number } | null {
    // 12-hour format with AM/PM
    const hour12Match = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (hour12Match) {
      let hour = parseInt(hour12Match[1]);
      const minute = parseInt(hour12Match[2]);
      const ampm = hour12Match[3].toLowerCase();
      
      if (ampm === 'pm' && hour !== 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      
      return { hour, minute };
    }

    // 24-hour format
    const hour24Match = text.match(/(\d{1,2}):(\d{2})/);
    if (hour24Match) {
      const hour = parseInt(hour24Match[1]);
      const minute = parseInt(hour24Match[2]);
      
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return { hour, minute };
      }
    }

    // Hour only with AM/PM
    const hourOnlyMatch = text.match(/(\d{1,2})\s*(am|pm)/i);
    if (hourOnlyMatch) {
      let hour = parseInt(hourOnlyMatch[1]);
      const ampm = hourOnlyMatch[2].toLowerCase();
      
      if (ampm === 'pm' && hour !== 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      
      return { hour, minute: 0 };
    }

    return null;
  }

  private static parseMonthName(monthName: string): number {
    const months: Record<string, number> = {
      january: 0, jan: 0,
      february: 1, feb: 1,
      march: 2, mar: 2,
      april: 3, apr: 3,
      may: 4,
      june: 5, jun: 5,
      july: 6, jul: 6,
      august: 7, aug: 7,
      september: 8, sep: 8, sept: 8,
      october: 9, oct: 9,
      november: 10, nov: 10,
      december: 11, dec: 11
    };
    
    return months[monthName.toLowerCase()] ?? -1;
  }

  private static getDayOfWeek(dayName: string): number {
    const days: Record<string, number> = {
      monday: 1, mon: 1,
      tuesday: 2, tue: 2, tues: 2,
      wednesday: 3, wed: 3,
      thursday: 4, thu: 4, thur: 4, thurs: 4,
      friday: 5, fri: 5,
      saturday: 6, sat: 6,
      sunday: 7, sun: 7
    };
    
    return days[dayName.toLowerCase()] ?? 1;
  }

  private static toMadisonTime(date: Date): Date {
    return DateTime.fromJSDate(date).setZone(this.MADISON_TIMEZONE).toJSDate();
  }

  private static isValidDate(date: Date): boolean {
    return (
      date instanceof Date &&
      !isNaN(date.getTime()) &&
      date > new Date('2000-01-01') &&
      date < new Date('2030-12-31')
    );
  }

  // Batch parsing for multiple date strings
  static parseMultipleDates(dateTexts: string[], referenceDate = new Date()): ParsedDate[] {
    return dateTexts
      .map(text => this.parseEventDate(text, referenceDate))
      .filter((result): result is ParsedDate => result !== null)
      .sort((a, b) => b.confidence - a.confidence);
  }

  // Get best date from multiple candidates
  static getBestDate(dateTexts: string[], referenceDate = new Date()): ParsedDate | null {
    const parsed = this.parseMultipleDates(dateTexts, referenceDate);
    return parsed.length > 0 ? parsed[0] : null;
  }
}
