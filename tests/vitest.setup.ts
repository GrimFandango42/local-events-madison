// Vitest setup file for modern testing (2025 best practices)
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'file:./test.db',
    REDIS_URL: undefined,
    LOCAL_EVENTS_API_URL: 'http://localhost:3000',
  },
}));

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/test',
    query: {},
    asPath: '/test',
  }),
}));

// Mock Next.js navigation (App Router)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test',
}));

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    venue: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    eventSource: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// MSW server for API mocking
export const server = setupServer(
  // Mock events API
  http.get('/api/events', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          title: 'Test Event',
          description: 'A test event',
          category: 'music',
          startDateTime: '2025-09-10T19:00:00Z',
          venue: {
            id: '1',
            name: 'Test Venue',
            address: '123 Test St',
          },
        },
      ],
      pagination: {
        page: 1,
        pageSize: 12,
        total: 1,
        hasMore: false,
      },
    });
  }),

  // Mock health API
  http.get('/api/health', () => {
    return HttpResponse.json({
      ok: true,
      node: 'v20.0.0',
      env: { NODE_ENV: 'test' },
      prisma: 'ok',
    });
  }),

  // Mock venue API
  http.get('/api/venues', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          name: 'Test Venue',
          address: '123 Test St',
          neighborhood: 'Downtown',
        },
      ],
    });
  }),
);

// Setup MSW
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});

// Global test utilities
global.createMockEvent = (overrides = {}) => ({
  id: '1',
  title: 'Test Event',
  description: 'A test event description',
  category: 'music',
  startDateTime: '2025-09-10T19:00:00Z',
  endDateTime: null,
  timezone: 'America/Chicago',
  allDay: false,
  price: 'Free',
  tags: 'test,event',
  venue: {
    id: '1',
    name: 'Test Venue',
    address: '123 Test St',
    neighborhood: 'Downtown',
  },
  ...overrides,
});

global.createMockVenue = (overrides = {}) => ({
  id: '1',
  name: 'Test Venue',
  address: '123 Test St, Madison, WI',
  city: 'Madison',
  state: 'WI',
  neighborhood: 'Downtown',
  website: 'https://test-venue.com',
  hostsEvents: true,
  ...overrides,
});

// Extend expect with custom matchers
declare global {
  var createMockEvent: (overrides?: any) => any;
  var createMockVenue: (overrides?: any) => any;
}