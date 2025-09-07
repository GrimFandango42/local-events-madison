# Local Events Platform - Technical Architecture

## System Overview

The Local Events platform is designed as a privacy-focused event aggregation system that replaces Facebook for discovering Madison-area food, music, and cultural events.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data Sources  │    │    Backend      │    │    Frontend     │
│                 │    │                 │    │                 │
│ • Manual Entry  │───▶│ • Event API     │───▶│ • Web App       │
│ • Web Scrapers  │    │ • Data Pipeline │    │ • Mobile PWA    │
│ • RSS Feeds     │    │ • User Auth     │    │ • Admin Panel   │
│ • Partnerships  │    │ • Search Engine │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack Recommendation

### Backend (Node.js/TypeScript)
```typescript
// Core Framework
- Runtime: Node.js 20+ LTS
- Framework: Fastify or Express.js
- Language: TypeScript with strict mode

// Database & Storage
- Primary DB: PostgreSQL 15+ with Prisma ORM
- Cache: Redis for sessions and frequent queries
- File Storage: Local filesystem or S3-compatible

// Search & Discovery
- Search Engine: Algolia (hosted) or Typesense (self-hosted)
- Geospatial: PostGIS extension for location-based queries

// Data Processing
- Queue: Bull (Redis-based) for background jobs
- Scheduler: node-cron for periodic data collection
- HTTP Client: Axios with retry logic
```

### Frontend (React/Next.js)
```typescript
// Core Framework
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS + shadcn/ui components

// State Management
- Client State: Zustand for UI state
- Server State: React Query (TanStack Query)
- Forms: React Hook Form with Zod validation

// Maps & Location
- Maps: Mapbox GL JS for interactive maps
- Geocoding: Mapbox Geocoding API

// Authentication
- Auth: NextAuth.js with JWT tokens
- Providers: Google, email/password
```

### Development Tools
```typescript
// Code Quality
- Linting: ESLint with TypeScript rules
- Formatting: Prettier
- Testing: Vitest + React Testing Library
- E2E: Playwright

// Database
- Migrations: Prisma migrate
- Seeding: Custom seed scripts
- Backup: pg_dump automation

// Deployment
- Containerization: Docker + docker-compose
- Process Management: PM2
- Reverse Proxy: Nginx
```

## Database Schema Design

### Core Entities
```sql
-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    venue_id UUID REFERENCES venues(id),
    category event_category NOT NULL,
    price_min INTEGER, -- cents
    price_max INTEGER, -- cents
    external_url TEXT,
    image_url TEXT,
    tags TEXT[],
    source_type data_source_type NOT NULL,
    source_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venues table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city VARCHAR(100) DEFAULT 'Madison',
    state VARCHAR(2) DEFAULT 'WI',
    website TEXT,
    phone VARCHAR(20),
    venue_type venue_type_enum,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences and saved events
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    preferences JSONB, -- categories, distance, price range
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE saved_events (
    user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, event_id)
);
```

### Enums and Types
```sql
CREATE TYPE event_category AS ENUM (
    'food', 'music', 'culture', 'art', 'festival', 'market', 'nightlife'
);

CREATE TYPE data_source_type AS ENUM (
    'manual', 'scraper', 'api', 'rss', 'partnership', 'user_submission'
);

CREATE TYPE venue_type_enum AS ENUM (
    'restaurant', 'bar', 'brewery', 'concert_hall', 'gallery', 
    'museum', 'park', 'community_center', 'university'
);
```

## Data Pipeline Architecture

### Event Data Collection
```typescript
// Data collection pipeline
interface DataCollector {
    collect(): Promise<RawEvent[]>;
    normalize(raw: RawEvent): Event;
    deduplicate(events: Event[]): Event[];
    validate(event: Event): boolean;
}

// Specific collectors
class IsthmusCollector implements DataCollector {
    // Web scraping with Playwright
}

class VenuePartnershipCollector implements DataCollector {
    // API or RSS feed integration
}

class UserSubmissionCollector implements DataCollector {
    // User-generated content processing
}
```

### Background Processing
```typescript
// Job types
type JobType = 
    | 'collect_events'
    | 'process_event_batch' 
    | 'update_search_index'
    | 'send_notifications'
    | 'cleanup_old_events';

// Scheduled jobs
const jobs = {
    collect_events: '0 */2 * * *', // Every 2 hours
    cleanup_old_events: '0 2 * * *', // Daily at 2am
    update_search_index: '*/15 * * * *', // Every 15 minutes
};
```

## API Design

### RESTful Endpoints
```typescript
// Event endpoints
GET    /api/events                 // List events with filters
GET    /api/events/:id             // Get event details  
POST   /api/events                 // Create event (admin/partner)
PUT    /api/events/:id             // Update event
DELETE /api/events/:id             // Delete event

// Search endpoints
GET    /api/search/events          // Search events
GET    /api/search/venues          // Search venues
GET    /api/search/suggest         // Autocomplete suggestions

// User endpoints
POST   /api/auth/login             // User authentication
GET    /api/users/me               // Current user profile
POST   /api/users/me/save-event   // Save event
GET    /api/users/me/saved-events // Get saved events
```

### Query Parameters
```typescript
// Event listing filters
interface EventFilters {
    category?: EventCategory[];
    date_from?: string; // ISO date
    date_to?: string;
    latitude?: number;
    longitude?: number;
    radius?: number; // meters
    price_max?: number; // cents
    venue_id?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
}
```

## Security Architecture

### Authentication & Authorization
```typescript
// JWT token structure
interface JWTPayload {
    userId: string;
    email: string;
    role: 'user' | 'admin' | 'partner';
    iat: number;
    exp: number;
}

// Role-based permissions
const permissions = {
    user: ['read:events', 'save:events', 'submit:events'],
    partner: ['create:events', 'update:own_events'],
    admin: ['*'] // All permissions
};
```

### Data Privacy
- No user tracking or analytics cookies
- Minimal data collection (email, preferences only)  
- GDPR/CCPA compliant data handling
- Optional account creation for basic features

## Performance Optimization

### Caching Strategy
```typescript
// Cache layers
const cacheConfig = {
    // Redis cache keys and TTL
    events_list: '1 hour',
    event_detail: '2 hours', 
    venue_list: '6 hours',
    search_results: '30 minutes',
    user_preferences: '1 day'
};

// Database optimization
const dbOptimization = {
    indexes: [
        'events(start_datetime, category)',
        'events(venue_id, start_datetime)',
        'venues(latitude, longitude)', // Geospatial index
        'events_search(search_vector)' // Full-text search
    ]
};
```

### Scalability Considerations
- Horizontal scaling with load balancers
- Database read replicas for search queries
- CDN for static assets and images
- Queue-based processing for data collection

## Monitoring & Observability

### Logging Strategy
```typescript
// Structured logging with Winston
const logger = winston.createLogger({
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Key metrics to track
const metrics = [
    'event_collection_success_rate',
    'api_response_times',
    'search_query_performance', 
    'user_engagement_metrics',
    'data_source_health'
];
```

### Health Checks
```typescript
// Application health endpoints
GET /health                 // Basic health check
GET /health/detailed        // Database, Redis, external API status
GET /metrics               // Prometheus-compatible metrics
```

## Deployment Architecture

### Development Environment
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  app:
    build: .
    environment:
      - NODE_ENV=development
    volumes:
      - ./src:/app/src
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: local_events_dev
  
  redis:
    image: redis:7-alpine
```

### Production Deployment
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    image: local-events:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

## Future Scalability

### Phase 1: Madison MVP
- Single city focus
- Manual curation with basic automation
- 1-2 data sources

### Phase 2: Regional Expansion  
- Wisconsin cities (Milwaukee, Green Bay)
- Automated data collection pipeline
- Partner venue integrations

### Phase 3: Multi-State Platform
- Midwest cities expansion
- Advanced personalization algorithms
- Mobile applications
- API for third-party developers

This architecture provides a solid foundation for building a privacy-focused, scalable event discovery platform that can grow from a Madison MVP to a regional solution.