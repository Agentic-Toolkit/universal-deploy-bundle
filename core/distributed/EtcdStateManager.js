#!/usr/bin/env node

/**
 * Etcd State Manager - V5.4
 *
 * Manages deployment state across multiple instances using etcd
 * Provides distributed coordination for deployment systems
 *
 * FREE Features:
 * - State persistence
 * - Configuration storage
 * - Basic coordination
 *
 * ENTERPRISE Features:
 * - Leader election (Raft consensus)
 * - Distributed locks
 * - Real-time state synchronization
 * - Watch functionality
 */

class EtcdStateManager {
  constructor(options = {}) {
    this.deploymentId = options.deploymentId || this.generateDeploymentId();
    this.instanceId = options.instanceId || this.generateInstanceId();
    this.projectRoot = options.projectRoot || process.cwd();
    this.etcdEndpoints = options.etcdEndpoints || ['localhost:2379'];
    this.enterpriseMode = options.enterpriseMode || false;
    this.verbose = options.verbose || false;

    // State management
    this.state = {
      deploymentId: this.deploymentId,
      instanceId: this.instanceId,
      leader: null,
      isLeader: false,
      connected: false
    };

    this.client = null;
    this.lease = null;
  }

  /**
   * Initialize etcd connection
   */
  async initialize() {
    console.log('\n🔄 Initializing Distributed State Management (V5.4)...');
    console.log(`   Deployment ID: ${this.deploymentId}`);
    console.log(`   Instance ID: ${this.instanceId}`);
    console.log(`   etcd endpoints: ${this.etcdEndpoints.join(', ')}`);

    // Check if etcd3 client is available
    try {
      const Etcd3 = require('etcd3');
      this.client = new Etcd3({
        hosts: this.etcdEndpoints
      });

      // Test connection
      await this.client.get('healthcheck').exec();
      this.state.connected = true;
      console.log('✅ etcd connection established');

    } catch (error) {
      console.log('⚠️  etcd3 not available. Running in local mode.');
      console.log('   For distributed features, install etcd3: npm install etcd3');
      this.state.connected = false;
      this.client = null;
    }

    return this.state.connected;
  }

