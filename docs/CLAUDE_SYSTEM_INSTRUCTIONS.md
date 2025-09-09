# 🤖 Claude Code System Instructions for Local Events Platform

**Created:** September 7, 2025  
**Version:** 2025.1  
**Platform:** Local Events - Madison Event Discovery

---

## 🎯 **Project Context & Purpose**

The Local Events platform is a **privacy-focused, cloud-native event discovery application** built for Madison, Wisconsin, with architecture designed for easy replication in any city. It serves as a Facebook-free alternative for discovering local food, music, and cultural events.

### **Core Values**
- **Privacy-First**: No tracking, no external analytics, no surveillance capitalism
- **Community-Driven**: User-submitted venues with approval workflows
- **Open Source**: Complete transparency and community contributions
- **Performance-Focused**: Core Web Vitals excellence and fast loading
- **Security-Hardened**: Enterprise-grade security with defense-in-depth

---

## 🏗️ **Architecture & Technology Stack**

### **Primary Technologies**
```typescript
// Frontend & Framework
Next.js 14 (App Router)           // React framework with SSR/SSG
TypeScript 5.0+                   // Type safety throughout
Tailwind CSS 3.4                  // Utility-first styling
React 18                          // UI library with concurrent features

// Backend & Database
Prisma ORM                        // Database abstraction with SQLite/PostgreSQL
SQLite (dev) / PostgreSQL (prod)  // Database engines
Redis (optional)                  // Caching and session storage

// Testing & Quality
Vitest                           // Modern unit testing framework
Playwright                       // E2E testing with cross-browser support
Jest (legacy)                    // Existing test compatibility
ESLint + TypeScript              // Code quality and type checking

// Performance & Optimization
Service Workers                  // PWA capabilities and offline support
Multi-layer Caching             // Redis + in-memory + CDN caching
Bundle Optimization             // Code splitting and tree shaking
Image Optimization              // WebP/AVIF with Next.js Image component

// Security & Validation
Zod                             // Schema validation and type safety
CSP Headers                     // Content Security Policy protection
Rate Limiting                   // Request throttling and abuse prevention
Input Sanitization              // XSS and injection protection
```

### **Key Architectural Patterns**
- **API-First Design**: RESTful APIs with OpenAPI documentation
- **Component-Based Architecture**: Reusable React components with TypeScript
- **Database-First Modeling**: Prisma schema as source of truth
- **Caching Strategy**: Multi-layer with intelligent invalidation
- **Security Middleware**: Request validation and rate limiting
- **Progressive Enhancement**: Core functionality without JavaScript

---

## 🛡️ **Security Guidelines**

### **Authentication & Authorization**
- **Current State**: Anonymous browsing by design (privacy-focused)
- **Future Considerations**: Optional user accounts for personalization
- **Admin Access**: Separate admin interface for content moderation

### **Input Validation & Sanitization**
```typescript
// Always use Zod schemas for validation
import { EventFiltersSchema, validateRequest } from '@/lib/validation';

const validation = validateRequest(EventFiltersSchema, input);
if (!validation.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
```

### **Security Headers & CSP**
- **Comprehensive CSP**: Strict Content Security Policy with nonce support
- **Security Headers**: HSTS, COEP, COOP, X-Frame-Options, etc.
- **Rate Limiting**: Intelligent throttling with Redis backing
- **Request Filtering**: Automated suspicious pattern detection

### **Data Protection**
- **No External Tracking**: Zero third-party analytics or tracking pixels
- **Local Data Storage**: All user data stays within the application
- **GDPR Compliance**: Privacy-by-design architecture
- **Secure Environment Variables**: Proper secrets management

---

## ⚡ **Performance Standards**

### **Core Web Vitals Targets**
```javascript
// Performance Metrics (2025 Standards)
LCP (Largest Contentful Paint): < 2.5 seconds
FID (First Input Delay): < 100 milliseconds
CLS (Cumulative Layout Shift): < 0.1
TTFB (Time to First Byte): < 600 milliseconds
```

