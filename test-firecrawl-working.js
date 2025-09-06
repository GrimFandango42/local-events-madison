// Working Firecrawl test with correct imports
const { FirecrawlClient } = require('@mendable/firecrawl-js');

async function testFirecrawlCapabilities(apiKey) {
  console.log('=== Firecrawl Social Media Scraping Test ===\n');
  
  if (!apiKey) {
    console.log('❌ No API key provided');
    return;
  }
  
  // Initialize with correct constructor
  const client = new FirecrawlClient({ apiKey });
  
  try {
    console.log('🔧 Firecrawl client initialized successfully');
    
    // Test 1: Simple connectivity test first
    await testConnectivity(client);
    
    // Test 2: Try scraping a public Instagram business page
    await testInstagramScraping(client);
    
    // Test 3: Try scraping a public Facebook page  
    await testFacebookScraping(client);
    
    // Test 4: Test with Madison event sources
    await testMadisonSources(client);
    
  } catch (error) {
    console.error('Test initialization failed:', error.message);
    console.error('This might be an API key issue or package version problem');
  }
}

async function testConnectivity(client) {
  console.log('1. Testing API connectivity...');
  
  try {
    // Test with a simple page first
    const testUrl = 'https://example.com';
    console.log(`   Testing: ${testUrl}`);
    
    const result = await client.scrape({ 
      url: testUrl,
      formats: ['markdown']
    });
    
    console.log('   ✅ API connectivity successful');
    console.log(`   📄 Content length: ${result.data?.markdown?.length || 0} chars`);
    console.log(`   💰 Request completed (1 API call used)`);
    
  } catch (error) {
    console.log(`   ❌ Connectivity error: ${error.message}`);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('   🔑 Authentication failed - check API key');
    } else if (error.message.includes('429')) {
      console.log('   🚦 Rate limited');
    } else if (error.message.includes('403')) {
      console.log('   🚫 Forbidden - API key may lack permissions');
    }
    
    throw error; // Stop tests if basic connectivity fails
  }
}

async function testInstagramScraping(client) {
  console.log('\n2. Testing Instagram business page...');
  
  try {
    const instagramUrl = 'https://www.instagram.com/isthmusmadison/';
    console.log(`   Target: ${instagramUrl}`);
    
    const startTime = Date.now();
    
    const result = await client.scrape({
      url: instagramUrl,
      formats: ['markdown'],
      waitFor: 5000,
      timeout: 30000
    });
    
    const endTime = Date.now();
    console.log(`   ⏱️ Response time: ${endTime - startTime}ms`);
    console.log(`   💰 Cost: 1 API call (~$0.001-0.01)`);
    
    if (result.success) {
      console.log('   ✅ Instagram scraping SUCCESSFUL!');
      console.log(`   📄 Content length: ${result.data?.markdown?.length || 0} chars`);
      
      if (result.data?.markdown) {
        // Analyze content quality
        const content = result.data.markdown;
        const eventKeywords = content.match(/event|concert|festival|food|music|cultural|happening|join us|save the date|tonight|tomorrow|this week/gi) || [];
        const datePatterns = content.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2})/gi) || [];
        
        console.log(`   🎯 Event keywords: ${eventKeywords.length} found`);
        console.log(`   📅 Date patterns: ${datePatterns.length} found`);
        
        if (eventKeywords.length > 0) {
          console.log(`   🎪 Sample keywords: ${eventKeywords.slice(0, 5).join(', ')}`);
        }
        
        // Show content preview
        const lines = content.split('\n').filter(line => line.trim().length > 20);
        if (lines.length > 0) {
          console.log(`   📝 Content sample: "${lines[0].substring(0, 100)}..."`);
        }
      }
      
    } else {
      console.log('   ❌ Instagram scraping failed');
      console.log('   Reason:', result.error || 'Unknown error');
    }
    
  } catch (error) {
    console.log(`   ❌ Instagram error: ${error.message}`);
    console.log(`   💰 Cost: 1 failed API call (still charged)`);
    
    if (error.message.includes('403')) {
      console.log('   🚫 Instagram blocked the request');
      console.log('   💡 This is where Firecrawl\'s anti-bot features should help');
    }
  }
}

