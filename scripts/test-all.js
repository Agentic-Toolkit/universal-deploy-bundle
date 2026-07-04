#!/usr/bin/env node

/**
 * Test Runner - V5.6
 *
 * Runs all tests for V5.3-V5.6 features
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      suites: []
    };
  }

  async runAllTests() {
    console.log('\n🧪 Universal Deploy Bundle - V5.6 Test Suite');
    console.log('='.repeat(60));

    // Test V5.3.0 - Cryptographic Integrity
    await this.runSuite('V5.3.0 - Cryptographic Integrity', 'tests/integrity');

    // Test V5.4.0 - Distributed State
    await this.runSuite('V5.4.0 - Distributed State', 'tests/distributed');

    // Test V5.5.0 - Service Mesh
    await this.runSuite('V5.5.0 - Service Mesh', 'tests/servicemesh');

    // Test V5.6.0 - Air-Gap
    await this.runSuite('V5.6.0 - Air-Gap', 'tests/airgap');

    this.printSummary();
  }

  async runSuite(name, testDir) {
    console.log(`\n${name}`);
    console.log('-'.repeat(60));

    const suitePath = path.join(__dirname, '..', testDir);

    if (!fs.existsSync(suitePath)) {
      console.log(`   ⚠️  Test directory not found: ${testDir}`);
      return;
    }

    const testFiles = fs.readdirSync(suitePath)
      .filter(f => f.endsWith('.test.js') || f.endsWith('.spec.js'));

    if (testFiles.length === 0) {
      console.log(`   ℹ️  No test files found`);
      return;
    }

    for (const testFile of testFiles) {
      await this.runTest(path.join(suitePath, testFile));
    }
  }

  async runTest(testFile) {
    const testName = path.basename(testFile);

    try {
      console.log(`   Running: ${testName}`);

      execSync(`node ${testFile}`, {
        stdio: 'inherit',
        cwd: path.dirname(testFile)
      });

      this.results.passed++;
      this.results.total++;
      console.log(`   ✅ ${testName} - PASSED`);

    } catch (error) {
      this.results.failed++;
      this.results.total++;
      console.log(`   ❌ ${testName} - FAILED`);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`\nTotal Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);

    if (this.results.total > 0) {
      const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
      console.log(`Pass Rate: ${passRate}%`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    if (this.results.failed > 0) {
      console.log('❌ Some tests failed. Please review the failures above.\n');
      process.exit(1);
    } else {
      console.log('✅ All tests passed!\n');
      process.exit(0);
    }
  }
}

// CLI interface
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(error => {
    console.error('\n❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = TestRunner;
