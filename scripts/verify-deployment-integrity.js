#!/usr/bin/env node

/**
 * Deployment Integrity Verification - V5.3
 *
 * Integrates integrity verification into deployment gates
 * Blocks deployment if integrity check fails
 *
 * Usage:
 *   node verify-deployment-integrity.js [--skip-integrity]
 */

const CryptographicIntegrityManager = require('../core/integrity/CryptographicIntegrityManager');
const fs = require('fs');
const path = require('path');

class DeploymentIntegrityGate {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.skipIntegrity = options.skipIntegrity || false;
    this.strictMode = options.strictMode || false;

    this.manager = new CryptographicIntegrityManager({
      projectRoot: this.projectRoot,
      verbose: options.verbose || false
    });

    this.results = {
      integrity: {
        checked: false,
        passed: false,
        manifestExists: false,
        corruptedFiles: [],
        missingFiles: []
      },
      deployment: {
        blocked: false,
        reason: null
      }
    };
  }

  /**
   * Run pre-deployment integrity check
   */
  async preDeploymentCheck() {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 V5.3 Pre-Deployment Integrity Check');
    console.log('='.repeat(60));

    if (this.skipIntegrity) {
      console.log('\n⚠️  Integrity verification skipped ( --skip-integrity flag)');
      console.log('   ⚠️  NOT RECOMMENDED for production deployments\n');
      this.results.integrity.checked = false;
      return true;
    }

    // Check if manifest exists
    const manifestPath = path.join(this.projectRoot, '.integrity.json');
    if (!fs.existsSync(manifestPath)) {
      console.log('\n⚠️  No integrity manifest found');
      console.log('   Run: npm run integrity:generate');
      console.log('   Continuing without integrity verification...\n');

      if (this.strictMode) {
        console.log('❌ STRICT MODE: Blocking deployment without manifest\n');
        this.results.deployment.blocked = true;
        this.results.deployment.reason = 'No integrity manifest in strict mode';
        return false;
      }

      this.results.integrity.checked = false;
      this.results.integrity.manifestExists = false;
      return true;
    }

    this.results.integrity.manifestExists = true;
    this.results.integrity.checked = true;

    console.log('\n🔍 Verifying cryptographic integrity...\n');

    // Run integrity verification
    const passed = await this.manager.verifyManifest();

    if (!passed) {
      console.log('\n' + '='.repeat(60));
      console.log('❌ DEPLOYMENT BLOCKED - INTEGRITY VERIFICATION FAILED');
      console.log('='.repeat(60));
      console.log('\n🔒 The Universal Deployer has detected code corruption.');
      console.log('   Deployment blocked to protect production.\n');

      console.log('Next steps:');
      console.log('   1. Review: .integrity/handoff.json');
      console.log('   2. Fix corrupted files or restore from last known good state');
      console.log('   3. Re-run: npm run integrity:verify');
      console.log('   4. Only deploy when integrity verified\n');

      this.results.integrity.passed = false;
      this.results.deployment.blocked = true;
      this.results.deployment.reason = 'Integrity verification failed';

      // Load handoff for details
      const handoffPath = path.join(this.projectRoot, '.integrity/handoff.json');
      if (fs.existsSync(handoffPath)) {
        const handoff = JSON.parse(fs.readFileSync(handoffPath, 'utf8'));
        this.results.integrity.corruptedFiles = handoff.corruptionAnalysis?.details || [];
        this.results.integrity.missingFiles = handoff.missingFiles || [];
      }

      return false;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ INTEGRITY VERIFIED - Deployment Approved');
    console.log('='.repeat(60));
    console.log('\n🚀 All files verified against cryptographic hashes');
    console.log('   Deployment may proceed safely\n');

    this.results.integrity.passed = true;
    this.results.deployment.blocked = false;

    return true;
  }

  /**
   * Run post-deployment integrity check
   */
  async postDeploymentCheck(deploymentPath) {
    if (!this.results.integrity.checked) {
      console.log('\nℹ️  Integrity verification was not run pre-deployment');
      console.log('   Skipping post-deployment verification\n');
      return true;
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 V5.3 Post-Deployment Integrity Verification');
    console.log('='.repeat(60));

    const manifestPath = path.join(this.projectRoot, '.integrity.json');

    try {
      const verified = await this.manager.verifyDeployment(deploymentPath, manifestPath);

      if (verified) {
        console.log('\n✅ Post-deployment integrity verified\n');
        return true;
      } else {
        console.log('\n❌ Post-deployment integrity check failed');
        console.log('   ⚠️  Deployment may be corrupted\n');
        return false;
      }
    } catch (error) {
      console.log('\n⚠️  Post-deployment verification error:', error.message);
      return false;
    }
  }

  /**
   * Get results
   */
  getResults() {
    return this.results;
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Integrity Verification Summary');
    console.log('='.repeat(60));
    console.log(`\nManifest Checked: ${this.results.integrity.checked ? 'Yes ✅' : 'No ⚠️'}`);
    console.log(`Manifest Exists: ${this.results.integrity.manifestExists ? 'Yes ✅' : 'No ⚠️'}`);
    console.log(`Integrity Passed: ${this.results.integrity.passed ? 'Yes ✅' : 'No ❌'}`);
    console.log(`Deployment Blocked: ${this.results.deployment.blocked ? 'Yes ❌' : 'No ✅'}`);

    if (this.results.deployment.blocked) {
      console.log(`\nBlock Reason: ${this.results.deployment.reason}`);
    }

    if (this.results.integrity.corruptedFiles.length > 0) {
      console.log(`\nCorrupted Files: ${this.results.integrity.corruptedFiles.length}`);
      this.results.integrity.corruptedFiles.forEach(file => {
        console.log(`   - ${file.file} (${file.pattern})`);
      });
    }

    if (this.results.integrity.missingFiles.length > 0) {
      console.log(`\nMissing Files: ${this.results.integrity.missingFiles.length}`);
      this.results.integrity.missingFiles.forEach(file => {
        console.log(`   - ${file.file}`);
      });
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    skipIntegrity: args.includes('--skip-integrity'),
    strictMode: args.includes('--strict'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  const gate = new DeploymentIntegrityGate(options);

  // Run pre-deployment check
  gate.preDeploymentCheck()
    .then(passed => {
      gate.printSummary();

      if (passed) {
        console.log('✅ Deployment gate passed\n');
        process.exit(0);
      } else {
        console.log('❌ Deployment gate failed\n');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Deployment gate error:', error.message);
      process.exit(1);
    });
}

module.exports = DeploymentIntegrityGate;
