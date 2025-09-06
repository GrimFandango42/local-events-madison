-- Local Events Database Schema
-- Designed for Madison event aggregation with venue/restaurant sources

-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For location data

-- Enums for type safety
CREATE TYPE source_type AS ENUM (
    'government',          -- City/county websites
    'local_media',         -- Isthmus, newspapers
    'venue',              -- Concert halls, theaters
    'restaurant',         -- Restaurants with events
    'brewery',            -- Breweries with live music
    'cultural',           -- Museums, galleries
    'university',         -- UW-Madison venues
    'community',          -- Community centers
    'custom',             -- User-added sources
    'social_media',       -- Instagram/Facebook (via official APIs)
    'api_feed'            -- RSS, JSON feeds
);

CREATE TYPE source_status AS ENUM (
    'active',             -- Currently scraping
    'paused',            -- Temporarily disabled
    'failed',            -- Repeated failures
    'archived'           -- No longer relevant
);

CREATE TYPE venue_type AS ENUM (
    'restaurant',
    'bar',
    'brewery',
    'distillery',
    'coffee_shop',
    'concert_hall',
    'theater',
    'gallery',
    'museum',
    'community_center',
    'park',
    'university_venue',
    'government_facility',
    'sports_venue',
    'festival_ground',
    'food_truck',
    'market',
    'other'
);

CREATE TYPE event_category AS ENUM (
    'food',
    'music',
    'culture',
    'art',
    'theater',
    'festival',
    'market',
    'nightlife',
    'education',
    'community',
    'sports',
    'family',
    'business',
    'other'
);

CREATE TYPE scraping_method AS ENUM (
    'mcp_playwright',     -- Primary scraping method
    'crawlee',           -- Enhanced scraping with Crawlee
    'crawl4ai',          -- AI-powered extraction
    'api_official',      -- Official APIs
    'rss_feed',          -- RSS parsing
    'manual',            -- Manual entry
    'webhook'            -- Push notifications
);

-- Core venues/restaurants table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    venue_type venue_type NOT NULL,
    
    -- Location data
    address TEXT,
    city VARCHAR(100) DEFAULT 'Madison',
    state VARCHAR(2) DEFAULT 'WI',
    zip_code VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOMETRY(POINT, 4326), -- PostGIS point for spatial queries
    
    -- Contact information
    website VARCHAR(500),
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Social media
    instagram_handle VARCHAR(100),
    facebook_page VARCHAR(255),
    twitter_handle VARCHAR(100),
    
    -- Business details
    description TEXT,
    hours_of_operation JSONB, -- Store as flexible JSON
    price_range VARCHAR(10), -- $, $$, $$$, $$$$
    cuisine_type VARCHAR(100), -- For restaurants
    capacity INTEGER,
    
    -- Event hosting details
    hosts_events BOOLEAN DEFAULT true,
    event_calendar_url VARCHAR(500),
    typical_event_types TEXT[],
    
    -- Internal tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    verified BOOLEAN DEFAULT false, -- Manual verification by admin
    notes TEXT
);

