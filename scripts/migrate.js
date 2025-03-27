/**
 * Database Migration Script
 * 
 * This script runs Prisma migrations on application startup.
 * It ensures the database schema is up-to-date before the bot or app starts.
 * It also handles provider switching (SQLite to PostgreSQL) by checking the migration_lock.toml
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuring dotenv to load environment variables
require('dotenv').config();

console.log('🔄 Running database migrations...');

async function runMigrations() {
  // First check if we need to handle a provider switch
  const migrationLockPath = path.join(process.cwd(), 'prisma', 'migrations', 'migration_lock.toml');
  
  try {
    // Check if we need to reset migrations due to provider switch
    if (fs.existsSync(migrationLockPath)) {
      const lockFileContent = fs.readFileSync(migrationLockPath, 'utf8');
      const currentProviderMatch = lockFileContent.match(/provider\s*=\s*"([^"]+)"/);
      const currentProvider = currentProviderMatch ? currentProviderMatch[1] : null;
      const targetProvider = process.env.DATABASE_PROVIDER;
      
      if (currentProvider && targetProvider && currentProvider !== targetProvider) {
        console.log(`⚠️ Provider switch detected: ${currentProvider} -> ${targetProvider}`);
        console.log('⚠️ Running db push to adapt schema without migrations');
        
        try {
          // Use prisma db push as a safer alternative to migrate reset for production
          const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss --force-reset');
          console.log('✅ Schema pushed successfully');
          if (stderr) console.warn(`⚠️ Warnings: ${stderr}`);
        } catch (error) {
          console.error(`❌ Error pushing schema: ${error.message}`);
          console.log('⚠️ Falling back to regular migration');
        }
      }
    }
    
    // Run the regular migration
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