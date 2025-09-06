# Firecrawl Integration Guide for Local Events Platform

## Overview

This guide covers integrating Firecrawl API into the Local Events platform for advanced web scraping capabilities, particularly for social media event data extraction.

## Setup and Configuration

### Installation
```bash
cd "Local Events"
npm install @mendable/firecrawl-js
```

### API Key Configuration
```typescript
// .env file
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
FIRECRAWL_TIMEOUT=30000
FIRECRAWL_MAX_RETRIES=3

// config/firecrawl.ts
export const firecrawlConfig = {
  apiKey: process.env.FIRECRAWL_API_KEY,
  timeout: parseInt(process.env.FIRECRAWL_TIMEOUT) || 30000,
  maxRetries: parseInt(process.env.FIRECRAWL_MAX_RETRIES) || 3
};
```

### Basic Integration
```typescript
// services/FirecrawlService.ts
import FirecrawlApp from '@mendable/firecrawl-js';
import { firecrawlConfig } from '../config/firecrawl';

export class FirecrawlService {
  private app: FirecrawlApp;
  
  constructor() {
    this.app = new FirecrawlApp({ 
      apiKey: firecrawlConfig.apiKey 
    });
  }
  
  async scrapeUrl(url: string, options = {}) {
    try {
      return await this.app.scrapeUrl(url, options);
    } catch (error) {
      console.error('Firecrawl scraping error:', error);
      throw error;
    }
  }
}
```

## Event Data Extraction Patterns

### Instagram Business Page Scraping
```typescript
// collectors/InstagramEventCollector.ts
export class InstagramEventCollector {
  constructor(private firecrawl: FirecrawlService) {}
  
  async collectEvents(pageUrl: string): Promise<Event[]> {
    const result = await this.firecrawl.scrapeUrl(pageUrl, {
      formats: ['markdown', 'extract'],
      actions: [
        { type: 'wait', milliseconds: 5000 },
        { type: 'screenshot' }
      ],
      extractSchema: {
        type: "object",
        properties: {
          posts: {
            type: "array",
            items: {
              type: "object", 
              properties: {
                text: { type: "string" },
                date: { type: "string" },
                hasEventKeywords: { type: "boolean" },
                eventDetails: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    date: { type: "string" },
                    time: { type: "string" },
                    location: { type: "string" },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    return this.parseInstagramEvents(result);
  }
  
  private parseInstagramEvents(scrapedData: any): Event[] {
    // Process scraped data into Event objects
    const events: Event[] = [];
    
    if (scrapedData.data.extract?.posts) {
      for (const post of scrapedData.data.extract.posts) {
        if (post.hasEventKeywords && post.eventDetails) {
          events.push({
            id: generateId(),
            title: post.eventDetails.title,
            description: post.eventDetails.description,
            startDateTime: parseEventDate(post.eventDetails.date, post.eventDetails.time),
            location: post.eventDetails.location,
            source: 'instagram',
            sourceUrl: post.url,
            category: inferEventCategory(post.text),
            rawData: post
          });
        }
      }
    }
    
    return events;
  }
}
```

### Facebook Page Event Extraction
```typescript
// collectors/FacebookEventCollector.ts
export class FacebookEventCollector {
  constructor(private firecrawl: FirecrawlService) {}
  
  async collectEvents(pageUrl: string): Promise<Event[]> {
    const result = await this.firecrawl.scrapeUrl(pageUrl, {
      formats: ['markdown', 'extract'],
      actions: [
        { type: 'wait', milliseconds: 8000 }
      ],
      includeTags: ['article', 'div[role="article"]'],
      extractSchema: {
        type: "object",
        properties: {
          eventPosts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                content: { type: "string" },
                timestamp: { type: "string" },
                eventTitle: { type: "string" },
                eventDate: { type: "string" },
                eventLocation: { type: "string" },
                eventDescription: { type: "string" },
                isEvent: { type: "boolean" }
              }
            }
          }
        }
      }
    });
    
    return this.parseFacebookEvents(result);
  }
  
  private parseFacebookEvents(scrapedData: any): Event[] {
    const events: Event[] = [];
    
    if (scrapedData.data.extract?.eventPosts) {
      for (const post of scrapedData.data.extract.eventPosts) {
        if (post.isEvent) {
          events.push({
            id: generateId(),
            title: post.eventTitle,
            description: post.eventDescription,
            startDateTime: new Date(post.eventDate),
            location: post.eventLocation,
            source: 'facebook',
            sourceUrl: pageUrl,
            category: inferEventCategory(post.content),
            rawData: post
          });
        }
      }
    }
    
    return events;
  }
}
```

