const fs = require('fs');
const https = require('https');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.log("No url or key");
  process.exit(1);
}

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

const options = {
  hostname: url.replace('https://', ''),
  path: '/rest/v1/messages?select=type,media_url,content,created_at&order=created_at.desc&limit=5',
  method: 'GET',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});

req.on('error', e => console.error(e));
req.end();
