#!/usr/bin/env node

/**
 * Bundle Analyzer Script for Local Events
 * Analyzes Next.js bundle size and provides optimization recommendations
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

function analyzeBundle() {
  log(colors.blue, '\n🔍 Analyzing Next.js Bundle...\n');

  try {
    // Build the application first
    log(colors.yellow, '📦 Building application...');
    execSync('npm run build', { stdio: 'inherit' });

    // Get build info
    const buildManifest = path.join(process.cwd(), '.next/build-manifest.json');
    const appManifest = path.join(process.cwd(), '.next/app-build-manifest.json');
    
    if (fs.existsSync(buildManifest)) {
      analyzeBuildManifest(buildManifest);
    }

    if (fs.existsSync(appManifest)) {
      analyzeAppManifest(appManifest);
    }

    // Analyze static files
    analyzeStaticFiles();

    // Provide recommendations
    provideRecommendations();

  } catch (error) {
    log(colors.red, `❌ Error analyzing bundle: ${error.message}`);
    process.exit(1);
  }
}

function analyzeBuildManifest(manifestPath) {
  log(colors.green, '\n📊 Build Manifest Analysis:');
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Analyze pages
    const pages = manifest.pages;
    const sortedPages = Object.entries(pages).map(([route, files]) => {
      const totalSize = files.reduce((sum, file) => {
        const filePath = path.join(process.cwd(), '.next', file);
        try {
          return sum + fs.statSync(filePath).size;
        } catch {
          return sum;
        }
      }, 0);
      
      return { route, files: files.length, size: totalSize };
    }).sort((a, b) => b.size - a.size);

    console.log('\nPage sizes:');
    sortedPages.slice(0, 10).forEach(page => {
      const sizeKB = (page.size / 1024).toFixed(2);
      const color = page.size > 500000 ? colors.red : page.size > 250000 ? colors.yellow : colors.green;
      console.log(`  ${color}${page.route.padEnd(30)} ${sizeKB.padStart(8)} KB (${page.files} files)${colors.reset}`);
    });

    // Analyze shared chunks
    log(colors.green, '\n📦 Shared Chunks:');
    if (manifest.sortedPages) {
      const sharedChunks = new Set();
      manifest.sortedPages.forEach(page => {
        const pageFiles = pages[page];
        pageFiles.forEach(file => {
          if (file.includes('chunks/') && !file.includes('pages/')) {
            sharedChunks.add(file);
          }
        });
      });

      Array.from(sharedChunks).slice(0, 10).forEach(chunk => {
        try {
          const filePath = path.join(process.cwd(), '.next', chunk);
          const size = fs.statSync(filePath).size;
          const sizeKB = (size / 1024).toFixed(2);
          const color = size > 100000 ? colors.red : size > 50000 ? colors.yellow : colors.green;
          console.log(`  ${color}${path.basename(chunk).padEnd(40)} ${sizeKB.padStart(8)} KB${colors.reset}`);
        } catch {
          // File might not exist
        }
      });
    }

  } catch (error) {
    log(colors.red, `Error reading build manifest: ${error.message}`);
  }
}

function analyzeAppManifest(manifestPath) {
  log(colors.green, '\n📱 App Manifest Analysis:');
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (manifest.pages) {
      const appPages = Object.entries(manifest.pages).map(([route, info]) => {
        return { route, ...info };
      }).sort((a, b) => (b.size || 0) - (a.size || 0));

      console.log('\nApp Router pages:');
      appPages.slice(0, 10).forEach(page => {
        if (page.size) {
          const sizeKB = (page.size / 1024).toFixed(2);
          const color = page.size > 500000 ? colors.red : page.size > 250000 ? colors.yellow : colors.green;
          console.log(`  ${color}${page.route.padEnd(30)} ${sizeKB.padStart(8)} KB${colors.reset}`);
        }
      });
    }

  } catch (error) {
    log(colors.red, `Error reading app manifest: ${error.message}`);
  }
}

function analyzeStaticFiles() {
  log(colors.green, '\n📁 Static Assets Analysis:');
  
  const staticDir = path.join(process.cwd(), '.next/static');
  if (!fs.existsSync(staticDir)) {
    log(colors.yellow, 'No static directory found');
    return;
  }

  const staticFiles = [];
  
  function scanDirectory(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = prefix ? `${prefix}/${item}` : item;
      
      if (fs.statSync(fullPath).isDirectory()) {
        scanDirectory(fullPath, relativePath);
      } else {
        const size = fs.statSync(fullPath).size;
        staticFiles.push({ path: relativePath, size });
      }
    }
  }
  
  scanDirectory(staticDir);
  
  // Sort by size and show largest files
  staticFiles.sort((a, b) => b.size - a.size);
  
  console.log('\nLargest static files:');
  staticFiles.slice(0, 15).forEach(file => {
    const sizeKB = (file.size / 1024).toFixed(2);
    const color = file.size > 500000 ? colors.red : file.size > 100000 ? colors.yellow : colors.green;
    console.log(`  ${color}${file.path.padEnd(50)} ${sizeKB.padStart(8)} KB${colors.reset}`);
  });

  // Summary
  const totalSize = staticFiles.reduce((sum, file) => sum + file.size, 0);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
  log(colors.blue, `\nTotal static assets: ${totalSizeMB} MB (${staticFiles.length} files)`);
}

function provideRecommendations() {
  log(colors.green, '\n💡 Performance Recommendations:\n');

  const recommendations = [
    {
      category: '🏠 Core Web Vitals',
      items: [
        'Use next/image for all images to enable automatic optimization',
        'Implement proper loading states to improve perceived performance',
        'Use font-display: swap for better font loading performance',
        'Preload critical resources in <head>'
      ]
    },
    {
      category: '📦 Bundle Optimization',
      items: [
        'Use dynamic imports for heavy components: const Component = dynamic(() => import("./Component"))',
        'Implement proper code splitting at route level',
        'Use React.memo() for expensive components',
        'Tree-shake unused dependencies',
        'Consider using smaller alternatives for large packages'
      ]
    },
    {
      category: '🚀 Caching Strategy',
      items: [
        'Implement proper API response caching',
        'Use SWR or React Query for client-side caching',
        'Set up proper browser caching headers',
        'Implement service worker for offline capabilities'
      ]
    },
    {
      category: '🔍 Monitoring',
      items: [
        'Set up Core Web Vitals monitoring',
        'Monitor bundle size in CI/CD pipeline',
        'Use Lighthouse CI for performance regression testing',
        'Track performance metrics in production'
      ]
    }
  ];

  recommendations.forEach(category => {
    log(colors.bold + colors.blue, category.category);
    category.items.forEach(item => {
      console.log(`  • ${item}`);
    });
    console.log('');
  });
}

// Run the analysis
if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle };