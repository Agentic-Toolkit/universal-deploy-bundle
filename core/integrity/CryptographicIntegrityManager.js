#!/usr/bin/env node

/**
 * Cryptographic Integrity Manager - V5.3
 *
 * Orchestrates integrity verification system
 * Ensures code integrity through SHA-256/SHA-512 hashing
 *
 * FREE FEATURES:
 * - SHA-256 hashing for all files
 * - Automatic manifest generation
 * - Pre-commit integrity verification
 * - Post-deployment verification
 *
 * ENTERPRISE FEATURES:
 * - SHA-512 high-security hashing
 * - Digital signatures with private keys (V5.4)
 * - Distributed integrity ledger (V5.4)
 * - Real-time integrity monitoring
 */

const IntegrityManifest = require('./IntegrityManifest');
const CorruptionDetector = require('./CorruptionDetector');
const fs = require('fs');
const path = require('path');

class CryptographicIntegrityManager {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.algorithm = options.algorithm || 'sha-256';
    this.enterpriseMode = options.enterpriseMode || false;
    this.verbose = options.verbose || false;

    this.manifestManager = new IntegrityManifest({
      projectRoot: this.projectRoot,
      algorithm: this.algorithm,
      verbose: this.verbose
    });

    this.detector = new CorruptionDetector({
      verbose: this.verbose
    });

    this.manifestPath = path.join(this.projectRoot, '.integrity.json');
    this.integrityDir = path.join(this.projectRoot, '.integrity');

