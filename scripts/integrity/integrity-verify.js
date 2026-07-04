#!/usr/bin/env node

/**
 * Integrity Verify - V5.3 CLI
 *
 * Verifies cryptographic integrity
 * Blocks deployment if verification fails
 */

const CryptographicIntegrityManager = require('../../core/integrity/CryptographicIntegrityManager');

const args = process.argv.slice(2);
const options = {
  algorithm: args.includes('--sha-512') ? 'sha-512' : 'sha-256',
  verbose: args.includes('--verbose') || args.includes('-v')
};

const manager = new CryptographicIntegrityManager(options);

manager.verifyManifest()
  .then(passed => {
    if (passed) {
      console.log('\n✅ Integrity verified - deployment approved\n');
      process.exit(0);
    } else {
      console.log('\n❌ Integrity verification failed - deployment blocked\n');
      console.log('🔒 The Universal Deployer has detected code corruption.');
      console.log('   Development work required - deployment blocked.\n');

      console.log('Next steps:');
      console.log('   1. Review corrupted files listed above');
      console.log('   2. Check handoff: .integrity/handoff.json');
      console.log('   3. Fix corrupted files or restore from last known good state');
      console.log('   4. Re-run verification: npm run integrity:verify');
      console.log('   5. Only proceed when integrity verified\n');

      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Verification failed:', error.message);
    console.error('\n❌ Deployment blocked\n');
    process.exit(1);
  });
