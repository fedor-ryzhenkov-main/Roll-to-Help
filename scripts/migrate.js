/**
 * Database Migration Script
 * 
 * This script runs Prisma migrations on application startup.
 * It ensures the database schema is up-to-date before the bot or app starts.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuring dotenv to load environment variables
require('dotenv').config();

console.log('🔄 Running database migrations...');

async function runMigrations() {
  try {
    // Run the migrations
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    console.log(`✅ Migration successful`);
    if (stdout) console.log(stdout);
    if (stderr) console.warn(`⚠️ Migration warnings: ${stderr}`);
    
    // Generate Prisma client if needed
    const { stdout: genStdout, stderr: genStderr } = await execAsync('npx prisma generate');
    console.log(`✅ Prisma client generated`);
    if (genStderr) console.warn(`⚠️ Client generation warnings: ${genStderr}`);
    
  } catch (error) {
    console.error(`❌ Migration error: ${error.message}`);
    // Don't exit the process - let the app continue to run even if migrations fail
    // This is useful in development when the database schema is still evolving
  }
}

// Run migrations
runMigrations();

module.exports = {
  // Export an empty object so this can be required by other scripts
}; 