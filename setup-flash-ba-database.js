#!/usr/bin/env node

/**
 * Flash.ba Database Setup Helper
 * This script helps generate the correct DATABASE_URL for your Vercel environment
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Flash.ba Database Setup Helper\n');
console.log('This will help you generate the correct DATABASE_URL for your Vercel environment variables.\n');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  try {
    console.log('Please provide your database details from cPanel:\n');
    
    const dbName = await askQuestion('Database name (e.g., flashba_video_portal): ');
    const dbUser = await askQuestion('Database username (e.g., flashba_dbuser): ');
    const dbPassword = await askQuestion('Database password: ');
    const dbHost = await askQuestion('Database host (default: 185.164.35.72): ') || '185.164.35.72';
    const dbPort = await askQuestion('Database port (default: 3306): ') || '3306';
    
    console.log('\n📋 Generated DATABASE_URL configurations:\n');
    
    // Standard connection
    const standardUrl = `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    console.log('🔗 Standard connection:');
    console.log(`DATABASE_URL=${standardUrl}\n`);
    
    // With SSL accept
    const sslUrl = `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?sslaccept=strict`;
    console.log('🔒 With SSL (try this first):');
    console.log(`DATABASE_URL=${sslUrl}\n`);
    
    // Alternative SSL configuration
    const sslAltUrl = `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?ssl={"rejectUnauthorized":false}`;
    console.log('🔓 Alternative SSL (if above fails):');
    console.log(`DATABASE_URL=${sslAltUrl}\n`);
    
    console.log('📝 Next steps:');
    console.log('1. Copy one of the DATABASE_URL values above');
    console.log('2. Go to your Vercel project settings');
    console.log('3. Add it as an environment variable');
    console.log('4. Redeploy your application');
    console.log('5. Run the database setup commands\n');
    
    console.log('🛠️  Database setup commands:');
    console.log('vercel env pull .env.local');
    console.log('pnpm db:generate');
    console.log('pnpm db:push');
    console.log('pnpm db:seed\n');
    
    console.log('✅ Setup complete! Your admin login will be:');
    console.log('Email: admin@flash.ba');
    console.log('Password: admin123 (change this after first login!)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

main();
