// VenueScrapers.ts - Specialized scrapers for Madison venues and restaurants
import { MCPEventCollector } from '../services/MCPEventCollector';

interface VenueScrapingConfig {
  venue: string;
  url: string;
  selectors: {
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
  dateFormat?: string;
}

export class MadisonVenueScrapers {
  private collector: MCPEventCollector;

  constructor(collector: MCPEventCollector) {
    this.collector = collector;
  }

  // Madison venue-specific scraping configurations
  private readonly venueConfigs: VenueScrapingConfig[] = [
    
    // Music Venues
    {
      venue: 'The Sylvee',
      url: 'https://thesylvee.com/events/',
      selectors: {
        container: '.event-card, .upcoming-event',
        title: '.event-title, .event-name, h3, h4',
        date: '.event-date, .date',
        time: '.event-time, .time',
        description: '.event-description, .description',
        price: '.ticket-price, .price',
        image: 'img'
      },
      waitTime: 5000,
      specialHandling: 'spa'
    },

    {
      venue: 'Overture Center',
      url: 'https://overture.org/events',
      selectors: {
        container: '.event-item, .performance-item',
        title: '.event-title, h3',
        date: '.performance-date, .event-date',
        description: '.event-summary, .description',
        price: '.price-range',
        image: '.event-image img, .performance-image img'
      },
      waitTime: 4000
    },

    {
      venue: 'Majestic Theatre',
      url: 'https://majesticmadison.com/events',
      selectors: {
        container: '.event-listing, .show-listing',
        title: '.event-title, .show-title',
        date: '.event-date, .show-date',
        description: '.event-description',
        price: '.ticket-info, .pricing'
      }
    },

    {
      venue: 'High Noon Saloon',
      url: 'https://high-noon.com/calendar',
      selectors: {
        container: '.event, .show',
        title: '.event-title, .band-name',
        date: '.date',
        time: '.time, .doors',
        description: '.event-info',
        price: '.cover, .admission'
      }
    },

    // Breweries & Restaurants
    {
      venue: 'Great Dane Pub',
      url: 'https://greatdanepub.com/events/',
      selectors: {
        container: '.event-item, .upcoming-event',
        title: '.event-title, h3',
        date: '.event-date',
        time: '.event-time',
        description: '.event-description',
        location: '.location' // Multiple locations
      }
    },

    {
      venue: 'Karben4 Brewing',
      url: 'https://karben4.com/events',
      selectors: {
        container: '.event, .calendar-event',
        title: '.event-name, .title',
        date: '.event-date, .date',
        description: '.event-details'
      }
    },

    {
      venue: 'Ale Asylum',
      url: 'https://aleasylum.com/events',
      selectors: {
        container: '.event-card',
        title: '.event-title',
        date: '.event-date',
        description: '.event-description'
      }
    },

    {
      venue: 'Working Draft Beer Company',
      url: 'https://workingdraftbeer.com/events',
      selectors: {
        container: '.event-listing',
        title: '.event-title',
        date: '.date',
        description: '.description'
      }
    },

    // Cultural Venues
    {
      venue: 'Madison Museum of Contemporary Art',
      url: 'https://mmoca.org/events',
      selectors: {
        container: '.event-item',
        title: '.event-title',
        date: '.event-date',
        description: '.event-excerpt',
        image: '.event-image img'
      }
    },

    {
      venue: 'Chazen Museum of Art',
      url: 'https://chazen.wisc.edu/events',
      selectors: {
        container: '.event-listing',
        title: '.event-title',
        date: '.event-date',
        description: '.event-description'
      }
    },

    // Restaurants with Events
    {
      venue: 'L\'Etoile Restaurant',
      url: 'https://letoile-restaurant.com/events',
      selectors: {
        container: '.event-item',
        title: '.event-title',
        date: '.event-date',
        description: '.event-description',
        price: '.event-price'
      }
    },

    {
      venue: 'Graze',
      url: 'https://grazeMadison.com/events',
      selectors: {
        container: '.event',
        title: '.event-title',
        date: '.date',
        description: '.description'
      }
    },

    // Community Venues
    {
      venue: 'Memorial Union',
      url: 'https://union.wisc.edu/events-and-activities/event-calendar/',
      selectors: {
        container: '.event-item, .calendar-event',
        title: '.event-title, .title',
        date: '.event-date, .date',
        time: '.event-time, .time',
        description: '.event-description',
        location: '.event-location, .location'
      },
      waitTime: 6000,
      specialHandling: 'calendar'
    },

    {
      venue: 'Monona Terrace',
      url: 'https://mononaterrace.com/events',
      selectors: {
        container: '.event-listing',
        title: '.event-name',
        date: '.event-date',
        description: '.event-summary'
      }
    }
  ];

