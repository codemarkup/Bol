const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

fetch(`${url}/rest/v1/messages`, {
  method: 'POST',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({
    conversation_id: '260f0acf-561a-41ad-98f6-9bee25885321', // Using the one from earlier
    sender_id: 'bf15de39-2fea-4c43-bad4-ba5c6fe34bb9',
    type: 'video',
    media_url: 'test',
    content: 'test'
  })
}).then(res => res.json()).then(console.log).catch(console.error);
