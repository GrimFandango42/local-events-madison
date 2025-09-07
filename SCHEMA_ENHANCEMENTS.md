# Enhanced Prisma Schema - Local Events Platform

This document outlines the comprehensive enhancements made to the Prisma schema to support multi-city deployment, advanced deduplication, federation readiness, and privacy-focused user management.

## 🎯 Key Improvements Overview

### 1. **Normalized Neighborhoods System**
- **Problem Solved**: Original schema used a simple string field for neighborhoods
- **Enhancement**: Created dedicated `Neighborhood` model with relationships
- **Benefits**:
  - Consistent neighborhood naming across venues
  - Geographic boundary support with GeoJSON polygons
  - Better filtering and search capabilities
  - City-specific neighborhood management

### 2. **Advanced Event Deduplication**
- **Problem Solved**: No systematic way to handle duplicate events from multiple sources
- **Enhancement**: Multi-layer deduplication system with hash-based detection
- **Features**:
  - `deduplicationHash`: Hash of key event properties (title, time, location)
  - `contentHash`: Hash of full content for change detection
  - `titleHash`: Normalized title hash for fuzzy matching
  - `timeLocationHash`: Hash of time + location for venue-based duplicates
  - `DeduplicationStatus` enum: unique, potential, confirmed, merged
  - `canonicalEventId`: Points to master event for merged duplicates
  - `similarityScore`: ML-ready similarity scoring

### 3. **Multi-City Configuration System**
- **Problem Solved**: Hard-coded Madison-specific configuration
- **Enhancement**: Hierarchical Region → City → Neighborhood structure
- **Features**:
  - **Region Model**: State/country level configuration
  - **City Model**: Complete city-specific customization including:
    - Branding (logos, colors, taglines)
    - Geographic settings (timezone, default radius)
    - Federation settings (ActivityPub support)
    - Contact information
    - Instance configuration
  - Easy forking: New cities can be added with full customization

### 4. **Privacy-Focused User Management**
- **Problem Solved**: Need for user features while maintaining privacy
- **Enhancement**: Minimal data collection with strong privacy controls
- **Features**:
  - Optional email with hashed alternatives for deduplication
  - Anonymous usage by default (`isAnonymous: true`)
  - Explicit consent tracking for data retention and marketing
  - Soft deletion with `deletedAt` for GDPR compliance
  - Pseudonym support for user-chosen display names
  - Fine-grained privacy settings

### 5. **User Subscriptions and Notifications**
- **Enhancement**: Comprehensive subscription system for user engagement
- **Features**:
  - Multiple subscription types: email, push, SMS, RSS, webhooks
  - Granular filtering: categories, neighborhoods, keywords, price ranges
  - Flexible scheduling with timezone support
  - Delivery failure tracking and retry logic
  - User preference management

### 6. **Enhanced Source Management**
- **Problem Solved**: Limited source configuration and monitoring
- **Enhancement**: Professional-grade source management system
- **Features**:
  - City-specific sources for multi-city deployment
  - Advanced scraping configuration with authentication
  - Performance metrics and quality scoring
  - Rate limiting and politeness settings
  - Federation source support (ActivityPub)
  - Community submission and approval workflow

### 7. **Federation Readiness (ActivityPub)**
- **Enhancement**: Built-in support for decentralized event sharing
- **Features**:
  - ActivityPub IDs for events and cities
  - Federation inbox/outbox support
  - Public/private key management for signatures
  - Cross-instance event sharing capability
  - Maintains local control while enabling network effects

## 🏗️ Detailed Model Enhancements

### Region and City Models
```prisma
model Region {
  // Supports state/country level organization
  federationEnabled Boolean // Regional federation settings
  activityPubHandle String? // @madison@events.wi
}

model City {
  // Complete city customization
  displayName       String? // "Greater Madison Area"
  tagline          String?
  primaryColor     String? // Hex color for theming
  federationEnabled Boolean
  activityPubId    String? // Full ActivityPub ID
}
```

