#!/usr/bin/env node

/**
 * HashGenerator Tests - V5.3
 *
 * Tests cryptographic hashing capabilities
 */

const HashGenerator = require('../../core/integrity/HashGenerator');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class HashGeneratorTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.testDir = path.join(__dirname, '.test-hash');
  }

  async runAll() {
    console.log('\n🧪 HashGenerator Test Suite - V5.3');
    console.log('='.repeat(60));

    // Setup
    this.setup();

    await this.testSHA256Calculation();
    await this.testEmptyFile();
    await this.testLargeFile();
    await this.testBufferHashing();
    await this.testStringHashing();
    await this.testFileVerification();
    await this.testSHA512Support();

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

  async testSHA256Calculation() {
    const testName = 'SHA-256 Calculation';
    try {
      const generator = new HashGenerator('sha-256');

      // Create test file with known content
      const testContent = 'Hello, World!';
      const testFile = path.join(this.testDir, 'test-file.txt');
      fs.writeFileSync(testFile, testContent);

      const hash = await generator.calculateFileHash(testFile);

      // Verify hash format (64 hex characters for SHA-256)
      if (!/^[a-f0-9]{64}$/.test(hash)) {
        throw new Error('Hash format incorrect');
      }

      // Verify hash is correct
      const expectedHash = crypto.createHash('sha-256')
        .update(testContent)
        .digest('hex');

      if (hash !== expectedHash) {
        throw new Error('Hash value incorrect');
      }

      this.pass(testName, 'SHA-256 hash calculated correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testEmptyFile() {
    const testName = 'Empty File Hashing';
    try {
      const generator = new HashGenerator('sha-256');

      const testFile = path.join(this.testDir, 'empty-file.txt');
      fs.writeFileSync(testFile, '');

      const hash = await generator.calculateFileHash(testFile);

      // Empty file SHA-256 hash
      const expectedEmptyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

      if (hash !== expectedEmptyHash) {
        throw new Error('Empty file hash incorrect');
      }

      this.pass(testName, 'Empty file hashed correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testLargeFile() {
    const testName = 'Large File Hashing';
    try {
      const generator = new HashGenerator('sha-256');

      // Create 1MB test file
      const largeContent = Buffer.alloc(1024 * 1024, 'x');
      const testFile = path.join(this.testDir, 'large-file.bin');
      fs.writeFileSync(testFile, largeContent);

      const hash = await generator.calculateFileHash(testFile);

      // Verify hash format
      if (!/^[a-f0-9]{64}$/.test(hash)) {
        throw new Error('Hash format incorrect for large file');
      }

      // Verify hash is consistent
      const hash2 = await generator.calculateFileHash(testFile);
      if (hash !== hash2) {
        throw new Error('Hash not consistent for large file');
      }

      this.pass(testName, 'Large file hashed correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testBufferHashing() {
    const testName = 'Buffer Hashing';
    try {
      const generator = new HashGenerator('sha-256');

      const testBuffer = Buffer.from('Test buffer content');

      const hash = await generator.calculateBufferHash(testBuffer);

      // Verify hash format
      if (!/^[a-f0-9]{64}$/.test(hash)) {
        throw new Error('Buffer hash format incorrect');
      }

      // Verify against Node's crypto
      const expectedHash = crypto.createHash('sha-256')
        .update(testBuffer)
        .digest('hex');

      if (hash !== expectedHash) {
        throw new Error('Buffer hash value incorrect');
      }

      this.pass(testName, 'Buffer hashing works correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testStringHashing() {
    const testName = 'String Hashing';
    try {
      const generator = new HashGenerator('sha-256');

      const testString = 'Test string content';

      const hash = await generator.calculateStringHash(testString);

      // Verify hash format
      if (!/^[a-f0-9]{64}$/.test(hash)) {
        throw new Error('String hash format incorrect');
      }

      // Verify against Node's crypto
      const expectedHash = crypto.createHash('sha-256')
        .update(testString)
        .digest('hex');

      if (hash !== expectedHash) {
        throw new Error('String hash value incorrect');
      }

      this.pass(testName, 'String hashing works correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testFileVerification() {
    const testName = 'File Verification';
    try {
      const generator = new HashGenerator('sha-256');

      const testContent = 'Verification test content';
      const testFile = path.join(this.testDir, 'verify-file.txt');
      fs.writeFileSync(testFile, testContent);

      const hash = await generator.calculateFileHash(testFile);
      const isValid = await generator.verifyFileHash(testFile, hash);

      if (!isValid) {
        throw new Error('File verification failed');
      }

      // Test with wrong hash
      const wrongHash = 'a'.repeat(64);
      const isInvalid = await generator.verifyFileHash(testFile, wrongHash);

      if (isInvalid) {
        throw new Error('Should reject wrong hash');
      }

      this.pass(testName, 'File verification works correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testSHA512Support() {
    const testName = 'SHA-512 Support';
    try {
      const generator = new HashGenerator('sha-512');

      const testContent = 'SHA-512 test';
      const testFile = path.join(this.testDir, 'sha512-file.txt');
      fs.writeFileSync(testFile, testContent);

      const hash = await generator.calculateFileHash(testFile);

      // SHA-512 produces 128 hex characters
      if (!/^[a-f0-9]{128}$/.test(hash)) {
        throw new Error('SHA-512 hash format incorrect');
      }

      // Verify against Node's crypto
      const expectedHash = crypto.createHash('sha-512')
        .update(testContent)
        .digest('hex');

      if (hash !== expectedHash) {
        throw new Error('SHA-512 hash value incorrect');
      }

      this.pass(testName, 'SHA-512 supported correctly');
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
  const test = new HashGeneratorTest();
  test.runAll().catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = HashGeneratorTest;
