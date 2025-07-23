const axios = require('axios');

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API...');
    
    const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyDImGR8W7zTB7LHTzX3_X3viwPKEjTEplg', {
      contents: [
        {
          parts: [
            {
              text: 'Hello, please respond with just "API works"'
            }
          ]
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Gemini API Test Successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Gemini API Test Failed!');
    console.log('Status:', error.response?.status);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Full Error:', error.message);
  }
}

testGeminiAPI();