## Advanced Scraping Configurations

### Anti-Bot Optimization
```typescript
// Enhanced scraping with stealth mode
const stealthConfig = {
  formats: ['markdown', 'extract'],
  actions: [
    { type: 'wait', milliseconds: 3000 },
    { type: 'scroll', direction: 'down' },
    { type: 'wait', milliseconds: 2000 }
  ],
  timeout: 45000,
  waitFor: 'networkidle'
};

// Usage for protected pages
const result = await firecrawl.scrapeUrl(protectedUrl, stealthConfig);
```

### Batch Processing for Multiple Sources
```typescript
// services/BatchEventCollector.ts
export class BatchEventCollector {
  constructor(private firecrawl: FirecrawlService) {}
  
  async collectFromMultipleSources(sources: EventSource[]): Promise<Event[]> {
    const batchSize = 5; // Respect rate limits
    const allEvents: Event[] = [];
    
    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize);
      const promises = batch.map(source => this.scrapeSource(source));
      
      try {
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            allEvents.push(...result.value);
            console.log(`✅ Successfully scraped: ${batch[index].url}`);
          } else {
            console.error(`❌ Failed to scrape: ${batch[index].url}`, result.reason);
          }
        });
        
        // Rate limiting between batches
        if (i + batchSize < sources.length) {
          await this.delay(2000);
        }
        
      } catch (error) {
        console.error('Batch processing error:', error);
      }
    }
    
    return allEvents;
  }
  
  private async scrapeSource(source: EventSource): Promise<Event[]> {
    switch (source.platform) {
      case 'instagram':
        return new InstagramEventCollector(this.firecrawl).collectEvents(source.url);
      case 'facebook':
        return new FacebookEventCollector(this.firecrawl).collectEvents(source.url);
      default:
        return this.genericScrape(source);
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Error Handling and Retry Logic

### Robust Error Handling
```typescript
// services/RobustFirecrawlService.ts
export class RobustFirecrawlService extends FirecrawlService {
  async scrapeWithRetry(
    url: string, 
    options: any = {}, 
    maxRetries: number = 3
  ): Promise<any> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} for ${url}`);
        
        const result = await this.scrapeUrl(url, {
          ...options,
          timeout: options.timeout || 30000
        });
        
        if (result.success) {
          return result;
        } else {
          throw new Error(result.error || 'Scraping failed');
        }
        
      } catch (error) {
        lastError = error as Error;
        
        console.log(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`Waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
  }
}
```

### Fallback Strategies
```typescript
// collectors/HybridEventCollector.ts
export class HybridEventCollector {
  constructor(
    private firecrawl: FirecrawlService,
    private playwright: PlaywrightService
  ) {}
  
  async collectEventsWithFallback(source: EventSource): Promise<Event[]> {
    try {
      // Try Firecrawl first for advanced anti-bot capabilities
      console.log(`🔥 Trying Firecrawl for: ${source.url}`);
      return await new InstagramEventCollector(this.firecrawl)
        .collectEvents(source.url);
        
    } catch (firecrawlError) {
      console.log(`⚠️ Firecrawl failed, falling back to Playwright:`, firecrawlError.message);
      
      try {
        // Fallback to Playwright MCP
        return await new PlaywrightEventCollector(this.playwright)
          .collectEvents(source.url);
          
      } catch (playwrightError) {
        console.error(`❌ Both methods failed for ${source.url}`);
        console.error('Firecrawl error:', firecrawlError.message);
        console.error('Playwright error:', playwrightError.message);
        
        // Return empty array to continue processing other sources
        return [];
      }
    }
  }
}
```

## Cost Optimization Strategies

### Request Optimization
```typescript
// Cost-aware scraping configuration
const costOptimizedConfig = {
  onlyMainContent: true,        // Reduce data transfer
  formats: ['markdown'],        // Only needed format
  timeout: 15000,              // Faster timeout
  actions: [                   // Minimal actions
    { type: 'wait', milliseconds: 3000 }
  ]
};

