#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up AI Template project...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('📝 Creating .env.local from .env.example...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ .env.local created! Please update it with your actual API keys.\n');
} else if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env.local file found. Please create one with your environment variables.\n');
}

// Make scripts executable
const scriptsDir = path.join(process.cwd(), 'scripts');
if (fs.existsSync(scriptsDir)) {
  const scripts = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.js'));
  scripts.forEach(script => {
    const scriptPath = path.join(scriptsDir, script);
    fs.chmodSync(scriptPath, '755');
  });
  console.log('✅ Scripts are now executable\n');
}

// Create necessary directories
const directories = [
  'src/components/ui',
  'src/components/feature',
  'src/components/layout',
  'src/lib/utils',
  'src/styles',
  'src/types',
  'public/images',
];

directories.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

console.log('\n🎉 Setup complete! Run "npm run dev" to start developing.');