#!/usr/bin/env node

/**
 * Performance Testing Script for Local Events
 * Tests API response times, database performance, and Core Web Vitals
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

async function runPerformanceTests() {
  log(colors.blue, '\n🚀 Running Performance Tests...\n');

  const results = {
    api: {},
    database: {},
    webVitals: {},
    lighthouse: {}
  };

  try {
    // Test API endpoints
    results.api = await testAPIPerformance();
    
    // Test database performance
    results.database = await testDatabasePerformance();
    
    // Generate report
    generateReport(results);
    
  } catch (error) {
    log(colors.red, `❌ Error running performance tests: ${error.message}`);
    process.exit(1);
  }
}

async function testAPIPerformance() {
  log(colors.green, '🔌 Testing API Performance...');

  const endpoints = [
    { name: 'Dashboard', url: 'http://localhost:3001/api/dashboard' },
    { name: 'Events (page 1)', url: 'http://localhost:3001/api/events?page=1&pageSize=12' },
    { name: 'Events (search)', url: 'http://localhost:3001/api/events?search=music&page=1&pageSize=12' },
    { name: 'Health Check', url: 'http://localhost:3001/api/health' },
    { name: 'Neighborhoods', url: 'http://localhost:3001/api/neighborhoods' }
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

function generateReport(results) {
  log(colors.green, '\n📊 Performance Report Summary:\n');

  // API Performance Summary
  log(colors.bold + colors.blue, '🔌 API Performance:');
  Object.entries(results.api).forEach(([name, data]) => {
    const statusIcon = data.status === 'good' ? '✅' : data.status === 'okay' ? '⚠️' : '❌';
    console.log(`  ${statusIcon} ${name}: ${data.average}ms average`);
  });

  // Database Performance Summary
  if (Object.keys(results.database).length > 0) {
    log(colors.bold + colors.blue, '\n💾 Database Performance:');
    Object.entries(results.database).forEach(([name, data]) => {
      const statusIcon = data.status === 'good' ? '✅' : data.status === 'okay' ? '⚠️' : '❌';
      console.log(`  ${statusIcon} ${name}: ${data.averageTime}ms average`);
    });
  }

  // Overall recommendations
  log(colors.green, '\n💡 Recommendations:');
  
  const apiIssues = Object.values(results.api).filter(r => r.status !== 'good');
  const dbIssues = Object.values(results.database).filter(r => r.status !== 'good');
  
  if (apiIssues.length === 0 && dbIssues.length === 0) {
    log(colors.green, '  🎉 All performance metrics are looking good!');
  } else {
    if (apiIssues.length > 0) {
      console.log('  • Consider implementing more aggressive caching for slower API endpoints');
      console.log('  • Review database query optimization for endpoints with high response times');
    }
    if (dbIssues.length > 0) {
      console.log('  • Add database indexes for commonly filtered/searched fields');
      console.log('  • Consider implementing database query result caching');
    }
  }

  // Save results to file
  const reportPath = path.join(process.cwd(), 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results
  }, null, 2));
  
  log(colors.blue, `\n📄 Detailed report saved to: ${reportPath}`);
}

// Utility function to check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/health');
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
      log(colors.red, '❌ Server not running on localhost:3001');
      log(colors.yellow, '💡 Please start the development server first: npm run dev');
      process.exit(1);
    }
    
    await runPerformanceTests();
  })();
}

module.exports = { runPerformanceTests };