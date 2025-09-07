// Vitest setup file for modern testing (2025 best practices)
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

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

// Basic test setup
beforeAll(() => {
  // Setup any global test configuration
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  // Cleanup
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