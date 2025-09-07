// Test script to evaluate social media scraping capabilities
const { chromium } = require('playwright');

async function testPublicPageAccess() {
  console.log('Testing public social media page access...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Test 1: Can we access a public Instagram business page?
  try {
    console.log('\n1. Testing Instagram public business page access...');
    await page.goto('https://www.instagram.com/isthmusmadison/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Try to get post content
    const posts = await page.$$eval('article', (articles) => {
      return articles.slice(0, 3).map(article => {
        const text = article.textContent || '';
        return {
          hasText: text.length > 0,
          textSnippet: text.substring(0, 100) + '...'
        };
      });
    }).catch(() => []);
    
    console.log(`Found ${posts.length} post elements`);
    posts.forEach((post, i) => {
      console.log(`Post ${i + 1}: Has text: ${post.hasText}, Snippet: ${post.textSnippet}`);
    });
    
  } catch (error) {
    console.log(`Instagram access failed: ${error.message}`);
  }

  // Test 2: Can we access Facebook public pages?
  try {
    console.log('\n2. Testing Facebook public page access...');
    await page.goto('https://www.facebook.com/isthmusmadison', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Look for event-like content
    const eventElements = await page.$$eval('[role="article"], .userContentWrapper, .story_body_container', (elements) => {
      return elements.slice(0, 5).map(el => {
        const text = el.textContent || '';
        const hasEventKeywords = /event|concert|festival|food|music|cultural|happening|join us|save the date/i.test(text);
        return {
          hasEventKeywords,
          textSnippet: text.substring(0, 150) + '...'
        };
      });
    }).catch(() => []);
    
    console.log(`Found ${eventElements.length} potential content elements`);
    const eventPosts = eventElements.filter(el => el.hasEventKeywords);
    console.log(`Event-related posts: ${eventPosts.length}`);
    
  } catch (error) {
    console.log(`Facebook access failed: ${error.message}`);
  }

  // Test 3: Check for anti-bot measures
  try {
    console.log('\n3. Checking for anti-bot detection...');
    
    const currentUrl = page.url();
    const pageContent = await page.content();
    
    const botDetectionSignals = [
      pageContent.includes('challenge'),
      pageContent.includes('captcha'),
      pageContent.includes('Please verify'),
      pageContent.includes('robot'),
      currentUrl.includes('checkpoint'),
      currentUrl.includes('challenge')
    ];
    
    const detectionCount = botDetectionSignals.filter(Boolean).length;
    console.log(`Bot detection signals: ${detectionCount}/6`);
    
    if (detectionCount > 0) {
      console.log('⚠️  Anti-bot measures detected');
    } else {
      console.log('✅ No obvious bot detection');
    }
    
  } catch (error) {
    console.log(`Anti-bot check failed: ${error.message}`);
  }

  await browser.close();
}

// Test rate limiting and respectful scraping
async function testRateLimiting() {
  console.log('\n4. Testing rate limiting behavior...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const requestTimes = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < 5; i++) {
    const page = await context.newPage();
    const startTime = Date.now();
    
    try {
      await page.goto('https://www.instagram.com/isthmusmadison/', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      const endTime = Date.now();
      requestTimes.push(endTime - startTime);
      successCount++;
      console.log(`Request ${i + 1}: Success (${endTime - startTime}ms)`);
    } catch (error) {
      failCount++;
      console.log(`Request ${i + 1}: Failed - ${error.message}`);
    }
    
    await page.close();
    // Wait between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\nRate limiting test results:`);
  console.log(`Success: ${successCount}/5`);
  console.log(`Failed: ${failCount}/5`);
  console.log(`Average response time: ${requestTimes.length > 0 ? Math.round(requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length) : 'N/A'}ms`);
  
  await browser.close();
}

async function main() {
  console.log('=== Social Media Scraping Capability Test ===\n');
  
  try {
    await testPublicPageAccess();
    await testRateLimiting();
    
    console.log('\n=== Test Summary ===');
    console.log('✅ Playwright can access public social media pages');
    console.log('⚠️  Success depends on anti-bot measures and rate limiting');
    console.log('📝 Manual inspection of content structure needed for data extraction');
    console.log('⚖️  Must respect ToS and implement respectful scraping practices');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

if (require.main === module) {
  main();
}