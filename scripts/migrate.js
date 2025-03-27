/**
 * Database Migration Script
 * 
 * This script runs Prisma migrations on application startup.
 * It ensures the database schema is up-to-date before the bot or app starts.
 */

const { exec } = require('child_process');

console.log('🔄 Running database migrations...');

// Execute the Prisma migration
exec('npx prisma migrate deploy', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Migration error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    // Sometimes stderr contains warnings but the migration still succeeds
    console.warn(`⚠️ Migration warnings: ${stderr}`);
  }
  
  console.log(`✅ Migration successful: ${stdout}`);
  
  // Generate Prisma client if needed
  exec('npx prisma generate', (genError, genStdout, genStderr) => {
    if (genError) {
      console.error(`❌ Client generation error: ${genError.message}`);
      return;
    }
    
    if (genStderr) {
      console.warn(`⚠️ Client generation warnings: ${genStderr}`);
    }
    
    console.log(`✅ Prisma client generated: ${genStdout}`);
  });
});

module.exports = {
  // Export an empty object so this can be required by other scripts
}; 