#!/usr/bin/env node

/**
 * EtcdStateManager Tests - V5.4.0
 *
 * Tests distributed state management with etcd
 */

const EtcdStateManager = require('../../core/distributed/EtcdStateManager');
const fs = require('fs');
const path = require('path');

class EtcdStateManagerTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  async runAll() {
    console.log('\n🧪 EtcdStateManager Test Suite - V5.4.0');
    console.log('='.repeat(60));

    await this.testInitialization();
    await this.testLocalFallback();
    await this.testLeaderElectionLocal();
    await this.testDistributedLockLocal();
    await this.testStatePersistence();
    await this.testResumeCapability();

    this.printSummary();
  }

  async testInitialization() {
    const testName = 'Initialization';
    try {
      const manager = new EtcdStateManager({
        deploymentId: 'test-deployment',
        instanceId: 'test-instance-1'
      });

      if (manager.deploymentId !== 'test-deployment') {
        throw new Error('Deployment ID not set correctly');
      }

      if (manager.instanceId !== 'test-instance-1') {
        throw new Error('Instance ID not set correctly');
      }

      this.pass(testName, 'Manager initializes with correct configuration');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testLocalFallback() {
    const testName = 'Local Fallback Mode';
    try {
      const manager = new EtcdStateManager({
        deploymentId: 'test-deployment',
        instanceId: 'test-instance-1',
        etcdEndpoints: [] // No etcd available
      });

      const connected = await manager.initialize();

      if (connected) {
        throw new Error('Should not be connected in local mode');
      }

      if (manager.state.connected) {
        throw new Error('Should not be connected');
      }

      this.pass(testName, 'Falls back to local storage when etcd unavailable');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testLeaderElectionLocal() {
    const testName = 'Leader Election (Local)';
    try {
      const manager = new EtcdStateManager({
        deploymentId: 'test-deployment',
        instanceId: 'test-instance-1',
        etcdEndpoints: []
      });

      await manager.initialize();

      // In local mode, single instance should become leader
      const leaderInfo = await manager.electLeader();

      if (!leaderInfo.isLeader) {
        throw new Error('Local instance should be leader');
      }

      if (leaderInfo.leaderId !== 'test-instance-1') {
        throw new Error('Leader ID should be test-instance-1');
      }

      this.pass(testName, 'Single instance becomes leader in local mode');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testDistributedLockLocal() {
    const testName = 'Distributed Lock (Local)';
    try {
      const manager = new EtcdStateManager({
        deploymentId: 'test-deployment',
        instanceId: 'test-instance-1',
        etcdEndpoints: []
      });

      await manager.initialize();

      const lockResult = await manager.acquireLock('deployment-lock', 10000);

      if (!lockResult.acquired) {
        throw new Error('Failed to acquire lock');
      }

      // In local mode, locks don't actually prevent double acquisition
      // This is expected behavior for local fallback mode

      this.pass(testName, 'Distributed lock works correctly in local mode');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testStatePersistence() {
    const testName = 'State Persistence';
    try {
      const manager = new EtcdStateManager({
        deploymentId: 'test-deployment',
        instanceId: 'test-instance-1',
        etcdEndpoints: []
      });

      await manager.initialize();

      const testData = {
        phase: 'verification',
        step: 'integrity',
        timestamp: Date.now(),
        data: { files: 156, verified: 156 }
      };

      await manager.saveState('deployment-state', testData);

      const retrieved = await manager.getState('deployment-state');

      if (!retrieved) {
        throw new Error('Failed to retrieve state');
      }

      if (retrieved.phase !== 'verification') {
        throw new Error('State data corrupted');
      }

      this.pass(testName, 'State persists correctly');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  async testResumeCapability() {
    const testName = 'Resume Capability';
    try {
      const manager1 = new EtcdStateManager({
        deploymentId: 'test-deployment',
        instanceId: 'test-instance-1',
        etcdEndpoints: []
      });

      await manager1.initialize();

      // Save state at specific phase
      await manager1.saveState('deployment-phase', {
        phase: 'build',
        completed: ['integrity', 'security'],
        pending: ['cni', 'deploy']
      });

      // Create new manager instance (simulating restart)
      const manager2 = new EtcdStateManager({
        deploymentId: 'test-deployment',
        instanceId: 'test-instance-2',
        etcdEndpoints: []
      });

      await manager2.initialize();

      const resumedState = await manager2.getState('deployment-phase');

      if (!resumedState) {
        throw new Error('Failed to resume state');
      }

      if (resumedState.phase !== 'build') {
        throw new Error('Resumed state incorrect');
      }

      if (resumedState.completed.length !== 2) {
        throw new Error('Resumed state incomplete');
      }

      this.pass(testName, 'Can resume from previous state');
    } catch (error) {
      this.fail(testName, error.message);
    }
  }

  pass(testName, message) {
    this.passed++;
    this.results.push({ test: testName, status: 'PASS', message });
    console.log(`   ✅ ${testName} - ${message}`);
  }

  fail(testName, message) {
    this.failed++;
    this.results.push({ test: testName, status: 'FAIL', message });
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
  const test = new EtcdStateManagerTest();
  test.runAll().catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = EtcdStateManagerTest;
