# 📚 Universal Deploy Bundle - Usage Examples & Templates

**Real-world examples and templates for V5.3-V5.6 features**

---

## 🎯 Table of Contents

1. [Cryptographic Integrity Examples](#cryptographic-integrity-examples)
2. [Distributed Deployment Examples](#distributed-deployment-examples)
3. [Service Mesh Examples](#service-mesh-examples)
4. [Air-Gap Deployment Examples](#air-gap-deployment-examples)
5. [CI/CD Templates](#cicd-templates)
6. [Configuration Templates](#configuration-templates)

---

## 🔒 Cryptographic Integrity Examples

### Example 1: Initial Project Setup

```bash
# 1. Install V5.6.0
npm install universal-deploy-bundle@5.6.0

# 2. Generate baseline integrity
npm run integrity:generate

# Output:
# 🔒 Generating cryptographic integrity manifest...
# ✅ Manifest created: 156 files
# ✅ Manifest saved: .integrity.json

# 3. Review manifest
cat .integrity.json

# 4. Commit to version control
git add .integrity.json
git commit -m "feat: add V5.6 cryptographic integrity baseline"
```

### Example 2: Detecting Code Corruption

```bash
# Scenario: A file gets corrupted during transfer

# 1. Verify integrity
npm run integrity:verify

# Output:
# 🔍 Verifying cryptographic integrity...
#    Checking 156 files...
#    ❌ Corrupted: src/components/Auth.tsx
#    ❌ Corrupted: src/utils/api.ts
#
# 📊 Verification Summary:
#    Total: 156
#    Verified: 154
#    Corrupted: 2
#    Missing: 0
#
# ❌ INTEGRITY VIOLATION DETECTED

# 2. Check handoff
cat .integrity/handoff.json

# 3. Restore corrupted files
git checkout HEAD -- src/components/Auth.tsx

# 4. Re-verify
npm run integrity:verify

# ✅ INTEGRITY VERIFIED: All files match
```

### Example 3: Using SHA-512 for High Security

```bash
# Generate SHA-512 manifest
npm run integrity:generate --sha-512

# Verify with SHA-512
npm run integrity:verify --sha-512

# Use in package.json
"scripts": {
  "integrity:generate": "node scripts/integrity/integrity-generate.js --sha-512",
  "integrity:verify": "node scripts/integrity/integrity-verify.js --sha-512"
}
```

---

## 🔄 Distributed Deployment Examples

### Example 4: Setting Up etcd Cluster

```yaml
# docker-compose.yml for etcd cluster
version: '3.8'
services:
  etcd1:
    image: quay.io/coreos/etcd:latest
    command:
      - /usr/local/bin/etcd
      - --name infra1
      - --data-dir /etcd-data
      - --listen-client-urls http://0.0.0.0:2379
      - --advertise-client-urls http://etcd1:2379
      - --listen-peer-urls http://0.0.0.0:2380
      - --initial-advertise-peer-urls http://etcd1:2380
      - --initial-cluster infra1=http://etcd1:2380,infra2=http://etcd2:2380,infra3=http://etcd3:2380
      - --initial-cluster-token etcd-cluster-1
    ports:
      - "2379:2379"
      - "2380:2380"
    volumes:
      - etcd1-data:/etcd-data

  etcd2:
    image: quay.io/coreos/etcd:latest
    command:
      - /usr/local/bin/etcd
      - --name infra2
      - --data-dir /etcd-data
      - --listen-client-urls http://0.0.0.0:2379
      - --advertise-client-urls http://etcd2:2379
      - --listen-peer-urls http://0.0.0.0:2380
      - --initial-advertise-peer-urls http://etcd2:2380
      - --initial-cluster infra1=http://etcd1:2380,infra2=http://etcd2:2380,infra3=http://etcd3:2380
      - --initial-cluster-token etcd-cluster-1
    ports:
      - "2379:2379"
      - "2380:2380"
    volumes:
      - etcd2-data:/etcd-data

  etcd3:
    image: quay.io/coreos/etcd:latest
    command:
      - /usr/local/bin/etcd
      - --name infra3
      - --data-dir /etcd-data
      - --listen-client-urls http://0.0.0.0:2379
      - --advertise-client-urls http://etcd3:2379
      - --listen-peer-urls http://0.0.0.0:2380
      - --initial-advertise-peer-urls http://etcd3:2380
      - --initial-cluster infra1=http://etcd1:2380,infra2=http://etcd2:2380,infra3=http://etcd3:2380
      - --initial-cluster-token etcd-cluster-1
    ports:
      - "2379:2379"
      - "2380:2380"
    volumes:
      - etcd3-data:/etcd-data

volumes:
  etcd1-data:
  etcd2-data:
  etcd3-data:
```

```bash
# Start cluster
docker-compose up -d

# Verify cluster
etcdctl member list
etcdctl endpoint health --cluster

# Set environment
export ETCD_ENDPOINTS="localhost:2379"

# Deploy with coordination
npm run distributed:init
npm run distributed:elect
npm run deploy:v5.4
```

### Example 5: Multi-Instance Deployment

```bash
# Instance 1 (Leader)
ssh server1
cd /app
export ETCD_ENDPOINTS="etcd1:2379,etcd2:2379,etcd3:2379"
npm run distributed:elect
# ✅ This instance is now the leader

# Instance 2 (Follower)
ssh server2
cd /app
export ETCD_ENDPOINTS="etcd1:2379,etcd2:2379,etcd3:2379"
npm run distributed:elect
# ℹ️  Current leader: server1-instance

# Instance 3 (Follower)
ssh server3
cd /app
export ETCD_ENDPOINTS="etcd1:2379,etcd2:2379,etcd3:2379"
npm run distributed:elect
# ℹ️  Current leader: server1-instance

# Any instance can now deploy with coordination
npm run deploy:v5.4
```

---

## 🔗 Service Mesh Examples

### Example 6: Istio Integration

```yaml
# k8s/istio-gateway.yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: app-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
    hosts:
    - "*"
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: app-vs
spec:
  hosts:
  - "*"
  gateways:
  - app-gateway
  http:
  - match:
    - uri:
        prefix: /
    route:
    - destination:
        host: app
        subset: v1
      weight: 90
    - destination:
        host: app
        subset: v2
      weight: 10
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: app-dr
spec:
  host: app
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

```bash
# Verify SMI compliance
npm run smi:verify

# Deploy
kubectl apply -f k8s/istio-gateway.yaml
npm run deploy:v5.3
npm run smi:verify
```

---

## 📦 Air-Gap Deployment Examples

### Example 7: Creating Complete Offline Bundle

```bash
# 1. Prepare project
npm run integrity:generate

# 2. Build application
npm run build

# 3. Create air-gap bundle
npm run airgap:create

# Output:
# 📦 Creating Air-Gap Deployment Bundle - V5.6
# 1️⃣ Collecting deployment files...
#    Collected 156 files
# 2️⃣ Collecting dependencies...
#    Collected 42 dependencies
# 3️⃣ Creating integrity data...
#    ✓ Integrity data created
# 4️⃣ Creating verification data...
#    ✓ Verification data created
# 5️⃣ Creating bundle archive...
#    ✓ Bundle compressed
# ✅ Air-gap bundle created successfully
#    Bundle: deployment-bundle-v5.6.tar.gz
#    Size: 234.5 MB
#    Files: 156
#    Dependencies: 42

# 4. Verify bundle
npm run airgap:verify deployment-bundle-v5.6.tar.gz

# 5. Transfer to offline environment
scp deployment-bundle-v5.6.tar.gz user@offline-server:/opt/

# 6. Deploy offline
ssh offline-server
cd /opt
npm run airgap:deploy deployment-bundle-v5.6.tar.gz /opt/app
```

### Example 8: Air-Gap Deployment Script

```bash
#!/bin/bash
# deploy-offline.sh

BUNDLE="$1"
TARGET_DIR="$2"

echo "🚀 Offline Deployment"
echo "Bundle: $BUNDLE"
echo "Target: $TARGET_DIR"

# 1. Verify bundle
echo "🔍 Verifying bundle..."
npm run airgap:verify "$BUNDLE"

if [ $? -ne 0 ]; then
  echo "❌ Bundle verification failed"
  exit 1
fi

# 2. Extract bundle
echo "📦 Extracting files..."
mkdir -p "$TARGET_DIR"
tar -xzf "$BUNDLE" -C "$TARGET_DIR"

# 3. Verify extracted files
echo "🔍 Verifying extracted files..."
cd "$TARGET_DIR"
node ../core/integrity/CryptographicIntegrityManager.js verify

# 4. Install dependencies
echo "📦 Installing dependencies..."
npm ci --offline

# 5. Build
echo "🔨 Building..."
npm run build

# 6. Start application
echo "🚀 Starting application..."
pm2 restart app || pm2 start npm --name "app" -- start

echo "✅ Deployment complete"
```

---

## 🔄 CI/CD Templates

### Example 9: GitHub Actions (V5.6)

```yaml
# .github/workflows/deploy-v5.6.yml
name: Deploy V5.6

on:
  push:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Security Scan
        run: |
          npm install
          npm run security

  integrity-check:
    runs-on: ubuntu-latest
    needs: security-scan
    steps:
      - uses: actions/checkout@v3

      - name: Generate Integrity
        run: |
          npm install
          npm run integrity:generate

      - name: Verify Integrity
        run: npm run integrity:verify

  build:
    runs-on: ubuntu-latest
    needs: integrity-check
    steps:
      - uses: actions/checkout@v3

      - name: Build
        run: |
          npm install
          npm run build

  create-airgap-bundle:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v3

      - name: Create Bundle
        run: |
          npm run airgap:create

      - name: Upload Bundle
        uses: actions/upload-artifact@v3
        with:
          name: deployment-bundle
          path: deployment-bundle-v5.6.tar.gz

  deploy-staging:
    runs-on: ubuntu-latest
    needs: create-airgap-bundle
    environment: staging
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Staging
        run: |
          npm run deploy:staging

  verify-staging:
    runs-on: ubuntu-latest
    needs: deploy-staging
    steps:
      - uses: actions/checkout@v3

      - name: Verify Deployment
        run: |
          npm run cni:verify
          npm run smi:verify

  deploy-production:
    runs-on: ubuntu-latest
    needs: verify-staging
    environment: production
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Production
        run: |
          npm run deploy:production

  post-deploy-verify:
    runs-on: ubuntu-latest
    needs: deploy-production
    steps:
      - name: Post-Deployment Verification
        run: |
          curl -f ${{ secrets.PRODUCTION_URL }}/api/health || exit 1
          echo "✅ Production deployment verified"
```

---

## 🔧 Configuration Templates

### Example 10: .integrity.json Template

```json
{
  "version": "1.0",
  "algorithm": "sha-256",
  "generatedAt": "2026-07-04T10:00:00Z",
  "generatedBy": "developer@company.com",
  "deploymentId": "deploy-abc123",
  "files": {
    "src/app.tsx": {
      "hash": "a1b2c3d4e5f6...",
      "size": 2048,
      "modified": "2026-07-04T09:55:00Z",
      "permissions": "rw-r--r--"
    },
    "package.json": {
      "hash": "f6e5d4c3b2a1...",
      "size": 1024,
      "modified": "2026-07-04T09:50:00Z",
      "permissions": "rw-r--r--"
    }
  },
  "metadata": {
    "totalFiles": 156,
    "totalSize": 5242880,
    "excludedPatterns": [
      "**/node_modules/**",
      "**/.next/**"
    ]
  },
  "manifestHash": "full_manifest_hash",
  "signature": {
    "algorithm": "RSA-4096",
    "hash": "SHA-256",
    "value": "base64_signature...",
    "signedAt": "2026-07-04T10:00:05Z",
    "signedBy": "deployer@company.com"
  }
}
```

### Example 11: etcd Configuration Template

```yaml
# etcd.conf.yml

# Cluster configuration
name: 'default'
data-dir: /var/lib/etcd
snapshot-count: 10000

# Listening URLs
listen-peer-urls: http://0.0.0.0:2380
listen-client-urls: http://0.0.0.0:2379

# Advertise URLs
initial-advertise-peer-urls: http://localhost:2380
advertise-client-urls: http://localhost:2379

# Cluster configuration
initial-cluster: default=http://localhost:2380
initial-cluster-state: new
initial-cluster-token: 'etcd-cluster'

# Logging
logger: zap
log-outputs: [stderr]
log-level: info

# Security
client-cert-auth: true
trusted-ca-file: /etc/etcd/ca.crt
cert-file: /etc/etcd/server.crt
key-file: /etc/etcd/server.key

# Metrics
enable-metrics: true
listen-metrics-urls: http://0.0.0.0:23791
```

---

## 🎯 Common Workflows

### Workflow 1: Daily Development

```bash
# 1. Start work
git pull origin main

# 2. Create feature branch
git checkout -b feature/new-feature

# 3. Make changes
vim src/components/NewFeature.tsx

# 4. Commit (automatic verification)
git add .
git commit -m "feat: add new feature"
# ✅ Pre-commit verifies integrity automatically

# 5. Push
git push origin feature/new-feature

# 6. Create PR (GitHub checks run automatically)
# - Security scan
# - Integrity verification
# - Build
# - Tests
```

### Workflow 2: Emergency Recovery

```bash
# 1. Detect corruption
npm run integrity:verify
# ❌ Integrity verification failed

# 2. Check handoff
cat .integrity/handoff.json

# 3. Identify corruption
# "injection" pattern detected in src/app.tsx

# 4. Immediate action
git checkout HEAD -- src/app.tsx

# 5. Verify recovery
npm run integrity:verify
# ✅ INTEGRITY VERIFIED

# 6. Continue deployment
npm run deploy:full
```

### Workflow 3: Blue-Green Deployment

```bash
# 1. Generate integrity for current (blue)
npm run integrity:generate
npm run integrity:save-history blue-$(git rev-parse --short HEAD)

# 2. Deploy new version (green)
git checkout main
git pull

# 3. Generate integrity for green
npm run integrity:generate

# 4. Deploy green
npm run deploy:production

# 5. Verify deployment
npm run deploy:verify https://green.example.com

# 6. Switch traffic (manual or automated)
# Switch from blue to green

# 7. Verify production
npm run integrity:verify

# 8. Keep history
npm run integrity:clean 20
```

---

## 📞 Support

**Questions?**
- Documentation: See all .md files in project root
- Issues: https://github.com/chibuenyim/universal-deploy-bundle/issues
- Email: admin@agentic-toolkit.com (Enterprise)

---

**Made with ❤️ for production excellence**

*Universal Deploy Bundle V5.6.0*