-- Event sources (websites, feeds, pages to scrape)
CREATE TABLE event_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source identification
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL UNIQUE,
    source_type source_type NOT NULL,
    scraping_method scraping_method DEFAULT 'mcp_playwright',
    
    -- Association with venues
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    
    -- Scraping configuration
    scraping_config JSONB DEFAULT '{}', -- CSS selectors, wait times, etc.
    extraction_rules JSONB DEFAULT '{}', -- Rules for finding event data
    
    -- Scheduling
    scrape_frequency_hours INTEGER DEFAULT 6, -- How often to check
    last_scraped TIMESTAMPTZ,
    next_scrape_due TIMESTAMPTZ,
    
    -- Performance tracking
    status source_status DEFAULT 'active',
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    last_success TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    
    -- Content analysis
    typical_event_count INTEGER DEFAULT 0,
    event_keywords TEXT[], -- Words that indicate events on this source
    content_structure_notes TEXT,
    
    -- User management
    added_by_user_id UUID, -- Reference to users table when implemented
    is_custom_source BOOLEAN DEFAULT false,
    approval_status VARCHAR(20) DEFAULT 'approved', -- For user-submitted sources
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Events table (core data)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event identification
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category event_category NOT NULL,
    
    -- Timing
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'America/Chicago',
    all_day BOOLEAN DEFAULT false,
    recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- RRULE format for recurring events
    
    -- Location
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    custom_location TEXT, -- For events not at known venues
    location_notes TEXT,
    
    -- Pricing
    price_min INTEGER, -- In cents
    price_max INTEGER,
    price_description TEXT, -- "Free", "Suggested donation", etc.
    ticket_url VARCHAR(500),
    
    -- Content
    image_url VARCHAR(500),
    tags TEXT[],
    age_restriction VARCHAR(50), -- "21+", "All ages", "18+"
    capacity INTEGER,
    
    -- Source tracking
    source_id UUID REFERENCES event_sources(id) ON DELETE SET NULL,
    source_url VARCHAR(500), -- Original URL where found
    external_id VARCHAR(255), -- ID from source system
    
    -- Data quality
    confidence_score DECIMAL(3,2) DEFAULT 1.00, -- How confident we are in the data
    manual_review BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    scraped_at TIMESTAMPTZ,
    hash_content VARCHAR(64), -- For duplicate detection
    
    -- Search optimization
    search_vector TSVECTOR -- Full-text search
);

-- Scraping logs for monitoring and debugging
CREATE TABLE scraping_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES event_sources(id) ON DELETE CASCADE,
    
    -- Execution details
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL, -- success, failure, timeout
    scraping_method scraping_method NOT NULL,
    
    -- Results
    events_found INTEGER DEFAULT 0,
    events_new INTEGER DEFAULT 0,
    events_updated INTEGER DEFAULT 0,
    
    -- Performance
    duration_ms INTEGER,
    bytes_downloaded INTEGER,
    requests_made INTEGER,
    
    -- Error tracking
    error_message TEXT,
    error_type VARCHAR(100),
    stack_trace TEXT,
    
    -- Content analysis
    content_hash VARCHAR(64), -- To detect when page content changes
    page_title VARCHAR(500),
    response_status INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-submitted sources (for the UI feature)
