// Small smoke-test script to call the controller endpoint via the running server
// Usage: node test-fetch-education-news.js

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/education-news',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Received articles:', Array.isArray(parsed) ? parsed.length : 'non-array response');
      if (Array.isArray(parsed)) {
        parsed.slice(0,5).forEach((a, i) => {
          console.log(i+1, '-', a.title || a.message || 'no title');
        });
      } else {
        console.log(parsed);
      }
    } catch (e) {
      console.error('Failed to parse response', e);
      console.log(data);
    }
  });
});

req.on('error', (e) => { console.error('Request failed', e); });
req.end();
