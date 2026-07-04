#!/usr/bin/env node

/**
 * AirGapManager Tests - V5.6.0
 *
 * Tests air-gap deployment capabilities
 */

const AirGapManager = require('../../core/airgap/AirGapManager');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AirGapManagerTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.testDir = path.join(__dirname, '.test-airgap');
    this.bundleDir = path.join(this.testDir, 'bundles');
    this.deployDir = path.join(this.testDir, 'deploy');
  }

  async runAll() {
    console.log('\n🧪 AirGapManager Test Suite - V5.6.0');
    console.log('='.repeat(60));

    // Setup
    this.setup();

    await this.testInitialization();
    await this.testBundleCreation();
    await this.testBundleVerification();
    await this.testTamperedBundle();
    await this.testDeploymentExtraction();
    await this.testOfflineVerification();
    await this.testImmutableDeployment();

    this.printSummary();

    // Cleanup
    this.cleanup();
  }

  setup() {
    // Create test directories
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.testDir, { recursive: true });
    fs.mkdirSync(this.bundleDir, { recursive: true });
    fs.mkdirSync(this.deployDir, { recursive: true });

    // Create sample project files
    const projectDir = path.join(this.testDir, 'project');
    fs.mkdirSync(projectDir, { recursive: true });

    fs.writeFileSync(path.join(projectDir, 'app.js'), 'console.log("test");');
    fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({
      name: 'test-app',
      version: '1.0.0'
    }));
    fs.writeFileSync(path.join(projectDir, 'README.md'), '# Test App');
  }

  cleanup() {
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
  }

  async testInitialization() {
    const testName = 'Initialization';
    try {
      const manager = new AirGapManager({
        projectRoot: path.join(this.testDir, 'project'),
        bundleDir: this.bundleDir
      });

      if (!manager.projectRoot) {
        throw new Error('Project root not set');
      }

      this.pass(testName, 'Manager initializes correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testBundleCreation() {
    const testName = 'Bundle Creation';
    try {
      const manager = new AirGapManager({
        projectRoot: path.join(this.testDir, 'project'),
        bundleDir: this.bundleDir
      });

      const bundlePath = await manager.createBundle();

      if (!bundlePath) {
        throw new Error('Failed to create bundle');
      }

      if (!fs.existsSync(bundlePath)) {
        throw new Error('Bundle file not created');
      }

      // Verify it's a tar.gz
      if (!bundlePath.endsWith('.tar.gz')) {
        throw new Error('Bundle should be .tar.gz');
      }

      this.pass(testName, 'Bundle created successfully');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testBundleVerification() {
    const testName = 'Bundle Verification';
    try {
      const manager = new AirGapManager({
        projectRoot: path.join(this.testDir, 'project'),
        bundleDir: this.bundleDir
      });

      const bundlePath = await manager.createBundle();

      // Verify the bundle
      const isValid = await manager.verifyBundle(bundlePath);

      if (!isValid) {
        throw new Error('Valid bundle failed verification');
      }

      this.pass(testName, 'Bundle verification works correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testTamperedBundle() {
    const testName = 'Tampered Bundle Detection';
    try {
      const manager = new AirGapManager({
        projectRoot: path.join(this.testDir, 'project'),
        bundleDir: this.bundleDir
      });

      const bundlePath = await manager.createBundle();

      // Tamper with bundle
      const bundleContent = fs.readFileSync(bundlePath);
      const tamperedContent = Buffer.concat([
        bundleContent.slice(0, 100),
        Buffer.from('TAMPERED'),
        bundleContent.slice(100)
      ]);
      fs.writeFileSync(bundlePath, tamperedContent);

      // Try to verify
      const isValid = await manager.verifyBundle(bundlePath);

      if (isValid) {
        throw new Error('Tampered bundle should be rejected');
      }

      this.pass(testName, 'Tampered bundle detected correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testDeploymentExtraction() {
    const testName = 'Offline Deployment';
    try {
      const manager = new AirGapManager({
        projectRoot: path.join(this.testDir, 'project'),
        bundleDir: this.bundleDir
      });

      const bundlePath = await manager.createBundle();

      // Deploy offline
      await manager.deployOffline(bundlePath, this.deployDir);

      // Verify files deployed
      if (!fs.existsSync(path.join(this.deployDir, 'app.js'))) {
        throw new Error('app.js not deployed');
      }

      if (!fs.existsSync(path.join(this.deployDir, 'package.json'))) {
        throw new Error('package.json not deployed');
      }

      // Verify content
      const appContent = fs.readFileSync(path.join(this.deployDir, 'app.js'), 'utf8');
      if (appContent !== 'console.log("test");') {
        throw new Error('Deployed content incorrect');
      }

      this.pass(testName, 'Offline deployment works correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testOfflineVerification() {
    const testName = 'Offline Verification';
    try {
      const manager = new AirGapManager({
        projectRoot: path.join(this.testDir, 'project'),
        bundleDir: this.bundleDir
      });

      const bundlePath = await manager.createBundle();

      // Verify bundle (works offline)
      const isValid = await manager.verifyBundle(bundlePath);

      if (!isValid) {
        throw new Error('Bundle verification failed');
      }

      this.pass(testName, 'Offline verification works correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testImmutableDeployment() {
    const testName = 'Bundle Integrity';
    try {
      const manager = new AirGapManager({
        projectRoot: path.join(this.testDir, 'project'),
        bundleDir: this.bundleDir
      });

      const bundlePath = await manager.createBundle();

      // Extract manifest from bundle
      const manifest = await manager.extractManifest(bundlePath);

      if (!manifest) {
        throw new Error('Failed to extract manifest');
      }

      if (!manifest.integrity) {
        throw new Error('Manifest missing integrity data');
      }

      if (!manifest.integrity.manifestHash) {
        throw new Error('Manifest missing hash');
      }

      if (!manifest.files) {
        throw new Error('Manifest missing files');
      }

      this.pass(testName, 'Bundle contains integrity manifest');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  pass(testName, message) {
    this.passed++;
    console.log(`   ✅ ${testName} - ${message}`);
  }

  fail(testName, message) {
    this.failed++;
    console.log(`   ❌ ${testName} - ${message}`);
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`\nTotal: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed} ✅`);
    console.log(`Failed: ${this.failed} ❌`);

    if (this.failed > 0) {
      console.log('\n❌ Some tests failed\n');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed\n');
      process.exit(0);
    }
  }
}

// Run tests
if (require.main === module) {
  const test = new AirGapManagerTest();
  test.runAll().catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = AirGapManagerTest;
