#!/usr/bin/env node

/**
 * API Endpoint Testing Script
 * 
 * Comprehensive testing of all API endpoints with realistic data
 * - Tests response formats and status codes
 * - Validates error handling scenarios  
 * - Checks data integrity and validation
 * 
 * Usage: node scripts/test-api-endpoints.js [base-url]
 * Example: node scripts/test-api-endpoints.js http://localhost:5000
 */

const fs = require('fs');
const path = require('path');

// Use built-in fetch or fallback to node-fetch
let fetch;
const initFetch = async () => {
  if (globalThis.fetch) {
    fetch = globalThis.fetch;
  } else {
    const nodeFetch = await import('node-fetch');
    fetch = nodeFetch.default;
  }
};

// Configuration
const baseURL = process.argv[2] || process.env.BASE_URL || 'http://localhost:5000';
const outputDir = 'tests/outputs';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
  endpoints: []
};

function logTest(name, passed, details = {}) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  
  if (details.error) {
    console.log(`   Error: ${details.error}`);
  }
  if (details.responseTime) {
    console.log(`   Response Time: ${details.responseTime}ms`);
  }
  if (details.statusCode) {
    console.log(`   Status Code: ${details.statusCode}`);
  }
  
  testResults.tests.push({ name, passed, ...details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function makeRequest(endpoint, options = {}) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      timeout: 10000,
      ...options
    });
    
    const responseTime = Date.now() - startTime;
    let data = null;
    
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch (parseError) {
      data = { parseError: 'Could not parse response as JSON' };
    }
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
      responseTime,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function testAPIEndpoints() {
  // Initialize fetch first
  await initFetch();
  
  console.log(`🧪 Starting API Endpoint Tests on ${baseURL}`);
  console.log('=' .repeat(60));
  
  // ==========================================
  // TEST 1: Health Endpoint
  // ==========================================
  console.log('\n📍 Testing Health Endpoint');
  
  const healthResult = await makeRequest('/api/health');
  testResults.endpoints.push({ endpoint: '/api/health', ...healthResult });
  
  if (healthResult.ok && healthResult.data && healthResult.data.ok) {
    logTest('GET /api/health returns healthy status', true, {
      responseTime: healthResult.responseTime,
      statusCode: healthResult.status
    });
  } else {
    logTest('GET /api/health returns healthy status', false, {
      error: healthResult.error || 'Unhealthy response',
      statusCode: healthResult.status,
      responseTime: healthResult.responseTime
    });
  }
  
  // ==========================================
  // TEST 2: Events Endpoint - Default Query
  // ==========================================
  console.log('\n📍 Testing Events Endpoint - Default');
  
  const eventsResult = await makeRequest('/api/events');
  testResults.endpoints.push({ endpoint: '/api/events', ...eventsResult });
  
  if (eventsResult.ok && eventsResult.data && eventsResult.data.success !== false) {
    const hasValidStructure = eventsResult.data.data && eventsResult.data.pagination;
    logTest('GET /api/events returns valid structure', hasValidStructure, {
      responseTime: eventsResult.responseTime,
      statusCode: eventsResult.status,
      error: !hasValidStructure ? 'Missing data or pagination fields' : null
    });
  } else {
    logTest('GET /api/events returns valid structure', false, {
      error: eventsResult.error || 'Invalid response',
      statusCode: eventsResult.status,
      responseTime: eventsResult.responseTime
    });
  }
  
  // ==========================================
  // TEST 3: Events Endpoint - With Pagination
  // ==========================================
  console.log('\n📍 Testing Events Endpoint - Pagination');
  
  const paginatedEventsResult = await makeRequest('/api/events?page=1&limit=5');
  testResults.endpoints.push({ endpoint: '/api/events?page=1&limit=5', ...paginatedEventsResult });
  
  if (paginatedEventsResult.ok && paginatedEventsResult.data) {
    const validPagination = paginatedEventsResult.data.pagination && 
                          paginatedEventsResult.data.pagination.page === 1 &&
                          paginatedEventsResult.data.pagination.limit <= 5;
    
    logTest('GET /api/events with pagination works correctly', validPagination, {
      responseTime: paginatedEventsResult.responseTime,
      statusCode: paginatedEventsResult.status,
      error: !validPagination ? 'Invalid pagination parameters' : null
    });
  } else {
    logTest('GET /api/events with pagination works correctly', false, {
      error: paginatedEventsResult.error || 'Pagination failed',
      statusCode: paginatedEventsResult.status,
      responseTime: paginatedEventsResult.responseTime
    });
  }
  
  // ==========================================
  // TEST 4: Events Endpoint - Category Filter
  // ==========================================
  console.log('\n📍 Testing Events Endpoint - Category Filter');
  
  const categoryEventsResult = await makeRequest('/api/events?category=music,food');
  testResults.endpoints.push({ endpoint: '/api/events?category=music,food', ...categoryEventsResult });
  
  if (categoryEventsResult.ok && categoryEventsResult.data) {
    logTest('GET /api/events with category filter works', true, {
      responseTime: categoryEventsResult.responseTime,
      statusCode: categoryEventsResult.status
    });
  } else {
    logTest('GET /api/events with category filter works', false, {
      error: categoryEventsResult.error || 'Category filtering failed',
      statusCode: categoryEventsResult.status,
      responseTime: categoryEventsResult.responseTime
    });
  }
  
  // ==========================================
  // TEST 5: Events Endpoint - Invalid Parameters
  // ==========================================
  console.log('\n📍 Testing Events Endpoint - Error Handling');
  
  const invalidEventsResult = await makeRequest('/api/events?page=abc&limit=-5');
  testResults.endpoints.push({ endpoint: '/api/events?page=abc&limit=-5', ...invalidEventsResult });
  
  // Should handle invalid params gracefully (either error or fallback to defaults)
  const handlesInvalidParams = invalidEventsResult.ok || invalidEventsResult.status === 400;
  
  logTest('GET /api/events handles invalid parameters gracefully', handlesInvalidParams, {
    responseTime: invalidEventsResult.responseTime,
    statusCode: invalidEventsResult.status,
    error: !handlesInvalidParams ? 'Should handle invalid params' : null
  });
  
  // ==========================================
  // TEST 6: Dashboard Endpoint
  // ==========================================
  console.log('\n📍 Testing Dashboard Endpoint');
  
  const dashboardResult = await makeRequest('/api/dashboard');
  testResults.endpoints.push({ endpoint: '/api/dashboard', ...dashboardResult });
  
  if (dashboardResult.ok && dashboardResult.data && dashboardResult.data.success !== false) {
    const hasValidStats = dashboardResult.data.data && 
                         typeof dashboardResult.data.data.totalEvents === 'number';
    
    logTest('GET /api/dashboard returns valid statistics', hasValidStats, {
      responseTime: dashboardResult.responseTime,
      statusCode: dashboardResult.status,
      error: !hasValidStats ? 'Missing or invalid statistics' : null
    });
  } else {
    logTest('GET /api/dashboard returns valid statistics', false, {
      error: dashboardResult.error || 'Dashboard failed',
      statusCode: dashboardResult.status,
      responseTime: dashboardResult.responseTime
    });
  }
  
  // ==========================================
  // TEST 7: Non-existent Endpoint
  // ==========================================
  console.log('\n📍 Testing Non-existent Endpoint');
  
  const notFoundResult = await makeRequest('/api/nonexistent');
  testResults.endpoints.push({ endpoint: '/api/nonexistent', ...notFoundResult });
  
  const returns404 = notFoundResult.status === 404;
  
  logTest('Non-existent endpoint returns 404', returns404, {
    responseTime: notFoundResult.responseTime,
    statusCode: notFoundResult.status,
    error: !returns404 ? 'Should return 404 for non-existent endpoints' : null
  });
  
  // ==========================================
  // TEST 8: Method Not Allowed
  // ==========================================
  console.log('\n📍 Testing Method Not Allowed');
  
  const methodNotAllowedResult = await makeRequest('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: 'data' })
  });
  testResults.endpoints.push({ endpoint: 'POST /api/events', ...methodNotAllowedResult });
  
  const returns405 = methodNotAllowedResult.status === 405;
  
  logTest('POST /api/events returns Method Not Allowed', returns405, {
    responseTime: methodNotAllowedResult.responseTime,
    statusCode: methodNotAllowedResult.status,
    error: !returns405 ? 'Should return 405 for unsupported methods' : null
  });
  
  // ==========================================
  // Generate Test Report
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 API TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  // Calculate performance stats
  const responseTimes = testResults.endpoints
    .filter(e => e.responseTime)
    .map(e => e.responseTime);
  
  if (responseTimes.length > 0) {
    const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b) / responseTimes.length);
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log(`⚡ Avg Response Time: ${avgResponseTime}ms`);
    console.log(`⚡ Max Response Time: ${maxResponseTime}ms`);
  }
  
  // Save detailed results to file
  const reportPath = path.join(outputDir, 'api-endpoints-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseURL,
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100),
      avgResponseTime: responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b) / responseTimes.length) : null
    },
    tests: testResults.tests,
    endpoints: testResults.endpoints
  }, null, 2));
  
  console.log(`📄 Detailed report saved to: ${reportPath}`);
  
  // Exit with error code if any tests failed
  if (testResults.failed > 0) {
    console.log('\n❌ Some API tests failed. Check the details above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All API tests passed!');
    process.exit(0);
  }
}

// Run the tests
if (require.main === module) {
  testAPIEndpoints().catch(error => {
    console.error('❌ API test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { testAPIEndpoints };