#!/usr/bin/env node

/**
 * SignatureManager Tests - V5.4.0
 *
 * Tests digital signature capabilities
 */

const SignatureManager = require('../../core/distributed/SignatureManager');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SignatureManagerTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.testDir = path.join(__dirname, '.test-signatures');
  }

  async runAll() {
    console.log('\n🧪 SignatureManager Test Suite - V5.4.0');
    console.log('='.repeat(60));

    // Setup test directory
    this.setup();

    await this.testKeyGeneration();
    await this.testManifestSigning();
    await this.testSignatureVerification();
    await this.testInvalidSignature();
    await this.testTamperedManifest();
    await this.testKeyInformation();

    this.printSummary();

    // Cleanup
    this.cleanup();
  }

  setup() {
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.testDir, { recursive: true });
  }

  cleanup() {
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
  }

  async testKeyGeneration() {
    const testName = 'RSA-4096 Key Generation';
    try {
      const manager = new SignatureManager({
        keysDir: this.testDir
      });

      await manager.generateKeyPair();

      if (!fs.existsSync(path.join(this.testDir, 'private.pem'))) {
        throw new Error('Private key not generated');
      }

      if (!fs.existsSync(path.join(this.testDir, 'public.pem'))) {
        throw new Error('Public key not generated');
      }

      // Verify key size
      const privateContent = fs.readFileSync(path.join(this.testDir, 'private.pem'), 'utf8');
      if (!privateContent.includes('4096')) {
        throw new Error('Keys are not RSA-4096');
      }

      this.pass(testName, 'RSA-4096 keys generated successfully');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testManifestSigning() {
    const testName = 'Manifest Signing';
    try {
      const manager = new SignatureManager({
        keysDir: this.testDir
      });

      await manager.generateKeyPair();

      const testManifest = {
        version: '1.0',
        algorithm: 'sha-256',
        files: {
          'test.js': { hash: 'abc123', size: 1024 },
          'app.tsx': { hash: 'def456', size: 2048 }
        }
      };

      const signature = manager.signManifest(testManifest);

      if (!signature) {
        throw new Error('Failed to generate signature');
      }

      if (!signature.value) {
        throw new Error('Signature value missing');
      }

      if (signature.algorithm !== 'RSA-4096') {
        throw new Error('Signature algorithm incorrect');
      }

      this.pass(testName, 'Manifest signed correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testSignatureVerification() {
    const testName = 'Signature Verification';
    try {
      const manager = new SignatureManager({
        keysDir: this.testDir
      });

      await manager.generateKeyPair();

      const testManifest = {
        version: '1.0',
        algorithm: 'sha-256',
        files: {
          'test.js': { hash: 'abc123', size: 1024 }
        }
      };

      const signature = manager.signManifest(testManifest);

      // Add signature to manifest
      testManifest.signature = signature;

      const isValid = manager.verifyManifest(testManifest);

      if (!isValid) {
        throw new Error('Valid signature rejected');
      }

      this.pass(testName, 'Valid signature verified successfully');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testInvalidSignature() {
    const testName = 'Invalid Signature Detection';
    try {
      const manager = new SignatureManager({
        keysDir: this.testDir
      });

      await manager.generateKeyPair();

      const testManifest = {
        version: '1.0',
        files: { 'test.js': { hash: 'abc123' } }
      };

      // Create fake signature
      testManifest.signature = {
        algorithm: 'RSA-4096',
        hash: 'SHA-256',
        value: crypto.randomBytes(256).toString('base64'),
        signedAt: new Date().toISOString(),
        signedBy: 'test@example.com'
      };

      const isValid = manager.verifyManifest(testManifest);

      if (isValid) {
        throw new Error('Invalid signature accepted');
      }

      this.pass(testName, 'Invalid signature rejected correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testTamperedManifest() {
    const testName = 'Tampered Manifest Detection';
    try {
      const manager = new SignatureManager({
        keysDir: this.testDir
      });

      await manager.generateKeyPair();

      const testManifest = {
        version: '1.0',
        files: { 'test.js': { hash: 'abc123' } }
      };

      const signature = manager.signManifest(testManifest);
      testManifest.signature = signature;

      // Tamper with manifest
      testManifest.files['test.js'].hash = 'tampered123';

      const isValid = manager.verifyManifest(testManifest);

      if (isValid) {
        throw new Error('Tampered manifest accepted');
      }

      this.pass(testName, 'Tampered manifest detected correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testKeyInformation() {
    const testName = 'Key Information';
    try {
      const manager = new SignatureManager({
        keysDir: this.testDir
      });

      await manager.generateKeyPair();

      const info = manager.getKeyInfo();

      if (!info) {
        throw new Error('Failed to get key info');
      }

      if (!info.keySize) {
        throw new Error('Key size missing');
      }

      if (info.keySize !== 4096) {
        throw new Error('Key size incorrect');
      }

      if (!info.algorithm) {
        throw new Error('Algorithm missing');
      }

      this.pass(testName, 'Key information retrieved correctly');
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
  const test = new SignatureManagerTest();
  test.runAll().catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = SignatureManagerTest;
