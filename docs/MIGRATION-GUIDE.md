# 🔄 Universal Deploy Bundle - Migration Guide

**Guide for upgrading from any version to V5.6.0**

---

## 📋 Overview

This guide helps you migrate from any previous version of Universal Deploy Bundle to V5.6.0, ensuring a smooth transition with zero downtime.

---

## 🎯 Migration Paths

### From V5.2 → V5.6 (Recommended)

**Steps:**

1. **Update package.json**
```bash
npm install universal-deploy-bundle@5.6.0
```

2. **Generate integrity manifest**
```bash
npm run integrity:generate
git add .integrity.json
git commit -m "feat: add V5.3 cryptographic integrity"
```

3. **Update pre-commit hooks**
```bash
# Hooks are automatically updated with V5.6.0
# Verify they're active:
cat .git/hooks/pre-commit
```

4. **Verify setup**
```bash
npm run integrity:verify
npm run integrity:report
```

5. **Test deployment**
```bash
# Test in staging first
npm run deploy:staging

# If successful, deploy to production
npm run deploy:production
```

**Breaking Changes:** None - 100% backward compatible

---

### From V5.3 → V5.6

**You already have:** Cryptographic integrity

**Add:**
```bash
# 1. Update to V5.6
npm install universal-deploy-bundle@5.6.0

# 2. Add distributed state (optional)
npm install etcd3
npm run distributed:init

# 3. Add service mesh verification (optional)
npm run smi:verify

# 4. Add air-gap support (optional)
npm run airgap:create
```

**Breaking Changes:** None

---

### From V5.4 → V5.6

**You already have:** Integrity + Distributed state

**Add:**
```bash
# 1. Update to V5.6
npm install universal-deploy-bundle@5.6.0

# 2. Add service mesh verification
npm run smi:verify

# 3. Add air-gap support
npm run airgap:create
```

**Breaking Changes:** None

---

### From V5.5 → V5.6

**You already have:** Integrity + Distributed + Service mesh

**Add:**
```bash
# 1. Update to V5.6
npm install universal-deploy-bundle@5.6.0

# 2. Add air-gap support
npm run airgap:create

# 3. Create offline bundle
npm run airgap:verify deployment-bundle-v5.6.tar.gz
```

**Breaking Changes:** None

---

## 📦 Version-Specific Migration Guides

### V5.3.0 Migration Guide

**What's New:**
- Cryptographic integrity verification
- SHA-256/SHA-512 hashing
- Corruption detection
- Pre-commit verification gates
- CNI compliance checking

**Migration Steps:**

1. **Install V5.3.0**
```bash
npm install universal-deploy-bundle@5.3.0
```

2. **Generate First Manifest**
```bash
npm run integrity:generate
```

3. **Review Manifest**
```bash
cat .integrity.json
```

4. **Commit to Git**
```bash
git add .integrity.json
git commit -m "feat: add V5.3 cryptographic integrity"
```

5. **Test Pre-commit Hook**
```bash
# Modify a file
echo "test" >> test.txt

# Try to commit
git add test.txt
git commit -m "test"
# Hook should verify integrity automatically
```

6. **Verify Deployment**
```bash
npm run deploy:gate
npm run deploy:full
```

**Troubleshooting:**

If verification fails:
```bash
# Check what changed
npm run integrity:report

# View corruption details
cat .integrity/handoff.json

# Restore if needed
git checkout HEAD -- <corrupted-file>
```

---

### V5.4.0 Migration Guide

**What's New:**
- Distributed state management (etcd)
- Leader election
- Digital signatures
- Distributed locks

**Migration Steps:**

1. **Install V5.4.0**
```bash
npm install universal-deploy-bundle@5.4.0
```

2. **Install etcd3 (Optional)**
```bash
# For distributed features
npm install etcd3

# Or use etcd directly
brew install etcd  # macOS
apt-get install etcd  # Linux
```

3. **Start etcd (if using distributed features)**
```bash
etcd

# Or in background
etcd --listen-client-urls http://localhost:2379 &
```

4. **Initialize Distributed State**
```bash
npm run distributed:init
```

5. **Elect Leader (Optional, Enterprise)**
```bash
npm run distributed:elect
```

6. **Generate Signing Keys (Optional)**
```bash
npm run integrity:generate-keys
```

7. **Test Distributed Deployment**
```bash
npm run deploy:v5.4
```

**Distributed Setup (Enterprise):**

```bash
# 1. Setup etcd cluster (3 nodes for production)
etcd --name infra1 \
  --listen-client-urls http://192.168.1.10:2379 \
  --advertise-client-urls http://192.168.1.10:2379 \
  --listen-peer-urls http://192.168.1.10:2380 \
  --initial-advertise-peer-urls http://192.168.1.10:2380 \
  --initial-cluster infra1=http://192.168.1.10:2380,infra2=http://192.168.1.11:2380,infra3=http://192.168.1.12:2380 \
  --initial-cluster-token etcd-cluster-1 \
  --initial-cluster-state new

# 2. Set environment variable
export ETCD_ENDPOINTS="192.168.1.10:2379,192.168.1.11:2379,192.168.1.12:2379"

# 3. Deploy with coordination
npm run distributed:elect
npm run deploy:v5.4
```

