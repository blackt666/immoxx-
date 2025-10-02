#!/usr/bin/env node

/**
 * DeepSeek API Integration Test
 *
 * Tests the DeepSeek API integration:
 * - API connection
 * - Property valuation
 * - Market analysis
 * - Description generation
 */

import { config } from 'dotenv';
config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5001';
const API_KEY = process.env.DEEPSEEK_API_KEY;

console.log('🧪 DeepSeek API Integration Test');
console.log('================================\n');

async function testAPIConnection() {
  console.log('1. Testing API connection...');

  try {
    const response = await fetch(`${BASE_URL}/api/deepseek/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success && data.data.connected) {
      console.log('✅ API connection successful\n');
      return true;
    } else {
      console.log('❌ API connection failed\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message, '\n');
    return false;
  }
}

async function testPropertyValuation() {
  console.log('2. Testing property valuation...');

  const testData = {
    address: 'Seestraße 15, 78464 Konstanz',
    propertyType: 'Wohnung',
    size: 120,
    rooms: 3,
    yearBuilt: 2015,
    condition: 'gut',
    features: ['Balkon', 'Seeblick', 'Einbauküche'],
    location: {
      city: 'Konstanz',
      region: 'Bodensee',
      proximity: ['Seeufer', 'Stadtzen trum'],
    },
  };

  try {
    const response = await fetch(`${BASE_URL}/api/deepseek/valuation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Property valuation successful');
      console.log('   Estimated value:', data.data.estimatedValue);
      console.log('   Confidence:', data.data.confidence);
      console.log();
      return true;
    } else {
      console.log('❌ Property valuation failed:', data.error, '\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Valuation test error:', error.message, '\n');
    return false;
  }
}

async function testMarketAnalysis() {
  console.log('3. Testing market analysis...');

  const testData = {
    region: 'Bodensee',
    propertyType: 'Wohnung',
    timeframe: 'letzten 12 Monate',
  };

  try {
    const response = await fetch(`${BASE_URL}/api/deepseek/market-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Market analysis successful');
      console.log('   Analysis preview:', data.data.analysis.substring(0, 100) + '...');
      console.log();
      return true;
    } else {
      console.log('❌ Market analysis failed:', data.error, '\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Market analysis test error:', error.message, '\n');
    return false;
  }
}

async function testDescriptionGeneration() {
  console.log('4. Testing description generation...');

  const testData = {
    title: 'Moderne 3-Zimmer-Wohnung mit Seeblick',
    type: 'Wohnung',
    size: 120,
    rooms: 3,
    features: ['Balkon', 'Seeblick', 'Einbauküche', 'Tiefgarage'],
    location: 'Konstanz, Bodensee',
  };

  try {
    const response = await fetch(`${BASE_URL}/api/deepseek/generate-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Description generation successful');
      console.log('   Description preview:', data.data.description.substring(0, 100) + '...');
      console.log();
      return true;
    } else {
      console.log('❌ Description generation failed:', data.error, '\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Description generation test error:', error.message, '\n');
    return false;
  }
}

async function testServiceStatus() {
  console.log('5. Testing service status...');

  try {
    const response = await fetch(`${BASE_URL}/api/deepseek/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Service status retrieved');
      console.log('   Configured:', data.data.configured);
      console.log('   Model:', data.data.model);
      console.log('   Max tokens:', data.data.maxTokens);
      console.log('   Temperature:', data.data.temperature);
      console.log();
      return true;
    } else {
      console.log('❌ Service status failed:', data.error, '\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Service status test error:', error.message, '\n');
    return false;
  }
}

async function runAllTests() {
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`API Key configured: ${API_KEY ? 'Yes' : 'No'}\n`);

  if (!API_KEY) {
    console.log('⚠️  Warning: DEEPSEEK_API_KEY not configured');
    console.log('   Set DEEPSEEK_API_KEY in .env file\n');
  }

  const results = {
    connection: await testAPIConnection(),
    status: await testServiceStatus(),
    valuation: await testPropertyValuation(),
    marketAnalysis: await testMarketAnalysis(),
    description: await testDescriptionGeneration(),
  };

  console.log('================================');
  console.log('Test Results Summary:');
  console.log('================================');
  console.log(`Connection Test:       ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Service Status:        ${results.status ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Property Valuation:    ${results.valuation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Market Analysis:       ${results.marketAnalysis ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Description Generation: ${results.description ? '✅ PASS' : '❌ FAIL'}`);
  console.log('================================\n');

  const allPassed = Object.values(results).every(Boolean);

  if (allPassed) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