    this.results = {
      timestamp: new Date().toISOString(),
      algorithm: this.algorithm,
      verificationPassed: false,
      corruptedFiles: [],
      missingFiles: [],
      verifiedFiles: []
    };
  }

  /**
   * Initialize integrity system
   */
  async initialize() {
    console.log('\n🔒 Cryptographic Integrity Manager - V5.3');
    console.log(`   Algorithm: ${this.algorithm.toUpperCase()}`);
    console.log(`   Mode: ${this.enterpriseMode ? 'ENTERPRISE' : 'FREE'}`);
    console.log(`   Project: ${this.projectRoot}`);
    console.log('');

    // Ensure .integrity directory exists
    if (!fs.existsSync(this.integrityDir)) {
      fs.mkdirSync(this.integrityDir, { recursive: true });
    }
  }

  /**
   * Generate integrity manifest for all project files
   */
  async generateManifest(options = {}) {
    await this.initialize();

    console.log('📝 Generating integrity manifest...\n');

    try {
      await this.manifestManager.create(options);
      await this.manifestManager.save();

      console.log('\n✅ Integrity manifest generated successfully');
      return true;
    } catch (error) {
      console.error('\n❌ Manifest generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Verify integrity against manifest
   */
  async verifyManifest() {
    await this.initialize();

    console.log('🔍 Verifying cryptographic integrity...\n');

    if (!fs.existsSync(this.manifestPath)) {
      console.log('❌ No integrity manifest found');
      console.log('   Run: npm run integrity:generate');
      return false;
    }

    try {
      const verificationResult = await this.manifestManager.verify();

      this.results.verificationPassed = verificationResult.passed;
      this.results.corruptedFiles = verificationResult.corrupted;
      this.results.missingFiles = verificationResult.missing;
      this.results.verifiedFiles = verificationResult.verified;

      // Load last known good state
      const lastGoodPath = path.join(this.integrityDir, 'last-good.json');
      const lastKnownGood = fs.existsSync(lastGoodPath) ?
        JSON.parse(fs.readFileSync(lastGoodPath, 'utf8')) : null;

      // If verification failed, generate handoff
      if (!verificationResult.passed) {
        const handoff = this.detector.generateHandoff({
          ...verificationResult,
          lastKnownGood
        });

        console.log(this.detector.formatReport(handoff));

        // Save handoff to file
        const handoffPath = path.join(this.integrityDir, 'handoff.json');
        fs.writeFileSync(handoffPath, JSON.stringify(handoff, null, 2));
        console.log(`📋 Handoff saved: ${handoffPath}`);
      }

      return verificationResult.passed;

    } catch (error) {
      console.error('\n❌ Verification failed:', error.message);
      this.results.verificationPassed = false;
      return false;
    }
  }

  /**
   * Verify specific file integrity (for post-deployment checks)
   */
  async verifyFileIntegrity(filePath, expectedHash) {
    const HashGenerator = require('./HashGenerator');
    const generator = new HashGenerator(this.algorithm);

    try {
      const actualHash = await generator.calculateFileHash(filePath);

      if (actualHash !== expectedHash) {
        console.log(`❌ Integrity violation: ${filePath}`);
        console.log(`   Expected: ${expectedHash.substring(0, 16)}...`);
        console.log(`   Actual: ${actualHash.substring(0, 16)}...`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`❌ Verification error: ${filePath} - ${error.message}`);
      return false;
    }
  }

  /**
   * Verify integrity of deployed files
   */
  async verifyDeployment(deploymentPath, manifestPath) {
    console.log('\n🔍 Verifying deployment integrity...');

    if (!fs.existsSync(manifestPath)) {
      console.log('❌ Deployment manifest not found');
      return false;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    let allVerified = true;

    for (const [file, fileInfo] of Object.entries(manifest.files)) {
      const fullPath = path.join(deploymentPath, file);

      if (!fs.existsSync(fullPath)) {
        console.log(`❌ Missing: ${file}`);
        allVerified = false;
        continue;
      }

      const verified = await this.verifyFileIntegrity(fullPath, fileInfo.hash);
      if (!verified) {
        allVerified = false;
      }
    }

    if (allVerified) {
      console.log('\n✅ Deployment integrity verified');
    } else {
      console.log('\n❌ Deployment integrity check failed');
    }

    return allVerified;
  }

  /**
   * Get verification status
   */
  getStatus() {
    return {
      timestamp: this.results.timestamp,
      algorithm: this.results.algorithm,
      verificationPassed: this.results.verificationPassed,
      totalCorrupted: this.results.corruptedFiles.length,
      totalMissing: this.results.missingFiles.length,
      totalVerified: this.results.verifiedFiles.length,
      canDeploy: this.results.verificationPassed
    };
  }

  /**
   * Generate integrity report
   */
  async generateReport() {
    await this.initialize();

    if (!fs.existsSync(this.manifestPath)) {
      console.log('❌ No manifest found. Run: npm run integrity:generate');
      return null;
    }

    this.manifestManager.load();
    const stats = this.manifestManager.getStatistics();

    console.log('\n📊 Integrity Report\n');
    console.log('='.repeat(50));
    console.log(`Total Files: ${stats.totalFiles}`);
    console.log(`Total Size: ${this.manifestManager.formatBytes(stats.totalSize)}`);
    console.log(`Algorithm: ${stats.algorithm}`);
    console.log(`Generated: ${stats.generatedAt}`);
    console.log(`Generated By: ${stats.generatedBy}`);
    console.log(`Manifest Hash: ${stats.manifestHash}`);
    console.log('='.repeat(50));

    // Verify current state
    const verified = await this.verifyManifest();

    console.log('\n📋 Status:');
    console.log(`   Current Verification: ${verified ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`   Can Deploy: ${verified ? 'YES ✅' : 'NO ❌'}`);
    console.log('');

    return {
      stats,
      verificationPassed: verified
    };
  }

  /**
   * Save manifest to history with identifier
   */
  async saveToHistory(identifier) {
    console.log(`\n📜 Saving manifest to history: ${identifier}`);

    try {
      await this.manifestManager.saveToHistory(identifier);
      console.log('✅ Manifest saved to history');
      return true;
    } catch (error) {
      console.error('❌ Failed to save to history:', error.message);
      return false;
    }
  }

  /**
   * Clean old history files
   */
  async cleanHistory(keepCount = 10) {
    console.log('\n🧹 Cleaning old history files...');

    const historyDir = path.join(this.integrityDir, 'history');
    if (!fs.existsSync(historyDir)) {
      console.log('   No history to clean');
      return;
    }

    const files = fs.readdirSync(historyDir)
      .map(f => ({
        name: f,
        path: path.join(historyDir, f),
        time: fs.statSync(path.join(historyDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    const toDelete = files.slice(keepCount);

    for (const file of toDelete) {
      fs.unlinkSync(file.path);
      console.log(`   Deleted: ${file.name}`);
    }

    console.log(`✅ Cleanup complete. Kept latest ${keepCount} files`);
  }

  /**
   * Get history list
   */
  getHistory() {
    const historyDir = path.join(this.integrityDir, 'history');
    if (!fs.existsSync(historyDir)) {
      return [];
    }

    return fs.readdirSync(historyDir)
      .map(f => {
        const filePath = path.join(historyDir, f);
        const stats = fs.statSync(filePath);
        return {
          name: f.replace('.json', ''),
          path: filePath,
          created: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.created - a.created);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const options = {
    algorithm: args.includes('--sha-512') ? 'sha-512' : 'sha-256',
    enterpriseMode: args.includes('--enterprise'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  const manager = new CryptographicIntegrityManager(options);

  switch (command) {
    case 'generate':
    case 'create':
      manager.generateManifest()
        .then(() => process.exit(0))
        .catch(error => {
          console.error('\n❌ Generation failed:', error.message);
          process.exit(1);
        });
      break;

    case 'verify':
      manager.verifyManifest()
        .then(passed => {
          if (!passed) {
            console.log('\n❌ Deployment blocked - integrity verification failed');
          }
          process.exit(passed ? 0 : 1);
        })
        .catch(error => {
          console.error('\n❌ Verification failed:', error.message);
          process.exit(1);
        });
      break;

    case 'report':
      manager.generateReport()
        .then(() => process.exit(0))
        .catch(error => {
          console.error('\n❌ Report generation failed:', error.message);
          process.exit(1);
        });
      break;

    case 'history':
      const history = manager.getHistory();
      console.log('\n📜 Integrity History\n');
      if (history.length === 0) {
        console.log('   No history available');
      } else {
        history.forEach((entry, i) => {
          console.log(`   ${i + 1}. ${entry.name}`);
          console.log(`      Created: ${entry.created.toISOString()}`);
          console.log(`      Size: ${entry.size} bytes`);
        });
      }
      console.log('');
      process.exit(0);
      break;

    case 'clean':
      const keepCount = parseInt(args[1]) || 10;
      manager.cleanHistory(keepCount)
        .then(() => process.exit(0))
        .catch(error => {
          console.error('\n❌ Cleanup failed:', error.message);
          process.exit(1);
        });
      break;

    default:
      console.log('\n🔒 Cryptographic Integrity Manager - V5.3\n');
      console.log('Usage:');
      console.log('  node CryptographicIntegrityManager.js generate [--sha-512] [--verbose]');
      console.log('  node CryptographicIntegrityManager.js verify');
      console.log('  node CryptographicIntegrityManager.js report');
      console.log('  node CryptographicIntegrityManager.js history');
      console.log('  node CryptographicIntegrityManager.js clean [keep-count]\n');
      console.log('Examples:');
      console.log('  node CryptographicIntegrityManager.js generate');
      console.log('  node CryptographicIntegrityManager.js verify');
      console.log('  node CryptographicIntegrityManager.js report');
      console.log('  node CryptographicIntegrityManager.js history');
      console.log('  node CryptographicIntegrityManager.js clean 20\n');
      process.exit(1);
  }
}

module.exports = CryptographicIntegrityManager;
