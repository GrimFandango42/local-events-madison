#!/usr/bin/env node

/**
 * Realistic Data Seeding Script
 * 
 * Creates realistic Madison venues and events for testing:
 * - Real Madison venues and neighborhoods
 * - Varied event types and categories
 * - Realistic dates and pricing
 * - Incremental seeding support
 * 
 * Usage: node scripts/seed-realistic-data.js [--clean] [--count=N]
 * Example: node scripts/seed-realistic-data.js --count=20
 * Example: node scripts/seed-realistic-data.js --clean (removes existing data first)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const outputDir = 'tests/outputs';

// Parse command line arguments
const args = process.argv.slice(2);
const shouldClean = args.includes('--clean');
const countArg = args.find(arg => arg.startsWith('--count='));
const eventCount = countArg ? parseInt(countArg.split('=')[1]) : 25;

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Real Madison venues and data
const madisonVenues = [
  {
    name: 'The Majestic Theatre',
    venueType: 'theatre',
    address: '115 King St',
    neighborhood: 'Downtown',
    website: 'https://themajestic.org',
    description: 'Historic theater venue hosting concerts, comedy, and live performances'
  },
  {
    name: 'Memorial Union Terrace',
    venueType: 'venue',
    address: '800 Langdon St',
    neighborhood: 'Campus Area', 
    website: 'https://union.wisc.edu',
    description: 'Iconic lakeside venue with outdoor concerts and events'
  },
  {
    name: 'High Noon Saloon',
    venueType: 'bar',
    address: '701A E Washington Ave',
    neighborhood: 'East Side',
    website: 'https://highnoonsa1oon.com',
    description: 'Popular music venue featuring local and touring acts'
  },
  {
    name: 'Overture Center',
    venueType: 'theatre',
    address: '201 State St',
    neighborhood: 'Downtown',
    website: 'https://overture.org',
    description: 'Premier performing arts center with multiple theaters'
  },
  {
    name: 'Crystal Corner Bar',
    venueType: 'bar',  
    address: '1302 Williamson St',
    neighborhood: 'Willy Street',
    website: 'https://crystalcornerbar.com',
    description: 'Neighborhood bar with live music and community events'
  },
  {
    name: 'Wilson Park',
    venueType: 'park',
    address: '1414 S 4th St',
    neighborhood: 'South Side',
    description: 'Community park hosting outdoor events and festivals'
  },
  {
    name: 'Colectivo Coffee',
    venueType: 'cafe',
    address: '2211 N Forest Rd',
    neighborhood: 'Northside',
    website: 'https://colectivocoffee.com',
    description: 'Coffee shop with live music and community events'
  },
  {
    name: 'The Sylvee',
    venueType: 'venue',
    address: '25 Richard T Ely Wy',
    neighborhood: 'Downtown',
    website: 'https://thesylvee.com',
    description: 'Modern concert venue and event space'
  },
  {
    name: 'Comedy Club on State',
    venueType: 'club',
    address: '202 State St',
    neighborhood: 'Downtown', 
    website: 'https://madisoncomedy.com',
    description: 'Stand-up comedy venue with regular shows'
  },
  {
    name: 'Madison Museum of Contemporary Art',
    venueType: 'museum',
    address: '227 State St',
    neighborhood: 'Downtown',
    website: 'https://mmoca.org',
    description: 'Contemporary art museum with exhibitions and events'
  }
];

const eventTemplates = [
  // Music Events
  {
    title: 'Live Jazz Night',
    category: 'music',
    description: 'Smooth jazz performances featuring local musicians',
    price: '$15',
    tags: 'jazz,live music,evening'
  },
  {
    title: 'Indie Rock Showcase',
    category: 'music', 
    description: 'Local indie bands performing original music',
    price: '$12',
    tags: 'indie,rock,local bands'
  },
  {
    title: 'Classical Music Concert',
    category: 'music',
    description: 'Professional orchestra performing classical masterpieces',
    price: '$25',
    tags: 'classical,orchestra,concert'
  },
  {
    title: 'Open Mic Night',
    category: 'music',
    description: 'Open stage for local talent - musicians, poets, comedians welcome',
    price: 'Free',
    tags: 'open mic,community,music'
  },
  
  // Food Events
  {
    title: 'Farm-to-Table Dinner',
    category: 'food',
    description: 'Multi-course dinner featuring local, seasonal ingredients',
    price: '$45',
    tags: 'farm to table,local,dinner'
  },
  {
    title: 'Craft Beer Tasting',
    category: 'food',
    description: 'Sample Wisconsin craft beers with expert guidance',
    price: '$20',
    tags: 'beer,craft beer,tasting'
  },
  {
    title: 'Cooking Class: Italian Pasta',
    category: 'food',
    description: 'Learn to make fresh pasta from scratch',
    price: '$35',
    tags: 'cooking class,pasta,italian'
  },
  {
    title: 'Food Truck Festival',
    category: 'food',
    description: 'Diverse food trucks gathering with live music',
    price: 'Free entry',
    tags: 'food trucks,festival,outdoor'
  },
  
  // Cultural Events  
  {
    title: 'Art Gallery Opening',
    category: 'culture',
    description: 'Opening reception for new local artist exhibition',
    price: 'Free',
    tags: 'art,gallery,opening'
  },
  {
    title: 'Poetry Reading',
    category: 'culture',
    description: 'Local poets sharing original works',
    price: '$5',
    tags: 'poetry,reading,literature'
  },
  {
    title: 'Historical Walking Tour',
    category: 'culture',
    description: 'Guided tour of historic downtown Madison',
    price: '$10',
    tags: 'history,walking tour,downtown'
  },
  {
    title: 'Film Screening',
    category: 'culture',
    description: 'Independent film screening with director Q&A',
    price: '$8',
    tags: 'film,screening,independent'
  },
  
  // Community Events
  {
    title: 'Community Volunteer Day',
    category: 'community',
    description: 'Join neighbors in local park cleanup and improvement',
    price: 'Free',
    tags: 'volunteer,community,environment'
  },
  {
    title: 'Local Business Showcase',
    category: 'business',
    description: 'Meet local entrepreneurs and learn about new businesses',
    price: 'Free',
    tags: 'business,local,networking'
  },
  {
    title: 'Trivia Night',
    category: 'nightlife',
    description: 'Weekly trivia competition with prizes',
    price: 'Free',
    tags: 'trivia,competition,social'
  },
  
  // Family Events
  {
    title: 'Family Game Night',
    category: 'family',
    description: 'Board games and activities for all ages',
    price: '$5 per family',
    tags: 'family,games,kids'
  },
  {
    title: 'Story Time for Kids',
    category: 'family',
    description: 'Interactive storytelling for children ages 3-8',
    price: 'Free',
    tags: 'kids,story time,family'
  }
];

// Helper function to generate random dates
function getRandomFutureDate(daysAhead = 30) {
  const today = new Date();
  const randomDays = Math.floor(Math.random() * daysAhead);
  const randomHours = Math.floor(Math.random() * 12) + 10; // Between 10 AM and 10 PM
  const date = new Date(today);
  date.setDate(today.getDate() + randomDays);
  date.setHours(randomHours, 0, 0, 0);
  return date;
}

function getRandomEndDate(startDate) {
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + Math.floor(Math.random() * 4) + 1); // 1-4 hours later
  return endDate;
}

async function seedDatabase() {
  console.log(`🌱 Starting Database Seeding`);
  console.log(`📊 Target: ${eventCount} events across ${madisonVenues.length} venues`);
  console.log('=' .repeat(60));
  
  let seededVenues = 0;
  let seededEvents = 0;
  const results = { venues: [], events: [], errors: [] };
  
  try {
    // Clean existing data if requested
    if (shouldClean) {
      console.log('🧹 Cleaning existing data...');
      await prisma.event.deleteMany({});
      await prisma.eventSource.deleteMany({});
      await prisma.venue.deleteMany({});
      console.log('✅ Existing data cleaned');
    }
    
    // Create venues
    console.log('\n📍 Creating venues...');
    
    for (const venueData of madisonVenues) {
      try {
        // Check if venue already exists
        const existingVenue = await prisma.venue.findFirst({
          where: { name: venueData.name }
        });
        
        if (existingVenue) {
          console.log(`⏩ Venue already exists: ${venueData.name}`);
          results.venues.push(existingVenue);
          continue;
        }
        
        const venue = await prisma.venue.create({
          data: {
            name: venueData.name,
            venueType: venueData.venueType,
            address: venueData.address,
            city: 'Madison',
            state: 'WI',
            neighborhood: venueData.neighborhood,
            website: venueData.website,
            description: venueData.description,
            hostsEvents: true,
            verified: true
          }
        });
        
        results.venues.push(venue);
        seededVenues++;
        console.log(`✅ Created venue: ${venue.name}`);
        
      } catch (error) {
        console.error(`❌ Failed to create venue ${venueData.name}:`, error.message);
        results.errors.push({ type: 'venue', name: venueData.name, error: error.message });
      }
    }
    
    // Create events
    console.log('\n🎉 Creating events...');
    
    for (let i = 0; i < eventCount; i++) {
      try {
        const randomTemplate = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
        const randomVenue = results.venues[Math.floor(Math.random() * results.venues.length)];
        
        if (!randomVenue) {
          console.error('❌ No venues available for event creation');
          break;
        }
        
        const startDateTime = getRandomFutureDate();
        const endDateTime = getRandomEndDate(startDateTime);
        
        // Add some variation to the event titles
        const titleVariations = [
          randomTemplate.title,
          `${randomTemplate.title} at ${randomVenue.name}`,
          `${randomTemplate.title} - ${randomVenue.neighborhood}`,
          `Special ${randomTemplate.title}`
        ];
        
        const finalTitle = titleVariations[Math.floor(Math.random() * titleVariations.length)];
        
        const event = await prisma.event.create({
          data: {
            title: finalTitle,
            description: randomTemplate.description,
            category: randomTemplate.category,
            startDateTime,
            endDateTime,
            timezone: 'America/Chicago',
            venueId: randomVenue.id,
            price: randomTemplate.price,
            tags: randomTemplate.tags,
            status: 'published'
          }
        });
        
        results.events.push(event);
        seededEvents++;
        
        if (i % 5 === 0) {
          console.log(`📈 Progress: ${i + 1}/${eventCount} events created`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to create event ${i + 1}:`, error.message);
        results.errors.push({ type: 'event', index: i + 1, error: error.message });
      }
    }
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    results.errors.push({ type: 'global', error: error.message });
  } finally {
    await prisma.$disconnect();
  }
  
  // ==========================================
  // Generate Report
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEEDING RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`🏢 Venues created: ${seededVenues}`);
  console.log(`🎉 Events created: ${seededEvents}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    results.errors.slice(0, 5).forEach((error, index) => {
      console.log(`${index + 1}. ${error.type}: ${error.error}`);
    });
    if (results.errors.length > 5) {
      console.log(`... and ${results.errors.length - 5} more errors`);
    }
  }
  
  // Show some sample events
  if (results.events.length > 0) {
    console.log('\n📅 Sample events created:');
    results.events.slice(0, 3).forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (${event.category}) - ${event.startDateTime.toLocaleDateString()}`);
    });
  }
  
  // Save detailed results
  const reportPath = path.join(outputDir, 'seeding-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      venuesCreated: seededVenues,
      eventsCreated: seededEvents,
      errorsCount: results.errors.length,
      requestedEventCount: eventCount
    },
    venues: results.venues.map(v => ({ id: v.id, name: v.name, neighborhood: v.neighborhood })),
    events: results.events.map(e => ({ 
      id: e.id, 
      title: e.title, 
      category: e.category, 
      startDateTime: e.startDateTime 
    })),
    errors: results.errors
  }, null, 2));
  
  console.log(`📄 Detailed report saved to: ${reportPath}`);
  
  if (results.errors.length > eventCount * 0.1) { // More than 10% failures
    console.log('\n❌ High error rate detected. Check the logs above.');
    process.exit(1);
  } else {
    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`🔍 View your data at: ${process.env.BASE_URL || 'http://localhost:5000'}`);
    process.exit(0);
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase().catch(error => {
    console.error('❌ Seeding script failed:', error);
    process.exit(1);
  });
}

module.exports = { seedDatabase };