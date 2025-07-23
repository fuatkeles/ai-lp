const axios = require('axios');

async function testKimiAPI() {
  try {
    console.log('Testing with different headers...');
    
    const response = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'user',
          content: 'Hello'
        }
      ],
      max_tokens: 50,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer sk-RPxTMR9Qy8M6wC7ROmiezNoVnTw4b1tTQ5O4XYYtPoFm7dpr`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'AI-Landing-Page-Generator/1.0.0'
      },
      timeout: 30000
    });
    
    console.log('✅ API Test Successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ API Test Failed!');
    console.log('Status:', error.response?.status);
    console.log('Headers:', error.response?.headers);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Full Error:', error.message);
    
    // Try to get more info about the error
    if (error.response?.status === 401) {
      console.log('\n🔍 Authentication Error Details:');
      console.log('- API Key format might be wrong');
      console.log('- API Key might be expired');
      console.log('- API Key might not have proper permissions');
      console.log('- Endpoint might be incorrect');
    }
  }
}

testKimiAPI();