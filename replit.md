# Local Events Platform

## Overview

The Local Events Platform is a privacy-focused web application for discovering and aggregating local events, currently configured for Madison, Wisconsin. The platform serves as a Facebook-free alternative for event discovery, focusing on food, music, and cultural events. Built with modern web technologies, it emphasizes user privacy, community-driven content, and scalable architecture that can be easily adapted for other cities.

The application aggregates events from multiple sources including venue websites, local media outlets, and user submissions. It features neighborhood-based filtering, event categorization, and a comprehensive admin interface for managing venues and event sources. The platform is designed to be completely self-hosted with no external tracking or analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses **Next.js 14 with App Router** as the primary frontend framework, providing server-side rendering and optimal performance. The UI is built with **React 18** and styled using **Tailwind CSS** with custom Madison-themed branding. TypeScript is used throughout for type safety, with strict mode enabled for comprehensive error checking.

Key frontend components include:
- **Event Discovery Interface**: Grid and list views with advanced filtering by neighborhood, category, and date
- **Interactive Map Integration**: Displays event locations with venue details
- **Source Management UI**: Admin interface for adding and managing event sources
- **Responsive Design**: Mobile-first approach with progressive enhancement

### Backend Architecture
The backend leverages **Next.js API Routes** for serverless functionality, with **Prisma ORM** providing type-safe database operations. The architecture supports both SQLite (development) and PostgreSQL (production) databases.

Core backend services include:
- **Event Collection Engine**: MCP-based web scraping using Playwright for automated event discovery
- **Data Processing Pipeline**: Event deduplication, categorization, and validation
- **Source Management System**: User-submitted venue and source approval workflows
- **Health Monitoring**: Comprehensive system health checks and performance metrics

### Data Storage Design
The database schema is designed for multi-city scalability with normalized relationships:
- **Venues**: Physical locations with detailed metadata and contact information
- **Event Sources**: Websites and feeds to scrape for events
- **Events**: Core event data with rich metadata and categorization
- **Scraping Logs**: Performance monitoring and debugging information

Advanced features include content hashing for deduplication, soft deletion for GDPR compliance, and geographic data support for location-based queries.

### Authentication and Security
The platform implements a **privacy-first security model** with comprehensive hardening:
- **No User Accounts Required**: Anonymous browsing by default with optional user features
- **Advanced Security Headers**: Content Security Policy, HSTS, frame protection
- **Input Validation**: Zod schema validation for all API endpoints
- **Rate Limiting**: Intelligent request throttling with Redis support
- **Security Scanning**: Automated vulnerability detection and monitoring

## External Dependencies

### Database Systems
- **Prisma ORM**: Type-safe database abstraction layer supporting SQLite and PostgreSQL
- **SQLite**: Development database with file-based storage
- **PostgreSQL**: Production database with geographic extensions for location queries
- **Redis**: Optional caching layer for session storage and rate limiting

### Web Scraping and Automation
- **Playwright**: Browser automation for venue website scraping
- **MCP (Model Context Protocol)**: Framework for browser automation and content extraction
- **Luxon**: Date and time parsing with timezone support for event scheduling

### Development and Testing
- **Vitest**: Modern unit testing framework with fast execution
- **Playwright Test**: Cross-browser end-to-end testing with visual regression
- **Jest**: Legacy test compatibility for integration testing
- **MSW (Mock Service Worker)**: API mocking for reliable testing

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with custom Madison branding
- **Lucide React**: Icon library for consistent visual elements
- **@tailwindcss/forms**: Enhanced form styling and accessibility
- **@tailwindcss/typography**: Rich text content styling

### API and Data Processing
- **Node Fetch**: HTTP client for external API requests
- **Zod**: Runtime type validation and schema definition
- **Critters**: CSS optimization for performance

The platform is designed to minimize external dependencies while maintaining high functionality, with all critical services capable of running locally without external API calls or third-party tracking services.