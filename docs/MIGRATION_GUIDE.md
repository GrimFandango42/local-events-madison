# Migration Guide: Current Schema → Enhanced Schema

This guide provides step-by-step instructions for migrating from the existing Local Events schema to the enhanced multi-city, federation-ready schema.

## 📋 Pre-Migration Checklist

- [ ] **Backup existing database** - Create full backup before starting
- [ ] **Review current data** - Understand existing venue neighborhoods, events, sources
- [ ] **Plan city configuration** - Decide on initial city/region setup
- [ ] **Test migration on copy** - Always test on a database copy first
- [ ] **Prepare rollback plan** - Have a way to revert if needed

## 🔄 Migration Steps

### Phase 1: Add New Models (No Data Loss)

**Step 1.1: Create Enhanced Schema**
```bash
# Replace current schema with enhanced version
cp prisma/enhanced_schema.prisma prisma/schema.prisma

# Generate new migration
npx prisma migrate dev --name "add_enhanced_models"
```

**Step 1.2: Verify New Tables Created**
- ✅ regions
- ✅ cities  
- ✅ neighborhoods
- ✅ users
- ✅ user_preferences
- ✅ user_subscriptions
- ✅ audit_logs
- ✅ system_metrics

### Phase 2: Migrate Reference Data

**Step 2.1: Create Default Region and City**
```sql
-- Create Wisconsin region
INSERT INTO regions (id, name, code, timezone, federation_enabled, created_at, updated_at) 
VALUES (
  'cuid_region_wisconsin',
  'Wisconsin', 
  'WI',
  'America/Chicago',
  false,
  NOW(),
  NOW()
);

-- Create Madison city with branding
INSERT INTO cities (
  id, name, slug, state, country, latitude, longitude, timezone,
  default_radius, primary_language, currency, display_name, tagline,
  description, primary_color, region_id, is_active, maintenance_mode,
  public_instance, federation_enabled, admin_email, website_url,
  created_at, updated_at
) VALUES (
  'cuid_city_madison',
  'Madison',
  'madison', 
  'WI',
  'US',
  43.0731,
  -89.4012,
  'America/Chicago',
  25,
  'en',
  'USD',
  'Greater Madison Area',
  'Privacy-focused local events without Facebook tracking',
  'Discover authentic local events in Madison, Wisconsin',
  '#c5050c', -- UW Red
  'cuid_region_wisconsin',
  true,
  false,
  true,
  false, -- Start with federation disabled
  'admin@yourdomain.com',
  'https://yoursite.com',
  NOW(),
  NOW()
);
```

**Step 2.2: Extract and Create Neighborhoods**
```sql
-- Extract unique neighborhoods from existing venues
WITH unique_neighborhoods AS (
  SELECT DISTINCT 
    TRIM(LOWER(neighborhood)) as neighborhood_name,
    COUNT(*) as venue_count
  FROM venues 
  WHERE neighborhood IS NOT NULL 
    AND TRIM(neighborhood) != ''
  GROUP BY TRIM(LOWER(neighborhood))
  ORDER BY venue_count DESC
)
INSERT INTO neighborhoods (id, name, slug, city_id, is_active, created_at, updated_at)
SELECT 
  'cuid_neighborhood_' || REPLACE(REPLACE(neighborhood_name, ' ', '_'), '-', '_'),
  INITCAP(neighborhood_name),
  LOWER(REPLACE(neighborhood_name, ' ', '-')),
  'cuid_city_madison',
  true,
  NOW(),
  NOW()
FROM unique_neighborhoods;
```

### Phase 3: Update Existing Data

**Step 3.1: Add City References to Existing Tables**
```sql
-- Add city_id to venues (without breaking existing data)
ALTER TABLE venues ADD COLUMN city_id_temp VARCHAR;

-- Set all existing venues to Madison
UPDATE venues SET city_id_temp = 'cuid_city_madison';

-- Update neighborhood references
UPDATE venues SET neighborhood_id = (
  SELECT n.id 
  FROM neighborhoods n 
  WHERE LOWER(n.name) = TRIM(LOWER(venues.neighborhood))
    AND n.city_id = 'cuid_city_madison'
  LIMIT 1
) WHERE neighborhood IS NOT NULL AND TRIM(neighborhood) != '';

-- Add city_id to events
ALTER TABLE events ADD COLUMN city_id_temp VARCHAR;
UPDATE events SET city_id_temp = 'cuid_city_madison';

-- Add city_id to event_sources  
ALTER TABLE event_sources ADD COLUMN city_id_temp VARCHAR;
UPDATE event_sources SET city_id_temp = 'cuid_city_madison';

-- Add city_id to scraping_logs
ALTER TABLE scraping_logs ADD COLUMN city_id_temp VARCHAR;
UPDATE scraping_logs SET city_id_temp = 'cuid_city_madison';
```