---

### V5.5.0 Migration Guide

**What's New:**
- Service Mesh Interface (SMI) compliance
- Traffic split verification
- mTLS configuration checks
- Circuit breaker verification

**Migration Steps:**

1. **Install V5.5.0**
```bash
npm install universal-deploy-bundle@5.5.0
```

2. **Configure Service Mesh (if using)**

**For Istio:**
```bash
# Install Istio
curl -L https://istio.io/downloadIstio | sh -

# Install with default profile
istioctl install --set profile=demo -y

# Enable automatic injection
kubectl label namespace default istio-injection=enabled
```

**For Linkerd:**
```bash
# Install Linkerd
curl -sL https://run.linkerd.io/install | sh

# Install
linkerd install | kubectl apply -f -

# Check
linkerd check
```

3. **Create Service Mesh Resources**

**Traffic Split:**
```yaml
# k8s/traffic-split.yaml
apiVersion: split.smi-spec.io/v1alpha1
kind: TrafficSplit
metadata:
  name: app-split
spec:
  service: app
  backends:
  - service: app-v1
    weight: 90
  - service: app-v2
    weight: 10
```

4. **Verify SMI Compliance**
```bash
npm run smi:verify
```

5. **Deploy with Service Mesh Verification**
```bash
npm run deploy:v5.3
npm run smi:verify
```

---

### V5.6.0 Migration Guide

**What's New:**
- Air-gap deployment support
- Offline bundle creation
- Immutable deployments
- Enhanced rollback

**Migration Steps:**

1. **Install V5.6.0**
```bash
npm install universal-deploy-bundle@5.6.0
```

2. **Create Air-Gap Bundle**
```bash
npm run airgap:create
```

3. **Verify Bundle**
```bash
npm run airgap:verify deployment-bundle-v5.6.tar.gz
```

4. **Test Offline Deployment**
```bash
# On offline server
npm run airgap:deploy deployment-bundle-v5.6.tar.gz /opt/app
```

5. **Deploy with Full V5.6 Features**
```bash
npm run deploy:v5.6
```

---

## 🔄 Rollback Guide

If you need to rollback from V5.6 to a previous version:

### Rollback to V5.5

```bash
# 1. Install V5.5
npm install universal-deploy-bundle@5.5.0

# 2. Remove air-gap features (optional)
# airgap bundles are backward compatible

# 3. Deploy with V5.5 features
npm run deploy:v5.3 && npm run smi:verify
```

### Rollback to V5.4

```bash
npm install universal-deploy-bundle@5.4.0
npm run deploy:v5.4
```

### Rollback to V5.3

```bash
npm install universal-deploy-bundle@5.3.0
npm run deploy:v5.3
```

### Rollback to V5.2

```bash
npm install universal-deploy-bundle@5.2.0
npm run deploy:full
```

**Note:** All integrity manifests are backward compatible!

---

## ✅ Verification Checklist

After migration, verify:

- [ ] Package version updated
- [ ] Integrity manifest generated
- [ ] Pre-commit hooks working
- [ ] Integrity verification passes
- [ ] Deployment test successful (staging)
- [ ] All features working as expected

---

## 🆘 Common Migration Issues

### Issue 1: Integrity Manifest Mismatch

**Problem:** Verification fails after upgrade

**Solution:**
```bash
# Regenerate manifest
npm run integrity:generate --force

# Verify
npm run integrity:verify
```

### Issue 2: etcd Connection Failed

**Problem:** Distributed features not working

**Solution:**
```bash
# Check etcd is running
etcdctl endpoint health

# Or run in local mode (no etcd required)
npm run deploy:v5.3  # Local mode
```

### Issue 3: Service Mesh Not Detected

**Problem:** SMI verification fails

**Solution:**
```bash
# Check service mesh installation
kubectl get pods -n istio-system

# Or run in simulation mode
npm run smi:verify  # Works without mesh
```

### Issue 4: Bundle Too Large

**Problem:** Air-gap bundle exceeds size limits

**Solution:**
```bash
# Exclude unnecessary files
# Edit IntegrityManifest.js default ignore patterns

# Clean history first
npm run integrity:clean 5

# Recreate bundle
npm run airgap:create
```

---

## 📞 Support

**Migration Issues:**
- GitHub Issues: https://github.com/chibuenyim/universal-deploy-bundle/issues
- Email: admin@agentic-toolkit.com (Enterprise)
- Documentation: See all .md files in project root

---

## ✅ Summary

**Migration to V5.6.0 is:**

- ✅ **Simple** - One command to install
- ✅ **Safe** - 100% backward compatible
- ✅ **Gradual** - Adopt features at your own pace
- ✅ **Verified** - Comprehensive verification checks

**The Universal Deployer controls deployment gates. No code passes without complete verification.**

---

*Made with ❤️ for smooth, safe migrations*