async function testFacebookScraping(client) {
  console.log('\n3. Testing Facebook public page...');
  
  try {
    const facebookUrl = 'https://www.facebook.com/isthmusmadison';
    console.log(`   Target: ${facebookUrl}`);
    
    const startTime = Date.now();
    
    const result = await client.scrape({
      url: facebookUrl,
      formats: ['markdown'],
      waitFor: 8000,
      timeout: 45000
    });
    
    const endTime = Date.now();
    console.log(`   ⏱️ Response time: ${endTime - startTime}ms`);
    console.log(`   💰 Cost: 1 API call (~$0.001-0.01)`);
    
    if (result.success) {
      console.log('   ✅ Facebook scraping SUCCESSFUL!');
      console.log(`   📄 Content length: ${result.data?.markdown?.length || 0} chars`);
      
      if (result.data?.markdown) {
        const content = result.data.markdown;
        const eventKeywords = content.match(/event|concert|festival|food|music|cultural|happening|join us|save the date/gi) || [];
        
        console.log(`   🎯 Event keywords: ${eventKeywords.length} found`);
        
        // Look for specific Madison venues/locations
        const madisonKeywords = content.match(/madison|capitol|state street|university|downtown|isthmus|terrace|memorial union/gi) || [];
        console.log(`   🏛️ Madison references: ${madisonKeywords.length} found`);
        
        const lines = content.split('\n').filter(line => line.trim().length > 20);
        if (lines.length > 0) {
          console.log(`   📝 Content sample: "${lines[0].substring(0, 100)}..."`);
        }
      }
      
    } else {
      console.log('   ❌ Facebook scraping failed');
      console.log('   Reason:', result.error || 'Unknown error');
    }
    
  } catch (error) {
    console.log(`   ❌ Facebook error: ${error.message}`);
    console.log(`   💰 Cost: 1 failed API call (still charged)`);
    
    if (error.message.includes('403')) {
      console.log('   🚫 Facebook blocked the request');
    } else if (error.message.includes('timeout')) {
      console.log('   ⏰ Request timed out - Facebook is slow');
    }
  }
}

async function testMadisonSources(client) {
  console.log('\n4. Testing Madison event sources...');
  
  const madisonSources = [
    {
      name: 'Visit Madison Events',
      url: 'https://www.visitmadison.com/events/',
      expected: 'Should have structured event listings'
    },
    {
      name: 'Isthmus Calendar', 
      url: 'https://isthmus.com/search/event/calendar-of-events/',
      expected: 'Local event submissions'
    }
  ];
  
  for (const source of madisonSources) {
    try {
      console.log(`   Testing: ${source.name}`);
      
      const startTime = Date.now();
      const result = await client.scrape({
        url: source.url,
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 20000
      });
      const endTime = Date.now();
      
      console.log(`   ⏱️ ${source.name}: ${endTime - startTime}ms`);
      console.log(`   💰 Cost: 1 API call`);
      
      if (result.success) {
        console.log(`   ✅ ${source.name}: Success`);
        console.log(`   📄 Content: ${result.data?.markdown?.length || 0} chars`);
        
        // Look for event indicators
        if (result.data?.markdown) {
          const eventCount = (result.data.markdown.match(/event|concert|festival/gi) || []).length;
          console.log(`   🎪 Event mentions: ${eventCount}`);
        }
      } else {
        console.log(`   ❌ ${source.name}: Failed`);
      }
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   ❌ ${source.name}: Error - ${error.message}`);
    }
  }
}

function analyzeAPIUsage() {
  console.log('\n=== 💰 COST ANALYSIS ===');
  console.log('');
  console.log('This test session used approximately:');
  console.log('• 6-8 API calls total');
  console.log('• Estimated cost: $0.006 - $0.08');
  console.log('');
  console.log('🔍 Where charges come from:');
  console.log('1. Each URL scrape = 1 API call charge');
  console.log('2. Failed requests still count as usage');
  console.log('3. Timeout requests are charged if processing started');
  console.log('4. Screenshots add extra cost');
  console.log('5. Extract/structured data requests cost more');
  console.log('');
  console.log('💡 COST AVOIDANCE STRATEGIES:');
  console.log('• Cache successful results (avoid re-scraping same URLs)');
  console.log('• Use shorter timeouts for fast failures');
  console.log('• Only scrape when content likely changed');
  console.log('• Use onlyMainContent=true to reduce processing');
  console.log('• Batch process and filter URLs before scraping');
  console.log('• Start with free MCP tools, upgrade to Firecrawl for blocked sources');
  console.log('');
  console.log('📊 Production estimates:');
  console.log('• Daily monitoring of 20 sources: $0.60-6/day');
  console.log('• Weekly deep scrape of 100 pages: $3-30/week');
  console.log('• Monthly cost for MVP: $15-150/month');
  console.log('');
  console.log('🎯 Recommended approach:');
  console.log('• Use MCP Playwright for 80% of sources (free)');
  console.log('• Use Firecrawl only for blocked social media (20%)');
  console.log('• Expected hybrid cost: $3-15/month');
}

// Run tests
if (require.main === module) {
  const apiKey = process.argv[2];
  
  if (!apiKey) {
    console.log('Usage: node test-firecrawl-working.js YOUR_API_KEY');
    process.exit(1);
  }
  
  testFirecrawlCapabilities(apiKey).then(() => {
    analyzeAPIUsage();
  }).catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    analyzeAPIUsage();
  });
}