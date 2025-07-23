const axios = require('axios');

async function testKimiAPI() {
  // Test different endpoints
  const endpoints = [
    'https://api.moonshot.cn/v1/chat/completions',
    'https://api.moonshot.cn/chat/completions',
    'https://moonshot.cn/v1/chat/completions'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`Testing endpoint: ${endpoint}`);
    try {
      const response = await axios.post(endpoint, {
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'user',
            content: 'Hello, please respond with just "API works"'
          }
        ],
        max_tokens: 50
      }, {
        headers: {
          'Authorization': 'Bearer sk-RPxTMR9Qy8M6wC7ROmiezNoVnTw4b1tTQ5O4XYYtPoFm7dpr',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ API Test Successful!');
      console.log('Response:', response.data);
      return;
    } catch (error) {
      console.log('❌ API Test Failed!');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
      console.log('---');
    }
  }
}

testKimiAPI();