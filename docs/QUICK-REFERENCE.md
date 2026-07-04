# ⚡ Quick Reference Guide
## Universal Deploy Bundle Development

**Version:** 1.0
**Purpose:** Quick reference for common development tasks

---

## 🚀 Quick Start

```bash
# Setup
git clone https://github.com/chibuenyim/universal-deploy-bundle.git
cd universal-deploy-bundle
npm install

# Development
git checkout -b feature/v5.3-<name>
# ... make changes ...
npm run test
npm run commit

# V5.3 Features
npm run integrity:generate   # Generate manifest
npm run integrity:verify    # Verify integrity
```

---

## 📋 V5.3-V5.6 Feature Overview

| Version | Feature | Command | Status |
|---------|---------|---------|--------|
| **V5.3** | Cryptographic Integrity | `npm run integrity:verify` | 🔨 In Development |
| **V5.4** | Distributed State | `npm run distributed:init` | 📋 Planned |
| **V5.5** | Service Mesh | `npm run mesh:verify` | 📋 Planned |
| **V5.6** | Air-Gap Support | `npm run airgap:create` | 📋 Planned |

---

## 🔧 Common Commands

### Development

```bash
npm run test                 # Run all tests
npm run lint                 # Lint code
npm run format              # Format code
npm run commit              # Commit with hooks
npm run integrity:generate  # Generate integrity manifest
npm run integrity:verify   # Verify integrity
```

### Deployment

```bash
npm run deploy              # Standard deployment
npm run deploy:full         # Full verification deployment
npm run deploy:staging      # Deploy to staging
npm run deploy:production   # Deploy to production
```

### Verification

```bash
npm run verify-all          # All verification layers
npm run verify-all:full     # Complete verification
npm run verify-runtime      # Runtime verification only
npm run security            # Security scan
```

---

## 📁 Project Structure

```
universal-deploy-bundle/
├── core/
│   ├── integrity/          # V5.3: Cryptographic integrity
│   ├── distributed/        # V5.4: Distributed state management
│   ├── servicemesh/       # V5.5: Service mesh integration
│   └── airgap/            # V5.6: Air-gap support
├── scripts/               # CLI tools
├── hooks/                # Git hooks
├── tests/                # Test suites
└── docs/                # Documentation
```

---

## 🎯 V5.3 Implementation Checklist

### Cryptographic Integrity System

**Phase 1: Core Components**
- [ ] `HashGenerator.js` - SHA-256/512 hashing
- [ ] `IntegrityManifest.js` - Manifest management
- [ ] `CorruptionDetector.js` - Corruption detection
- [ ] `CryptographicIntegrityManager.js` - Main orchestrator

**Phase 2: CLI Tools**
- [ ] `integrity-generate.js` - Generate manifest
- [ ] `integrity-verify.js` - Verify integrity
- [ ] `integrity-report.js` - Generate report

**Phase 3: Integration**
- [ ] Update `hooks/pre-commit`
- [ ] Update `deployment-verifier.js`
- [ ] Update CI/CD templates

**Phase 4: Testing**
- [ ] Unit tests (90%+ coverage)
- [ ] Integration tests
- [ ] Performance tests
- [ ] E2E tests

**Phase 5: Documentation**
- [ ] User guide
- [ ] API reference
- [ ] Migration guide
- [ ] Update README

---

## 🧪 Testing Commands

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance

# Coverage report
npm run test:coverage

# All tests
npm run test:all
```

---

## 📝 Commit Convention

```bash
# Format
<type>(<scope>): <subject>

# Types
feat:     New feature
fix:      Bug fix
docs:     Documentation
test:     Tests
chore:    Maintenance
perf:     Performance
sec:      Security

# Examples
feat(v5.3): add SHA-256 hash generator
fix(integrity): resolve manifest verification bug
docs(v5.3): update API reference
test(integrity): add corruption detection tests
```

---

## 🔐 Security Checklist

Before committing code:

- [ ] No hardcoded credentials
- [ ] No secrets in code
- [ ] No API keys exposed
- [ ] Proper error handling
- [ ] Input validation
- [ ] Output encoding
- [ ] Cryptographic operations correct
- [ ] Dependencies audited

---

## 🐛 Debugging

### Enable Verbose Mode

```bash
# Integrity verification
npm run integrity:verify -- --verbose

# Deployment
npm run deploy:full -- --verbose

# Verification
npm run verify-all -- --verbose
```

### Check Logs

```bash
# Deployment logs
cat .deployment-state-v5.2.json

# Integrity logs
cat .integrity.json

# Verification logs
cat verification-results.json
```

### Common Issues

**Issue: Integrity verification fails**
```bash
# Check what changed
npm run integrity:report

# Regenerate manifest if changes are legitimate
npm run integrity:generate -- --force

# If corruption detected, review corrupted files
git diff <corrupted-file>
```

**Issue: etcd connection fails (V5.4)**
```bash
# Check etcd is running
etcdctl endpoint health

# Check connection
etcdctl member list

# Restart etcd
brew services restart etcd
```

---

## 📊 Performance Targets

### V5.3 Integrity System

| Project Size | Files | Generation | Verification |
|--------------|-------|------------|--------------|
| Small | < 100 | < 2s | < 1s |
| Medium | 100-1000 | < 10s | < 5s |
| Large | 1000-10000 | < 60s | < 30s |

### V5.4 Distributed State

| Operation | Target |
|-----------|--------|
| State save | < 100ms |
| State load | < 100ms |
| Leader election | < 5s |
| Lock acquisition | < 1s |

---

## 🚨 Emergency Procedures

### Deployment Blocked by Integrity Check

```bash
# 1. Check verification report
npm run integrity:report

