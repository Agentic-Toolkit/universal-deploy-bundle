# Contributing to Universal Deploy Bundle

Thank you for your interest in contributing to Universal Deploy Bundle! This document provides guidelines for contributing.

---

## 🎯 How to Contribute

### Reporting Bugs

1. Check existing [GitHub Issues](https://github.com/chibuenyim/universal-deploy-bundle/issues)
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details (OS, Node.js version, etc.)
   - Logs/error messages

### Suggesting Features

1. Check existing [GitHub Issues](https://github.com/chibuenyim/universal-deploy-bundle/issues) and [ROADMAP](docs/ADVANCED-ROADMAP.md)
2. Create a new issue with:
   - Clear feature description
   - Use cases and benefits
   - Proposed implementation approach
   - Potential impact on existing features

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass (`npm run test:all`)
6. Commit with clear messages
7. Push to your fork (`git push origin feature/my-feature`)
8. Open a Pull Request

---

## 📋 Development Guidelines

### Code Style

- Use JavaScript/Node.js best practices
- Follow existing code formatting
- Add JSDoc comments for new functions
- Use meaningful variable and function names

### Testing

- Write tests for all new features
- Maintain > 90% test pass rate
- Test both success and failure scenarios
- Use descriptive test names

### Documentation

- Update README.md for user-facing changes
- Add technical documentation in `docs/`
- Update CHANGELOG.md for version changes
- Include usage examples

### Commit Messages

Follow conventional commit format:
```
feat: add new integrity verification feature
fix: resolve corruption detection bug
docs: update migration guide
test: add tests for air-gap deployment
```

---

## 🔒 Security Policy

### Vulnerability Reporting

For security vulnerabilities, please email directly:
- **admin@agentic-toolkit.com**
- Do NOT open public issues
- Include details and reproduction steps
- We'll respond within 48 hours

### Security Guidelines

- Never commit credentials
- Use environment variables for secrets
- Validate all user inputs
- Follow OWASP guidelines
- Keep dependencies updated

---

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific suite
npm run test:integrity
npm run test:distributed
npm run test:servicemesh
npm run test:airgap
```

### Writing Tests

- Test files should be in `tests/` directory
- Name test files as `*.test.js` or `*.spec.js`
- Use class-based test structure
- Include setup and cleanup
- Test edge cases

---

## 📝 Development Workflow

1. **Setup:**
   ```bash
   git clone https://github.com/chibuenyim/universal-deploy-bundle.git
   cd universal-deploy-bundle
   npm install
   ```

2. **Create Branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

3. **Make Changes:**
   - Write code
   - Add tests
   - Update documentation

4. **Test:**
   ```bash
   npm run test:all
   npm run integrity:verify
   ```

5. **Commit:**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

6. **Push & PR:**
   ```bash
   git push origin feature/my-feature
   # Open PR on GitHub
   ```

---

## 🎨 Project Structure

```
universal-deploy-bundle/
├── core/                  # Core components
│   ├── integrity/        # V5.3 Cryptographic integrity
│   ├── distributed/      # V5.4 Distributed state
│   ├── servicemesh/      # V5.5 Service mesh
│   └── airgap/          # V5.6 Air-gap deployment
├── scripts/              # CLI scripts
│   └── integrity/        # Integrity CLI tools
├── tests/               # Test suites
│   ├── integrity/        # V5.3 tests
│   ├── distributed/      # V5.4 tests
│   ├── servicemesh/      # V5.5 tests
│   └── airgap/          # V5.6 tests
├── docs/                # Documentation
├── examples/            # Usage examples
├── hooks/               # Git hooks
└── templates/           # Template files
```

---

## ✅ Code Review Criteria

PRs are reviewed based on:
- ✅ Tests pass (all suites)
- ✅ Code follows style guidelines
- ✅ Documentation updated
- ✅ No breaking changes (or clearly documented)
- ✅ Performance impact assessed
- ✅ Security implications considered

---

## 🤝 Community Guidelines

### Be Respectful
- Be constructive in feedback
- Welcome new contributors
- Focus on what is best for the community
- Show empathy towards other community members

### Be Collaborative
- Work transparently
- Invite feedback and criticism
- Accept feedback gracefully
- Step down when you have fulfilled your role

### Be Professional
- Use inclusive language
- Focus on what is best for the community
- Respect differing opinions and viewpoints

---

## 📧 Getting Help

- **GitHub Issues:** https://github.com/chibuenyim/universal-deploy-bundle/issues
- **Email:** admin@agentic-toolkit.com
- **Documentation:** See [docs/](./docs/) directory

---

## 🎯 Priority Areas

We're particularly interested in contributions for:

1. **Test Coverage** - Improve test pass rate from 90% to 100%
2. **Service Mesh** - Enhance SMI verification and testing
3. **Documentation** - Improve examples and guides
4. **Performance** - Optimization and benchmarking
5. **Integration** - CI/CD templates and plugins

---

## ✨ Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Acknowledged in release notes
- Recognized for significant contributions

---

**Thank you for contributing to Universal Deploy Bundle!**

**🔒 Together, we're making deployments more secure and reliable.**
