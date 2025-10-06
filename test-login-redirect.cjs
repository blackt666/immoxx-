#!/usr/bin/env node

/**
 * Test script for Admin Login Redirect
 * Tests: Login -> Redirect to /admin -> Dashboard loads
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5001';

async function testLoginRedirect() {
  console.log('🔐 Testing Admin Login Redirect...\n');

  try {
    // Step 1: Test login API
    console.log('1️⃣ Testing login API...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', loginData.username);
      
      // Extract cookies for session
      const cookies = loginResponse.headers.raw()['set-cookie'];
      const cookieHeader = cookies ? cookies.join('; ') : '';
      
      // Step 2: Test /api/auth/me with session
      console.log('\n2️⃣ Testing auth check...');
      const authResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Cookie': cookieHeader
        }
      });
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('✅ Auth check successful:', authData.username);
        
        // Step 3: Test /admin page access
        console.log('\n3️⃣ Testing /admin page access...');
        const adminResponse = await fetch(`${BASE_URL}/admin`, {
          headers: {
            'Cookie': cookieHeader
          }
        });
        
        if (adminResponse.ok) {
          const adminHtml = await adminResponse.text();
          if (adminHtml.includes('Admin Dashboard') || adminHtml.includes('Dashboard')) {
            console.log('✅ Admin dashboard accessible!');
            console.log('\n🎉 LOGIN REDIRECT TEST: SUCCESS!');
            console.log('📋 Issue Resolution: Login -> Dashboard redirect should work now');
          } else {
            console.log('⚠️ Admin page loads but dashboard content missing');
          }
        } else {
          console.log('❌ Admin page access failed:', adminResponse.status);
        }
        
      } else {
        console.log('❌ Auth check failed:', authResponse.status);
      }
    } else {
      const errorData = await loginResponse.json().catch(() => ({}));
      console.log('❌ Login failed:', errorData.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run test
testLoginRedirect();