### **Optimization Techniques**
- **Image Optimization**: Use Next.js Image component with WebP/AVIF
- **Code Splitting**: Dynamic imports for non-critical components
- **Database Queries**: Selective field loading with Prisma
- **Caching Strategy**: Multi-layer caching with Redis + CDN
- **Bundle Analysis**: Regular bundle size monitoring and optimization

---

## 🧪 **Testing Requirements**

### **Testing Strategy Hierarchy**
```bash
# Unit Tests (Vitest) - 80%+ coverage target
npm run test:unit              # Fast, isolated component/function testing
npm run test:coverage          # Coverage reporting with C8

# Integration Tests (Jest) - Existing API tests
npm run test                   # Database and API integration testing

# E2E Tests (Playwright) - Critical user journeys
npm run test:e2e              # Cross-browser functional testing

# Performance Tests - Automated Core Web Vitals
npm run perf:test             # Performance regression detection
```

### **Testing Patterns**
- **Page Object Model**: Playwright E2E tests using POM pattern
- **Mock Service Worker**: MSW for API mocking in unit tests
- **Visual Regression**: Screenshot comparison for UI consistency
- **Accessibility Testing**: WCAG compliance verification
- **Performance Monitoring**: Automated Core Web Vitals tracking

---

## 📊 **Development Workflow**

### **Code Quality Standards**
```typescript
// TypeScript Configuration
"strict": true,                    // Strict mode enabled
"noUncheckedIndexedAccess": true, // Array access safety
"exactOptionalPropertyTypes": true // Optional property strictness

// ESLint Rules (Performance-focused)
"@typescript-eslint/no-floating-promises": "error",
"@typescript-eslint/prefer-nullish-coalescing": "error",
"@typescript-eslint/prefer-optional-chain": "error",
```

### **Git Workflow & Commit Standards**
- **Branch Protection**: Main branch requires review and passing tests
- **Commit Messages**: Conventional commits with emoji prefixes
- **Pre-commit Hooks**: Linting, type checking, and security scanning
- **Automated Testing**: All tests must pass before merge

### **Environment Management**
```bash
# Development Commands
npm run dev:oneclick           # One-click development setup
npm run dev:clean              # Clean development environment
npm run validate:env           # Environment validation

# Security Commands
npm run security:audit         # NPM audit for vulnerabilities
npm run security:scan          # Custom security pattern scanning

# Performance Commands
npm run perf:monitor          # Real-time performance monitoring
npm run analyze               # Bundle size analysis
```

---

## 🎨 **UI/UX Guidelines**

### **Design System**
- **Tailwind CSS**: Utility-first styling with consistent spacing
- **Color Palette**: Madison-themed colors with accessibility compliance
- **Typography**: Inter font family with display: swap optimization
- **Components**: Reusable components with TypeScript props
- **Responsive Design**: Mobile-first with breakpoint consistency

### **Accessibility Requirements**
- **WCAG 2.1 AA Compliance**: Automated testing with axe-core
- **Semantic HTML**: Proper ARIA labels and roles
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Descriptive text and announcements
- **Color Contrast**: Minimum 4.5:1 ratio for text

### **Progressive Web App Features**
- **Service Worker**: Offline-first capabilities with background sync
- **App Manifest**: Install prompts and native app-like experience
- **Push Notifications**: Optional event reminders (future feature)
- **Offline Functionality**: Cached content for network failures

---

## 🚀 **Deployment & Operations**

### **Environment Configurations**
```typescript
// Environment Variables (Required)
DATABASE_URL                   // Database connection string
NODE_ENV                      // Environment mode (development/production/test)

// Optional Performance Variables
REDIS_URL                     // Redis connection for caching
LOCAL_EVENTS_API_URL          // API base URL for client connections
```

### **Deployment Targets**
- **Development**: Local development with SQLite and hot reloading
- **Staging**: Production-like environment with PostgreSQL
- **Production**: Optimized build with CDN, caching, and monitoring
- **Docker**: Containerized deployment for any cloud platform

### **Monitoring & Observability**
- **Health Endpoints**: `/api/health` for service monitoring
- **Performance Monitoring**: Core Web Vitals tracking
- **Error Reporting**: Structured error logging and alerting
- **Security Monitoring**: Automated vulnerability scanning

