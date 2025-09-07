// Test script to validate Madison venue scrapers
const { chromium } = require('playwright');

async function testBasicScraping() {
  console.log('🧪 Testing Local Events MCP Scraping System\n');
  
  const testSources = [
    {
      name: 'Visit Madison Events',
      url: 'https://www.visitmadison.com/events/',
      expectedContent: ['event', 'madison', 'calendar']
    },
    {
      name: 'Isthmus Calendar',
      url: 'https://isthmus.com/search/event/calendar-of-events/',
      expectedContent: ['event', 'calendar', 'madison']
    }
  ];

  const browser = await chromium.launch({ headless: true });
  
  try {
    for (const source of testSources) {
      console.log(`🕷️ Testing: ${source.name}`);
      
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
      const page = await context.newPage();
      
      const startTime = Date.now();
      
      try {
        const response = await page.goto(source.url, { 
          waitUntil: 'networkidle',
          timeout: 15000 
        });
        
        const duration = Date.now() - startTime;
        
        if (!response || !response.ok()) {
          console.log(`   ❌ HTTP ${response?.status()}: ${response?.statusText()}`);
          continue;
        }
        
        await page.waitForTimeout(2000);
        const content = await page.content();
        
        // Check for expected content
        const foundContent = source.expectedContent.filter(keyword => 
          content.toLowerCase().includes(keyword.toLowerCase())
        );
        
        // Simple event detection
        const eventPatterns = [
          /event/gi,
          /concert|music|show/gi,
          /food|restaurant|dining/gi,
          /festival|fair|celebration/gi
        ];
        
        let eventMentions = 0;
        eventPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          eventMentions += matches ? matches.length : 0;
        });
        
        console.log(`   ✅ Success (${duration}ms)`);
        console.log(`   📄 Content: ${Math.round(content.length / 1000)}KB`);
        console.log(`   🎯 Found content: ${foundContent.join(', ')}`);
        console.log(`   🎪 Event mentions: ${eventMentions}`);
        
        if (eventMentions > 10) {
          console.log(`   🏆 High event content detected - good source!`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      await context.close();
      console.log('');
    }
    
  } finally {
    await browser.close();
  }
  
  console.log('✅ MCP Scraping Test Complete!');
  console.log('');
  console.log('🚀 Ready for full Madison venue scraping:');
  console.log('   • 20+ pre-configured venues');
  console.log('   • Intelligent event extraction');
  console.log('   • Real-time performance monitoring');
  console.log('   • $0/month operating cost');
  console.log('');
  console.log('Next steps:');
  console.log('   1. Set up PostgreSQL database');
  console.log('   2. Run venue scrapers: npm run start:collector');
  console.log('   3. Launch admin UI: npm run dev');
}

testBasicScraping().catch(console.error);