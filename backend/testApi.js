const baseURL = 'https://car-battery-erp-backend.onrender.com';

async function run() {
  try {
    console.log('Logging in as Admin...');
    const loginRes = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@carbattery.com',
        password: 'Admin@123'
      })
    });
    
    if (!loginRes.ok) {
      const errText = await loginRes.text();
      throw new Error(`Login failed with status ${loginRes.status}: ${errText}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Logged in successfully. Token acquired.');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('\n--- Test 1: Fetching all inventory (branchId=all) ---');
    const allRes = await fetch(`${baseURL}/api/inventory?branchId=all`, { headers });
    const allData = await allRes.json();
    console.log(`Status: ${allRes.status}`);
    console.log(`Count: ${allData.length} products`);
    if (allData.length > 0) {
      console.log('Returned branchIds:', [...new Set(allData.map(p => p.branchId))]);
    }
    
    console.log('\n--- Test 2: Fetching branch specific inventory (branchId=sub-north) ---');
    const subNorthRes = await fetch(`${baseURL}/api/inventory?branchId=sub-north`, { headers });
    const subNorthData = await subNorthRes.json();
    console.log(`Status: ${subNorthRes.status}`);
    console.log(`Count: ${subNorthData.length} products`);
    if (subNorthData.length > 0) {
      console.log('Returned branchIds:', [...new Set(subNorthData.map(p => p.branchId))]);
    }

    console.log('\n--- Test 3: Fetching default inventory (no branchId param) ---');
    const defaultRes = await fetch(`${baseURL}/api/inventory`, { headers });
    const defaultData = await defaultRes.json();
    console.log(`Status: ${defaultRes.status}`);
    console.log(`Count: ${defaultData.length} products`);
    if (defaultData.length > 0) {
      console.log('Returned branchIds:', [...new Set(defaultData.map(p => p.branchId))]);
    }

  } catch (error) {
    console.error('Error running test:', error.message);
  }
}

run();
