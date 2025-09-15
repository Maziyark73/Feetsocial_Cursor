#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Feet Social Setup Helper\n');

// Check if .env already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('VITE_SUPABASE_URL') && !envContent.includes('your_project_url_here')) {
    console.log('✅ Supabase appears to be configured');
  } else {
    console.log('⚠️  Supabase not configured yet');
  }
} else {
  console.log('📝 Creating .env file...');
  const envTemplate = `# Supabase Configuration
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Cloudflare Stream Configuration (Optional)
VITE_CF_ACCOUNT_ID=your_account_id_here
VITE_CF_STREAM_TOKEN=your_stream_token_here
`;
  
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ .env file created');
}

console.log('\n📋 Next steps:');
console.log('1. Go to https://supabase.com and create a new project');
console.log('2. Copy your Project URL and anon key to the .env file');
console.log('3. Run: npx supabase db push');
console.log('4. Run: npm run dev');
console.log('\n🎉 Your app will work in demo mode even without configuration!');
