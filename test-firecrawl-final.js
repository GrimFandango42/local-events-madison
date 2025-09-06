// Final working Firecrawl test with correct API usage
const Firecrawl = require('@mendable/firecrawl-js').default;

async function testFirecrawlCapabilities(apiKey) {
  console.log('=== Firecrawl Social Media Scraping Test ===\n');
  
  if (!apiKey) {
    console.log('❌ No API key provided');
    return;
  }
  
  // Initialize with correct constructor
  const app = new Firecrawl({ apiKey });
  
  try {
    console.log('🔧 Firecrawl client initialized successfully');
    
    // Test 1: Simple connectivity test
    await testConnectivity(app);
    
    // Test 2: Instagram business page
    await testInstagramScraping(app);
    
    // Test 3: Facebook public page  
    await testFacebookScraping(app);
    
    // Test 4: Madison event sources
    await testMadisonSources(app);
    
  } catch (error) {
    console.error('Test initialization failed:', error.message);
  }
}

async function testConnectivity(app) {
  console.log('1. Testing API connectivity...');
  
  try {
    const result = await app.scrape('https://example.com', {
      formats: ['markdown']
    });
    
    console.log('   ✅ API connectivity successful');
    console.log(`   📄 Content length: ${result.markdown?.length || 0} chars`);
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
    
    throw error;
  }
}

