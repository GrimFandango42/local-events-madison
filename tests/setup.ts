// Test setup and configuration
import { beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'file:./test.db'
    }
  }
});

beforeAll(async () => {
  // Set up test database
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
  
  // Clear all tables
  await prisma.$transaction([
    prisma.event.deleteMany(),
    prisma.eventSource.deleteMany(),
    prisma.venue.deleteMany(),
    prisma.scrapingLog.deleteMany(),
  ]);
});

afterAll(async () => {
  // Clean up test database
  await prisma.$transaction([
    prisma.event.deleteMany(),
    prisma.eventSource.deleteMany(),
    prisma.venue.deleteMany(),
    prisma.scrapingLog.deleteMany(),
  ]);
  
  await prisma.$disconnect();
});

// Test utilities
export const createTestVenue = async (data: Partial<any> = {}) => {
  return await prisma.venue.create({
    data: {
      name: data.name || 'Test Venue',
      address: data.address || '123 Test St, Madison, WI',
      neighborhood: data.neighborhood || 'Downtown',
      website: data.website || 'https://test-venue.com',
      phoneNumber: data.phoneNumber || '(608) 123-4567',
      hostsEvents: data.hostsEvents ?? true,
      ...data
    }
  });
};

export const createTestEventSource = async (data: Partial<any> = {}) => {
  const venue = data.venue || await createTestVenue();
  
  return await prisma.eventSource.create({
    data: {
      name: data.name || 'Test Event Source',
      url: data.url || 'https://test-venue.com/events',
      sourceType: data.sourceType || 'venue',
      venueId: venue.id,
      isActive: data.isActive ?? true,
      // SQLite schema stores JSON as strings
      scrapingConfig: JSON.stringify(
        data.scrapingConfig || { method: 'playwright', waitTime: 3000 }
      ),
      extractionRules: JSON.stringify(
        data.extractionRules || {
          selectors: {
            container: '.event',
            title: '.title',
            date: '.date',
            description: '.description'
          }
        }
      ),
      ...data
    }
  });
};

export const createTestEvent = async (data: Partial<any> = {}) => {
  const venue = data.venue || await createTestVenue();
  
  return await prisma.event.create({
    data: {
      title: data.title || 'Test Event',
      description: data.description || 'A test event description',
      startDateTime: data.startDateTime || new Date(Date.now() + 86400000), // Tomorrow
      endDateTime: data.endDateTime,
      category: data.category || 'music',
      price: data.price || 'Free',
      venueId: venue.id,
      customLocation: data.customLocation,
      sourceUrl: data.sourceUrl || 'https://test-venue.com/events',
      // SQLite schema stores tags as CSV string
      tags: Array.isArray(data.tags) ? data.tags.join(',') : (data.tags || 'test'),
      status: data.status || 'published',
      ...data
    }
  });
};

export { prisma };
