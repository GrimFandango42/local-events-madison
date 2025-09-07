// API route tests for events
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/events/route';
import { prisma, createTestVenue, createTestEvent } from '../setup';

describe('/api/events', () => {
  describe('GET', () => {
    test('should return events with default pagination', async () => {
      // Create test data
      const venue = await createTestVenue({ name: 'Test API Venue' });
      await createTestEvent({ 
        title: 'API Test Event 1',
        venue,
        startDateTime: new Date(Date.now() + 86400000)
      });
      await createTestEvent({ 
        title: 'API Test Event 2',
        venue,
        startDateTime: new Date(Date.now() + 172800000)
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/events'
      });

      const response = await handler.GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    test('should filter events by category', async () => {
      const venue = await createTestVenue();
      await createTestEvent({ 
        title: 'Music Event',
        category: 'music',
        venue 
      });
      await createTestEvent({ 
        title: 'Food Event',
        category: 'food',
        venue 
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/events?category=music'
      });

      const response = await handler.GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.every((event: any) => event.category === 'music')).toBe(true);
    });

    test('should filter events by neighborhood', async () => {
      const downtownVenue = await createTestVenue({ 
        name: 'Downtown Venue',
        neighborhood: 'Downtown' 
      });
      const eastSideVenue = await createTestVenue({ 
        name: 'East Side Venue',
        neighborhood: 'East Side' 
      });

      await createTestEvent({ 
        title: 'Downtown Event',
        venue: downtownVenue 
      });
      await createTestEvent({ 
        title: 'East Side Event',
        venue: eastSideVenue 
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/events?neighborhood=Downtown'
      });

      const response = await handler.GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.every((event: any) => 
        event.venue?.neighborhood === 'Downtown'
      )).toBe(true);
    });

    test('should filter events by search term', async () => {
      const venue = await createTestVenue();
      await createTestEvent({ 
        title: 'Jazz Concert Tonight',
        description: 'Amazing jazz music',
        venue 
      });
      await createTestEvent({ 
        title: 'Rock Show',
        description: 'Heavy metal concert',
        venue 
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/events?search=jazz'
      });

      const response = await handler.GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.some((event: any) => 
        event.title.toLowerCase().includes('jazz') ||
        event.description?.toLowerCase().includes('jazz')
      )).toBe(true);
    });

    test('should filter events by date range', async () => {
      const venue = await createTestVenue();
      const tomorrow = new Date(Date.now() + 86400000);
      const nextWeek = new Date(Date.now() + 7 * 86400000);
      const nextMonth = new Date(Date.now() + 30 * 86400000);

      await createTestEvent({ 
        title: 'Tomorrow Event',
        startDateTime: tomorrow,
        venue 
      });
      await createTestEvent({ 
        title: 'Next Week Event',
        startDateTime: nextWeek,
        venue 
      });
      await createTestEvent({ 
        title: 'Next Month Event',
        startDateTime: nextMonth,
        venue 
      });

      const dateFrom = tomorrow.toISOString().split('T')[0];
      const dateTo = nextWeek.toISOString().split('T')[0];

      const { req } = createMocks({
        method: 'GET',
        url: `/api/events?dateFrom=${dateFrom}&dateTo=${dateTo}`
      });

      const response = await handler.GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.every((event: any) => {
        const eventDate = new Date(event.startDateTime);
        return eventDate >= tomorrow && eventDate <= nextWeek;
      })).toBe(true);
    });

    test('should handle pagination correctly', async () => {
      const venue = await createTestVenue();
      
      // Create 15 test events
      for (let i = 0; i < 15; i++) {
        await createTestEvent({ 
          title: `Pagination Test Event ${i}`,
          venue,
          startDateTime: new Date(Date.now() + (i * 3600000)) // Spread over hours
        });
      }

      // Test first page
      const { req: req1 } = createMocks({
        method: 'GET',
        url: '/api/events?page=1&limit=5'
      });

      const response1 = await handler.GET(req1 as any);
      const data1 = await response1.json();

      expect(data1.data).toHaveLength(5);
      expect(data1.pagination.page).toBe(1);
      expect(data1.pagination.limit).toBe(5);
      expect(data1.pagination.hasMore).toBe(true);

      // Test second page
      const { req: req2 } = createMocks({
        method: 'GET',
        url: '/api/events?page=2&limit=5'
      });

      const response2 = await handler.GET(req2 as any);
      const data2 = await response2.json();

      expect(data2.data).toHaveLength(5);
      expect(data2.pagination.page).toBe(2);
      expect(data2.pagination.hasMore).toBe(true);
    });

    test('should include venue information in events', async () => {
      const venue = await createTestVenue({
        name: 'The Majestic Theatre',
        address: '115 King St, Madison, WI',
        neighborhood: 'Downtown'
      });

      await createTestEvent({ 
        title: 'Concert at Majestic',
        venue 
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/events'
      });

      const response = await handler.GET(req as any);
      const data = await response.json();

      expect(data.data[0].venue).toBeDefined();
      expect(data.data[0].venue.name).toBe('The Majestic Theatre');
      expect(data.data[0].venue.address).toBe('115 King St, Madison, WI');
      expect(data.data[0].venue.neighborhood).toBe('Downtown');
    });

    test('should handle invalid query parameters gracefully', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/events?page=invalid&limit=not-a-number'
      });

      const response = await handler.GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should use default pagination values
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    test('should return empty array when no events match filters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/events?category=nonexistent-category'
      });

      const response = await handler.GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });
  });

  describe('error handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock Prisma to throw an error
      const originalFindMany = prisma.event.findMany;
      prisma.event.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

      const { req } = createMocks({
        method: 'GET',
        url: '/api/events'
      });

      const response = await handler.GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Database error');

      // Restore original method
      prisma.event.findMany = originalFindMany;
    });

    test('should return 405 for non-GET methods', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/events'
      });

      const response = await handler.POST?.(req as any);
      expect(response?.status).toBe(405);
    });
  });
});