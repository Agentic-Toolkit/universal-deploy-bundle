#!/usr/bin/env node

/**
 * Hash Generator - V5.3
 *
 * Generates SHA-256/SHA-512 hashes for files
 * Optimized for performance and memory efficiency
 *
 * FREE FEATURES:
 * - SHA-256 hashing
 * - File streaming for large files
 * - Buffer hashing for small files
 * - String hashing
 *
 * ENTERPRISE FEATURES:
 * - SHA-512 high-security hashing
 * - HMAC for authenticated hashing
 * - Batch processing optimization
 */

const crypto = require('crypto');
const fs = require('fs');
const stream = require('stream');

class HashGenerator {
  constructor(algorithm = 'sha-256') {
    this.algorithm = algorithm;
    this.chunkSize = 65536; // 64KB chunks for large files
  }

  /**
   * Calculate hash for a file using streaming
   * Memory efficient for large files
   */
  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(this.algorithm);
      const fileStream = fs.createReadStream(filePath);

      fileStream.on('data', (chunk) => {
        hash.update(chunk);
      });

      fileStream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      fileStream.on('error', (error) => {
        reject(new Error(`Failed to read file: ${error.message}`));
      });
    });
  }

  /**
   * Calculate hash for a buffer (for small files)
   * Faster for files that fit in memory
   */
  calculateBufferHash(buffer) {
    const hash = crypto.createHash(this.algorithm);
    hash.update(buffer);
    return hash.digest('hex');
  }

  /**
   * Calculate hash for a string
   */
  calculateStringHash(str) {
    const hash = crypto.createHash(this.algorithm);
    hash.update(str, 'utf8');
    return hash.digest('hex');
  }

  /**
   * Calculate hash for directory contents
   */
  async calculateDirectoryHash(dirPath, options = {}) {
    const path = require('path');

    const patterns = options.patterns || ['**/*'];
    const ignore = options.ignore || ['**/node_modules/**', '**/.git/**'];

    const glob = require('glob');
    const fileHashes = {};

    for (const pattern of patterns) {
      const files = glob.sync(pattern, {
        cwd: dirPath,
        ignore,
        nodir: true
      });

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
          const fileHash = await this.calculateFileHash(filePath);
          fileHashes[file] = fileHash;
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }

    // Create combined hash of all file hashes (sorted for consistency)
    const combined = Object.values(fileHashes).sort().join(':');
    return this.calculateStringHash(combined);
  }

  /**
   * Generate HMAC for authenticated hashing
   * ENTERPRISE FEATURE
   */
  async calculateHMAC(filePath, secret) {
    const hmac = crypto.createHmac(this.algorithm, secret);
    const buffer = fs.readFileSync(filePath);
    hmac.update(buffer);
    return hmac.digest('hex');
  }

  /**
   * Verify file against expected hash
   */
  async verifyFileHash(filePath, expectedHash) {
    try {
      const actualHash = await this.calculateFileHash(filePath);
      return actualHash === expectedHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Batch hash calculation for multiple files
   * ENTERPRISE FEATURE
   */
  async calculateBatchHashes(filePaths, options = {}) {
    const concurrent = options.concurrent || 5;
    const results = {};

    // Process files in batches
    for (let i = 0; i < filePaths.length; i += concurrent) {
      const batch = filePaths.slice(i, i + concurrent);
      const batchPromises = batch.map(async (filePath) => {
        try {
          const hash = await this.calculateFileHash(filePath);
          results[filePath] = hash;
        } catch (error) {
          results[filePath] = null;
        }
      });
      await Promise.all(batchPromises);
    }

    return results;
  }

  /**
   * Get algorithm information
   */
  getAlgorithmInfo() {
    const algorithms = {
      'sha-256': {
        name: 'SHA-256',
        outputLength: 256,
        blockSize: 512,
        strength: 'HIGH'
      },
      'sha-512': {
        name: 'SHA-512',
        outputLength: 512,
        blockSize: 1024,
        strength: 'VERY_HIGH'
      }
    };

    return algorithms[this.algorithm] || algorithms['sha-256'];
  }

  /**
   * Validate algorithm
   */
  static isValidAlgorithm(algorithm) {
    const validAlgorithms = ['sha-256', 'sha-512', 'md5', 'sha1'];
    return validAlgorithms.includes(algorithm.toLowerCase());
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const algorithm = args.includes('--sha-512') ? 'sha-512' : 'sha-256';

  const generator = new HashGenerator(algorithm);

  if (command === 'test') {
    console.log(`\n🔒 Hash Generator Test (${algorithm.toUpperCase()})\n`);
    console.log(`Algorithm: ${generator.getAlgorithmInfo().name}`);
    console.log(`Output Length: ${generator.getAlgorithmInfo().outputLength} bits`);
    console.log(`Block Size: ${generator.getAlgorithmInfo().blockSize} bits`);
    console.log(`Strength: ${generator.getAlgorithmInfo().strength}`);
    console.log('\n✅ Hash Generator is ready\n');
  } else if (command === 'hash' && args[1]) {
    generator.calculateFileHash(args[1])
      .then(hash => {
        console.log(`\n🔒 File Hash (${algorithm.toUpperCase()})\n`);
        console.log(`File: ${args[1]}`);
        console.log(`Hash: ${hash}\n`);
      })
      .catch(error => {
        console.error(`\n❌ Error: ${error.message}\n`);
        process.exit(1);
      });
  } else {
    console.log('\n🔒 Hash Generator - V5.3\n');
    console.log('Usage:');
    console.log('  node HashGenerator.js test                    # Test generator');
    console.log('  node HashGenerator.js hash <file> [--sha-512] # Hash a file\n');
    console.log('Examples:');
    console.log('  node HashGenerator.js test');
    console.log('  node HashGenerator.js hash package.json');
    console.log('  node HashGenerator.js hash package.json --sha-512\n');
  }
}

module.exports = HashGenerator;