  /**
   * Save state (distributed or local)
   */
  async saveState(key, value) {
    if (!this.client || !this.state.connected) {
      // Fallback to local storage
      return this.saveLocalState(key, value);
    }

    const stateKey = `/deployments/${this.deploymentId}/state/${key}`;

    try {
      await this.client.put()
        .key(stateKey)
        .value(JSON.stringify(value))
        .exec();

      if (this.verbose) {
        console.log(`✅ State saved: ${stateKey}`);
      }
    } catch (error) {
      console.error(`Failed to save state: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get state (distributed or local)
   */
  async getState(key) {
    if (!this.client || !this.state.connected) {
      // Fallback to local storage
      return this.getLocalState(key);
    }

    const stateKey = `/deployments/${this.deploymentId}/state/${key}`;

    try {
      const value = await this.client.get().key(stateKey).exec();
      if (value && value.length > 0) {
        return JSON.parse(value[0].value.toString());
      }
      return null;
    } catch (error) {
      console.error(`Failed to get state: ${error.message}`);
      return null;
    }
  }

  /**
   * Save state locally (fallback)
   */
  async saveLocalState(key, value) {
    const fs = require('fs');
    const path = require('path');
    const stateDir = path.join(this.projectRoot, '.deployment-state-v5.4');

    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    const stateFile = path.join(stateDir, `${key}.json`);
    fs.writeFileSync(stateFile, JSON.stringify(value, null, 2));

    if (this.verbose) {
      console.log(`✅ State saved locally: ${key}`);
    }
  }

  /**
   * Get state locally (fallback)
   */
  async getLocalState(key) {
    const fs = require('fs');
    const path = require('path');
    const stateFile = path.join(this.projectRoot, '.deployment-state-v5.4', `${key}.json`);

    if (fs.existsSync(stateFile)) {
      try {
        const data = fs.readFileSync(stateFile, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        console.error(`Failed to load local state: ${error.message}`);
        return null;
      }
    }

    return null;
  }

  /**
   * Update deployment progress
   */
  async updateProgress(milestone, percentage, metadata = {}) {
    const progress = {
      milestone,
      percentage,
      timestamp: new Date().toISOString(),
      instanceId: this.instanceId,
      metadata
    };

    await this.saveState('progress', progress);

    console.log(`📊 Progress: ${milestone} (${percentage}%)`);
  }

  /**
   * Get deployment progress
   */
  async getProgress() {
    return await this.getState('progress');
  }

  /**
   * Acquire distributed lock (ENTERPRISE)
   */
  async acquireLock(resource, timeout = 30000) {
    if (!this.enterpriseMode || !this.client) {
      // Local mode - just return success
      return { acquired: true, resource };
    }

    const lockKey = `/deployments/${this.deploymentId}/locks/${resource}`;

    console.log(`🔒 Acquiring lock: ${resource}`);

    try {
      const lock = await this.client.lock()
        .key(lockKey)
        .ttl(timeout)
        .acquire();

      console.log(`✅ Lock acquired: ${resource}`);
      return { acquired: true, lock, resource };

    } catch (error) {
      console.log(`⚠️  Lock acquisition failed: ${resource}`);
      return { acquired: false, resource, error: error.message };
    }
  }

  /**
   * Release lock
   */
  async releaseLock(lock) {
    if (!lock || !lock.lock) {
      return;
    }

    try {
      await lock.lock.release();
      console.log(`🔓 Lock released: ${lock.resource}`);
    } catch (error) {
      console.error(`Failed to release lock: ${error.message}`);
    }
  }

  /**
   * Leader election (ENTERPRISE)
   */
  async electLeader() {
    if (!this.enterpriseMode || !this.client) {
      console.log('ℹ️  Running in single-instance mode');
      this.state.isLeader = true;
      this.state.leader = this.instanceId;
      return {
        isLeader: true,
        leaderId: this.instanceId
      };
    }

    const leaderKey = `/deployments/${this.deploymentId}/leader`;

    console.log('\n🏆 Participating in leader election...');

    try {
      const Etcd3 = require('etcd3');
      const election = this.client.election(leaderKey, this.instanceId);
      const leader = await election.campaign();

      this.state.isLeader = true;
      this.state.leader = this.instanceId;

      console.log(`✅ This instance (${this.instanceId}) is now the leader`);

      // Setup resignation handler
      process.on('SIGTERM', async () => {
        console.log('Resigning leadership...');
        await leader.resign();
        process.exit(0);
      });

      return {
        isLeader: true,
        leaderId: this.instanceId,
        election
      };

    } catch (error) {
      // Already have a leader
      const currentLeader = await this.client.get().key(leaderKey).string();
      this.state.isLeader = false;
      this.state.leader = currentLeader;

      console.log(`ℹ️  Current leader: ${currentLeader}`);
      console.log(`   This instance (${this.instanceId}) is a follower`);

      return {
        isLeader: false,
        leaderId: currentLeader
      };
    }
  }

  /**
   * Save integrity manifest (distributed)
   */
  async saveIntegrityManifest(commitHash, manifest) {
    const manifestKey = `/deployments/${this.deploymentId}/integrity/${commitHash}`;

    if (this.client && this.state.connected) {
      try {
        await this.client.put()
          .key(manifestKey)
          .value(JSON.stringify(manifest))
          .exec();

        console.log(`✅ Integrity manifest saved: ${commitHash.substring(0, 8)}...`);
      } catch (error) {
        console.error(`Failed to save manifest: ${error.message}`);
      }
    } else {
      await this.saveLocalState(`integrity-${commitHash}`, manifest);
    }
  }

  /**
   * Verify integrity against distributed manifest
   */
  async verifyIntegrity(commitHash) {
    const manifestKey = `/deployments/${this.deploymentId}/integrity/${commitHash}`;

    if (this.client && this.state.connected) {
      try {
        const manifest = await this.client.get().key(manifestKey).exec();
        if (manifest && manifest.length > 0) {
          const data = JSON.parse(manifest[0].value.toString());
          console.log(`✅ Found integrity manifest: ${commitHash.substring(0, 8)}...`);
          return data;
        }
      } catch (error) {
        console.error(`Failed to retrieve manifest: ${error.message}`);
      }
    }

    // Fallback to local
    return await this.getLocalState(`integrity-${commitHash}`);
  }

  /**
   * Watch for state changes (ENTERPRISE)
   */
  watchState(key, callback) {
    if (!this.enterpriseMode || !this.client) {
      console.log('ℹ️  Watch not available in local mode');
      return;
    }

    const stateKey = `/deployments/${this.deploymentId}/state/${key}`;

    this.client.watch()
      .key(stateKey)
      .create()
      .then(watcher => {
        watcher.on('put', (event) => {
          const value = JSON.parse(event.value.toString());
          callback('put', value);
        });

        watcher.on('delete', (event) => {
          callback('delete', event.key.toString());
        });

        console.log(`👀 Watching: ${stateKey}`);
      })
      .catch(error => {
        console.error(`Failed to watch state: ${error.message}`);
      });
  }

  /**
   * Get all state
   */
  async getAllState() {
    if (this.client && this.state.connected) {
      const prefix = `/deployments/${this.deploymentId}/state/`;
      const keys = await this.client.getAll().prefix(prefix).keys();

      const state = {};
      for (const key of keys) {
        const value = await this.client.get().key(key).string();
        if (value) {
          const keyName = key.replace(prefix, '');
          state[keyName] = JSON.parse(value);
        }
      }

      return state;
    }

    // Fallback to local
    const fs = require('fs');
    const path = require('path');
    const stateDir = path.join(this.projectRoot, '.deployment-state-v5.4');

    if (!fs.existsSync(stateDir)) {
      return {};
    }

    const state = {};
    const files = fs.readdirSync(stateDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const key = file.replace('.json', '');
        const data = fs.readFileSync(path.join(stateDir, file), 'utf8');
        state[key] = JSON.parse(data);
      }
    }

    return state;
  }

  /**
   * Cleanup on deployment completion
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up deployment state...');

    // Resign leadership if leader
    if (this.state.isLeader && this.client) {
      // Leader resignation would happen here
    }

    // Clean up locks
    if (this.client && this.state.connected) {
      const lockPrefix = `/deployments/${this.deploymentId}/locks/`;
      try {
        await this.client.delete().prefix(lockPrefix).exec();
        console.log('✅ Distributed locks cleaned');
      } catch (error) {
        console.error(`Failed to clean locks: ${error.message}`);
      }
    }

    console.log('✅ Cleanup completed');
  }

  /**
   * Generate deployment ID
   */
  generateDeploymentId() {
    return `deploy-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate instance ID
   */
  generateInstanceId() {
    const os = require('os');
    return `${os.hostname()}-${process.pid}-${Date.now()}`;
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      ...this.state,
      deploymentId: this.deploymentId,
      instanceId: this.instanceId,
      connected: this.state.connected,
      enterpriseMode: this.enterpriseMode
    };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const options = {
    etcdEndpoints: process.env.ETCD_ENDPOINTS ? process.env.ETCD_ENDPOINTS.split(',') : ['localhost:2379'],
    enterpriseMode: args.includes('--enterprise'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  const manager = new EtcdStateManager(options);

  switch (command) {
    case 'init':
      manager.initialize()
        .then(connected => {
          console.log(`\n✅ State manager initialized`);
          console.log(`   Connected: ${connected ? 'Yes ✅' : 'No ⚠️'}`);
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Initialization failed:', error.message);
          process.exit(1);
        });
      break;

    case 'status':
      manager.initialize()
        .then(() => {
          const status = manager.getStatus();
          console.log('\n📊 State Manager Status\n');
          console.log(`Deployment ID: ${status.deploymentId}`);
          console.log(`Instance ID: ${status.instanceId}`);
          console.log(`Connected: ${status.connected ? 'Yes ✅' : 'No ⚠️'}`);
          console.log(`Enterprise Mode: ${status.enterpriseMode ? 'Yes ✅' : 'No ⚠️'}`);
          console.log(`Is Leader: ${status.isLeader ? 'Yes ✅' : 'No ⚠️'}`);
          if (status.leader) {
            console.log(`Current Leader: ${status.leader}`);
          }
          console.log('');
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Status check failed:', error.message);
          process.exit(1);
        });
      break;

    case 'elect':
      manager.initialize()
        .then(() => manager.electLeader())
        .then(result => {
          console.log('\n📊 Leader Election Result\n');
          console.log(`Is Leader: ${result.isLeader ? 'Yes ✅' : 'No ⚠️'}`);
          console.log(`Leader ID: ${result.leaderId}`);
          console.log('');
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Leader election failed:', error.message);
          process.exit(1);
        });
      break;

    default:
      console.log('\n🔄 Distributed State Manager - V5.4\n');
      console.log('Usage:');
      console.log('  node EtcdStateManager.js init                      # Initialize');
      console.log('  node EtcdStateManager.js status                    # Check status');
      console.log('  node EtcdStateManager.js elect [--enterprise]      # Leader election');
      console.log('');
      console.log('Examples:');
      console.log('  node EtcdStateManager.js init');
      console.log('  node EtcdStateManager.js status');
      console.log('  node EtcdStateManager.js elect --enterprise\n');
      process.exit(1);
  }
}

module.exports = EtcdStateManager;
