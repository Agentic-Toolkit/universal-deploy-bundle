#!/usr/bin/env node

/**
 * Integrity Generate - V5.3 CLI
 *
 * Generates cryptographic integrity manifest
 */

const CryptographicIntegrityManager = require('../../core/integrity/CryptographicIntegrityManager');

const args = process.argv.slice(2);
const options = {
  algorithm: args.includes('--sha-512') ? 'sha-512' : 'sha-256',
  verbose: args.includes('--verbose') || args.includes('-v')
};

const manager = new CryptographicIntegrityManager(options);

manager.generateManifest()
  .then(() => {
    console.log('\n✅ Integrity manifest generated successfully');
    console.log('   Next: Run verification with: npm run integrity:verify\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Generation failed:', error.message);
    process.exit(1);
  });