---

## 🔧 **Common Development Tasks**

### **Adding New API Endpoints**
1. **Create Zod Schema**: Define validation in `lib/validation.ts`
2. **Implement Route**: Create in `app/api/[endpoint]/route.ts`
3. **Add Input Validation**: Use `validateRequest` helper
4. **Implement Caching**: Use `withCache` for performance
5. **Write Tests**: Unit tests with Vitest, integration with Jest
6. **Update Documentation**: Add to API documentation

### **Adding New Components**
1. **TypeScript Interface**: Define component props interface
2. **Accessibility**: Include ARIA labels and semantic HTML
3. **Responsive Design**: Mobile-first Tailwind classes
4. **Performance**: Use React.memo for expensive components
5. **Testing**: Unit tests with React Testing Library
6. **Storybook**: Component documentation (future)

### **Database Schema Changes**
1. **Update Prisma Schema**: Modify `prisma/schema.prisma`
2. **Generate Migration**: `npm run db:generate`
3. **Test Locally**: `npm run db:push` for development
4. **Update Types**: Regenerate Prisma client types
5. **Update Validation**: Modify Zod schemas accordingly
6. **Write Tests**: Database operation tests

---

## 🌍 **Multi-City Deployment**

### **Fork Strategy**
- **Core Platform**: Shared codebase with city-specific configuration
- **Customization Points**: City name, colors, venue sources, neighborhoods
- **Configuration Files**: City-specific environment variables
- **Content Management**: Local venue and event source management

### **Scaling Considerations**
- **Database**: PostgreSQL for production, horizontal scaling ready
- **Caching**: Redis cluster for distributed caching
- **CDN**: Static asset distribution and edge caching
- **Load Balancing**: Horizontal scaling with session affinity
- **Monitoring**: City-specific metrics and alerting

---

## 📚 **Documentation Standards**

### **Code Documentation**
- **TypeScript**: Comprehensive type definitions and JSDoc comments
- **API Documentation**: OpenAPI/Swagger specifications
- **Component Documentation**: Props interfaces and usage examples
- **Architecture Documentation**: System design and data flow diagrams

### **User Documentation**
- **README**: Clear setup and contribution instructions
- **Deployment Guide**: Step-by-step deployment instructions
- **API Guide**: Complete API reference with examples
- **Fork Guide**: City-specific deployment instructions

---

## 🔮 **Future Roadmap & Extensibility**

### **Planned Features**
- **Mobile App**: React Native application with shared API
- **Federation**: Multi-city event sharing and discovery
- **AI Integration**: Intelligent event recommendations
- **Venue Dashboard**: Self-service event management for venues
- **Advanced Analytics**: Privacy-compliant usage insights

### **Architecture Evolution**
- **Microservices**: Service splitting for scaling (events, venues, search)
- **GraphQL**: API evolution for complex query requirements
- **Real-time Features**: WebSocket support for live updates
- **Machine Learning**: Event categorization and recommendation engine
- **Blockchain Integration**: Decentralized event ticketing (experimental)

---

## ⚠️ **Important Reminders**

### **Security First**
- **Never Log Secrets**: No sensitive data in console.log or logs
- **Validate All Inputs**: Use Zod schemas for all user input
- **Sanitize HTML**: Prevent XSS with proper sanitization
- **Rate Limiting**: Protect against abuse and DoS attacks

### **Performance Focus**
- **Optimize Images**: Use Next.js Image component with proper sizing
- **Cache Strategically**: Multi-layer caching with appropriate TTLs
- **Monitor Bundle Size**: Regular analysis and optimization
- **Test Performance**: Automated Core Web Vitals monitoring

### **Privacy Commitment**
- **No Tracking**: Maintain zero external tracking commitment
- **Local Data**: Keep all user data within the application
- **Transparent**: Open source with clear privacy policies
- **User Control**: Respect user preferences and data choices

---

**This platform represents the gold standard for 2025 web application development - secure, performant, accessible, and privacy-focused.** 

*Generated by Claude Code - September 7, 2025*