// MCPEventCollector.ts - Core event collection service using MCP Playwright
import { EventEmitter } from 'events';
import { prisma } from '@/lib/db';
import { EventDateParser } from '../../lib/dateParser';
import { normalizeUrl } from '../../lib/url';

interface ScrapingResult {
  success: boolean;
  eventsFound: Event[];
  error?: string;
  metadata: {
    source: EventSource;
    duration: number;
    contentHash: string;
    statusCode?: number;
  };
}

interface EventSource {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  scrapingConfig: any;
  extractionRules: any;
  venue?: Venue;
}

interface Venue {
  id: string;
  name: string;
  location: string;
}

interface Event {
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
}

export class MCPEventCollector extends EventEmitter {
  private isRunning: boolean = false;
  private activeCollections: Set<string> = new Set();

  constructor() {
    super();
  }

  async initialize() {
    console.log('🔧 Initializing MCP Event Collector...');
    
    // Test MCP Playwright connection
    try {
      await this.testMCPConnection();
      console.log('✅ MCP Playwright connection successful');
    } catch (error) {
      console.error('❌ MCP Playwright connection failed:', error);
      throw error;
    }

    this.emit('initialized');
  }

  private async testMCPConnection() {
    // This would test the actual MCP connection
    // For now, we'll simulate with the existing Playwright setup
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ headless: true });
    await browser.close();
  }

  async startScheduledCollection() {
    if (this.isRunning) {
      console.log('⚠️ Collection already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting scheduled event collection...');
    
    // Run collection loop
    this.collectionLoop();
  }

  private async collectionLoop() {
    while (this.isRunning) {
      try {
        const sourcesToScrape = await this.getSourcesDueForScraping();
        console.log(`📊 Found ${sourcesToScrape.length} sources due for scraping`);

        for (const source of sourcesToScrape) {
          if (!this.isRunning) break;
          
          try {
            await this.collectFromSource(source);
          } catch (error) {
            console.error(`❌ Failed to collect from ${source.name}:`, error);
            await this.logScrapingError(source.id, error);
          }
          
          // Rate limiting - wait between sources
          await this.delay(2000);
        }

        // Wait before next collection cycle
        await this.delay(30000); // 30 seconds

      } catch (error) {
        console.error('❌ Collection loop error:', error);
        await this.delay(60000); // Wait 1 minute on error
      }
    }
  }

  async collectFromSource(source: EventSource): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    if (this.activeCollections.has(source.id)) {
      throw new Error('Collection already in progress for this source');
    }

    this.activeCollections.add(source.id);
    
    try {
      console.log(`🕷️ Scraping: ${source.name} (${source.url})`);
      
      // Log scraping start
      const logId = await this.startScrapingLog(source);
      
      // Choose collection method based on source type and config
      const result = await this.scrapeWithMethod(source);
      
      // Process and store events
      if (result.success && result.eventsFound.length > 0) {
        await this.processAndStoreEvents(result.eventsFound, source);
      }

      // Update source statistics
      await this.updateSourceStats(source.id, result.success);
      
      // Complete scraping log
      await this.completeScrapingLog(logId, result);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Completed ${source.name}: ${result.eventsFound.length} events (${duration}ms)`);
      
      this.emit('sourceCollected', { source, result });
      
      return {
        ...result,
        metadata: {
          source,
          duration,
          contentHash: result.metadata.contentHash
        }
      };

    } finally {
      this.activeCollections.delete(source.id);
    }
  }

  private async scrapeWithMethod(source: EventSource): Promise<ScrapingResult> {
    const method = source.scrapingConfig?.method || 'playwright';
    
    switch (method) {
      case 'playwright':
        return await this.scrapeWithPlaywright(source);
      case 'crawlee':
        return await this.scrapeWithCrawlee(source);
      case 'crawl4ai':
        return await this.scrapeWithCrawl4AI(source);
      default:
        return await this.scrapeWithPlaywright(source);
    }
  }

  private async scrapeWithPlaywright(source: EventSource): Promise<ScrapingResult> {
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
      
      // Navigate to source URL
      const response = await page.goto(source.url, { 
        waitUntil: 'networkidle',
        timeout: 20000 
      });
      
      if (!response || !response.ok()) {
        throw new Error(`HTTP ${response?.status()}: ${response?.statusText()}`);
      }

      // Wait for content to load
      const waitTime = source.scrapingConfig?.waitTime || 3000;
      await page.waitForTimeout(waitTime);

      // Extract events using configured selectors
      const events = await this.extractEventsFromPage(page, source);
      
      // Get content hash for change detection
      const content = await page.content();
      const contentHash = await this.generateContentHash(content);
      
      return {
        success: true,
        eventsFound: events,
        metadata: {
          source,
          duration: 0, // Will be set by caller
          contentHash,
          statusCode: response.status()
        }
      };

    } finally {
      await browser.close();
    }
  }

  private async extractEventsFromPage(page: any, source: EventSource): Promise<Event[]> {
    const extractionRules = source.extractionRules || {};
    const events: Event[] = [];

    try {
      // Use configured selectors or intelligent extraction
      if (extractionRules.selectors) {
        return await this.extractWithSelectors(page, source, extractionRules.selectors);
      } else {
        return await this.extractWithIntelligentDetection(page, source);
      }
    } catch (error) {
      console.error(`Event extraction failed for ${source.name}:`, error);
      return [];
    }
  }

  private async extractWithSelectors(page: any, source: EventSource, selectors: any): Promise<Event[]> {
    const events: Event[] = [];
    
    // Get all event containers
    const eventElements = await page.$$(selectors.container || '.event, .event-item, article');
    
    for (const element of eventElements) {
      try {
        const event = await this.extractSingleEvent(element, source, selectors);
        if (event && this.isValidEvent(event)) {
          events.push(event);
        }
      } catch (error) {
        console.warn('Failed to extract individual event:', error);
      }
    }
    
    return events;
  }

  private async extractSingleEvent(element: any, source: EventSource, selectors: any): Promise<Event | null> {
    const title = await this.getTextFromSelector(element, selectors.title || 'h1, h2, h3, .title, .event-title');
    if (!title) return null;

    const description = await this.getTextFromSelector(element, selectors.description || '.description, .event-description, p');
    const dateText = await this.getTextFromSelector(element, selectors.date || '.date, .event-date, time');
    const location = await this.getTextFromSelector(element, selectors.location || '.location, .venue, .address');
    const price = await this.getTextFromSelector(element, selectors.price || '.price, .cost, .ticket-price');
    const imageUrl = await this.getAttributeFromSelector(element, selectors.image || 'img', 'src');

    // Parse date using enhanced parser
    const parsedDate = EventDateParser.parseEventDate(dateText || '');
    if (!parsedDate) return null;
    const startDateTime = parsedDate.date;

    // Determine category
    const category = this.categorizeEvent(title, description ?? '', source.sourceType);

    // Extract tags
    const tags = this.extractTags(title, description ?? '');

    return {
      title: title.trim(),
      description: description?.trim(),
      startDateTime,
      location: location?.trim(),
      category,
      price: price?.trim(),
      imageUrl: imageUrl || undefined,
      sourceUrl: normalizeUrl(source.url) || source.url,
      tags
    };
  }

  private async extractWithIntelligentDetection(page: any, source: EventSource): Promise<Event[]> {
    // Intelligent event detection using common patterns
    const events: Event[] = [];
    
    // Look for structured data (JSON-LD)
    const structuredData = await this.extractStructuredData(page);
    if (structuredData.length > 0) {
      events.push(...structuredData);
    }

    // Look for common event patterns
    const patternEvents = await this.extractByPatterns(page, source);
    events.push(...patternEvents);

    // Remove duplicates
    return this.deduplicateEvents(events);
  }

  private async extractStructuredData(page: any): Promise<Event[]> {
    const events: Event[] = [];
    
    try {
      const jsonLdScripts = await page.$$eval('script[type="application/ld+json"]', 
        (scripts: any[]) => scripts.map(script => {
          try {
            return JSON.parse(script.textContent || '');
          } catch {
            return null;
          }
        }).filter(Boolean)
      );

      for (const data of jsonLdScripts) {
        const structuredEvents = this.parseStructuredDataForEvents(data);
        events.push(...structuredEvents);
      }
    } catch (error) {
      console.warn('Failed to extract structured data:', error);
    }

    return events;
  }

  private parseStructuredDataForEvents(data: any): Event[] {
    const events: Event[] = [];
    
    if (data['@type'] === 'Event') {
      const event = this.convertStructuredDataToEvent(data);
      if (event) events.push(event);
    } else if (Array.isArray(data)) {
      for (const item of data) {
        events.push(...this.parseStructuredDataForEvents(item));
      }
    } else if (typeof data === 'object') {
      for (const value of Object.values(data)) {
        if (typeof value === 'object') {
          events.push(...this.parseStructuredDataForEvents(value));
        }
      }
    }

    return events;
  }

  private convertStructuredDataToEvent(data: any): Event | null {
    if (!data.name || !data.startDate) return null;

    const startDateTime = new Date(data.startDate);
    if (isNaN(startDateTime.getTime())) return null;

    return {
      title: data.name,
      description: data.description,
      startDateTime,
      endDateTime: data.endDate ? new Date(data.endDate) : undefined,
      location: data.location?.name || data.location?.address?.streetAddress,
      category: this.categorizeEvent(data.name, data.description, 'venue'),
      price: data.offers?.price,
      imageUrl: data.image?.url || data.image,
      sourceUrl: data.url,
      tags: []
    };
  }

  private async extractByPatterns(page: any, source: EventSource): Promise<Event[]> {
    // This would implement pattern-based event detection
    // Looking for common HTML structures, date patterns, etc.
    return [];
  }

  private async getTextFromSelector(element: any, selector: string): Promise<string | null> {
    try {
      const el = await element.$(selector);
      return el ? await el.textContent() : null;
    } catch {
      return null;
    }
  }

  private async getAttributeFromSelector(element: any, selector: string, attribute: string): Promise<string | null> {
    try {
      const el = await element.$(selector);
      return el ? await el.getAttribute(attribute) : null;
    } catch {
      return null;
    }
  }

  private parseEventDate(dateText: string | null): Date | null {
    if (!dateText) return null;

    // Multiple date parsing strategies
    const strategies = [
      // ISO format
      (text: string) => new Date(text),
      
      // Common formats
      (text: string) => {
        const patterns = [
          /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
          /(\d{4})-(\d{1,2})-(\d{1,2})/,    // YYYY-MM-DD
          /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,  // Month DD, YYYY
        ];
        
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            const date = new Date(text);
            if (!isNaN(date.getTime())) return date;
          }
        }
        return null;
      }
    ];

    for (const strategy of strategies) {
      try {
        const date = strategy(dateText);
        if (date && !isNaN(date.getTime()) && date > new Date()) {
          return date;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private categorizeEvent(title: string, description: string = '', sourceType: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    const categories = {
      music: /music|concert|band|singer|dj|acoustic|jazz|rock|country|pop|classical/,
      food: /food|dinner|lunch|brunch|cooking|chef|tasting|wine|beer|cocktail|menu/,
      culture: /culture|art|gallery|museum|theater|performance|dance|cultural/,
      festival: /festival|fest|celebration|fair/,
      market: /market|farmers|vendor|craft|artisan/,
      nightlife: /night|bar|club|happy hour|late/,
      family: /family|kids|children|all ages/,
      education: /workshop|class|seminar|lecture|learning|course/
    };

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(text)) return category;
    }

    // Default based on source type
    const sourceDefaults: Record<string, string> = {
      restaurant: 'food',
      brewery: 'food',
      venue: 'music',
      cultural: 'culture',
      community: 'community'
    };

    return sourceDefaults[sourceType] || 'other';
  }

  private extractTags(title: string, description: string = ''): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [];
    
    const tagPatterns = {
      'live-music': /live music|live band|acoustic|performance/,
      'free': /free|no cost|complimentary/,
      '21+': /21\+|adults only|over 21/,
      'family-friendly': /family|kids|all ages|children/,
      'outdoor': /outdoor|patio|terrace|garden/,
      'special-event': /special|limited|exclusive|one night/
    };

    for (const [tag, pattern] of Object.entries(tagPatterns)) {
      if (pattern.test(text)) tags.push(tag);
    }

    return tags;
  }

  private isValidEvent(event: Event): boolean {
    return !!(
      event.title &&
      event.title.length > 3 &&
      event.startDateTime &&
      event.startDateTime > new Date()
    );
  }

  private deduplicateEvents(events: Event[]): Event[] {
    const seen = new Set();
    return events.filter(event => {
      const key = `${event.title}-${event.startDateTime?.toISOString()}-${event.location}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Enhanced methods for Crawlee integration
  private async scrapeWithCrawlee(source: EventSource): Promise<ScrapingResult> {
    // Would integrate with Crawlee for enhanced scraping
    // Placeholder for now
    return this.scrapeWithPlaywright(source);
  }

  // Enhanced methods for Crawl4AI integration  
  private async scrapeWithCrawl4AI(source: EventSource): Promise<ScrapingResult> {
    // Would integrate with Crawl4AI for AI-powered extraction
    // Placeholder for now
    return this.scrapeWithPlaywright(source);
  }

  private async getSourcesDueForScraping(): Promise<EventSource[]> {
    try {
      const now = new Date();
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

        const sources = await prisma.eventSource.findMany({
        where: {
          isActive: true,
          OR: [
            { lastScrapedAt: null },
            { lastScrapedAt: { lt: fourHoursAgo } }
          ]
        },
        include: {
          venue: true
        },
        orderBy: {
          lastScrapedAt: 'asc'
        },
        take: 10 // Limit concurrent scraping
      });

      return sources.map(source => ({
        id: source.id,
        name: source.name,
        url: source.url,
        sourceType: source.sourceType,
        // Schema stores these as strings in SQLite; parse safely
        scrapingConfig: safeJsonParse(source.scrapingConfig),
        extractionRules: safeJsonParse(source.extractionRules),
        venue: source.venue ? {
          id: source.venue.id,
          name: source.venue.name,
          location: source.venue.address || source.venue.name
        } : undefined
      }));
    } catch (error) {
      console.error('Failed to get sources due for scraping:', error);
      return [];
    }
  }

  // Run a single collection cycle over currently due sources (no long loop)
  async runOnce() {
    try {
      const sourcesToScrape = await this.getSourcesDueForScraping();
      console.log(`🔁 One-shot run: ${sourcesToScrape.length} sources due`);

      for (const source of sourcesToScrape) {
        try {
          await this.collectFromSource(source);
        } catch (error) {
          console.error(`⚠️ Failed to collect from ${source.name}:`, error);
          await this.logScrapingError(source.id, error);
        }
        await this.delay(1000);
      }
    } catch (error) {
      console.error('Run-once collection error:', error);
      throw error;
    }
  }

  private async processAndStoreEvents(events: Event[], source: EventSource): Promise<void> {
    console.log(`💾 Storing ${events.length} events from ${source.name}`);
    
    for (const eventData of events) {
      try {
        // Check for existing event (deduplication)
        const existingEvent = await prisma.event.findFirst({
          where: {
            title: eventData.title,
            startDateTime: eventData.startDateTime,
            OR: [
              { venueId: source.venue?.id },
              { customLocation: eventData.location }
            ]
          }
        });

        if (existingEvent) {
          console.log(`⏩ Skipping duplicate event: ${eventData.title}`);
          continue;
        }

        // Create new event
        await prisma.event.create({
          data: {
            title: eventData.title,
            description: eventData.description,
            startDateTime: eventData.startDateTime,
            endDateTime: eventData.endDateTime,
            category: eventData.category,
            price: eventData.price,
            imageUrl: eventData.imageUrl,
            sourceUrl: eventData.sourceUrl,
            tags: Array.isArray(eventData.tags) ? eventData.tags.join(',') : (eventData.tags as any),
            venueId: source.venue?.id,
            customLocation: source.venue?.id ? null : eventData.location,
            sourceId: source.id,
            status: 'published'
          }
        });
        
        console.log(`✅ Stored event: ${eventData.title}`);
        
      } catch (error) {
        console.error(`❌ Failed to store event ${eventData.title}:`, error);
      }
    }
  }

  private async updateSourceStats(sourceId: string, success: boolean): Promise<void> {
    try {
      const source = await prisma.eventSource.findUnique({
        where: { id: sourceId }
      });

      if (!source) return;

      const totalAttempts = (source.totalAttempts || 0) + 1;
      const successfulAttempts = (source.successfulAttempts || 0) + (success ? 1 : 0);
      const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

      await prisma.eventSource.update({
        where: { id: sourceId },
        data: {
          lastScrapedAt: new Date(),
          totalAttempts,
          successfulAttempts,
          successRate,
          status: success ? 'active' : (successRate < 50 ? 'error' : 'warning')
        }
      });
    } catch (error) {
      console.error('Failed to update source stats:', error);
    }
  }

  private async startScrapingLog(source: EventSource): Promise<string> {
    try {
      const log = await prisma.scrapingLog.create({
        data: {
          sourceId: source.id,
          startedAt: new Date(),
          status: 'running'
        }
      });
      return log.id;
    } catch (error) {
      console.error('Failed to create scraping log:', error);
      return 'error-log-id';
    }
  }

  private async completeScrapingLog(logId: string, result: ScrapingResult): Promise<void> {
    try {
      await prisma.scrapingLog.update({
        where: { id: logId },
        data: {
          completedAt: new Date(),
          status: result.success ? 'completed' : 'failed',
          eventsFound: result.eventsFound.length,
          error: result.error,
          metadata: JSON.stringify(result.metadata)
        }
      });
    } catch (error) {
      console.error('Failed to complete scraping log:', error);
    }
  }

  private async logScrapingError(sourceId: string, error: any): Promise<void> {
    try {
      await prisma.scrapingLog.create({
        data: {
          sourceId,
          startedAt: new Date(),
          completedAt: new Date(),
          status: 'failed',
          eventsFound: 0,
          error: error.message || String(error),
          metadata: JSON.stringify({ error: String(error) })
        }
      });
      
      // Update source status
      await this.updateSourceStats(sourceId, false);
    } catch (logError) {
      console.error('Failed to log scraping error:', logError);
    }
  }

  private async generateContentHash(content: string): Promise<string> {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    console.log('🛑 Stopping event collection...');
    this.isRunning = false;
    this.emit('stopped');
  }

  async destroy() {
    await this.stop();
    await prisma.$disconnect();
  }
}

// Local helper for safe JSON parsing from string columns
function safeJsonParse(value: any): any {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