**Step 3.2: Generate Deduplication Hashes for Existing Events**
```javascript
// Node.js script to generate hashes for existing events
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function generateDeduplicationHashes() {
  const events = await prisma.event.findMany({
    include: { venue: true }
  });

  for (const event of events) {
    // Generate deduplication hash from key properties
    const keyData = {
      title: normalizeTitle(event.title),
      startDateTime: event.startDateTime.toISOString(),
      venueId: event.venueId,
      customLocation: event.customLocation
    };
    
    const deduplicationHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
    
    // Generate content hash
    const contentData = {
      title: event.title,
      description: event.description,
      category: event.category,
      startDateTime: event.startDateTime.toISOString(),
      endDateTime: event.endDateTime?.toISOString(),
      venueId: event.venueId,
      customLocation: event.customLocation,
      priceMin: event.priceMin,
      priceMax: event.priceMax
    };
    
    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(contentData))
      .digest('hex');
    
    // Generate title hash (normalized)
    const titleHash = crypto
      .createHash('sha256')
      .update(normalizeTitle(event.title))
      .digest('hex');
    
    // Generate time-location hash
    const timeLocationData = {
      startDateTime: event.startDateTime.toISOString(),
      venueId: event.venueId,
      customLocation: event.customLocation
    };
    
    const timeLocationHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(timeLocationData))
      .digest('hex');
    
    // Update event with hashes
    await prisma.event.update({
      where: { id: event.id },
      data: {
        deduplicationHash,
        contentHash,
        titleHash,
        timeLocationHash,
        deduplicationStatus: 'unique' // Assume existing events are unique
      }
    });
  }
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

generateDeduplicationHashes().catch(console.error);
```

### Phase 4: Schema Constraints and Cleanup

**Step 4.1: Apply Non-Nullable Foreign Keys**
```sql
-- Make city_id columns non-nullable and add foreign keys
ALTER TABLE venues 
  ALTER COLUMN city_id_temp SET NOT NULL,
  ADD CONSTRAINT venues_city_id_fkey 
    FOREIGN KEY (city_id_temp) REFERENCES cities(id);

ALTER TABLE events
  ALTER COLUMN city_id_temp SET NOT NULL,
  ADD CONSTRAINT events_city_id_fkey
    FOREIGN KEY (city_id_temp) REFERENCES cities(id);

ALTER TABLE event_sources
  ALTER COLUMN city_id_temp SET NOT NULL,
  ADD CONSTRAINT event_sources_city_id_fkey
    FOREIGN KEY (city_id_temp) REFERENCES cities(id);

ALTER TABLE scraping_logs
  ALTER COLUMN city_id_temp SET NOT NULL,
  ADD CONSTRAINT scraping_logs_city_id_fkey
    FOREIGN KEY (city_id_temp) REFERENCES cities(id);
```

**Step 4.2: Rename Temporary Columns**
```sql
-- Rename temp columns to final names
ALTER TABLE venues RENAME COLUMN city_id_temp TO city_id;
ALTER TABLE events RENAME COLUMN city_id_temp TO city_id;  
ALTER TABLE event_sources RENAME COLUMN city_id_temp TO city_id;
ALTER TABLE scraping_logs RENAME COLUMN city_id_temp TO city_id;
```

**Step 4.3: Remove Old Neighborhood String Column**
```sql
-- Remove the old neighborhood string column from venues
ALTER TABLE venues DROP COLUMN neighborhood;
```

**Step 4.4: Add Performance Indexes**
```sql
-- Add critical indexes for performance
CREATE INDEX idx_events_deduplication_hash ON events(deduplication_hash);
CREATE INDEX idx_events_title_hash ON events(title_hash);
CREATE INDEX idx_events_time_location_hash ON events(time_location_hash);
CREATE INDEX idx_events_start_date_city ON events(start_datetime, city_id);
CREATE INDEX idx_events_category_city ON events(category, city_id);
CREATE INDEX idx_venues_slug_city ON venues(slug, city_id);
CREATE INDEX idx_event_sources_url_city ON event_sources(url, city_id);
```

### Phase 5: Validation and Testing