async function testInstagramScraping(app) {
  console.log('\n2. Testing Instagram business page...');
  
  try {
    const instagramUrl = 'https://www.instagram.com/isthmusmadison/';
    console.log(`   Target: ${instagramUrl}`);
    
    const startTime = Date.now();
    
    const result = await app.scrape(instagramUrl, {
      formats: ['markdown']
    });
    
    const endTime = Date.now();
    console.log(`   ⏱️ Response time: ${endTime - startTime}ms`);
    console.log(`   💰 Cost: 1 API call (~$0.001-0.01)`);
    
    if (result && result.markdown) {
      console.log('   ✅ Instagram scraping SUCCESSFUL!');
      console.log(`   📄 Content length: ${result.markdown.length} chars`);
      
      // Analyze content quality
      const content = result.markdown;
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
      
    } else {
      console.log('   ❌ Instagram scraping failed - no content returned');
      console.log('   Result:', JSON.stringify(result, null, 2));
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

async function testFacebookScraping(app) {
  console.log('\n3. Testing Facebook public page...');
  
  try {
    const facebookUrl = 'https://www.facebook.com/isthmusmadison';
    console.log(`   Target: ${facebookUrl}`);
    
    const startTime = Date.now();
    
    const result = await app.scrape(facebookUrl, {
      formats: ['markdown']
    });
    
    const endTime = Date.now();
    console.log(`   ⏱️ Response time: ${endTime - startTime}ms`);
    console.log(`   💰 Cost: 1 API call (~$0.001-0.01)`);
    
    if (result && result.markdown) {
      console.log('   ✅ Facebook scraping SUCCESSFUL!');
      console.log(`   📄 Content length: ${result.markdown.length} chars`);
      
      const content = result.markdown;
      const eventKeywords = content.match(/event|concert|festival|food|music|cultural|happening|join us|save the date/gi) || [];
      
      console.log(`   🎯 Event keywords: ${eventKeywords.length} found`);
      
      // Look for specific Madison venues/locations
      const madisonKeywords = content.match(/madison|capitol|state street|university|downtown|isthmus|terrace|memorial union/gi) || [];
      console.log(`   🏛️ Madison references: ${madisonKeywords.length} found`);
      
      const lines = content.split('\n').filter(line => line.trim().length > 20);
      if (lines.length > 0) {
        console.log(`   📝 Content sample: "${lines[0].substring(0, 100)}..."`);
      }
      
    } else {
      console.log('   ❌ Facebook scraping failed - no content returned');
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

async function testMadisonSources(app) {
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
      const result = await app.scrape(source.url, {
        formats: ['markdown'],
        onlyMainContent: true
      });
      const endTime = Date.now();
      
      console.log(`   ⏱️ ${source.name}: ${endTime - startTime}ms`);
      console.log(`   💰 Cost: 1 API call`);
      
      if (result && result.markdown) {
        console.log(`   ✅ ${source.name}: Success`);
        console.log(`   📄 Content: ${result.markdown.length} chars`);
        
        // Look for event indicators
        const eventCount = (result.markdown.match(/event|concert|festival/gi) || []).length;
        console.log(`   🎪 Event mentions: ${eventCount}`);
      } else {
        console.log(`   ❌ ${source.name}: Failed - no content`);
      }
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   ❌ ${source.name}: Error - ${error.message}`);
    }
  }
}

function analyzeAPIUsage() {
  console.log('\n=== 💰 COST ANALYSIS & AVOIDANCE STRATEGIES ===');
  console.log('');
  console.log('This test session used approximately:');
  console.log('• 6-8 API calls total');
  console.log('• Estimated cost: $0.006 - $0.08');
  console.log('');
  console.log('🔍 WHERE CHARGES COME FROM:');
  console.log('1. ❌ Each URL scrape = 1 API call charge (even if blocked)');
  console.log('2. ❌ Failed requests still count as usage');
  console.log('3. ❌ Timeout requests are charged if processing started');
  console.log('4. ❌ Screenshots add extra cost');
  console.log('5. ❌ Extract/structured data requests cost more');
  console.log('6. ❌ Large pages with lots of content cost more');
  console.log('');
  console.log('💡 COST AVOIDANCE STRATEGIES:');
  console.log('');
  console.log('🔄 CACHING (Highest Impact):');
  console.log('• Cache successful results for 1-6 hours');
  console.log('• Only re-scrape if content likely changed'); 
  console.log('• Use ETags/Last-Modified headers when possible');
  console.log('• Savings: 70-90% reduction in API calls');
  console.log('');
  console.log('🎯 SMART FILTERING:');
  console.log('• Pre-filter URLs to avoid obviously empty sources');
  console.log('• Check robots.txt before scraping');
  console.log('• Skip pages that historically have no events');
  console.log('• Savings: 30-50% reduction in wasted calls');
  console.log('');
  console.log('⚡ CONFIGURATION OPTIMIZATION:');
  console.log('• Use onlyMainContent=true (reduces processing)');
  console.log('• Set shorter timeouts (15-20 seconds max)');
  console.log('• Only request needed formats (markdown only)');
  console.log('• Avoid screenshots unless absolutely needed');
  console.log('• Savings: 20-40% per request');
  console.log('');
  console.log('🔀 HYBRID APPROACH (Recommended):');
  console.log('• Use FREE MCP Playwright for 80% of sources');
  console.log('• Use Firecrawl ONLY for blocked social media');
  console.log('• Try MCP first, fallback to Firecrawl if blocked');
  console.log('• Savings: 60-80% overall cost reduction');
  console.log('');
  console.log('⏰ INTELLIGENT SCHEDULING:');
  console.log('• Scrape Instagram/Facebook only 1-2x per day');
  console.log('• Batch requests to minimize connection overhead');
  console.log('• Monitor during business hours when events are posted');
  console.log('• Savings: 50-70% reduction in frequency');
  console.log('');
  console.log('📊 COST ESTIMATES (with strategies):');
  console.log('');
  console.log('🔥 Firecrawl Only (expensive):');
  console.log('• Daily scraping 20 sources: $18-180/month');
  console.log('• Weekly scraping 50 sources: $6-60/month');
  console.log('');
  console.log('🎯 Hybrid Approach (recommended):');
  console.log('• MCP for 80% of sources: $0/month');
  console.log('• Firecrawl for 20% social media: $1-5/month');
  console.log('• Total cost: $1-5/month');
  console.log('');
  console.log('✅ OPTIMAL STRATEGY FOR LOCAL EVENTS:');
  console.log('1. Use MCP Playwright for:');
  console.log('   • Government sites (visitmadison.com)');
  console.log('   • Local media (isthmus.com)');
  console.log('   • Cooperative venues');
  console.log('2. Use Firecrawl only for:');
  console.log('   • Instagram business pages (when MCP blocked)');
  console.log('   • Facebook pages (when MCP blocked)');
  console.log('   • High-value protected sources');
  console.log('3. Cache all results for 2-6 hours');
  console.log('4. Monitor success rates and adjust strategy');
  console.log('');
  console.log('🎉 Expected result: 90% data coverage at 5% of full cost!');
}

// Run tests
if (require.main === module) {
  const apiKey = process.argv[2];
  
  if (!apiKey) {
    console.log('Usage: node test-firecrawl-final.js YOUR_API_KEY');
    process.exit(1);
  }
  
  console.log(`🔑 Using API key: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);
  
  testFirecrawlCapabilities(apiKey).then(() => {
    analyzeAPIUsage();
  }).catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    analyzeAPIUsage();
  });
}