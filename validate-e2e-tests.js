#!/usr/bin/env node

/**
 * E2E Test Infrastructure Validation Script
 * 
 * This script validates the E2E test infrastructure without running full browser tests.
 * It checks:
 * - Test file structure
 * - Configuration validity
 * - Server availability
 * - Test dependencies
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

console.log('🧪 E2E Test Infrastructure Validation');
console.log('=====================================\n');

// Test counters
const stats = {
  totalTestFiles: 0,
  totalTests: 0,
  validFiles: 0,
  invalidFiles: 0,
  configFiles: 0
};

/**
 * Check server availability
 */
async function checkServerHealth() {
  console.log('🔍 1. Checking Server Health...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    if (data.ready) {
      console.log('   ✅ Server is ready');
      console.log(`   📍 URL: ${BASE_URL}`);
      console.log(`   🌍 Environment: ${data.environment}`);
      console.log(`   ⏰ Timestamp: ${data.timestamp}\n`);
      return true;
    } else {
      console.log('   ❌ Server is not ready\n');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Server unreachable: ${error.message}\n`);
    return false;
  }
}

/**
 * Find all test files
 */
async function findTestFiles(dir = 'tests', files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await findTestFiles(fullPath, files);
    } else if (entry.name.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Analyze test file
 */
async function analyzeTestFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    
    // Count test cases
    const testMatches = content.match(/test\s*\(/g) || [];
    const testDescribeMatches = content.match(/test\.describe\s*\(/g) || [];
    const testCount = testMatches.length;
    
    // Check for common patterns
    const hasAsync = content.includes('async');
    const hasExpect = content.includes('expect(');
    const hasPage = content.includes('page');
    const hasBrowser = content.includes('browser');
    const hasRequest = content.includes('request');
    
    return {
      valid: testCount > 0,
      testCount,
      describeBlocks: testDescribeMatches.length,
      patterns: {
        hasAsync,
        hasExpect,
        hasPage,
        hasBrowser,
        hasRequest
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Check Playwright configuration
 */
async function checkPlaywrightConfig() {
  console.log('📝 2. Checking Playwright Configuration...');
  
  const configFiles = [
    'playwright.config.ts',
    'playwright-validation.config.ts'
  ];
  
  for (const configFile of configFiles) {
    try {
      const content = await readFile(configFile, 'utf-8');
      const fileSize = (await stat(configFile)).size;
      
      console.log(`   ✅ ${configFile} (${fileSize} bytes)`);
      
      // Extract key configuration
      const timeoutMatch = content.match(/timeout:\s*(\d+)/);
      const retriesMatch = content.match(/retries:\s*(\d+)/);
      const testDirMatch = content.match(/testDir:\s*["'](.+?)["']/);
      
      if (timeoutMatch) console.log(`      ⏱️  Timeout: ${timeoutMatch[1]}ms`);
      if (retriesMatch) console.log(`      🔄 Retries: ${retriesMatch[1]}`);
      if (testDirMatch) console.log(`      📁 Test Dir: ${testDirMatch[1]}`);
      
      stats.configFiles++;
    } catch (error) {
      console.log(`   ❌ ${configFile} not found`);
    }
  }
  
  console.log();
}

/**
 * Analyze test files
 */
async function analyzeTestFiles() {
  console.log('🔍 3. Analyzing Test Files...\n');
  
  const testFiles = await findTestFiles();
  stats.totalTestFiles = testFiles.length;
  
  console.log(`   Found ${testFiles.length} test files\n`);
  
  const categories = {};
  
  for (const filePath of testFiles) {
    const fileName = relative(process.cwd(), filePath);
    const analysis = await analyzeTestFile(filePath);
    
    if (analysis.valid) {
      stats.validFiles++;
      stats.totalTests += analysis.testCount;
      
      // Categorize
      const category = fileName.split('/').pop().replace('.spec.ts', '').replace(/-/g, ' ');
      
      if (!categories[category]) {
        categories[category] = {
          count: 0,
          files: []
        };
      }
      
      categories[category].count += analysis.testCount;
      categories[category].files.push(fileName);
      
      console.log(`   ✅ ${fileName}`);
      console.log(`      📊 Tests: ${analysis.testCount}, Describes: ${analysis.describeBlocks}`);
      console.log(`      🔧 Patterns: ${Object.entries(analysis.patterns)
        .filter(([_, v]) => v)
        .map(([k]) => k.replace('has', ''))
        .join(', ')}`);
    } else {
      stats.invalidFiles++;
      console.log(`   ❌ ${fileName}: ${analysis.error || 'No tests found'}`);
    }
  }
  
  console.log('\n📊 4. Test Categories Summary...\n');
  
  for (const [category, data] of Object.entries(categories)) {
    console.log(`   📁 ${category}: ${data.count} tests`);
  }
  
  console.log();
}

/**
 * Check dependencies
 */
async function checkDependencies() {
  console.log('📦 5. Checking Test Dependencies...');
  
  try {
    const packageJson = JSON.parse(await readFile('package.json', 'utf-8'));
    
    const testDeps = {
      '@playwright/test': packageJson.dependencies?.['@playwright/test'] || 
                         packageJson.devDependencies?.['@playwright/test'],
      'playwright': packageJson.dependencies?.['playwright'] || 
                   packageJson.devDependencies?.['playwright']
    };
    
    for (const [dep, version] of Object.entries(testDeps)) {
      if (version) {
        console.log(`   ✅ ${dep}: ${version}`);
      } else {
        console.log(`   ❌ ${dep}: Not installed`);
      }
    }
    
    console.log();
  } catch (error) {
    console.log(`   ❌ Error reading package.json: ${error.message}\n`);
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log('═══════════════════════════════════════');
  console.log('📈 VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════\n');
  
  console.log(`📁 Test Files: ${stats.totalTestFiles}`);
  console.log(`✅ Valid Files: ${stats.validFiles}`);
  console.log(`❌ Invalid Files: ${stats.invalidFiles}`);
  console.log(`🧪 Total Tests: ${stats.totalTests}`);
  console.log(`⚙️  Config Files: ${stats.configFiles}`);
  
  console.log('\n📊 Status:');
  
  if (stats.validFiles > 0 && stats.totalTests > 0) {
    console.log('   ✅ E2E test infrastructure is set up correctly');
    console.log('   📝 Ready for test execution once browsers are installed');
  } else {
    console.log('   ⚠️  E2E test infrastructure needs attention');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Install Playwright browsers: npx playwright install');
  console.log('   2. Run tests: npm run test:e2e');
  console.log('   3. View test report: npx playwright show-report logs/playwright-report');
  
  console.log('\n✨ Validation Complete!\n');
}

/**
 * Main function
 */
async function main() {
  try {
    await checkServerHealth();
    await checkPlaywrightConfig();
    await analyzeTestFiles();
    await checkDependencies();
    printSummary();
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run validation
main();