**Step 5.1: Data Integrity Checks**
```sql
-- Verify all venues have city_id
SELECT COUNT(*) FROM venues WHERE city_id IS NULL; -- Should be 0

-- Verify all events have city_id
SELECT COUNT(*) FROM events WHERE city_id IS NULL; -- Should be 0

-- Verify neighborhood relationships
SELECT COUNT(*) FROM venues v 
LEFT JOIN neighborhoods n ON v.neighborhood_id = n.id 
WHERE v.neighborhood_id IS NOT NULL AND n.id IS NULL; -- Should be 0

-- Check deduplication hash coverage
SELECT COUNT(*) FROM events WHERE deduplication_hash IS NULL; -- Should be 0
```

**Step 5.2: Application Testing**
- [ ] **Event listing** - Verify events display correctly
- [ ] **Venue pages** - Check venue details and neighborhood display
- [ ] **Search functionality** - Test category and location filtering  
- [ ] **Admin interface** - Verify source management works
- [ ] **API endpoints** - Test all existing API functionality

### Phase 6: Enable New Features

**Step 6.1: Set Up Deduplication Detection**
```javascript
// Add to your scraping pipeline
async function detectDuplicates(newEvent) {
  const existingEvent = await prisma.event.findFirst({
    where: {
      OR: [
        { deduplicationHash: newEvent.deduplicationHash },
        { titleHash: newEvent.titleHash, timeLocationHash: newEvent.timeLocationHash }
      ],
      cityId: newEvent.cityId
    }
  });
  
  if (existingEvent) {
    // Mark as potential duplicate for review
    await prisma.event.update({
      where: { id: newEvent.id },
      data: { 
        deduplicationStatus: 'potential',
        canonicalEventId: existingEvent.id 
      }
    });
  }
}
```

**Step 6.2: Configure Multi-City Support**
```javascript
// Add city context to your application
function getCityFromRequest(req) {
  // Extract from subdomain, path, or header
  return req.headers['x-city-slug'] || 'madison';
}

// Filter queries by city
function addCityFilter(query, citySlug) {
  const city = await prisma.city.findUnique({ 
    where: { slug: citySlug } 
  });
  
  return {
    ...query,
    where: {
      ...query.where,
      cityId: city.id
    }
  };
}
```

## 🚨 Common Migration Issues

### Issue 1: Neighborhood Matching Fails
**Symptom**: Some venues have `neighborhood_id` as null after migration
**Solution**: 
```sql
-- Find unmatched neighborhoods
SELECT DISTINCT neighborhood FROM venues 
WHERE neighborhood_id IS NULL AND neighborhood IS NOT NULL;

-- Create missing neighborhoods manually
INSERT INTO neighborhoods (id, name, slug, city_id, created_at, updated_at)
VALUES ('manual_id', 'Manual Neighborhood', 'manual-neighborhood', 'madison_city_id', NOW(), NOW());
```

### Issue 2: Duplicate Hash Collisions
**Symptom**: Multiple events with same deduplication hash
**Solution**: Add uniqueness validation and manual review process
```javascript
// Add validation in your scraping code
const existingHash = await prisma.event.findFirst({
  where: { deduplicationHash: newHash }
});

if (existingHash && existingHash.id !== currentEventId) {
  // Handle collision - mark for manual review
  console.log(`Hash collision detected for events ${existingHash.id} and ${currentEventId}`);
}
```

### Issue 3: Performance Issues After Migration
**Symptom**: Slow queries after adding city filtering
**Solution**: Ensure indexes are created and queries use city context
```sql
-- Check if indexes are being used
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM events WHERE city_id = 'madison_id' AND start_datetime > NOW();

-- Add missing indexes as needed
CREATE INDEX IF NOT EXISTS idx_events_city_date ON events(city_id, start_datetime);
```

## ✅ Post-Migration Checklist

- [ ] **All data migrated** - Verify record counts match pre-migration
- [ ] **Foreign keys working** - No orphaned records
- [ ] **Indexes created** - Performance is acceptable
- [ ] **Application works** - All features functional
- [ ] **Backups updated** - New backup with migrated schema
- [ ] **Documentation updated** - API docs reflect new structure
- [ ] **Monitoring configured** - New tables are monitored
- [ ] **Team trained** - Developers understand new schema

## 🔄 Rollback Plan (If Needed)

If migration fails and you need to rollback:

1. **Stop application** to prevent data corruption
2. **Restore from backup** taken before migration
3. **Verify data integrity** of restored database
4. **Restart application** with original schema
5. **Investigate issues** and fix before re-attempting

## 📞 Support

If you encounter issues during migration:
- Check the error logs first
- Verify each step was completed successfully  
- Test on a smaller dataset if needed
- Don't proceed if any step fails - investigate first

The enhanced schema provides significant benefits, but take your time with the migration to ensure data integrity is maintained throughout the process.