# 2. Identify corrupted files
# Review report output

# 3. Options:
#    A) Restore from last good state
git checkout HEAD -- <corrupted-file>

#    B) Fix file manually (if changes are intentional)
#    Edit file and regenerate manifest
npm run integrity:generate -- --force

# 4. Re-verify
npm run integrity:verify

# 5. Proceed with deployment only when verified
npm run deploy:full
```

### Rollback to Last Good State

```bash
# 1. Find last good deployment
cat .integrity/last-good.json

# 2. Checkout last good commit
git checkout <commit-hash>

# 3. Verify integrity
npm run integrity:verify

# 4. Re-deploy
npm run deploy:full
```

---

## 📚 Documentation Links

| Document | Path | Purpose |
|----------|------|---------|
| Advanced Roadmap | `ADVANCED-ROADMAP.md` | Strategic plan V5.3-V5.6 |
| Technical Spec V5.3 | `TECHNICAL-SPEC-V5.3.md` | Implementation details |
| Implementation Guide | `DEVELOPER-IMPLEMENTATION-GUIDE.md` | Step-by-step guide |
| Quick Reference | `QUICK-REFERENCE.md` | This file |
| README | `README.md` | Main documentation |
| V5.2 Release Notes | `V5.2.0-RELEASE-NOTES.md` | Current release |

---

## 🎯 Success Metrics

### V5.3 Success Criteria

- ✅ SHA-256 hashing accurate and fast
- ✅ Manifest generation < 5 seconds (1000 files)
- ✅ Verification < 5 seconds
- ✅ Zero false negatives
- ✅ Pre-commit blocking effective
- ✅ 90%+ test coverage
- ✅ Documentation complete

### V5.4 Success Criteria

- ✅ etcd integration working
- ✅ Leader election successful
- ✅ State consistency maintained
- ✅ Multi-instance coordination
- ✅ Digital signatures working
- ✅ Graceful failover

### V5.5 Success Criteria

- ✅ SMI compliance verified
- ✅ Service mesh integration working
- ✅ mTLS verification functional
- ✅ Traffic split verification
- ✅ Circuit breaker checks

### V5.6 Success Criteria

- ✅ Immutable deployments working
- ✅ Air-gap bundles created
- ✅ Offline deployment verified
- ✅ Rollback < 30 seconds

---

## 💡 Tips

### Development

```bash
# Use git hooks for quality
npm run hooks:install

# Auto-fix linting issues
npm run lint -- --fix

# Format code
npm run format

# Watch tests during development
npm run test:watch
```

### Testing

```bash
# Run specific test file
npm test -- path/to/test.test.js

# Run tests matching pattern
npm test -- --grep "integrity"

# Debug tests
npm test -- --debug
```

### Performance

```bash
# Profile verification time
time npm run integrity:verify

# Check memory usage
node --prof scripts/integrity-verify.js

# Analyze bundle size
npm run analyze
```

---

## 🔗 Useful Resources

### Internal

- GitHub: https://github.com/chibuenyim/universal-deploy-bundle
- Issues: https://github.com/chibuenyim/universal-deploy-bundle/issues
- Discussions: https://github.com/chibuenyim/universal-deploy-bundle/discussions

### External Standards

- CNI: https://github.com/containernetworking/cni
- etcd: https://etcd.io/
- SMI: https://smi-spec.io/
- SHA-256: https://csrc.nist.gov/projects/hash-functions

### Tools

- Node.js: https://nodejs.org/
- npm: https://www.npmjs.com/
- Git: https://git-scm.com/
- etcd: https://etcd.io/

---

## 📞 Support

### Community Support

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Questions and ideas
- Documentation: All docs in `/docs`

### Enterprise Support

- Email: admin@agentic-toolkit.com
- Priority support for Enterprise customers
- Custom integration assistance

---

## 🎓 Learning Resources

### Recommended Reading

1. **Cryptographic Hashing**
   - SHA-256 specification
   - Hash function best practices
   - Integrity verification patterns

2. **Distributed Systems**
   - Raft consensus algorithm
   - Leader election patterns
   - Distributed state management

3. **Container Security**
   - CNI standards
   - Container networking
   - Service mesh patterns

4. **Code Integrity**
   - Tamper detection
   - Digital signatures
   - Immutable deployments

---

## ✅ Pre-Commit Checklist

Before pushing code:

- [ ] Tests passing locally
- [ ] Linting complete
- [ ] Code reviewed (self or peer)
- [ ] Documentation updated
- [ ] Comments added for complex code
- [ ] No console.log statements
- [ ] No TODO comments (or filed as issues)
- [ ] Security review complete
- [ ] Performance impact considered
- [ ] Backward compatibility checked

---

## 🚀 Deploy Command Flow

```
npm run deploy:full
    ↓
1. Security Scan (npm audit)
    ↓
2. Integrity Verification (V5.3)
    ↓
3. Zero-Error Verification
    ↓
4. Build
    ↓
5. Runtime Verification
    ↓
6. HTTP Endpoint Verification
    ↓
7. E2E Tests
    ↓
8. Deployment
    ↓
9. Post-Deployment Verification
    ↓
10. Success ✅

If any step fails → Deployment blocked
```

---

## 🔑 Key Principles

1. **Cryptographic Guarantees** - SHA-256 provides mathematical certainty
2. **Gate-Based Verification** - Multiple checkpoints throughout pipeline
3. **Automatic Blocking** - System blocks on failures
4. **Developer Handoff** - Rich context when issues detected
5. **Zero Tolerance** - No corruption allowed through gates

**The Universal Deployer controls deployment gates.**

---

**Last Updated:** July 4, 2026
**Next Review:** Start of V5.3 development
