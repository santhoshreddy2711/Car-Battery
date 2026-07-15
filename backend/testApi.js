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
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Logged in successfully. Token acquired.');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n--- Test: Fetching a product to checkout ---');
    const prodRes = await fetch(`${baseURL}/api/inventory`, { headers });
    const products = await prodRes.json();
    if (products.length === 0) {
      console.log('No products found to checkout.');
      return;
    }
    const product = products[0];
    console.log(`Using product: ${product.brand} ${product.model} (${product.productId})`);

    console.log('\n--- Test: Performing checkout ---');
    const checkoutRes = await fetch(`${baseURL}/api/billing`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customerName: 'Diagnostic Test Customer',
        mobileNumber: '9876543210',
        vehicleNumber: 'TS09AA1234',
        items: [{
          productId: product.productId,
          qty: 1,
          price: product.sellingPrice,
          gstRate: 18,
          discount: 0
        }],
        paymentMethod: 'Cash',
        status: 'Paid',
        branchId: 'main'
      })
    });

    console.log(`Status: ${checkoutRes.status}`);
    const resData = await checkoutRes.json();
    console.log('Response:', JSON.stringify(resData, null, 2));

  } catch (error) {
    console.error('Error running test:', error.message);
  }
}

run();
