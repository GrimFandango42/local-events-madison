#!/usr/bin/env node

/**
 * Enhanced Performance Testing Script for Local Events
 * 
 * Comprehensive load testing with:
 * - Concurrent user simulation
 * - Response time measurements  
 * - Throughput analysis
 * - Error rate monitoring
 * 
 * Usage: node scripts/performance-test.js [base-url] [--concurrent=N] [--duration=N]
 * Example: node scripts/performance-test.js http://localhost:5000 --concurrent=10 --duration=30
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

// Configuration from command line args
const baseURL = process.argv[2] || process.env.BASE_URL || 'http://localhost:5000';
const outputDir = 'tests/outputs';

// Parse command line arguments
const args = process.argv.slice(2);
const concurrentArg = args.find(arg => arg.startsWith('--concurrent='));
const durationArg = args.find(arg => arg.startsWith('--duration='));

const concurrentUsers = concurrentArg ? parseInt(concurrentArg.split('=')[1]) : 5;
const durationSeconds = durationArg ? parseInt(durationArg.split('=')[1]) : 15;

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Performance metrics tracking
let metrics = {
  requests: { total: 0, successful: 0, failed: 0, timeouts: 0 },
  responseTimes: [],
  errors: [],
  endpoints: {},
  startTime: null,
  endTime: null
};

async function runPerformanceTests() {
  // Initialize fetch first
  await initFetch();
  
  log(colors.blue, `⚡ Starting Enhanced Performance Test on ${baseURL}`);
  log(colors.yellow, `👥 Concurrent Users: ${concurrentUsers}`);
  log(colors.yellow, `⏱️  Duration: ${durationSeconds} seconds`);
  console.log('=' .repeat(60));

  metrics.startTime = new Date();
  const startTimestamp = Date.now();
  
  try {
    // Run concurrent user simulation
    log(colors.green, '🚀 Starting concurrent user simulation...');
    
    const userPromises = [];
    for (let i = 0; i < concurrentUsers; i++) {
      userPromises.push(simulateUser(i + 1, durationSeconds * 1000));
    }
    
    // Monitor progress
    const progressInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTimestamp) / 1000);
      const progress = Math.round((elapsed / durationSeconds) * 100);
      log(colors.yellow, `📈 Progress: ${elapsed}/${durationSeconds}s (${progress}%) - Requests: ${metrics.requests.total}`);
    }, 2000);
    
    // Wait for all users to complete
    const userResults = await Promise.all(userPromises);
    clearInterval(progressInterval);
    
    metrics.endTime = new Date();
    
    // Also run the original basic API tests for comparison
    log(colors.green, '\n🔌 Running basic API performance tests...');
    const basicAPIResults = await testAPIPerformance();
    
    // Generate comprehensive report
    generateReport({ 
      concurrent: { userResults, metrics },
      basicAPI: basicAPIResults 
    });
    
  } catch (error) {
    log(colors.red, `❌ Error running performance tests: ${error.message}`);
    process.exit(1);
  }
}

// Test endpoints with different loads for concurrent simulation
const testEndpoints = [
  { path: '/api/health', weight: 10 },
  { path: '/api/events', weight: 50 },
  { path: '/api/events?limit=5', weight: 30 },
  { path: '/api/events?category=music', weight: 15 },
  { path: '/api/dashboard', weight: 10 }
];

function getRandomEndpoint() {
  // Weighted random selection
  const totalWeight = testEndpoints.reduce((sum, ep) => sum + ep.weight, 0);
  const random = Math.random() * totalWeight;
  
  let currentWeight = 0;
  for (const endpoint of testEndpoints) {
    currentWeight += endpoint.weight;
    if (random <= currentWeight) {
      return endpoint.path;
    }
  }
  return testEndpoints[0].path; // Fallback
}

async function simulateUser(userId, durationMs) {
  const userMetrics = {
    requests: 0,
    successful: 0,
    failed: 0,
    responseTimes: []
  };
  
  const endTime = Date.now() + durationMs;
  
  while (Date.now() < endTime) {
    const endpoint = getRandomEndpoint();
    const result = await makeRequest(endpoint);
    
    // Update metrics
    metrics.requests.total++;
    userMetrics.requests++;
    
    if (result.success) {
      metrics.requests.successful++;
      userMetrics.successful++;
    } else {
      metrics.requests.failed++;
      userMetrics.failed++;
      
      if (result.timeout) {
        metrics.requests.timeouts++;
      }
      
      metrics.errors.push({
        endpoint: result.endpoint,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
    
    metrics.responseTimes.push(result.responseTime);
    userMetrics.responseTimes.push(result.responseTime);
    
    // Track per-endpoint metrics
    if (!metrics.endpoints[result.endpoint]) {
      metrics.endpoints[result.endpoint] = {
        requests: 0,
        successful: 0,
        failed: 0,
        responseTimes: []
      };
    }
    
    const endpointMetrics = metrics.endpoints[result.endpoint];
    endpointMetrics.requests++;
    endpointMetrics.responseTimes.push(result.responseTime);
    
    if (result.success) {
      endpointMetrics.successful++;
    } else {
      endpointMetrics.failed++;
    }
    
    // Small delay between requests (simulate real user behavior)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
  }
  
  return userMetrics;
}

async function makeRequest(endpoint, timeout = 5000) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      timeout,
      headers: {
        'User-Agent': 'PerformanceTest/1.0'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    // Try to read the response body to simulate real usage
    await response.text();
    
    return {
      success: true,
      status: response.status,
      responseTime,
      endpoint
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      error: error.message,
      responseTime,
      endpoint,
      timeout: error.type === 'request-timeout'
    };
  }
}

async function testAPIPerformance() {
  log(colors.green, '🔌 Testing Basic API Performance...');

  const endpoints = [
    { name: 'Dashboard', url: `${baseURL}/api/dashboard` },
    { name: 'Events (page 1)', url: `${baseURL}/api/events?page=1&pageSize=12` },
    { name: 'Events (search)', url: `${baseURL}/api/events?search=music&page=1&pageSize=12` },
    { name: 'Health Check', url: `${baseURL}/api/health` },
    { name: 'Events (filter)', url: `${baseURL}/api/events?category=music,food` }
  ];

  const results = {};

  for (const endpoint of endpoints) {
    log(colors.yellow, `  Testing ${endpoint.name}...`);
    
    const times = [];
    const iterations = 5;

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      try {
        const response = await fetch(endpoint.url, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          await response.json(); // Consume the response
          times.push(Date.now() - start);
        } else {
          times.push(-1); // Error indicator
        }
      } catch (error) {
        times.push(-1); // Error indicator
      }
    }

    const validTimes = times.filter(t => t > 0);
    const avg = validTimes.length > 0 ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length : 0;
    const min = validTimes.length > 0 ? Math.min(...validTimes) : 0;
    const max = validTimes.length > 0 ? Math.max(...validTimes) : 0;
    const errorRate = ((iterations - validTimes.length) / iterations) * 100;

    results[endpoint.name] = {
      average: Math.round(avg),
      min: min,
      max: max,
      errorRate: errorRate,
      status: avg < 500 ? 'good' : avg < 1000 ? 'okay' : 'poor'
    };

    const statusColor = results[endpoint.name].status === 'good' ? colors.green : 
                       results[endpoint.name].status === 'okay' ? colors.yellow : colors.red;
    
    console.log(`    ${statusColor}${endpoint.name}: ${avg.toFixed(0)}ms avg (${min}-${max}ms)${colors.reset}`);
  }

  return results;
}

async function testDatabasePerformance() {
  log(colors.green, '\n💾 Testing Database Performance...');

  // Test database queries by measuring API response times for different query types
  const queries = [
    { name: 'Simple Count', url: 'http://localhost:3001/api/events?page=1&pageSize=1' },
    { name: 'Complex Filter', url: 'http://localhost:3001/api/events?category=music,food&neighborhood=Downtown&page=1&pageSize=12' },
    { name: 'Text Search', url: 'http://localhost:3001/api/events?search=madison&page=1&pageSize=12' },
    { name: 'Date Range', url: `http://localhost:3001/api/events?dateFrom=${new Date().toISOString()}&page=1&pageSize=12` }
  ];

  const results = {};

  for (const query of queries) {
    log(colors.yellow, `  Testing ${query.name}...`);
    
    const times = [];
    const iterations = 3;

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      try {
        const response = await fetch(query.url, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          times.push({
            responseTime: Date.now() - start,
            resultCount: data.data ? data.data.length : 0
          });
        }
      } catch (error) {
        // Skip failed requests
      }
    }

    if (times.length > 0) {
      const avgTime = times.reduce((sum, t) => sum + t.responseTime, 0) / times.length;
      const avgResults = times.reduce((sum, t) => sum + t.resultCount, 0) / times.length;
      
      results[query.name] = {
        averageTime: Math.round(avgTime),
        averageResults: Math.round(avgResults),
        status: avgTime < 300 ? 'good' : avgTime < 600 ? 'okay' : 'poor'
      };

      const statusColor = results[query.name].status === 'good' ? colors.green : 
                         results[query.name].status === 'okay' ? colors.yellow : colors.red;
      
      console.log(`    ${statusColor}${query.name}: ${avgTime.toFixed(0)}ms (${avgResults} results avg)${colors.reset}`);
    }
  }

  return results;
}

function calculateStats(values) {
  if (values.length === 0) return { min: 0, max: 0, avg: 0, median: 0, p95: 0, p99: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;
  
  return {
    min: sorted[0],
    max: sorted[len - 1],
    avg: Math.round(values.reduce((a, b) => a + b) / len),
    median: len % 2 === 0 ? (sorted[len/2 - 1] + sorted[len/2]) / 2 : sorted[Math.floor(len/2)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)]
  };
}

function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  log(colors.bold + colors.green, '📊 PERFORMANCE TEST RESULTS');
  console.log('='.repeat(60));

  // Concurrent testing results
  if (results.concurrent && results.concurrent.metrics) {
    const concurrentMetrics = results.concurrent.metrics;
    const totalDurationMs = concurrentMetrics.endTime.getTime() - concurrentMetrics.startTime.getTime();
    const responseTimeStats = calculateStats(concurrentMetrics.responseTimes);
    const successRate = (concurrentMetrics.requests.successful / concurrentMetrics.requests.total) * 100;
    const requestsPerSecond = concurrentMetrics.requests.total / (totalDurationMs / 1000);
    
    log(colors.bold + colors.blue, '\n🚀 Concurrent Load Test Results:');
    console.log(`   ⏱️  Duration: ${Math.round(totalDurationMs / 1000)}s`);
    console.log(`   👥 Concurrent Users: ${concurrentUsers}`);
    console.log(`   📞 Total Requests: ${concurrentMetrics.requests.total}`);
    console.log(`   ✅ Success Rate: ${Math.round(successRate)}%`);
    console.log(`   🚀 Throughput: ${Math.round(requestsPerSecond)} req/s`);
    console.log(`   ⚡ Avg Response: ${responseTimeStats.avg}ms`);
    console.log(`   📈 95th Percentile: ${responseTimeStats.p95}ms`);

    // Per-endpoint concurrent results
    if (Object.keys(concurrentMetrics.endpoints).length > 0) {
      log(colors.bold + colors.blue, '\n🎯 Concurrent Test - Per Endpoint:');
      for (const [endpoint, stats] of Object.entries(concurrentMetrics.endpoints)) {
        const endpointStats = calculateStats(stats.responseTimes);
        const endpointSuccessRate = (stats.successful / stats.requests) * 100;
        console.log(`   ${endpoint}:`);
        console.log(`     Requests: ${stats.requests} (${Math.round(endpointSuccessRate)}% success)`);
        console.log(`     Avg: ${endpointStats.avg}ms | 95th: ${endpointStats.p95}ms`);
      }
    }
  }

  // Basic API performance results
  if (results.basicAPI && Object.keys(results.basicAPI).length > 0) {
    log(colors.bold + colors.blue, '\n🔌 Basic API Performance:');
    Object.entries(results.basicAPI).forEach(([name, data]) => {
      const statusIcon = data.status === 'good' ? '✅' : data.status === 'okay' ? '⚠️' : '❌';
      console.log(`   ${statusIcon} ${name}: ${data.average}ms avg (${data.min}-${data.max}ms)`);
    });
  }

  // Performance Assessment
  if (results.concurrent && results.concurrent.metrics) {
    const concurrentMetrics = results.concurrent.metrics;
    const successRate = (concurrentMetrics.requests.successful / concurrentMetrics.requests.total) * 100;
    const responseTimeStats = calculateStats(concurrentMetrics.responseTimes);
    const requestsPerSecond = concurrentMetrics.requests.total / ((concurrentMetrics.endTime.getTime() - concurrentMetrics.startTime.getTime()) / 1000);
    
    log(colors.bold + colors.green, '\n🎯 Performance Assessment:');
    
    if (successRate >= 99) {
      log(colors.green, '   ✅ Excellent reliability (99%+ success rate)');
    } else if (successRate >= 95) {
      log(colors.yellow, '   ⚠️  Good reliability (95%+ success rate)');
    } else {
      log(colors.red, '   ❌ Poor reliability (<95% success rate)');
    }
    
    if (responseTimeStats.avg < 200) {
      log(colors.green, '   ✅ Excellent response times (<200ms avg)');
    } else if (responseTimeStats.avg < 500) {
      log(colors.yellow, '   ⚠️  Good response times (<500ms avg)');
    } else {
      log(colors.red, '   ❌ Slow response times (>500ms avg)');
    }
    
    if (requestsPerSecond > 50) {
      log(colors.green, '   ✅ High throughput (>50 req/s)');
    } else if (requestsPerSecond > 20) {
      log(colors.yellow, '   ⚠️  Good throughput (>20 req/s)');  
    } else {
      log(colors.red, '   ❌ Low throughput (<20 req/s)');
    }

    // Show top errors if any
    if (concurrentMetrics.errors.length > 0) {
      log(colors.yellow, '\n⚠️  Top Errors:');
      const errorCounts = {};
      concurrentMetrics.errors.forEach(error => {
        const key = `${error.endpoint}: ${error.error}`;
        errorCounts[key] = (errorCounts[key] || 0) + 1;
      });
      
      Object.entries(errorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([error, count]) => {
          console.log(`     ${count}x - ${error}`);
        });
    }
  }

  // Save comprehensive report
  const reportPath = path.join(outputDir, 'performance-test-report.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    config: { baseURL, concurrentUsers, durationSeconds },
    results
  };
  
  if (results.concurrent && results.concurrent.metrics) {
    const concurrentMetrics = results.concurrent.metrics;
    reportData.summary = {
      totalRequests: concurrentMetrics.requests.total,
      successRate: Math.round((concurrentMetrics.requests.successful / concurrentMetrics.requests.total) * 100),
      avgResponseTime: calculateStats(concurrentMetrics.responseTimes).avg,
      requestsPerSecond: Math.round(concurrentMetrics.requests.total / ((concurrentMetrics.endTime.getTime() - concurrentMetrics.startTime.getTime()) / 1000))
    };
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  log(colors.blue, `\n📄 Detailed report saved to: ${reportPath}`);
  
  // Determine exit code
  if (results.concurrent && results.concurrent.metrics) {
    const successRate = (results.concurrent.metrics.requests.successful / results.concurrent.metrics.requests.total) * 100;
    const avgResponseTime = calculateStats(results.concurrent.metrics.responseTimes).avg;
    
    if (successRate < 90 || avgResponseTime > 1000) {
      log(colors.red, '\n❌ Performance test indicates issues. Check the details above.');
      process.exit(1);
    } else {
      log(colors.green, '\n🎉 Performance test completed successfully!');
    }
  }
}

// Utility function to check if server is running
async function checkServer() {
  await initFetch();
  try {
    const response = await fetch(`${baseURL}/api/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
if (require.main === module) {
  (async () => {
    // Check if server is running
    const serverRunning = await checkServer();
    
    if (!serverRunning) {
      log(colors.red, `❌ Server not running on ${baseURL}`);
      log(colors.yellow, '💡 Please start the development server first: npm run dev');
      process.exit(1);
    }
    
    await runPerformanceTests();
  })();
}

module.exports = { runPerformanceTests };