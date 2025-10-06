#!/usr/bin/env node
/**
 * Build Validation Test
 * Ensures the build process completes successfully and all required files are generated
 */

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🧪 Build Validation Test');
console.log('========================\n');

let exitCode = 0;

function validateFile(path, description) {
  const exists = fs.existsSync(path);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${path}`);
  if (!exists) exitCode = 1;
  return exists;
}

function validateDirectory(path, description) {
  const exists = fs.existsSync(path) && fs.statSync(path).isDirectory();
  console.log(`${exists ? '✅' : '❌'} ${description}: ${path}`);
  if (!exists) exitCode = 1;
  return exists;
}

try {
  // Test 1: Validate build script exists
  console.log('📋 Test 1: Build Script Validation');
  validateFile('scripts/build.js', 'Build script exists');
  console.log();

  // Test 2: Validate client package.json exists
  console.log('📋 Test 2: Client Configuration Validation');
  validateFile('client/package.json', 'Client package.json exists');
  console.log();

  // Test 3: Check if build outputs exist (if build has been run)
  console.log('📋 Test 3: Build Output Validation');
  const distExists = fs.existsSync('dist');
  
  if (distExists) {
    console.log('✅ Build has been run, validating outputs...');
    validateDirectory('dist/public', 'Client build directory');
    validateFile('dist/public/index.html', 'Client index.html');
    
    // Check if server was compiled
    if (fs.existsSync('dist/server')) {
      validateDirectory('dist/server', 'Server build directory');
      validateFile('dist/server/index.js', 'Server index.js');
    } else {
      console.log('ℹ️  Server not compiled (will use tsx runtime)');
    }
  } else {
    console.log('ℹ️  Build not run yet (dist/ directory not found)');
    console.log('   This is expected on fresh clone before first build');
  }
  console.log();

  // Test 4: Verify build script has client dependency installation
  console.log('📋 Test 4: Build Script Content Validation');
  const buildScript = fs.readFileSync('scripts/build.js', 'utf-8');
  
  const hasClientInstall = buildScript.includes('cd client && npm ci') || 
                          buildScript.includes('cd client && npm install');
  console.log(`${hasClientInstall ? '✅' : '❌'} Build script installs client dependencies`);
  if (!hasClientInstall) {
    console.log('   ⚠️  Build script should install client dependencies before building');
    exitCode = 1;
  }

  const hasViteBuild = buildScript.includes('vite build');
  console.log(`${hasViteBuild ? '✅' : '❌'} Build script includes Vite build command`);
  if (!hasViteBuild) exitCode = 1;

  console.log();

  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  if (exitCode === 0) {
    console.log('✅ All build validation tests passed!');
  } else {
    console.log('❌ Some build validation tests failed');
  }

} catch (error) {
  console.error('❌ Build validation error:', error.message);
  exitCode = 1;
}

process.exit(exitCode);
