// Integration tests for MCPEventCollector
import { MCPEventCollector } from '@/backend/services/MCPEventCollector';
import { prisma, createTestVenue, createTestEventSource } from '../setup';

// Mock Playwright for testing
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(() => ({
      newContext: jest.fn(() => ({
        newPage: jest.fn(() => ({
          goto: jest.fn(() => ({ ok: () => true, status: () => 200 })),
          waitForTimeout: jest.fn(),
          content: jest.fn(() => '<html><body>Test content</body></html>'),
          $$: jest.fn(() => []),
          close: jest.fn()
        }))
      })),
      close: jest.fn()
    }))
  }
}));

describe('MCPEventCollector Integration Tests', () => {
  let collector: MCPEventCollector;

  beforeEach(async () => {
    collector = new MCPEventCollector();
    await collector.initialize();
  });

  afterEach(async () => {
    await collector.destroy();
  });

  describe('initialization', () => {
    test('should initialize successfully', async () => {
      const newCollector = new MCPEventCollector();
      await expect(newCollector.initialize()).resolves.not.toThrow();
      await newCollector.destroy();
    });

    test('should emit initialized event', async () => {
      const newCollector = new MCPEventCollector();
      const initPromise = new Promise(resolve => {
        newCollector.once('initialized', resolve);
      });
      
      await newCollector.initialize();
      await expect(initPromise).resolves.toBeUndefined();
      await newCollector.destroy();
    });
  });

  describe('source management', () => {
    test('should find sources due for scraping', async () => {
      // Create test venue and source
      const venue = await createTestVenue({
        name: 'Test Venue for Scraping'
      });

      const source = await createTestEventSource({
        name: 'Test Source',
        url: 'https://test-venue.com/events',
        venue,
        lastScrapedAt: null // Never scraped
      });

      // Access private method through reflection for testing
      const getSourcesDueForScraping = (collector as any).getSourcesDueForScraping.bind(collector);
      const sources = await getSourcesDueForScraping();

      expect(sources).toHaveLength(1);
      expect(sources[0].name).toBe('Test Source');
      expect(sources[0].venue).toBeDefined();
    });

    test('should update source statistics after scraping', async () => {
      const venue = await createTestVenue();
      const source = await createTestEventSource({ venue });

      // Access private method
      const updateSourceStats = (collector as any).updateSourceStats.bind(collector);
      await updateSourceStats(source.id, true);

      const updatedSource = await prisma.eventSource.findUnique({
        where: { id: source.id }
      });

      expect(updatedSource?.totalAttempts).toBe(1);
      expect(updatedSource?.successfulAttempts).toBe(1);
      expect(updatedSource?.successRate).toBe(100);
      expect(updatedSource?.status).toBe('active');
      expect(updatedSource?.lastScrapedAt).toBeTruthy();
    });
  });

  describe('event processing', () => {
    test('should store events from successful scraping', async () => {
      const venue = await createTestVenue();
      const source = await createTestEventSource({ venue });

      const mockEvents = [
        {
          title: 'Test Concert',
          description: 'A great concert',
          startDateTime: new Date(Date.now() + 86400000), // Tomorrow
          category: 'music',
          price: '$10',
          sourceUrl: 'https://test-venue.com/events',
          tags: ['live-music']
        }
      ];

      // Access private method
      const processAndStoreEvents = (collector as any).processAndStoreEvents.bind(collector);
      await processAndStoreEvents(mockEvents, {
        id: source.id,
        name: source.name,
        url: source.url,
        sourceType: source.sourceType,
        venue: {
          id: venue.id,
          name: venue.name,
          location: venue.address
        }
      });

      const storedEvents = await prisma.event.findMany({
        where: { sourceId: source.id }
      });

      expect(storedEvents).toHaveLength(1);
      expect(storedEvents[0].title).toBe('Test Concert');
      expect(storedEvents[0].category).toBe('music');
      expect(storedEvents[0].venueId).toBe(venue.id);
    });

    test('should skip duplicate events', async () => {
      const venue = await createTestVenue();
      const source = await createTestEventSource({ venue });

      const mockEvent = {
        title: 'Duplicate Event',
        description: 'This event will be duplicated',
        startDateTime: new Date(Date.now() + 86400000),
        category: 'music',
        price: 'Free',
        sourceUrl: 'https://test-venue.com/events',
        tags: []
      };

      const processAndStoreEvents = (collector as any).processAndStoreEvents.bind(collector);
      
      // Store first time
      await processAndStoreEvents([mockEvent], {
        id: source.id,
        name: source.name,
        url: source.url,
        sourceType: source.sourceType,
        venue: {
          id: venue.id,
          name: venue.name,
          location: venue.address
        }
      });

      // Store second time (should be skipped)
      await processAndStoreEvents([mockEvent], {
        id: source.id,
        name: source.name,
        url: source.url,
        sourceType: source.sourceType,
        venue: {
          id: venue.id,
          name: venue.name,
          location: venue.address
        }
      });

      const storedEvents = await prisma.event.findMany({
        where: { 
          sourceId: source.id,
          title: 'Duplicate Event'
        }
      });

      expect(storedEvents).toHaveLength(1); // Should only have one event
    });
  });

  describe('logging and monitoring', () => {
    test('should create scraping logs', async () => {
      const venue = await createTestVenue();
      const source = await createTestEventSource({ venue });

      const startScrapingLog = (collector as any).startScrapingLog.bind(collector);
      const logId = await startScrapingLog({
        id: source.id,
        name: source.name,
        url: source.url,
        sourceType: source.sourceType
      });

      expect(logId).toBeTruthy();

      const log = await prisma.scrapingLog.findUnique({
        where: { id: logId }
      });

      expect(log).toBeTruthy();
      expect(log?.sourceId).toBe(source.id);
      expect(log?.status).toBe('running');
    });

    test('should complete scraping logs with results', async () => {
      const venue = await createTestVenue();
      const source = await createTestEventSource({ venue });

      const startScrapingLog = (collector as any).startScrapingLog.bind(collector);
      const completeScrapingLog = (collector as any).completeScrapingLog.bind(collector);
      
      const logId = await startScrapingLog({
        id: source.id,
        name: source.name,
        url: source.url,
        sourceType: source.sourceType
      });

      const mockResult = {
        success: true,
        eventsFound: [
          { title: 'Test Event', startDateTime: new Date() }
        ],
        metadata: {
          source: { id: source.id, name: source.name },
          duration: 1000,
          contentHash: 'test-hash'
        }
      };

      await completeScrapingLog(logId, mockResult);

      const completedLog = await prisma.scrapingLog.findUnique({
        where: { id: logId }
      });

      expect(completedLog?.status).toBe('completed');
      expect(completedLog?.eventsFound).toBe(1);
      expect(completedLog?.completedAt).toBeTruthy();
    });
  });

  describe('error handling', () => {
    test('should handle scraping errors gracefully', async () => {
      const venue = await createTestVenue();
      const source = await createTestEventSource({ venue });

      const logScrapingError = (collector as any).logScrapingError.bind(collector);
      await logScrapingError(source.id, new Error('Test scraping error'));

      const errorLogs = await prisma.scrapingLog.findMany({
        where: { 
          sourceId: source.id,
          status: 'failed'
        }
      });

      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].error).toContain('Test scraping error');

      // Check that source stats were updated
      const updatedSource = await prisma.eventSource.findUnique({
        where: { id: source.id }
      });
      expect(updatedSource?.totalAttempts).toBe(1);
      expect(updatedSource?.successfulAttempts).toBe(0);
    });
  });

  describe('event categorization', () => {
    test('should categorize events correctly', () => {
      const categorizeEvent = (collector as any).categorizeEvent.bind(collector);
      
      expect(categorizeEvent('Live Jazz Concert', 'Great music event', 'venue')).toBe('music');
      expect(categorizeEvent('Wine Tasting', 'Food and wine pairing', 'restaurant')).toBe('food');
      expect(categorizeEvent('Art Gallery Opening', 'New exhibition', 'cultural')).toBe('culture');
      expect(categorizeEvent('Summer Festival', 'Annual celebration', 'community')).toBe('festival');
      expect(categorizeEvent('Farmers Market', 'Local vendors', 'market')).toBe('market');
    });
  });

  describe('tag extraction', () => {
    test('should extract relevant tags', () => {
      const extractTags = (collector as any).extractTags.bind(collector);
      
      const tags1 = extractTags('Free Live Music', 'Acoustic performance for all ages');
      expect(tags1).toContain('live-music');
      expect(tags1).toContain('free');
      expect(tags1).toContain('family-friendly');

      const tags2 = extractTags('21+ Night Club Event', 'Adults only dance party');
      expect(tags2).toContain('21+');

      const tags3 = extractTags('Outdoor Patio Concert', 'Special one-night performance');
      expect(tags3).toContain('outdoor');
      expect(tags3).toContain('special-event');
    });
  });
});