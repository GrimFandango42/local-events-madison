// Test script to evaluate Firecrawl capabilities for social media scraping
const FirecrawlApp = require('@mendable/firecrawl-js').default;

async function testFirecrawlCapabilities(apiKey = null) {
  console.log('=== Firecrawl Social Media Scraping Test ===\n');
  
  if (!apiKey) {
    console.log('❌ No API key provided. Showing test framework only.');
    console.log('To run actual tests, provide your Firecrawl API key.\n');
    showTestFramework();
    return;
  }
  
  const app = new FirecrawlApp({ apiKey });
  
  try {
    // Test 1: Check API connectivity
    console.log('1. Testing API connectivity...');
    
    // Test 2: Try scraping a public Instagram business page
    await testInstagramScraping(app);
    
    // Test 3: Try scraping a public Facebook page  
    await testFacebookScraping(app);
    
    // Test 4: Test anti-bot handling
    await testAntiBotCapabilities(app);
    
    // Test 5: Test structured data extraction
    await testStructuredExtraction(app);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

async function testInstagramScraping(app) {
  console.log('\n2. Testing Instagram public business page scraping...');
  
  try {
    const instagramUrl = 'https://www.instagram.com/isthmusmadison/';
    console.log(`   Attempting to scrape: ${instagramUrl}`);
    
    const result = await app.scrapeUrl(instagramUrl, {
      formats: ['markdown', 'html'],
      actions: [
        { type: 'wait', milliseconds: 3000 },
        { type: 'screenshot' }
      ],
      onlyMainContent: true
    });
    
    if (result.success) {
      console.log('   ✅ Successfully scraped Instagram page');
      console.log(`   📄 Content length: ${result.data.markdown?.length || 0} chars`);
      
      // Look for event-related content
      const eventKeywords = /event|concert|festival|food|music|cultural|happening|join us|save the date/gi;
      const matches = result.data.markdown?.match(eventKeywords) || [];
      console.log(`   🎯 Event-related keywords found: ${matches.length}`);
      
      // Show content snippet
      const snippet = result.data.markdown?.substring(0, 200) + '...';
      console.log(`   📝 Content preview: ${snippet}`);
      
    } else {
      console.log('   ❌ Failed to scrape Instagram page');
      console.log(`   Error: ${result.error}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Instagram scraping error: ${error.message}`);
  }
}

async function testFacebookScraping(app) {
  console.log('\n3. Testing Facebook public page scraping...');
  
  try {
    const facebookUrl = 'https://www.facebook.com/isthmusmadison';
    console.log(`   Attempting to scrape: ${facebookUrl}`);
    
    const result = await app.scrapeUrl(facebookUrl, {
      formats: ['markdown', 'html'],
      actions: [
        { type: 'wait', milliseconds: 5000 }
      ],
      onlyMainContent: true,
      includeTags: ['article', 'div[role="article"]', '.userContentWrapper']
    });
    
    if (result.success) {
      console.log('   ✅ Successfully scraped Facebook page');
      console.log(`   📄 Content length: ${result.data.markdown?.length || 0} chars`);
      
      // Look for event posts
      const eventKeywords = /event|concert|festival|food|music|cultural|happening|join us|save the date/gi;
      const matches = result.data.markdown?.match(eventKeywords) || [];
      console.log(`   🎯 Event-related keywords found: ${matches.length}`);
      
      // Show content snippet
      const snippet = result.data.markdown?.substring(0, 200) + '...';
      console.log(`   📝 Content preview: ${snippet}`);
      
    } else {
      console.log('   ❌ Failed to scrape Facebook page');
      console.log(`   Error: ${result.error}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Facebook scraping error: ${error.message}`);
  }
}

async function testAntiBotCapabilities(app) {
  console.log('\n4. Testing anti-bot detection handling...');
  
  try {
    // Test multiple requests to check for blocking
    const testUrls = [
      'https://www.instagram.com/isthmusmadison/',
      'https://www.facebook.com/isthmusmadison'
    ];
    
    let successCount = 0;
    let blockedCount = 0;
    
    for (const url of testUrls) {
      try {
        console.log(`   Testing: ${url.split('/')[2]}`);
        const result = await app.scrapeUrl(url, {
          formats: ['markdown'],
          timeout: 15000
        });
        
        if (result.success) {
          successCount++;
          console.log(`   ✅ Success`);
        } else {
          blockedCount++;
          console.log(`   ⚠️ Blocked/Failed: ${result.error}`);
        }
        
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        blockedCount++;
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log(`   📊 Success rate: ${successCount}/${testUrls.length}`);
    console.log(`   🚫 Blocked/Failed: ${blockedCount}/${testUrls.length}`);
    
  } catch (error) {
    console.log(`   ❌ Anti-bot test error: ${error.message}`);
  }
}

async function testStructuredExtraction(app) {
  console.log('\n5. Testing structured data extraction for events...');
  
  try {
    // Test the new /extract endpoint for structured event data
    const testUrl = 'https://www.instagram.com/isthmusmadison/';
    
    const extractSchema = {
      type: "object",
      properties: {
        events: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              date: { type: "string" },
              location: { type: "string" },
              description: { type: "string" },
              category: { type: "string" }
            }
          }
        },
        posts: {
          type: "array", 
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              hasEventKeywords: { type: "boolean" }
            }
          }
        }
      }
    };
    
    console.log('   🔍 Attempting structured event extraction...');
    
    // Note: This would use the /extract endpoint if available in the SDK
    const result = await app.scrapeUrl(testUrl, {
      formats: ['extract'],
      extractSchema: extractSchema
    });
    
    if (result.success && result.data.extract) {
      console.log('   ✅ Structured extraction successful');
      console.log(`   📅 Events found: ${result.data.extract.events?.length || 0}`);
      console.log(`   📝 Posts analyzed: ${result.data.extract.posts?.length || 0}`);
    } else {
      console.log('   ⚠️ Structured extraction not available or failed');
    }
    
  } catch (error) {
    console.log(`   ❌ Structured extraction error: ${error.message}`);
  }
}

function showTestFramework() {
  console.log('Test Framework Overview:');
  console.log('=====================');
  console.log('');
  console.log('Available Tests:');
  console.log('1. API Connectivity Check');
  console.log('2. Instagram Business Page Scraping');
  console.log('3. Facebook Public Page Scraping');
  console.log('4. Anti-Bot Detection Handling');
  console.log('5. Structured Event Data Extraction');
  console.log('');
  console.log('Features to Evaluate:');
  console.log('• JavaScript rendering capabilities');
  console.log('• Anti-bot bypass effectiveness');
  console.log('• Content extraction quality');
  console.log('• Event data identification accuracy');
  console.log('• Rate limiting and reliability');
  console.log('');
  console.log('Expected Outputs:');
  console.log('• Success/failure rates for social media platforms');
  console.log('• Content quality assessment');
  console.log('• Event keyword detection performance');
  console.log('• Anti-blocking effectiveness scores');
  console.log('• Structured data extraction capabilities');
  console.log('');
  console.log('Usage:');
  console.log('node test-firecrawl.js [API_KEY]');
  console.log('');
  console.log('Or modify the script to include your API key directly.');
}

// Command line usage
if (require.main === module) {
  const apiKey = process.argv[2] || process.env.FIRECRAWL_API_KEY || null;
  testFirecrawlCapabilities(apiKey);
}

module.exports = { testFirecrawlCapabilities };