#!/usr/bin/env node

/**
 * SMIVerifier Tests - V5.5.0
 *
 * Tests Service Mesh Interface verification
 */

const SMIVerifier = require('../../core/servicemesh/SMIVerifier');

class SMIVerifierTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  async runAll() {
    console.log('\n🧪 SMIVerifier Test Suite - V5.5.0');
    console.log('='.repeat(60));

    await this.testInitialization();
    await this.testSimulationMode();
    await this.testComplianceVerification();
    await this.testTrafficSplitCheck();
    await this.testmTLSCheck();
    await this.testCircuitBreakerCheck();
    await this.testReportGeneration();

    this.printSummary();
  }

  async testInitialization() {
    const testName = 'Initialization';
    try {
      const verifier = new SMIVerifier({
        serviceMesh: 'istio',
        verbose: true
      });

      if (verifier.serviceMesh !== 'istio') {
        throw new Error('Service mesh not set correctly');
      }

      if (!verifier.verbose) {
        throw new Error('Verbose mode not set');
      }

      this.pass(testName, 'Verifier initializes with correct configuration');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testSimulationMode() {
    const testName = 'Simulation Mode';
    try {
      const verifier = new SMIVerifier({
        serviceMesh: 'istio',
        simulation: true
      });

      const result = await verifier.verifySMICompliance();

      if (!result) {
        throw new Error('Verification failed');
      }

      if (!result.simulation) {
        throw new Error('Result should indicate simulation mode');
      }

      // In simulation mode, should always pass
      if (!result.compliant) {
        throw new Error('Simulation mode should be compliant');
      }

      this.pass(testName, 'Simulation mode works correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testComplianceVerification() {
    const testName = 'Compliance Verification';
    try {
      const verifier = new SMIVerifier({
        serviceMesh: 'istio',
        simulation: true
      });

      const result = await verifier.verifySMICompliance();

      if (!result) {
        throw new Error('Verification failed');
      }

      if (!result.summary) {
        throw new Error('Summary missing');
      }

      if (typeof result.summary.totalChecks !== 'number') {
        throw new Error('Total checks missing');
      }

      if (!result.compliant) {
        throw new Error('Should be compliant in simulation mode');
      }

      this.pass(testName, 'Compliance verification works correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testTrafficSplitCheck() {
    const testName = 'Traffic Split Check';
    try {
      const verifier = new SMIVerifier({
        serviceMesh: 'istio',
        simulation: true
      });

      const result = await verifier.verifyTrafficSplits();

      if (!result) {
        throw new Error('Traffic split check failed');
      }

      if (typeof result.checked !== 'number') {
        throw new Error('Checked count missing');
      }

      if (typeof result.passed !== 'number') {
        throw new Error('Passed count missing');
      }

      this.pass(testName, 'Traffic split check works correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testmTLSCheck() {
    const testName = 'mTLS Check';
    try {
      const verifier = new SMIVerifier({
        serviceMesh: 'istio',
        simulation: true
      });

      const result = await verifier.verifymTLS();

      if (!result) {
        throw new Error('mTLS check failed');
      }

      if (typeof result.checked !== 'number') {
        throw new Error('Checked count missing');
      }

      if (typeof result.passed !== 'number') {
        throw new Error('Passed count missing');
      }

      this.pass(testName, 'mTLS check works correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testCircuitBreakerCheck() {
    const testName = 'Circuit Breaker Check';
    try {
      const verifier = new SMIVerifier({
        serviceMesh: 'istio',
        simulation: true
      });

      const result = await verifier.verifyCircuitBreakers();

      if (!result) {
        throw new Error('Circuit breaker check failed');
      }

      if (typeof result.checked !== 'number') {
        throw new Error('Checked count missing');
      }

      if (typeof result.passed !== 'number') {
        throw new Error('Passed count missing');
      }

      this.pass(testName, 'Circuit breaker check works correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testReportGeneration() {
    const testName = 'Report Generation';
    try {
      const verifier = new SMIVerifier({
        serviceMesh: 'istio',
        simulation: true
      });

      const checks = [
        { name: 'TrafficSplit', passed: true },
        { name: 'mTLS', passed: true },
        { name: 'CircuitBreaker', passed: true }
      ];

      const report = verifier.generateComplianceReport(checks);

      if (!report) {
        throw new Error('Report generation failed');
      }

      if (!report.summary) {
        throw new Error('Summary missing');
      }

      if (report.summary.totalChecks !== 3) {
        throw new Error('Total checks incorrect');
      }

      if (!report.compliant) {
        throw new Error('All checks passed should be compliant');
      }

      if (report.compliancePercentage !== 100) {
        throw new Error('Should be 100% compliant');
      }

      this.pass(testName, 'Report generation works correctly');
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
  const test = new SMIVerifierTest();
  test.runAll().catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = SMIVerifierTest;
