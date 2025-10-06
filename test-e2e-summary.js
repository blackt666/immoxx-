#!/usr/bin/env node

/**
 * E2E Test Quick Summary Script
 * Runs key E2E tests and generates a summary
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const testSuites = [
  { name: 'Health Checks', file: 'tests/health.spec.ts' },
  { name: 'Navigation Links', file: 'tests/navigation-links.spec.ts' },
  { name: 'Translation System', file: 'tests/translation.spec.ts' },
  { name: 'User Journey', file: 'tests/user-journey-complete.spec.ts' },
];

console.log('🧪 E2E Test Quick Summary');
console.log('========================\n');

const results = [];
let totalPassed = 0;
let totalFailed = 0;

for (const suite of testSuites) {
  console.log(`\n🔍 Running: ${suite.name}...`);
  
  try {
    const { stdout, stderr } = await execAsync(
      `npm run test:e2e -- ${suite.file} --reporter=json`,
      { 
        cwd: process.cwd(),
        timeout: 90000,
        env: { ...process.env, FORCE_COLOR: '0' }
      }
    );
    
    try {
      // Extract results from JSON
      const jsonMatch = stdout.match(/\{[\s\S]*"suites"[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        const stats = data.stats || {};
        
        const passed = stats.expected || 0;
        const failed = stats.unexpected || 0;
        const skipped = stats.skipped || 0;
        
        totalPassed += passed;
        totalFailed += failed;
        
        results.push({
          name: suite.name,
          passed,
          failed,
          skipped,
          status: failed === 0 ? '✅' : '⚠️'
        });
        
        console.log(`   ${failed === 0 ? '✅' : '⚠️'} ${passed} passed${failed > 0 ? `, ${failed} failed` : ''}`);
      } else {
        // Fallback: parse line reporter output
        const passedMatch = stdout.match(/(\d+) passed/);
        const failedMatch = stdout.match(/(\d+) failed/);
        
        const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        
        totalPassed += passed;
        totalFailed += failed;
        
        results.push({
          name: suite.name,
          passed,
          failed,
          status: failed === 0 ? '✅' : '⚠️'
        });
        
        console.log(`   ${failed === 0 ? '✅' : '⚠️'} ${passed} passed${failed > 0 ? `, ${failed} failed` : ''}`);
      }
    } catch (parseError) {
      console.log(`   ⚠️ Could not parse results`);
      results.push({
        name: suite.name,
        passed: 0,
        failed: 0,
        status: '⚠️'
      });
    }
  } catch (error) {
    console.log(`   ❌ Test suite failed to run`);
    results.push({
      name: suite.name,
      passed: 0,
      failed: 0,
      status: '❌',
      error: error.message
    });
  }
}

console.log('\n\n═══════════════════════════════════');
console.log('📊 SUMMARY');
console.log('═══════════════════════════════════\n');

for (const result of results) {
  console.log(`${result.status} ${result.name}`);
  console.log(`   Passed: ${result.passed}, Failed: ${result.failed}`);
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
}

console.log('\n───────────────────────────────────');
console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);

const successRate = totalPassed + totalFailed > 0 
  ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) 
  : 0;

console.log(`Success Rate: ${successRate}%`);
console.log('───────────────────────────────────\n');

if (successRate >= 80) {
  console.log('✅ E2E tests are in good shape!');
} else if (successRate >= 50) {
  console.log('⚠️ Some E2E tests need attention');
} else {
  console.log('❌ E2E tests need significant work');
}

console.log('\n💡 Run full suite with: npm run test:e2e');
console.log('📊 View detailed report: npx playwright show-report logs/playwright-report\n');
