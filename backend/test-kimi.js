const axios = require('axios');

async function testKimiAPI() {
  try {
    console.log('Testing Kimi API with correct endpoint...');
    
    const response = await axios.post('https://api.moonshot.ai/v1/chat/completions', {
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'user',
          content: 'Hello, please respond with just "Kimi API works"'
        }
      ],
      max_tokens: 50
    }, {
      headers: {
        'Authorization': 'Bearer sk-RPxTMR9Qy8M6wC7ROmiezNoVnTw4b1tTQ5O4XYYtPoFm7dpr',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Kimi API Test Successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Kimi API Test Failed!');
    console.log('Status:', error.response?.status);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Full Error:', error.message);
  }
}

testKimiAPI();