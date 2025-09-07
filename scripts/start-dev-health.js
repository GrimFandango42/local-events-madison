#!/usr/bin/env node
/**
 * Start Dev (Clean + Health):
 * - Cleans caches
 * - Ensures Prisma client + DB schema
 * - Starts Next.js dev on a free port (3000+)
 * - Opens /admin/health automatically
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

function log(m){ console.log(m); }
function run(cmd, opts={}){ log(`$ ${cmd}`); execSync(cmd, { stdio:'inherit', ...opts }); }

async function portIsFree(port){
  return await new Promise(res => {
    const s = net.createServer().once('error',()=>res(false)).once('listening',()=>s.close(()=>res(true))).listen(port,'127.0.0.1');
  });
}
async function getFreePort(start=3000, span=10){
  for (let p=start;p<start+span;p++){ if (await portIsFree(p)) return p; }
  throw new Error('No free port found');
}
function openBrowser(url){
  const pl = process.platform;
  try {
    if (pl === 'win32') spawn('cmd',['/c','start','',url],{detached:true,stdio:'ignore'});
    else if (pl === 'darwin') spawn('open',[url],{detached:true,stdio:'ignore'});
    else spawn('xdg-open',[url],{detached:true,stdio:'ignore'});
  } catch {}
}

async function main(){
  const root = process.cwd();
  log('\n🚀 Start Dev (Clean + Health)');

  // Clean caches
  try { run('npm run dev:clean'); } catch {}

  // Prisma generate with Windows EPERM auto-repair
  try {
    run('npm run db:generate');
  } catch (e){
    const clientDir = path.join(root,'node_modules','.prisma','client');
    const enginesDir = path.join(root,'node_modules','@prisma','engines');
    try { if (fs.existsSync(clientDir)) { try{fs.chmodSync(clientDir,0o700);}catch{} fs.rmSync(clientDir,{recursive:true,force:true}); } } catch{}
    try { if (fs.existsSync(enginesDir)) { try{fs.chmodSync(enginesDir,0o700);}catch{} fs.rmSync(enginesDir,{recursive:true,force:true}); } } catch{}
    run('npm run db:generate');
  }

  run('npm run db:push');

  const port = await getFreePort(3000, 10);
  const url = `http://localhost:${port}/admin/health`;
  log(`✅ Starting Next.js on ${url}`);

  const child = spawn(process.platform==='win32'?'npm.cmd':'npm',['run','dev'],{env:{...process.env,PORT:String(port)},stdio:'inherit'});
  setTimeout(()=>openBrowser(url),2500);
  child.on('exit', code => process.exit(code||0));
}

main().catch(e=>{ console.error('❌', e.message||e); process.exit(1); });

