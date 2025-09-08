#!/usr/bin/env node

/**
 * Test script for Local Events Madison ChatGPT Connector
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ConnectorTester {
  constructor() {
    this.serverPath = join(__dirname, 'mcp-server.js');
  }

  async testConnector() {
    console.log('🧪 Testing Local Events Madison ChatGPT Connector\n');

    // Test 1: Server Startup
    console.log('1. Testing server startup...');
    const startupTest = await this.testServerStartup();
    if (!startupTest) {
      console.log('❌ Server startup failed');
      return false;
    }
    console.log('✅ Server startup successful\n');

    // Test 2: Tool Listing
    console.log('2. Testing tool listing...');
    const toolsTest = await this.testToolListing();
    if (!toolsTest) {
      console.log('❌ Tool listing failed');
      return false;
    }
    console.log('✅ Tool listing successful\n');

    // Test 3: API Connectivity
    console.log('3. Testing API connectivity...');
    const apiTest = await this.testApiConnectivity();
    if (!apiTest) {
      console.log('⚠️ API connectivity test failed (platform may not be running)');
    } else {
      console.log('✅ API connectivity successful\n');
    }

    console.log('🎉 Connector testing complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Ensure Local Events platform is running: npm run dev');
    console.log('   2. Add connector to ChatGPT settings');
    console.log('   3. Test with natural language queries in ChatGPT');
    
    return true;
  }

  async testServerStartup() {
    return new Promise((resolve) => {
      const server = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let hasStarted = false;

      server.stderr.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Local Events MCP server running')) {
          hasStarted = true;
          server.kill();
          resolve(true);
        }
      });

      server.on('error', () => {
        resolve(false);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!hasStarted) {
          server.kill();
          resolve(false);
        }
      }, 5000);

      // Send test message
      setTimeout(() => {
        server.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' }
          }
        }) + '\n');
      }, 1000);
    });
  }

  async testToolListing() {
    return new Promise((resolve) => {
      const server = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let toolsReceived = false;

      server.stdout.on('data', (data) => {
        const messages = data.toString().split('\n').filter(line => line.trim());
        for (const message of messages) {
          try {
            const parsed = JSON.parse(message);
            if (parsed.result && parsed.result.tools) {
              const tools = parsed.result.tools;
              console.log(`   Found ${tools.length} tools:`);
              tools.forEach(tool => {
                console.log(`   - ${tool.name}: ${tool.description}`);
              });
              toolsReceived = true;
              server.kill();
              resolve(true);
              return;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });

      server.on('error', () => {
        resolve(false);
      });

      // Initialize and list tools
      setTimeout(() => {
        server.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' }
          }
        }) + '\n');

        setTimeout(() => {
          server.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {}
          }) + '\n');
        }, 500);
      }, 1000);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!toolsReceived) {
          server.kill();
          resolve(false);
        }
      }, 10000);
    });
  }

  async testApiConnectivity() {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('http://localhost:3001/api/dashboard');
      const data = await response.json();
      
      if (data.success || response.status === 200) {
        console.log('   Platform API is accessible');
        return true;
      } else {
        console.log('   Platform API returned error:', data.error);
        return false;
      }
    } catch (error) {
      console.log('   Platform API is not accessible:', error.message);
      console.log('   This is expected if the Local Events platform is not running');
      return false;
    }
  }
}

// Run tests
const tester = new ConnectorTester();
tester.testConnector().catch(console.error);