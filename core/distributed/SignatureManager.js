#!/usr/bin/env node

/**
 * Signature Manager - V5.4
 *
 * Manages digital signatures for integrity manifests
 * Provides cryptographic signing and verification
 *
 * FREE Features:
 * - Basic signature verification
 * - Key management guidance
 *
 * ENTERPRISE Features:
 * - RSA-4096 signing
 * - Key generation
 * - Automatic manifest signing
 * - Signature verification
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SignatureManager {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.keyDir = path.join(this.projectRoot, '.integrity/keys');
    this.publicKeyPath = path.join(this.keyDir, 'deployer.pub');
    this.privateKeyPath = path.join(this.keyDir, 'deployer.key');
    this.passphrase = options.passphrase || process.env.DEPLOYER_KEY_PASSPHRASE || 'default-passphrase';
    this.keySize = options.keySize || 4096; // RSA-4096
  }

  /**
   * Generate key pair for signing
   */
  async generateKeyPair() {
    console.log('\n🔑 Generating deployment signing key pair...');

    // Ensure key directory exists
    if (!fs.existsSync(this.keyDir)) {
      fs.mkdirSync(this.keyDir, { recursive: true });
    }

    console.log(`   Key size: ${this.keySize} bits`);
    console.log(`   Algorithm: RSA`);

    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: this.keySize,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
          cipher: 'aes-256-cbc',
          passphrase: this.passphrase
        }
      });

      // Save keys
      fs.writeFileSync(this.publicKeyPath, publicKey);
      fs.writeFileSync(this.privateKeyPath, privateKey);

      // Set restrictive permissions
      fs.chmodSync(this.privateKeyPath, 0o600);
      fs.chmodSync(this.publicKeyPath, 0o644);

      console.log('\n✅ Key pair generated successfully');
      console.log(`   Public key: ${this.publicKeyPath}`);
      console.log(`   Private key: ${this.privateKeyPath}`);
      console.log('\n⚠️  IMPORTANT: Keep the private key secure and never commit it to version control!\n');

      return { publicKey, privateKey };

    } catch (error) {
      console.error('\n❌ Key generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Sign integrity manifest
   */
  signManifest(manifest) {
    if (!fs.existsSync(this.privateKeyPath)) {
      console.log('\n⚠️  No signing key found');
      console.log('   Generate keys with: npm run integrity:generate-keys');
      return manifest;
    }

    try {
      const privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');
      const manifestString = JSON.stringify(manifest, null, 2);

      const sign = crypto.createSign('SHA-256');
      sign.update(manifestString);
      sign.end();

      const signature = sign.sign({
        key: privateKey,
        passphrase: this.passphrase
      }, 'base64');

      const signedManifest = {
        ...manifest,
        signature: {
          algorithm: 'RSA-4096',
          hash: 'SHA-256',
          value: signature,
          signedAt: new Date().toISOString(),
          signedBy: this.getSignerIdentity()
        }
      };

      console.log('\n✅ Manifest signed successfully');
      return signedManifest;

    } catch (error) {
      console.error('\n❌ Signing failed:', error.message);
      return manifest;
    }
  }

  /**
   * Verify signed manifest
   */
  verifyManifest(signedManifest) {
    if (!signedManifest.signature) {
      console.log('\n⚠️  Manifest is not signed');
      return { valid: false, reason: 'No signature' };
    }

    if (!fs.existsSync(this.publicKeyPath)) {
      console.log('\n⚠️  No public key found for verification');
      return { valid: false, reason: 'No public key' };
    }

    try {
      const publicKey = fs.readFileSync(this.publicKeyPath, 'utf8');

      // Remove signature for verification
      const manifest = { ...signedManifest };
      delete manifest.signature;

      const manifestString = JSON.stringify(manifest, null, 2);

      const verify = crypto.createVerify('SHA-256');
      verify.update(manifestString);
      verify.end();

      const isValid = verify.verify(
        publicKey,
        signedManifest.signature.value,
        'base64'
      );

      if (isValid) {
        console.log('\n✅ Signature verified');
        console.log(`   Signed by: ${signedManifest.signature.signedBy}`);
        console.log(`   Signed at: ${signedManifest.signature.signedAt}`);
      } else {
        console.log('\n❌ Signature verification failed');
        console.log('   Manifest may have been tampered with!');
      }

      return {
        valid: isValid,
        signedBy: signedManifest.signature.signedBy,
        signedAt: signedManifest.signature.signedAt
      };

    } catch (error) {
      console.error('\n❌ Verification failed:', error.message);
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Get signer identity
   */
  getSignerIdentity() {
    try {
      const { execSync } = require('child_process');
      const email = execSync('git config user.email', { encoding: 'utf8' }).trim();
      return email || 'unknown@developer';
    } catch (error) {
      return 'unknown@developer';
    }
  }

  /**
   * Check if keys exist
   */
  keysExist() {
    return fs.existsSync(this.privateKeyPath) && fs.existsSync(this.publicKeyPath);
  }

  /**
   * Get key info
   */
  getKeyInfo() {
    if (!this.keysExist()) {
      return null;
    }

    try {
      const publicKey = fs.readFileSync(this.publicKeyPath, 'utf8');
      const privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');

      // Parse key info
      const publicKeyMatch = publicKey.match(/Public-Key: \((\d+) bit\)/);
      const keySize = publicKeyMatch ? publicKeyMatch[1] : 'unknown';

      return {
        keySize,
        algorithm: 'RSA',
        publicKeyPath: this.publicKeyPath,
        privateKeyPath: this.privateKeyPath,
        hasPassphrase: !!this.passphrase
      };
    } catch (error) {
      console.error('Failed to get key info:', error.message);
      return null;
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const manager = new SignatureManager();

  switch (command) {
    case 'generate':
      manager.generateKeyPair()
        .then(() => process.exit(0))
        .catch(error => {
          console.error('\n❌ Key generation failed:', error.message);
          process.exit(1);
        });
      break;

    case 'verify':
      if (!args[1]) {
        console.log('\n❌ Please provide manifest file to verify\n');
        process.exit(1);
      }

      try {
        const manifestPath = args[1];
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const result = manager.verifyManifest(manifest);
        process.exit(result.valid ? 0 : 1);
      } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
        process.exit(1);
      }
      break;

    case 'info':
      if (manager.keysExist()) {
        const info = manager.getKeyInfo();
        console.log('\n🔑 Key Information\n');
        console.log(`Algorithm: ${info.algorithm}`);
        console.log(`Key Size: ${info.keySize} bits`);
        console.log(`Public Key: ${info.publicKeyPath}`);
        console.log(`Private Key: ${info.privateKeyPath}`);
        console.log(`Passphrase: ${info.hasPassphrase ? 'Yes ✅' : 'No ⚠️'}`);
        console.log('');
      } else {
        console.log('\n⚠️  No signing keys found\n');
        console.log('Generate keys with: npm run integrity:generate-keys\n');
      }
      break;

    default:
      console.log('\n🔑 Signature Manager - V5.4\n');
      console.log('Usage:');
      console.log('  node SignatureManager.js generate                 # Generate key pair');
      console.log('  node SignatureManager.js verify <manifest>        # Verify signature');
      console.log('  node SignatureManager.js info                     # Show key info\n');
      console.log('Examples:');
      console.log('  node SignatureManager.js generate');
      console.log('  node SignatureManager.js verify .integrity.json');
      console.log('  node SignatureManager.js info\n');
      process.exit(1);
  }
}

module.exports = SignatureManager;
