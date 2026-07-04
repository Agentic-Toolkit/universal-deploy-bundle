#!/usr/bin/env node

/**
 * IntegrityManifest Tests - V5.3
 *
 * Tests manifest creation and verification
 */

const IntegrityManifest = require('../../core/integrity/IntegrityManifest');
const fs = require('fs');
const path = require('path');

class IntegrityManifestTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.testDir = path.join(__dirname, '.test-manifest');
  }

  async runAll() {
    console.log('\n🧪 IntegrityManifest Test Suite - V5.3');
    console.log('='.repeat(60));

    // Setup
    this.setup();

    await this.testManifestCreation();
    await this.testManifestSaveAndLoad();
    await this.testManifestVerification();
    await this.testModifiedFileDetection();
    await this.testMissingFileDetection();
    await this.testManifestComparison();

    this.printSummary();

    // Cleanup
    this.cleanup();
  }

  setup() {
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.testDir, { recursive: true });

    // Create test files
    fs.writeFileSync(path.join(this.testDir, 'app.js'), 'console.log("test");');
    fs.writeFileSync(path.join(this.testDir, 'config.json'), '{"key": "value"}');
    fs.writeFileSync(path.join(this.testDir, 'README.md'), '# Test');
  }

  cleanup() {
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
  }

  async testManifestCreation() {
    const testName = 'Manifest Creation';
    try {
      const manifest = new IntegrityManifest({
        projectRoot: this.testDir,
        algorithm: 'sha-256'
      });

      // Use patterns that match our test files
      await manifest.create({
        patterns: ['**/*'],
        ignore: []
      });

      if (!manifest.files) {
        throw new Error('Files not tracked');
      }

      if (Object.keys(manifest.files).length === 0) {
        throw new Error('No files in manifest');
      }

      // Should have tracked the test files
      if (!manifest.files['app.js']) {
        throw new Error('app.js not tracked');
      }

      if (!manifest.files['config.json']) {
        throw new Error('config.json not tracked');
      }

      this.pass(testName, 'Manifest created successfully');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testManifestSaveAndLoad() {
    const testName = 'Manifest Save and Load';
    try {
      const manifestPath = path.join(this.testDir, 'integrity.json');

      // Create and save manifest
      const manifest1 = new IntegrityManifest({
        projectRoot: this.testDir,
        algorithm: 'sha-256',
        outputPath: manifestPath
      });

      await manifest1.create({
        patterns: ['**/*'],
        ignore: []
      });
      await manifest1.save();

      if (!fs.existsSync(manifestPath)) {
        throw new Error('Manifest file not created');
      }

      // Load manifest
      const manifest2 = new IntegrityManifest({
        projectRoot: this.testDir,
        algorithm: 'sha-256',
        outputPath: manifestPath
      });

      await manifest2.load();

      if (!manifest2.files) {
        throw new Error('Loaded manifest has no files');
      }

      if (Object.keys(manifest2.files).length === 0) {
        throw new Error('Loaded manifest is empty');
      }

      // Verify files match
      if (!manifest2.files['app.js']) {
        throw new Error('app.js not in loaded manifest');
      }

      this.pass(testName, 'Manifest save and load works correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testManifestVerification() {
    const testName = 'Manifest Verification';
    try {
      const manifest = new IntegrityManifest({
        projectRoot: this.testDir,
        algorithm: 'sha-256'
      });

      await manifest.create({
        patterns: ['**/*'],
        ignore: []
      });

      // Verify (should pass)
      const result = await manifest.verify();

      if (!result) {
        throw new Error('Verification failed');
      }

      if (!result.verified) {
        throw new Error('Verification should pass');
      }

      if (result.corrupted && result.corrupted.length > 0) {
        throw new Error('No files should be corrupted');
      }

      if (result.missing && result.missing.length > 0) {
        throw new Error('No files should be missing');
      }

      this.pass(testName, 'Manifest verification works correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testModifiedFileDetection() {
    const testName = 'Modified File Detection';
    try {
      // Create initial manifest
      const manifest1 = new IntegrityManifest({
        projectRoot: this.testDir,
        algorithm: 'sha-256'
      });

      await manifest1.create({
        patterns: ['**/*'],
        ignore: []
      });

      // Modify a file
      fs.writeFileSync(path.join(this.testDir, 'app.js'), 'console.log("modified");');

      // Create new manifest for verification
      const manifest2 = new IntegrityManifest({
        projectRoot: this.testDir,
        algorithm: 'sha-256'
      });

      await manifest2.create({
        patterns: ['**/*'],
        ignore: []
      });

      // Verify against original
      const result = await manifest2.verify();

      if (!result) {
        throw new Error('Verification failed');
      }

      if (result.verified) {
        throw new Error('Should detect modified file');
      }

      if (!result.corrupted || result.corrupted.length === 0) {
        throw new Error('Should list corrupted files');
      }

      if (!result.corrupted.includes('app.js')) {
        throw new Error('app.js should be in corrupted list');
      }

      this.pass(testName, 'Modified file detected correctly');
    } catch (error) {
      this.fail(testName, error.message);
    } finally {
      // Restore original file
      fs.writeFileSync(path.join(this.testDir, 'app.js'), 'console.log("test");');
    }
  }

  async testMissingFileDetection() {
    const testName = 'Missing File Detection';
    try {
      // Create initial manifest
      const manifest1 = new IntegrityManifest({
        projectRoot: this.testDir,
        algorithm: 'sha-256'
      });

      await manifest1.create({
        patterns: ['**/*'],
        ignore: []
      });

      // Delete a file
      fs.unlinkSync(path.join(this.testDir, 'config.json'));

      // Create new manifest for verification
      const manifest2 = new IntegrityManifest({
        projectRoot: this.testDir,
        algorithm: 'sha-256'
      });

      // Load original manifest
      manifest2.files = manifest1.files;

      // Verify
      const result = await manifest2.verify();

      if (!result) {
        throw new Error('Verification failed');
      }

      if (!result.missing || result.missing.length === 0) {
        throw new Error('Should detect missing file');
      }

      if (!result.missing.includes('config.json')) {
        throw new Error('config.json should be in missing list');
      }

      this.pass(testName, 'Missing file detected correctly');
    } catch (error) {
      this.fail(testName, error.message);
    } finally {
      // Restore deleted file
      fs.writeFileSync(path.join(this.testDir, 'config.json'), '{"key": "value"}');
    }
  }

  async testManifestComparison() {
    const testName = 'Manifest Comparison';
    try {
      // Create first manifest
      const manifest1 = new IntegrityManifest({
        projectRoot: this.testDir,
        algorithm: 'sha-256'
      });

      await manifest1.create({
        patterns: ['**/*'],
        ignore: []
      });

      // Create second manifest (same state)
      const manifest2 = new IntegrityManifest({
        projectRoot: this.testDir,
        algorithm: 'sha-256'
      });

      await manifest2.create({
        patterns: ['**/*'],
        ignore: []
      });

      // Compare
      const comparison = manifest1.compare(manifest2);

      if (!comparison) {
        throw new Error('Comparison failed');
      }

      if (comparison.added && comparison.added.length > 0) {
        throw new Error('No files should be added');
      }

      if (comparison.removed && comparison.removed.length > 0) {
        throw new Error('No files should be removed');
      }

      if (comparison.modified && comparison.modified.length > 0) {
        throw new Error('No files should be modified');
      }

      if (!comparison.identical) {
        throw new Error('Manifests should be identical');
      }

      this.pass(testName, 'Manifest comparison works correctly');
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
  const test = new IntegrityManifestTest();
  test.runAll().catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = IntegrityManifestTest;
