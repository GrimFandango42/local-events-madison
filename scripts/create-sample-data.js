// Create sample data for testing
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleData() {
  console.log('🎭 Creating sample Madison data...');

  try {
    // Create sample venues
    const majestic = await prisma.venue.create({
      data: {
        name: 'The Majestic Theatre',
        venueType: 'theater',
        address: '115 King St, Madison, WI 53703',
        neighborhood: 'Downtown',
        website: 'https://majesticmadison.com',
        phoneNumber: '(608) 255-0901',
        hostsEvents: true,
        eventCalendarUrl: 'https://majesticmadison.com/events',
        verified: true
      }
    });

    const memorialUnion = await prisma.venue.create({
      data: {
        name: 'Memorial Union Terrace',
        venueType: 'venue',
        address: '800 Langdon St, Madison, WI 53706',
        neighborhood: 'Campus',
        website: 'https://union.wisc.edu',
        phoneNumber: '(608) 262-1331',
        hostsEvents: true,
        description: 'Iconic lakefront terrace with live music and events',
        verified: true
      }
    });

    const overture = await prisma.venue.create({
      data: {
        name: 'Overture Center',
        venueType: 'theater',
        address: '201 State St, Madison, WI 53703',
        neighborhood: 'Downtown',
        website: 'https://overture.org',
        phoneNumber: '(608) 258-4141',
        hostsEvents: true,
        eventCalendarUrl: 'https://overture.org/events',
        description: 'Premier performing arts center',
        verified: true
      }
    });

    console.log('✅ Created venues:', majestic.name, memorialUnion.name, overture.name);

    // Create sample event sources
    const majesticSource = await prisma.eventSource.create({
      data: {
        name: 'Majestic Theatre Events',
        url: 'https://majesticmadison.com/events',
        sourceType: 'venue',
        venueId: majestic.id,
        isActive: true,
        scrapingConfig: JSON.stringify({
          method: 'playwright',
          waitTime: 3000,
          userAgent: 'LocalEvents/1.0'
        }),
        extractionRules: JSON.stringify({
          selectors: {
            container: '.event-item',
            title: '.event-title',
            date: '.event-date',
            description: '.event-description'
          }
        })
      }
    });

    const unionSource = await prisma.eventSource.create({
      data: {
        name: 'Memorial Union Events',
        url: 'https://union.wisc.edu/events',
        sourceType: 'venue',
        venueId: memorialUnion.id,
        isActive: true,
        scrapingConfig: JSON.stringify({
          method: 'playwright',
          waitTime: 2000
        })
      }
    });

    console.log('✅ Created event sources:', majesticSource.name, unionSource.name);

    // Create sample events
    const events = [
      {
        title: 'Madison Symphony Orchestra - Beethoven\'s 9th',
        description: 'Experience the power and beauty of Beethoven\'s iconic Symphony No. 9 with full orchestra and choir.',
        category: 'music',
        startDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
        venueId: overture.id,
        price: '$25-85',
        sourceUrl: 'https://overture.org/events',
        tags: 'classical,symphony,beethoven',
        imageUrl: 'https://example.com/beethoven.jpg'
      },
      {
        title: 'Terrace After Dark - Local Jazz Trio',
        description: 'Enjoy smooth jazz on the beautiful Memorial Union Terrace overlooking Lake Mendota.',
        category: 'music',
        startDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
        venueId: memorialUnion.id,
        price: 'Free',
        sourceId: unionSource.id,
        sourceUrl: 'https://union.wisc.edu/events',
        tags: 'free,outdoor,jazz,terrace',
        allDay: false
      },
      {
        title: 'Comedy Night at the Majestic',
        description: 'Hilarious stand-up comedy featuring local and touring comedians. Ages 18+.',
        category: 'nightlife',
        startDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // In 10 days
        venueId: majestic.id,
        price: '$15-20',
        sourceId: majesticSource.id,
        sourceUrl: 'https://majesticmadison.com/events',
        tags: 'comedy,standup,18+',
        imageUrl: 'https://example.com/comedy.jpg'
      },
      {
        title: 'Farmers Market on the Square',
        description: 'Fresh local produce, artisan goods, and live music around the Wisconsin State Capitol.',
        category: 'market',
        startDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
        customLocation: 'Capitol Square, Madison, WI',
        price: 'Free',
        sourceUrl: 'https://dcfm.org',
        tags: 'free,farmers market,local,capitol',
        allDay: true
      },
      {
        title: 'Art Fair on the Square',
        description: 'Annual outdoor art fair featuring 500+ artists from across the country. Food, music, and art!',
        category: 'art',
        startDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // In 30 days
        endDateTime: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000), // 2-day event
        customLocation: 'Capitol Square & State Street, Madison, WI',
        price: 'Free',
        sourceUrl: 'https://mmoca.org/art-fair',
        tags: 'free,art,fair,capitol,annual',
        allDay: true
      }
    ];

    for (const eventData of events) {
      const event = await prisma.event.create({
        data: eventData
      });
      console.log(`✅ Created event: ${event.title}`);
    }

    // Create a sample scraping log
    await prisma.scrapingLog.create({
      data: {
        sourceId: majesticSource.id,
        startedAt: new Date(Date.now() - 60000), // 1 minute ago
        completedAt: new Date(),
        status: 'completed',
        eventsFound: 3,
        metadata: JSON.stringify({
          responseCode: 200,
          contentHash: 'abc123def456',
          processingTime: 2500
        })
      }
    });

    console.log('✅ Sample data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`  • ${await prisma.venue.count()} venues`);
    console.log(`  • ${await prisma.eventSource.count()} event sources`);
    console.log(`  • ${await prisma.event.count()} events`);
    console.log(`  • ${await prisma.scrapingLog.count()} scraping logs`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createSampleData();
}

module.exports = createSampleData;