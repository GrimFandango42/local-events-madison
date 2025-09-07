#!/usr/bin/env node
/**
 * One-click local setup and launch for Local Events.
 * - Verifies Node and npm
 * - Installs dependencies
 * - Ensures .env.local exists with sane defaults
 * - Runs Prisma generate + push, seeds sample data
 * - Starts Next.js dev server on a free port (3000+)
 * - Opens browser to the running app
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

function log(msg) { console.log(msg); }
function ok(msg) { console.log(`✅ ${msg}`); }
function warn(msg) { console.warn(`⚠️  ${msg}`); }
function err(msg) { console.error(`❌ ${msg}`); }

function run(cmd, opts = {}) {
  log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

async function portIsFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => server.close(() => resolve(true)))
      .listen(port, '127.0.0.1');
  });
}

async function getFreePort(start = 3000, limit = 20) {
  for (let p = start; p < start + limit; p++) {
    // eslint-disable-next-line no-await-in-loop
    if (await portIsFree(p)) return p;
  }
  throw new Error(`No free port found from ${start}..${start + limit - 1}`);
}

function openBrowser(url) {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true });
    } else if (platform === 'darwin') {
      spawn('open', [url], { stdio: 'ignore', detached: true });
    } else {
      spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
    }
  } catch (e) {
    warn(`Could not auto-open browser: ${e.message}`);
  }
}

async function main() {
  log('\n🎪 Local Events — One-Click Dev\n');

  // 1) Check Node
  const nodeVersion = process.version; // vX.Y.Z
  const major = parseInt(nodeVersion.replace('v','').split('.')[0], 10);
  if (Number.isNaN(major) || major < 18) {
    throw new Error(`Node 18+ required. Current: ${nodeVersion}`);
  }
  ok(`Node ${nodeVersion}`);

  // 2) npm install (skip if node_modules present)
  const root = process.cwd();
  const nodeModules = path.join(root, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    run('npm install');
  } else {
    ok('Dependencies already installed');
  }

  // 3) Ensure .env.local with sane defaults
  const envLocal = path.join(root, '.env.local');
  const envExample = path.join(root, '.env.example');
  if (!fs.existsSync(envLocal)) {
    if (fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envLocal);
      ok('Created .env.local from .env.example');
    } else {
      fs.writeFileSync(envLocal, 'DATABASE_URL="file:./dev.db"\nNEXTAUTH_URL="http://localhost:3000"\nNEXTAUTH_SECRET="dev-secret"\n');
      ok('Created .env.local with defaults');
    }
  } else {
    ok('.env.local present');
  }

  // 4) Prisma generate + push
  try {
    run('npm run db:generate');
  } catch (e) {
    const msg = String(e && e.message || e);
    if (/EPERM: operation not permitted, rename[\s\S]*\.prisma[\\/]client[\\/]query_engine-windows\.dll\.node/i.test(msg)) {
      warn('Prisma engine file locked. Attempting auto-repair...');
      const clientDir = path.join(root, 'node_modules', '.prisma', 'client');
      const enginesDir = path.join(root, 'node_modules', '@prisma', 'engines');
      try {
        // Best-effort cleanup of locked engine files and directories
        if (fs.existsSync(clientDir)) {
          try { fs.chmodSync(clientDir, 0o700); } catch {}
          fs.rmSync(clientDir, { recursive: true, force: true });
        }
        if (fs.existsSync(enginesDir)) {
          try { fs.chmodSync(enginesDir, 0o700); } catch {}
          fs.rmSync(enginesDir, { recursive: true, force: true });
        }
      } catch (cleanupErr) {
        warn(`Cleanup warning: ${cleanupErr.message || cleanupErr}`);
      }

      // Retry generate after cleanup
      try {
        run('npm run db:generate');
        ok('Prisma generate repaired');
      } catch (retryErr) {
        warn('Prisma generate still failing. Make sure no dev servers are running.');
        warn('Tip: close any Node/Next terminals, then press Enter to retry.');
        process.stdin.setRawMode && process.stdin.setRawMode(true);
        process.stdout.write('\nPress Enter to retry...');
        await new Promise((res) => process.stdin.once('data', () => res(null)));
        run('npm run db:generate');
      }
    } else {
      throw e;
    }
  }
  run('npm run db:push');

  // 5) Seed sample data (best-effort)
  try {
    run('npm run db:seed');
  } catch (e) {
    warn('Seeding failed or script missing; continuing');
  }

  // 6) Start Next on a free port and open browser
  const port = await getFreePort(3000, 10);
  const env = { ...process.env, PORT: String(port) };
  const url = `http://localhost:${port}`;

  ok(`Starting Next.js on ${url}`);
  const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], { env, stdio: 'inherit' });

  // Give Next a moment to start, then open browser
  setTimeout(() => openBrowser(url), 2500);

  child.on('exit', (code) => {
    if (code) err(`Dev server exited with code ${code}`);
    process.exit(code || 0);
  });
}

main().catch((e) => {
  err(e.message || String(e));
  process.exit(1);
});