CREATE TABLE user_source_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Submitted source details
    suggested_name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    source_type source_type,
    venue_name VARCHAR(255),
    
    -- Submission context
    user_ip_address INET,
    user_email VARCHAR(255),
    submission_reason TEXT,
    expected_event_types TEXT[],
    
    -- Review process
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- If approved, link to created records
    created_venue_id UUID REFERENCES venues(id),
    created_source_id UUID REFERENCES event_sources(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_start_datetime ON events(start_datetime);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_source_id ON events(source_id);
CREATE INDEX idx_events_search_vector ON events USING GIN(search_vector);
CREATE INDEX idx_events_location ON events(venue_id, start_datetime);
CREATE INDEX idx_events_hash_content ON events(hash_content); -- For duplicate detection

CREATE INDEX idx_venues_location ON venues USING GIST(location);
CREATE INDEX idx_venues_type ON venues(venue_type);
CREATE INDEX idx_venues_hosts_events ON venues(hosts_events) WHERE hosts_events = true;

CREATE INDEX idx_sources_status ON event_sources(status);
CREATE INDEX idx_sources_next_scrape ON event_sources(next_scrape_due) WHERE status = 'active';
CREATE INDEX idx_sources_venue_id ON event_sources(venue_id);
CREATE INDEX idx_sources_type ON event_sources(source_type);

CREATE INDEX idx_scraping_logs_source_id ON scraping_logs(source_id);
CREATE INDEX idx_scraping_logs_started_at ON scraping_logs(started_at);

-- Functions and triggers

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to main tables
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_sources_updated_at BEFORE UPDATE ON event_sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update search vector for events
CREATE OR REPLACE FUNCTION update_events_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' || 
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_search_vector_trigger 
    BEFORE INSERT OR UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_events_search_vector();

-- Calculate next scrape time
CREATE OR REPLACE FUNCTION calculate_next_scrape()
RETURNS TRIGGER AS $$
BEGIN
    NEW.next_scrape_due := NOW() + INTERVAL '1 hour' * NEW.scrape_frequency_hours;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_next_scrape_trigger 
    BEFORE INSERT OR UPDATE ON event_sources 
    FOR EACH ROW EXECUTE FUNCTION calculate_next_scrape();

-- Views for common queries

-- Active venues with upcoming events
CREATE VIEW active_venues_with_events AS
SELECT 
    v.*,
    COUNT(e.id) as upcoming_event_count,
    MAX(e.start_datetime) as next_event_date
FROM venues v
LEFT JOIN events e ON v.id = e.venue_id 
    AND e.start_datetime > NOW()
WHERE v.hosts_events = true
GROUP BY v.id;

-- Sources due for scraping
CREATE VIEW sources_due_for_scraping AS
SELECT 
    s.*,
    v.name as venue_name,
    EXTRACT(EPOCH FROM (NOW() - s.last_scraped))/3600 as hours_since_last_scrape
FROM event_sources s
LEFT JOIN venues v ON s.venue_id = v.id
WHERE s.status = 'active' 
    AND (s.next_scrape_due <= NOW() OR s.next_scrape_due IS NULL)
ORDER BY s.last_scraped ASC NULLS FIRST;

-- Recent scraping performance
CREATE VIEW scraping_performance_summary AS
SELECT 
    s.name,
    s.source_type,
    COUNT(sl.id) as total_scrapes_last_7_days,
    COUNT(CASE WHEN sl.status = 'success' THEN 1 END) as successful_scrapes,
    ROUND(AVG(sl.duration_ms), 0) as avg_duration_ms,
    SUM(sl.events_found) as total_events_found,
    MAX(sl.started_at) as last_scrape
FROM event_sources s
LEFT JOIN scraping_logs sl ON s.id = sl.source_id 
    AND sl.started_at > NOW() - INTERVAL '7 days'
GROUP BY s.id, s.name, s.source_type
ORDER BY successful_scrapes DESC;

-- Sample data for Madison

-- Insert some Madison venues
INSERT INTO venues (name, venue_type, address, website, instagram_handle, hosts_events) VALUES
('The Sylvee', 'concert_hall', '25 S Livingston St, Madison, WI 53703', 'https://thesylvee.com', 'thesylveemadison', true),
('Overture Center for the Arts', 'theater', '201 State St, Madison, WI 53703', 'https://overture.org', 'overturecenter', true),
('Great Dane Pub & Brewing Co.', 'brewery', '123 E Doty St, Madison, WI 53703', 'https://greatdanepub.com', 'greatdanepub', true),
('Memorial Union Terrace', 'university_venue', '800 Langdon St, Madison, WI 53706', 'https://union.wisc.edu', 'wiscunion', true),
('Isthmus Coffee & Tea', 'coffee_shop', '525 State St, Madison, WI 53703', 'https://isthmus.coffee', 'isthmuscoffee', true);

-- Insert some event sources
INSERT INTO event_sources (name, url, source_type, venue_id, scraping_config) VALUES
('Visit Madison Events', 'https://www.visitmadison.com/events/', 'government', NULL, 
 '{"selectors": {"events": ".event-item", "title": ".event-title", "date": ".event-date"}}'),
('Isthmus Calendar', 'https://isthmus.com/search/event/calendar-of-events/', 'local_media', NULL,
 '{"selectors": {"events": ".event-listing", "title": "h3", "date": ".date"}}'),
('The Sylvee Events', 'https://thesylvee.com/events/', 'venue', 
 (SELECT id FROM venues WHERE name = 'The Sylvee'), 
 '{"selectors": {"events": ".event-card", "title": ".event-name", "date": ".event-date"}}');

COMMENT ON TABLE venues IS 'Madison area venues, restaurants, and event locations';
COMMENT ON TABLE event_sources IS 'Websites and feeds to scrape for event data';
COMMENT ON TABLE events IS 'Core events table with all event information';
COMMENT ON TABLE scraping_logs IS 'Detailed logs of all scraping operations for monitoring';
COMMENT ON TABLE user_source_submissions IS 'User-submitted sources for admin review';