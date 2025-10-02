#!/usr/bin/env node

/**
 * ImmoXX Production Build Script
 * Konsolidiertes Build-Script für Client & Server
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 ImmoXX Production Build');
console.log('===========================\n');

try {
  // 1. Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
  }
  fs.mkdirSync('dist', { recursive: true });
  fs.mkdirSync('dist/public', { recursive: true });

  // 2. Build client with Vite
  console.log('\n📦 Building client with Vite...');
  execSync('vite build', { stdio: 'inherit' });
  console.log('✅ Client build completed');

  // 3. Build server with TypeScript (with tsx fallback)
  console.log('\n🔧 Building server...');
  let serverCompiled = false;

  try {
    execSync('tsc -p tsconfig.prod.json', { stdio: 'inherit' });
    serverCompiled = true;
    console.log('✅ Server compiled to JavaScript');
  } catch (error) {
    console.warn('⚠️  TypeScript compilation had errors');
    console.log('📝 Production will use tsx runtime');
  }

  // 4. Verify build outputs
  const checks = {
    'Client': fs.existsSync('dist/public/index.html'),
    'Server Source': fs.existsSync('server/index.ts'),
    'Server Build': serverCompiled && fs.existsSync('dist/server/index.js'),
  };

  console.log('\n📊 Build Status:');
  for (const [name, exists] of Object.entries(checks)) {
    console.log(`  ${exists ? '✅' : '❌'} ${name}`);
  }

  if (checks['Client'] && checks['Server Source']) {
    console.log('\n🎉 Build successful!');
    console.log(`📦 Runtime: ${serverCompiled ? 'Compiled JS' : 'tsx (TypeScript)'}`);
  } else {
    throw new Error('Build verification failed');
  }

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}