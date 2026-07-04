#!/usr/bin/env node

/**
 * Integrity Report - V5.3 CLI
 *
 * Generates comprehensive integrity report
 */

const CryptographicIntegrityManager = require('../../core/integrity/CryptographicIntegrityManager');

const args = process.argv.slice(2);
const options = {
  algorithm: args.includes('--sha-512') ? 'sha-512' : 'sha-256',
  verbose: args.includes('--verbose') || args.includes('-v')
};

const manager = new CryptographicIntegrityManager(options);

manager.generateReport()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Report generation failed:', error.message);
    process.exit(1);
  });