// Smart caching to avoid duplicate requests
export class CachedFirecrawlService extends FirecrawlService {
  private cache = new Map<string, { data: any, timestamp: number }>();
  private cacheTimeout = 60 * 60 * 1000; // 1 hour
  
  async scrapeWithCache(url: string, options = {}): Promise<any> {
    const cacheKey = `${url}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📋 Using cached result for: ${url}`);
      return cached.data;
    }
    
    const result = await this.scrapeUrl(url, options);
    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  }
}
```

## Monitoring and Analytics

### Usage Tracking
```typescript
// services/FirecrawlAnalytics.ts
export class FirecrawlAnalytics {
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalCost: 0,
    averageResponseTime: 0
  };
  
  trackRequest(url: string, success: boolean, responseTime: number, estimatedCost: number) {
    this.stats.totalRequests++;
    this.stats.totalCost += estimatedCost;
    
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }
    
    // Update average response time
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime + responseTime) / 2;
    
    console.log(`📊 Firecrawl Stats:`, {
      successRate: `${((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(1)}%`,
      totalCost: `$${this.stats.totalCost.toFixed(4)}`,
      avgResponseTime: `${this.stats.averageResponseTime.toFixed(0)}ms`
    });
  }
}
```

## Testing Framework Integration

### Comprehensive Testing
```bash
# Run Firecrawl tests
cd "Local Events"
node test-firecrawl.js YOUR_API_KEY

# Or set environment variable
export FIRECRAWL_API_KEY=your_key_here
node test-firecrawl.js
```

### Automated Testing Pipeline
```typescript
// tests/firecrawl.test.ts
import { FirecrawlService } from '../services/FirecrawlService';

describe('Firecrawl Social Media Scraping', () => {
  let firecrawl: FirecrawlService;
  
  beforeAll(() => {
    firecrawl = new FirecrawlService();
  });
  
  it('should scrape Instagram business page', async () => {
    const result = await firecrawl.scrapeUrl('https://www.instagram.com/isthmusmadison/', {
      formats: ['markdown'],
      timeout: 20000
    });
    
    expect(result.success).toBe(true);
    expect(result.data.markdown).toContain('Isthmus');
  });
  
  it('should extract event data from scraped content', async () => {
    const collector = new InstagramEventCollector(firecrawl);
    const events = await collector.collectEvents('https://www.instagram.com/isthmusmadison/');
    
    expect(Array.isArray(events)).toBe(true);
    // Test event structure
  });
});
```

## Production Deployment

### Environment Configuration
```bash
# .env.production
FIRECRAWL_API_KEY=your_production_api_key
FIRECRAWL_TIMEOUT=45000
FIRECRAWL_MAX_RETRIES=3
FIRECRAWL_BATCH_SIZE=3
FIRECRAWL_CACHE_TIMEOUT=3600000

# Node.js production settings
NODE_ENV=production
```

### Docker Integration
```dockerfile
# Dockerfile addition for Firecrawl
ENV FIRECRAWL_API_KEY=""
ENV FIRECRAWL_TIMEOUT=30000

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production
```

## Legal and Compliance

### Terms of Service Compliance
```typescript
// Implement respectful scraping practices
const complianceConfig = {
  respectRobotsTxt: true,      // Honor robots.txt (if supported)
  rateLimitMs: 2000,           // 2 second delays between requests
  maxConcurrent: 2,            // Limit concurrent requests
  timeout: 30000,              // Reasonable timeout
  userAgent: 'Local Events Platform v1.0' // Identify your scraper
};
```

### Data Privacy
```typescript
// Only collect public data
const privacyCompliantSchema = {
  type: "object", 
  properties: {
    publicPosts: {
      // Only extract public event information
      type: "array",
      items: {
        type: "object",
        properties: {
          eventTitle: { type: "string" },
          eventDate: { type: "string" },
          eventLocation: { type: "string" },
          // Do NOT include personal user information
        }
      }
    }
  }
};
```

## Next Steps

1. **Get API Key**: Obtain Firecrawl API key for testing
2. **Run Tests**: Execute comprehensive test suite
3. **Integrate Gradually**: Start with one social media source
4. **Monitor Usage**: Track costs and success rates
5. **Optimize**: Refine extraction schemas and configurations
6. **Scale**: Expand to additional data sources as needed

This integration approach provides a robust foundation for social media event data extraction while maintaining cost efficiency and legal compliance.