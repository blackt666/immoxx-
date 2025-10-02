#!/usr/bin/env node
/**
 * Quick API validation script - Tests können sofort ausgeführt werden
 */

const BASE_URL = 'http://localhost:5003';

async function testHealthEndpoint() {
  try {
    console.log('🔍 Testing Health Endpoint...');
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    console.log('✅ Health Endpoint Response:', data);
    
    // Validate response structure
    const requiredFields = ['status', 'ready', 'timestamp', 'port', 'host'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length === 0) {
      console.log('✅ All required health fields present');
    } else {
      console.log('❌ Missing fields:', missingFields);
    }
    
    return data.ready === true;
  } catch (error) {
    console.log('❌ Health endpoint error:', error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('🌐 Testing various API endpoints...');
  
  const endpoints = [
    '/api/translations',
    '/api/properties',
    '/api/admin/health',
    '/'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      console.log(`${response.ok ? '✅' : '❌'} ${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting Quick API Validation...\n');
  
  const healthOk = await testHealthEndpoint();
  console.log('\n');
  
  if (healthOk) {
    await testAPIEndpoints();
  } else {
    console.log('❌ Server health check failed, skipping other tests');
  }
  
  console.log('\n✅ Quick validation completed!');
}

main().catch(console.error);
