#!/usr/bin/env node
// Simple configuration validator to catch common setup issues
const fs = require('fs');
const path = require('path');

function ok(msg) { console.log(`✅ ${msg}`); }
function warn(msg) { console.warn(`⚠️  ${msg}`); }
function err(msg) { console.error(`❌ ${msg}`); }

function requireEnv(name) {
  const val = process.env[name];
  if (!val || String(val).trim() === '') {
    warn(`${name} not set`);
    return false;
  }
  ok(`${name} present`);
  return true;
}

function main() {
  console.log('\n🔎 Validating Local Events configuration...');

  // 1) .env files
  const envLocal = path.join(process.cwd(), '.env.local');
  const envExample = path.join(process.cwd(), '.env.example');
  if (fs.existsSync(envLocal)) ok('.env.local found'); else warn('.env.local missing');
  if (fs.existsSync(envExample)) ok('.env.example found'); else warn('.env.example missing');

  // 2) Required env vars (soft)
  const haveDb = requireEnv('DATABASE_URL');
  requireEnv('NEXTAUTH_URL');
  requireEnv('NEXTAUTH_SECRET');
  process.env.LOCAL_EVENTS_API_URL && ok('LOCAL_EVENTS_API_URL present');

  // 3) Prisma schema
  const prismaSchema = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (fs.existsSync(prismaSchema)) ok('Prisma schema present'); else return err('Missing prisma/schema.prisma');

  // 4) Scripts sanity
  const pkgPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const requiredScripts = ['dev','db:generate','db:push','db:seed','scrape:once'];
  const missingScripts = requiredScripts.filter(s => !pkg.scripts || !pkg.scripts[s]);
  if (missingScripts.length) warn(`Missing npm scripts: ${missingScripts.join(', ')}`); else ok('Core npm scripts present');

  // 5) API routes critical
  const routes = [
    'app/api/events/route.ts',
    'app/api/events/[id]/route.ts',
    'app/api/sources/route.ts',
    'app/api/sources/submit/route.ts',
    'app/api/dashboard/route.ts',
    'app/api/neighborhoods/route.ts',
  ];
  const missingRoutes = routes.filter(r => !fs.existsSync(path.join(process.cwd(), r)));
  if (missingRoutes.length) return err(`Missing API routes: ${missingRoutes.join(', ')}`);
  ok('API routes present');

  console.log('\n✨ Config validation complete');
  if (!haveDb) process.exitCode = 2;
}

main();

