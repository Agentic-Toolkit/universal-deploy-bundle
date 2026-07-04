#!/usr/bin/env node

/**
 * Integrity Manifest Manager - V5.3
 *
 * Creates and manages integrity manifests
 * Handles manifest versioning and storage
 */

const fs = require('fs');
const path = require('path');
const HashGenerator = require('./HashGenerator');

class IntegrityManifest {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.algorithm = options.algorithm || 'sha-256';
    this.manifestPath = options.manifestPath ||
      path.join(this.projectRoot, '.integrity.json');
    this.historyDir = path.join(this.projectRoot, '.integrity/history');
    this.verbose = options.verbose || false;

    this.hashGenerator = new HashGenerator(this.algorithm);

    this.manifest = {
      version: '1.0',
      algorithm: this.algorithm,
      generatedAt: new Date().toISOString(),
      generatedBy: this.getGitUser(),
      files: {},
      metadata: {
        totalFiles: 0,
        totalSize: 0,
        excludedPatterns: []
      },
      manifestHash: null
    };
  }

  /**
   * Get git user for attribution
   */
  getGitUser() {
    try {
      const { execSync } = require('child_process');
      const email = execSync('git config user.email', { encoding: 'utf8' }).trim();
      return email || 'unknown@developer';
    } catch (error) {
      return 'unknown@developer';
    }
  }

  /**
   * Create manifest from project files
   */
  async create(options = {}) {
    const patterns = options.patterns || this.getDefaultPatterns();
    const ignore = options.ignore || this.getDefaultIgnore();

    console.log(`\n📝 Creating integrity manifest (${this.algorithm.toUpperCase()})...`);

    const glob = require('glob');

    for (const pattern of patterns) {
      const files = glob.sync(pattern, {
        cwd: this.projectRoot,
        ignore,
        nodir: true
      });

      for (const file of files) {
        await this.addFile(file);
      }
    }

    this.manifest.metadata.excludedPatterns = ignore;

    // Calculate final manifest hash
    await this.finalize();

    console.log(`✅ Manifest created: ${this.manifest.metadata.totalFiles} files`);
    console.log(`   Total size: ${this.formatBytes(this.manifest.metadata.totalSize)}`);
    console.log(`   Manifest hash: ${this.manifest.manifestHash.substring(0, 16)}...`);

    return this.manifest;
  }

  /**
   * Add file to manifest
   */
  async addFile(relativePath) {
    const fullPath = path.join(this.projectRoot, relativePath);

    try {
      const stats = fs.statSync(fullPath);
      const hash = await this.hashGenerator.calculateFileHash(fullPath);

      this.manifest.files[relativePath] = {
        hash,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        permissions: stats.mode.toString(8)
      };

      this.manifest.metadata.totalFiles++;
      this.manifest.metadata.totalSize += stats.size;

      if (this.verbose) {
        console.log(`   ✓ ${relativePath}`);
      }

    } catch (error) {
      if (this.verbose) {
        console.log(`   ⚠️  Skipped: ${relativePath} (${error.message})`);
      }
    }
  }

  /**
   * Finalize manifest with hash calculation
   */
  async finalize() {
    // Create hash of all file entries (sorted for consistency)
    const filesObject = {};
    Object.keys(this.manifest.files).sort().forEach(key => {
      filesObject[key] = this.manifest.files[key];
    });

    const filesString = JSON.stringify(filesObject, null, 2);
    this.manifest.manifestHash = this.hashGenerator.calculateStringHash(filesString);
  }

  /**
   * Load existing manifest
   */
  load() {
    if (!fs.existsSync(this.manifestPath)) {
      throw new Error('No manifest found. Run: npm run integrity:generate');
    }

    this.manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));

    if (this.manifest.algorithm !== this.algorithm) {
      console.log(`⚠️  Manifest uses ${this.manifest.algorithm}, creating new ${this.algorithm} manifest`);
    }

    return this.manifest;
  }

  /**
   * Save manifest to disk
   */
  async save() {
    await this.finalize();

    // Ensure .integrity directory exists
    const integrityDir = path.dirname(this.manifestPath);
    if (!fs.existsSync(integrityDir)) {
      fs.mkdirSync(integrityDir, { recursive: true });
    }

    fs.writeFileSync(this.manifestPath, JSON.stringify(this.manifest, null, 2));

    console.log(`✅ Manifest saved: ${this.manifestPath}`);
  }

  /**
   * Save manifest to history
   */
  async saveToHistory(identifier) {
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }

    const historyPath = path.join(this.historyDir, `${identifier}.json`);
    fs.writeFileSync(historyPath, JSON.stringify(this.manifest, null, 2));

    // Save as last-good
    const lastGoodPath = path.join(this.projectRoot, '.integrity/last-good.json');
    fs.writeFileSync(lastGoodPath, JSON.stringify({
      ...this.manifest,
      identifier,
      savedAt: new Date().toISOString()
    }, null, 2));

    console.log(`📜 Manifest saved to history: ${identifier}`);
  }

  /**
   * Get default file patterns
   */
  getDefaultPatterns() {
    return [
      'src/**/*',
      'lib/**/*',
      'app/**/*',
      'pages/**/*',
      'public/**/*',
      'styles/**/*',
      'components/**/*',
      'hooks/**/*',
      'utils/**/*',
      'types/**/*',
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'tsconfig.json',
      'next.config.js',
      'next.config.mjs',
      'tailwind.config.js',
      'tailwind.config.ts',
      '.env.example',
      'vite.config.js',
      'webpack.config.js'
    ];
  }

  /**
   * Get default ignore patterns
   */
  getDefaultIgnore() {
    return [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/*.log',
      '**/coverage/**',
      '**/.cache/**',
      '**/*.tmp',
      '**/.DS_Store',
      '**/test-results/**',
      '**/playwright-report/**',
      '**/.playwright/**'
    ];
  }

  /**
   * Compare two manifests
   */
  compare(otherManifest) {
    const changes = {
      added: [],
      removed: [],
      modified: [],
      unchanged: []
    };

    // Check for added and modified files
    for (const [file, info] of Object.entries(this.manifest.files)) {
      if (!otherManifest.files) {
        changes.added.push({ file, info });
        continue;
      }

      if (!otherManifest.files[file]) {
        changes.added.push({ file, info });
      } else if (info.hash !== otherManifest.files[file].hash) {
        changes.modified.push({
          file,
          current: info.hash,
          previous: otherManifest.files[file].hash
        });
      } else {
        changes.unchanged.push(file);
      }
    }

    // Check for removed files
    if (otherManifest.files) {
      for (const file of Object.keys(otherManifest.files)) {
        if (!this.manifest.files[file]) {
          changes.removed.push({
            file,
            info: otherManifest.files[file]
          });
        }
      }
    }

    return changes;
  }

  /**
   * Verify manifest against files on disk
   */
  async verify() {
    console.log('\n🔍 Verifying integrity manifest...');

    if (!fs.existsSync(this.manifestPath)) {
      console.log('❌ No manifest found. Run: npm run integrity:generate');
      return {
        verified: [],
        corrupted: [],
        missing: [],
        totalFiles: 0,
        passed: false
      };
    }

    this.load();

    const corrupted = [];
    const missing = [];
    const verified = [];

    console.log(`   Checking ${this.manifest.metadata.totalFiles} files...`);

    for (const [file, expected] of Object.entries(this.manifest.files)) {
      const fullPath = path.join(this.projectRoot, file);

      if (!fs.existsSync(fullPath)) {
        missing.push({ file, expected });
        console.log(`   ❌ Missing: ${file}`);
        continue;
      }

      try {
        const actualHash = await this.hashGenerator.calculateFileHash(fullPath);

        if (actualHash === expected.hash) {
          verified.push(file);
        } else {
          corrupted.push({
            file,
            expected: expected.hash,
            actual: actualHash
          });
          console.log(`   ❌ Corrupted: ${file}`);
        }
      } catch (error) {
        missing.push({ file, expected, error: error.message });
        console.log(`   ⚠️  Error: ${file} - ${error.message}`);
      }
    }

    const result = {
      verified,
      corrupted,
      missing,
      totalFiles: this.manifest.metadata.totalFiles,
      passed: corrupted.length === 0 && missing.length === 0
    };

    console.log('\n📊 Verification Summary:');
    console.log(`   Total: ${result.totalFiles}`);
    console.log(`   Verified: ${verified.length}`);
    console.log(`   Corrupted: ${corrupted.length}`);
    console.log(`   Missing: ${missing.length}`);

    if (result.passed) {
      console.log('\n✅ INTEGRITY VERIFIED: All files match');
    } else {
      console.log('\n❌ INTEGRITY VIOLATION DETECTED');
    }

    return result;
  }

  /**
   * Format bytes for human-readable output
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get manifest statistics
   */
  getStatistics() {
    return {
      totalFiles: this.manifest.metadata.totalFiles,
      totalSize: this.manifest.metadata.totalSize,
      algorithm: this.manifest.algorithm,
      generatedAt: this.manifest.generatedAt,
      generatedBy: this.manifest.generatedBy,
      manifestHash: this.manifest.manifestHash
    };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const algorithm = args.includes('--sha-512') ? 'sha-512' : 'sha-256';
  const verbose = args.includes('--verbose') || args.includes('-v');

  const manifest = new IntegrityManifest({ algorithm, verbose });

  switch (command) {
    case 'create':
    case 'generate':
      manifest.create()
        .then(() => manifest.save())
        .then(() => process.exit(0))
        .catch(error => {
          console.error('❌ Generation failed:', error.message);
          process.exit(1);
        });
      break;

    case 'verify':
      manifest.verify()
        .then(result => process.exit(result.passed ? 0 : 1))
        .catch(error => {
          console.error('❌ Verification failed:', error.message);
          process.exit(1);
        });
      break;

    case 'stats':
      try {
        manifest.load();
        const stats = manifest.getStatistics();
        console.log('\n📊 Integrity Manifest Statistics\n');
        console.log(`Total Files: ${stats.totalFiles}`);
        console.log(`Total Size: ${manifest.formatBytes(stats.totalSize)}`);
        console.log(`Algorithm: ${stats.algorithm}`);
        console.log(`Generated: ${stats.generatedAt}`);
        console.log(`Generated By: ${stats.generatedBy}`);
        console.log(`Manifest Hash: ${stats.manifestHash.substring(0, 16)}...`);
        console.log();
        process.exit(0);
      } catch (error) {
        console.error('❌ Failed to load manifest:', error.message);
        process.exit(1);
      }
      break;

    default:
      console.log('\n📝 Integrity Manifest Manager - V5.3\n');
      console.log('Usage:');
      console.log('  node IntegrityManifest.js create [--sha-512] [--verbose]');
      console.log('  node IntegrityManifest.js verify');
      console.log('  node IntegrityManifest.js stats\n');
      console.log('Examples:');
      console.log('  node IntegrityManifest.js create');
      console.log('  node IntegrityManifest.js create --verbose');
      console.log('  node IntegrityManifest.js verify');
      console.log('  node IntegrityManifest.js stats\n');
  }
}

module.exports = IntegrityManifest;
