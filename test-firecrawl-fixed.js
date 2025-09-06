// Fixed Firecrawl test script with proper API usage
const FirecrawlApp = require('@mendable/firecrawl-js');

async function testFirecrawlCapabilities(apiKey) {
  console.log('=== Firecrawl Social Media Scraping Test ===\n');
  
  if (!apiKey) {
    console.log('❌ No API key provided');
    return;
  }
  
  // Initialize with correct API structure
  const app = new FirecrawlApp.FirecrawlApp({ apiKey });
  
  try {
    // Test 1: Simple connectivity test first
    await testConnectivity(app);
    
    // Test 2: Try scraping a public Instagram business page
    await testInstagramScraping(app);
    
    // Test 3: Try scraping a public Facebook page  
    await testFacebookScraping(app);
    
    // Test 4: Test with different configurations
    await testDifferentConfigs(app);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testConnectivity(app) {
  console.log('1. Testing API connectivity with simple page...');
  
  try {
    // Test with a simple, non-social media page first
    const testUrl = 'https://example.com';
    console.log(`   Testing simple page: ${testUrl}`);
    
    const result = await app.scrapeUrl(testUrl, {
      formats: ['markdown']
    });
    
    if (result && result.success) {
      console.log('   ✅ API connectivity successful');
      console.log(`   📄 Content length: ${result.data?.markdown?.length || 0} chars`);
    } else {
      console.log('   ⚠️ API call succeeded but no content returned');
      console.log('   Response:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.log(`   ❌ Connectivity test error: ${error.message}`);
    
    // Check if it's an authentication error
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      console.log('   🔑 This appears to be an authentication issue');
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      console.log('   🚦 This appears to be a rate limiting issue');
    }
  }
}

async function testInstagramScraping(app) {
  console.log('\n2. Testing Instagram public business page scraping...');
  
  try {
    const instagramUrl = 'https://www.instagram.com/isthmusmadison/';
    console.log(`   Attempting to scrape: ${instagramUrl}`);
    
    const startTime = Date.now();
    
    const result = await app.scrapeUrl(instagramUrl, {
      formats: ['markdown'],
      waitFor: 5000,
      timeout: 30000
    });
    
    const endTime = Date.now();
    console.log(`   ⏱️ Request took: ${endTime - startTime}ms`);
    
    if (result && result.success) {
      console.log('   ✅ Successfully scraped Instagram page');
      console.log(`   📄 Content length: ${result.data?.markdown?.length || 0} chars`);
      
      // Look for event-related content
      if (result.data?.markdown) {
        const eventKeywords = result.data.markdown.match(/event|concert|festival|food|music|cultural|happening|join us|save the date/gi) || [];
        console.log(`   🎯 Event-related keywords found: ${eventKeywords.length}`);
        
        // Show content snippet
        const snippet = result.data.markdown.substring(0, 300) + '...';
        console.log(`   📝 Content preview:\n   ${snippet.replace(/\n/g, '\n   ')}`);
      }
      
    } else {
      console.log('   ❌ Failed to scrape Instagram page');
      console.log(`   Response:`, JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.log(`   ❌ Instagram scraping error: ${error.message}`);
    
    // Analyze error type
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      console.log('   🚫 Instagram blocked the request (403 Forbidden)');
    } else if (error.message.includes('timeout')) {
      console.log('   ⏰ Request timed out - Instagram may be slow to load');
    }
  }
}

async function testFacebookScraping(app) {
  console.log('\n3. Testing Facebook public page scraping...');
  
  try {
    const facebookUrl = 'https://www.facebook.com/isthmusmadison';
    console.log(`   Attempting to scrape: ${facebookUrl}`);
    
    const startTime = Date.now();
    
    const result = await app.scrapeUrl(facebookUrl, {
      formats: ['markdown'],
      waitFor: 8000,
      timeout: 45000
    });
    
    const endTime = Date.now();
    console.log(`   ⏱️ Request took: ${endTime - startTime}ms`);
    
    if (result && result.success) {
      console.log('   ✅ Successfully scraped Facebook page');
      console.log(`   📄 Content length: ${result.data?.markdown?.length || 0} chars`);
      
      // Look for event posts
      if (result.data?.markdown) {
        const eventKeywords = result.data.markdown.match(/event|concert|festival|food|music|cultural|happening|join us|save the date/gi) || [];
        console.log(`   🎯 Event-related keywords found: ${eventKeywords.length}`);
        
        const snippet = result.data.markdown.substring(0, 300) + '...';
        console.log(`   📝 Content preview:\n   ${snippet.replace(/\n/g, '\n   ')}`);
      }
      
    } else {
      console.log('   ❌ Failed to scrape Facebook page');
      console.log(`   Response:`, JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.log(`   ❌ Facebook scraping error: ${error.message}`);
    
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      console.log('   🚫 Facebook blocked the request (403 Forbidden)');
    } else if (error.message.includes('timeout')) {
      console.log('   ⏰ Request timed out - Facebook may be slow to load');
    }
  }
}

async function testDifferentConfigs(app) {
  console.log('\n4. Testing different scraping configurations...');
  
  const configs = [
    {
      name: 'Minimal Config',
      config: { formats: ['markdown'] }
    },
    {
      name: 'With Screenshot', 
      config: { formats: ['markdown', 'screenshot'] }
    },
    {
      name: 'Only Main Content',
      config: { 
        formats: ['markdown'],
        onlyMainContent: true
      }
    }
  ];
  
  const testUrl = 'https://www.visitmadison.com/events/';
  
  for (const { name, config } of configs) {
    try {
      console.log(`   Testing ${name}...`);
      const startTime = Date.now();
      
      const result = await app.scrapeUrl(testUrl, config);
      
      const endTime = Date.now();
      
      if (result && result.success) {
        console.log(`   ✅ ${name}: Success (${endTime - startTime}ms)`);
        console.log(`   📄 Content length: ${result.data?.markdown?.length || 0} chars`);
      } else {
        console.log(`   ❌ ${name}: Failed`);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ ${name}: Error - ${error.message}`);
    }
  }
}

// Track API usage and costs
function trackAPIUsage() {
  console.log('\n=== API Usage Summary ===');
  console.log('Based on this test session:');
  console.log('• Total API calls made: ~6-8 requests');
  console.log('• Estimated cost per request: $0.001-0.01');
  console.log('• Test session cost: $0.01-0.08');
  console.log('');
  console.log('For production usage:');
  console.log('• 50 social media pages/day = $1.50-15/month');
  console.log('• 200 pages/month = $6-60/month');
  console.log('');
  console.log('Cost drivers:');
  console.log('• Each URL scrape = 1 API call');
  console.log('• Screenshots increase cost');
  console.log('• Longer timeouts may increase cost');
  console.log('• Failed requests still count toward usage');
}

// Command line usage
if (require.main === module) {
  const apiKey = process.argv[2] || process.env.FIRECRAWL_API_KEY;
  
  if (!apiKey) {
    console.log('Usage: node test-firecrawl-fixed.js YOUR_API_KEY');
    process.exit(1);
  }
  
  testFirecrawlCapabilities(apiKey).then(() => {
    trackAPIUsage();
  }).catch(error => {
    console.error('Test suite failed:', error);
  });
}

module.exports = { testFirecrawlCapabilities };