### Enhanced Event Model with Deduplication
```prisma
model Event {
  // Multi-hash deduplication system
  deduplicationHash     String? // Key properties hash
  contentHash          String? // Full content hash  
  titleHash            String? // Normalized title hash
  timeLocationHash     String? // Time + location hash
  deduplicationStatus  DeduplicationStatus
  canonicalEventId     String? // Master event reference
  similarityScore      Decimal? // ML similarity score
  
  // Rich content and metadata
  shortDescription     String? // For previews
  subcategory         String? // More specific than category
  isVirtualEvent      Boolean
  virtualEventUrl     String?
  
  // Enhanced organizer info
  organizerName       String?
  organizerEmail      String?
  organizerPhone      String?
  
  // Analytics ready
  viewCount           Int
  clickCount          Int
  shareCount          Int
}
```

### Privacy-First User Model
```prisma
model User {
  // Minimal required data
  email                String? // Optional!
  hashedEmail         String? // For deduplication
  isAnonymous         Boolean @default(true)
  
  // Explicit consent tracking
  dataRetentionConsent Boolean @default(false)
  marketingConsent    Boolean @default(false)
  allowsDataCollection Boolean @default(false)
  
  // Soft deletion for GDPR
  deletedAt           DateTime?
}
```

### Advanced Scraping and Monitoring
```prisma
model ScrapingLog {
  // Enhanced metrics
  duplicatesFound      Int
  duplicatesMerged     Int
  memoryUsage         Int? // Performance tracking
  cpuTime             Int?
  
  // Quality assessment
  dataQualityScore    Decimal?
  extractionAccuracy  Decimal?
  completenessScore   Decimal?
  
  // Bot detection
  botDetected         Boolean
  rateLimited         Boolean
}
```

## 🚀 Migration Strategy

### From Current Schema
1. **Add new models** (Region, City, Neighborhood, User, etc.)
2. **Migrate existing data**:
   - Create default Region and City for Madison
   - Extract neighborhoods from existing venue strings
   - Generate deduplication hashes for existing events
3. **Update foreign keys** to point to City instead of hardcoded values
4. **Backfill missing data** with sensible defaults

### Multi-City Deployment
1. **Create new City record** with custom branding
2. **Import neighborhoods** for the new city
3. **Configure city-specific sources** and venues
4. **Set up federation** if desired
5. **Launch with minimal user data collection**

## 🔒 Privacy and Security Features

### Data Minimization
- Users can participate anonymously
- Email is optional, hashed alternatives available
- Explicit consent required for data retention
- Soft deletion maintains referential integrity

### GDPR Compliance
- Right to be forgotten via soft deletion
- Data export capabilities through user preferences
- Consent tracking and management
- Minimal data collection by default

### Federation Security
- Public/private key cryptography for ActivityPub
- Source validation and rate limiting
- Content moderation capabilities
- Local control with optional federation

## 🎨 Customization Features

### City-Specific Branding
- Custom logos and hero images
- Configurable color schemes
- Custom taglines and descriptions
- Localized contact information

### Flexible Content Management
- Custom event categories per city
- Neighborhood-specific filtering
- Multi-language support ready
- Custom venue types and amenities

## 📊 Analytics and Monitoring Ready

### Event Analytics
- View, click, and share tracking
- Confidence and quality scoring
- Source performance metrics
- Deduplication effectiveness

### System Health
- Performance metrics collection
- Scraping success rates
- Error tracking and categorization
- Resource usage monitoring

### Community Features
- User submissions with voting
- Quality scoring for sources
- Community-driven content
- Moderation workflows

## 🌐 Federation and Scaling

### ActivityPub Integration
- Standard-compliant event sharing
- Decentralized network participation
- Local autonomy with global reach
- Cross-instance discovery

### Horizontal Scaling
- City-specific data partitioning
- Independent city instances
- Regional federation capabilities
- Load balancing ready

## 🔧 Developer Experience

### Clear Relationships
- Explicit foreign keys with proper cascading
- Comprehensive indexes for performance
- Rich enums for type safety
- JSON fields for flexible configuration

### Extensibility
- Plugin-ready architecture
- Configurable scraping methods
- Custom field support via JSON
- Event-driven architecture ready

This enhanced schema transforms the local events platform from a Madison-specific tool into a scalable, privacy-focused, federation-ready platform that can be easily deployed to any city while maintaining the community-driven, Facebook-free approach that makes it special.