  async scrapeAllVenues(): Promise<void> {
    console.log(`🏢 Starting scrape of ${this.venueConfigs.length} Madison venues...`);
    
    for (const config of this.venueConfigs) {
      try {
        console.log(`🎯 Scraping ${config.venue}...`);
        await this.scrapeVenue(config);
        
        // Rate limiting between venues
        await this.delay(3000);
        
      } catch (error) {
        console.error(`❌ Failed to scrape ${config.venue}:`, error);
      }
    }
  }

  async scrapeVenue(config: VenueScrapingConfig): Promise<any[]> {
    const { chromium } = require('playwright');
    
    const browser = await chromium.launch({ 
      headless: true,
      timeout: 30000
    });

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1200, height: 800 }
      });

      const page = await context.newPage();
      
      // Navigate to venue page
      console.log(`  🌐 Loading ${config.url}`);
      const response = await page.goto(config.url, { 
        waitUntil: 'networkidle',
        timeout: 20000 
      });

      if (!response || !response.ok()) {
        throw new Error(`HTTP ${response?.status()}: ${response?.statusText()}`);
      }

      // Handle special cases
      await this.handleSpecialPageType(page, config);

      // Wait for content
      const waitTime = config.waitTime || 3000;
      await page.waitForTimeout(waitTime);

      // Extract events
      const events = await this.extractVenueEvents(page, config);
      
      console.log(`  ✅ Found ${events.length} events at ${config.venue}`);
      return events;

    } finally {
      await browser.close();
    }
  }

  private async handleSpecialPageType(page: any, config: VenueScrapingConfig): Promise<void> {
    switch (config.specialHandling) {
      case 'spa':
        // Single Page Application - wait for JavaScript to load content
        await page.waitForSelector(config.selectors.container, { timeout: 10000 }).catch(() => {});
        break;
        
      case 'calendar':
        // Calendar widget - might need to click "upcoming" or navigate
        await page.waitForSelector('.calendar, .event-calendar', { timeout: 5000 }).catch(() => {});
        // Try to click "upcoming events" or "list view" if present
        await page.click('.upcoming-events, .list-view, [data-view="list"]').catch(() => {});
        break;
        
      case 'iframe':
        // Events in iframe - switch context
        const iframe = await page.frameLocator('iframe').first();
        // Handle iframe content extraction
        break;
        
      case 'ajax':
        // AJAX-loaded content - trigger load more
        await page.click('.load-more, .show-more').catch(() => {});
        await page.waitForTimeout(2000);
        break;
    }
  }

  private async extractVenueEvents(page: any, config: VenueScrapingConfig): Promise<any[]> {
    const events: any[] = [];

    try {
      // Find all event containers
      const eventElements = await page.$$(config.selectors.container);
      
      console.log(`  📋 Found ${eventElements.length} potential event containers`);

      for (const element of eventElements) {
        try {
          const event = await this.extractSingleVenueEvent(element, config);
          if (event && this.isValidVenueEvent(event)) {
            events.push({
              ...event,
              venue: config.venue,
              sourceUrl: config.url,
              scrapedAt: new Date()
            });
          }
        } catch (error) {
          console.warn('  ⚠️ Failed to extract individual event:', error);
        }
      }

    } catch (error) {
      console.error(`  ❌ Event extraction failed for ${config.venue}:`, error);
    }

    return events;
  }

  private async extractSingleVenueEvent(element: any, config: VenueScrapingConfig): Promise<any | null> {
    // Extract title
    const title = await this.getTextFromElement(element, config.selectors.title);
    if (!title || title.length < 3) return null;

    // Extract date and time
    const dateText = await this.getTextFromElement(element, config.selectors.date);
    const timeText = config.selectors.time ? 
      await this.getTextFromElement(element, config.selectors.time) : null;

    const dateTime = this.parseVenueDateTime(dateText, timeText, config.dateFormat);
    if (!dateTime || dateTime < new Date()) return null;

    // Extract other details
    const description = config.selectors.description ? 
      await this.getTextFromElement(element, config.selectors.description) : null;
    
    const price = config.selectors.price ? 
      await this.getTextFromElement(element, config.selectors.price) : null;
    
    const imageUrl = config.selectors.image ? 
      await this.getAttributeFromElement(element, config.selectors.image, 'src') : null;

    const location = config.selectors.location ? 
      await this.getTextFromElement(element, config.selectors.location) : config.venue;

    return {
      title: title.trim(),
      description: description?.trim(),
      dateTime,
      location: location?.trim() || config.venue,
      price: this.cleanPrice(price),
      imageUrl: this.resolveImageUrl(imageUrl, config.url),
      category: this.categorizeVenueEvent(title, description, config.venue),
      tags: this.extractEventTags(title, description)
    };
  }

  private async getTextFromElement(element: any, selector: string): Promise<string | null> {
    try {
      const el = await element.$(selector);
      if (!el) return null;
      return (await el.textContent())?.trim() || null;
    } catch {
      return null;
    }
  }

  private async getAttributeFromElement(element: any, selector: string, attribute: string): Promise<string | null> {
    try {
      const el = await element.$(selector);
      if (!el) return null;
      return await el.getAttribute(attribute);
    } catch {
      return null;
    }
  }

  private parseVenueDateTime(dateText: string | null, timeText: string | null, format?: string): Date | null {
    if (!dateText) return null;

    const combinedText = `${dateText} ${timeText || ''}`.trim();
    
    // Try multiple parsing strategies
    const strategies = [
      // Direct Date parsing
      () => new Date(combinedText),
      () => new Date(dateText),
      
      // Common venue date formats
      () => this.parseCommonDateFormats(combinedText),
      
      // Relative dates (today, tomorrow, this weekend)
      () => this.parseRelativeDates(combinedText)
    ];

    for (const strategy of strategies) {
      try {
        const date = strategy();
        if (date && !isNaN(date.getTime()) && date > new Date()) {
          return date;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private parseCommonDateFormats(text: string): Date | null {
    // Common patterns venues use
    const patterns = [
      // "Friday, January 10, 2025 at 7:00 PM"
      /(\w+),?\s+(\w+)\s+(\d{1,2}),?\s+(\d{4})\s*(?:at)?\s*(\d{1,2}):?(\d{0,2})\s*([ap]m)?/i,
      
      // "Jan 10 @ 7pm"
      /(\w{3})\s+(\d{1,2})\s*@\s*(\d{1,2}):?(\d{0,2})\s*([ap]m)?/i,
      
      // "1/10/2025 7:00 PM"
      /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*([ap]m)?/i,
      
      // "January 10 - 7:00pm"
      /(\w+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2}):?(\d{0,2})\s*([ap]m)?/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          // Custom parsing based on pattern
          const parsed = this.parseMatchedGroups(match);
          if (parsed && !isNaN(parsed.getTime())) {
            return parsed;
          }
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  private parseMatchedGroups(match: RegExpMatchArray): Date | null {
    // This would implement specific parsing logic for each pattern
    // For now, return null to use fallback parsing
    return null;
  }

  private parseRelativeDates(text: string): Date | null {
    const now = new Date();
    const lower = text.toLowerCase();
    
    if (lower.includes('today')) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0); // Default 7pm
    } else if (lower.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 19, 0);
    } else if (lower.includes('this weekend')) {
      // Next Saturday
      const saturday = new Date(now);
      saturday.setDate(now.getDate() + (6 - now.getDay()));
      return new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate(), 19, 0);
    }

    return null;
  }

  private cleanPrice(price: string | null): string | null {
    if (!price) return null;
    
    // Clean up price text
    const cleaned = price
      .replace(/[^\d$.,\-\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleaned.toLowerCase().includes('free') || cleaned === '$0') {
      return 'Free';
    }
    
    return cleaned || null;
  }

  private resolveImageUrl(imageUrl: string | null, baseUrl: string): string | null {
    if (!imageUrl) return null;
    
    try {
      // If already absolute URL, return as-is
      if (imageUrl.startsWith('http')) return imageUrl;
      
      // Resolve relative URL
      const base = new URL(baseUrl);
      return new URL(imageUrl, base.origin).toString();
    } catch {
      return null;
    }
  }

  private categorizeVenueEvent(title: string, description: string = '', venue: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    // Venue-specific categorization
    const venueCategories: Record<string, string> = {
      'sylvee': 'music',
      'overture': 'theater',
      'majestic': 'music',
      'high noon': 'music',
      'great dane': 'food',
      'karben4': 'food',
      'ale asylum': 'food',
      'mmoca': 'art',
      'chazen': 'art',
      'letoile': 'food',
      'graze': 'food',
      'memorial union': 'community',
      'monona terrace': 'community'
    };

    const venueKey = venue.toLowerCase();
    for (const [key, category] of Object.entries(venueCategories)) {
      if (venueKey.includes(key)) return category;
    }

    // Content-based categorization
    if (/music|concert|band|live|acoustic|jazz|rock|dj/i.test(text)) return 'music';
    if (/food|dinner|brunch|tasting|wine|beer|menu|chef/i.test(text)) return 'food';
    if (/art|gallery|exhibit|culture|theater|performance/i.test(text)) return 'culture';
    if (/festival|fest|fair|celebration/i.test(text)) return 'festival';
    if (/market|vendor|craft/i.test(text)) return 'market';
    if (/night|late|club|bar/i.test(text)) return 'nightlife';

    return 'other';
  }

  private extractEventTags(title: string, description: string = ''): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [];

    const tagPatterns = {
      'live-music': /live music|live band|acoustic performance/,
      'free-event': /free|no cover|complimentary|no charge/,
      'all-ages': /all ages|family|kids welcome/,
      '21+': /21\+|over 21|adults only|id required/,
      'outdoor': /outdoor|patio|terrace|rooftop|garden/,
      'food-included': /dinner included|buffet|food provided/,
      'reservation-required': /reservation|rsvp|advance ticket/,
      'limited-seating': /limited|first come|small venue/,
      'special-guest': /special guest|featuring|with/,
      'recurring': /weekly|monthly|every|regular/
    };

    for (const [tag, pattern] of Object.entries(tagPatterns)) {
      if (pattern.test(text)) tags.push(tag);
    }

    return tags;
  }

  private isValidVenueEvent(event: any): boolean {
    return !!(
      event.title &&
      event.title.length > 3 &&
      event.dateTime &&
      event.dateTime > new Date() &&
      !this.isGenericContent(event.title)
    );
  }

  private isGenericContent(title: string): boolean {
    // Filter out non-event content
    const genericPatterns = [
      /^(menu|hours|contact|about|location)$/i,
      /^(home|welcome|news)$/i,
      /^(gallery|photos|videos)$/i
    ];

    return genericPatterns.some(pattern => pattern.test(title.trim()));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Add specific venue methods for complex cases
  async scrapeMemorialUnion(): Promise<any[]> {
    // Special handling for UW-Madison complex calendar system
    const config = this.venueConfigs.find(c => c.venue === 'Memorial Union');
    if (!config) return [];
    
    // Would implement calendar-specific scraping logic
    return this.scrapeVenue(config);
  }

  async scrapeSylveeDetailed(): Promise<any[]> {
    // Enhanced scraping for The Sylvee with ticket information
    const config = this.venueConfigs.find(c => c.venue === 'The Sylvee');
    if (!config) return [];
    
    // Enhanced version would extract ticket links, pricing tiers, etc.
    return this.scrapeVenue(config);
  }

  // Utility method to get all configured venues
  getConfiguredVenues(): string[] {
    return this.venueConfigs.map(config => config.venue);
  }

  // Method to test a single venue configuration
  async testVenueConfig(venueName: string): Promise<boolean> {
    const config = this.venueConfigs.find(c => c.venue === venueName);
    if (!config) return false;

    try {
      const events = await this.scrapeVenue(config);
      console.log(`✅ Test successful: ${events.length} events found for ${venueName}`);
      return true;
    } catch (error) {
      console.error(`❌ Test failed for ${venueName}:`, error);
      return false;
    }
  }
}