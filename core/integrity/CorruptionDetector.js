#!/usr/bin/env node

/**
 * Corruption Detector - V5.3
 *
 * Detects and analyzes code corruption
 * Provides detailed handoff context for developers
 */

class CorruptionDetector {
  constructor(options = {}) {
    this.strictMode = options.strictMode || false;
    this.autoFix = options.autoFix || false;
    this.verbose = options.verbose || false;
  }

  /**
   * Analyze corruption patterns
   */
  analyzeCorruption(corruptedFiles) {
    const patterns = {
      encoding: [],
      whitespace: [],
      lineEndings: [],
      truncation: [],
      injection: [],
      unknown: []
    };

    for (const corruption of corruptedFiles) {
      const pattern = this.detectPattern(corruption);
      patterns[pattern].push(corruption);
    }

    return patterns;
  }

  /**
   * Detect corruption pattern
   */
  detectPattern(corruption) {
    const { expected, actual } = corruption;

    // Check for encoding issues
    if (this.hasEncodingIssue(expected, actual)) {
      return 'encoding';
    }

    // Check for whitespace differences
    if (this.onlyWhitespaceDiff(expected, actual)) {
      return 'whitespace';
    }

    // Check for line ending differences
    if (this.onlyLineEndingDiff(expected, actual)) {
      return 'lineEndings';
    }

    // Check for truncation
    if (this.isTruncated(expected, actual)) {
      return 'truncation';
    }

    // Check for injection
    if (this.isInjected(expected, actual)) {
      return 'injection';
    }

    return 'unknown';
  }

  /**
   * Check for encoding corruption
   */
  hasEncodingIssue(expected, actual) {
    // Encoding issues typically cause character replacement
    const actualLength = actual.length;

    // UTF-8 encoding issues often result in replacement characters
    return actual.includes('\uFFFD') || actual.includes('\uFFFE');
  }

  /**
   * Check if only whitespace differs
   */
  onlyWhitespaceDiff(expected, actual) {
    const cleanExpected = expected.replace(/\s/g, '');
    const cleanActual = actual.replace(/\s/g, '');
    return cleanExpected === cleanActual && expected !== actual;
  }

  /**
   * Check if only line endings differ
   */
  onlyLineEndingDiff(expected, actual) {
    const normalize = (str) => str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return normalize(expected) === normalize(actual) && expected !== actual;
  }

  /**
   * Check for file truncation
   */
  isTruncated(expected, actual) {
    const expectedLength = expected.length;
    const actualLength = actual.length;

    // File is significantly shorter but starts the same
    return actualLength < expectedLength * 0.9 &&
           expectedLength > 100 &&
           expected.startsWith(actual.substring(0, Math.min(100, actualLength)));
  }

  /**
   * Check for code injection
   */
  isInjected(expected, actual) {
    const suspiciousPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /eval\s*\(/gi,
      /document\.write/gi,
      /javascript:/gi,
      /onerror\s*=/gi,
      /onload\s*=/gi
    ];

    for (const pattern of suspiciousPatterns) {
      const actualMatches = (actual.match(pattern) || []).length;
      const expectedMatches = (expected.match(pattern) || []).length;

      // More suspicious patterns in actual than expected = injection
      if (actualMatches > expectedMatches) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate developer handoff context
   */
  generateHandoff(verificationResult) {
    const { corrupted, missing, totalFiles, lastKnownGood } = verificationResult;

    const corruptionPatterns = this.analyzeCorruption(corrupted);

    return {
      timestamp: new Date().toISOString(),
      deploymentBlocked: true,
      actionRequired: 'FIX_CORRUPTION',

      summary: {
        totalFiles,
        totalCorrupted: corrupted.length,
        totalMissing: missing.length,
        totalVerified: totalFiles - corrupted.length - missing.length,
        severity: this.calculateSeverity(corrupted, corruptionPatterns)
      },

      corruptionAnalysis: {
        byPattern: {
          injection: corruptionPatterns.injection.length,
          truncation: corruptionPatterns.truncation.length,
          encoding: corruptionPatterns.encoding.length,
          unknown: corruptionPatterns.unknown.length,
          whitespace: corruptionPatterns.whitespace.length,
          lineEndings: corruptionPatterns.lineEndings.length
        },
        details: this.getCorruptionDetails(corrupted, corruptionPatterns)
      },

      missingFiles: missing.map(m => ({
        file: m.file,
        expectedHash: m.expected ? m.expected.hash.substring(0, 16) : 'unknown',
        severity: 'HIGH'
      })),

      lastKnownGood: lastKnownGood ? {
        commit: lastKnownGood.identifier,
        timestamp: lastKnownGood.savedAt,
        algorithm: lastKnownGood.algorithm,
        restoredWith: `git checkout ${lastKnownGood.identifier} -- <file>`
      } : null,

      recommendedActions: this.getRecommendedActions(corruptionPatterns),

      nextSteps: this.getNextSteps(corruptionPatterns),

      recoveryCommands: this.getRecoveryCommands(corrupted, lastKnownGood)
    };
  }

  /**
   * Calculate overall severity
   */
  calculateSeverity(corrupted, corruptionPatterns) {
    if (corruptionPatterns.injection.length > 0) return 'CRITICAL';
    if (corruptionPatterns.truncation.length > 0) return 'HIGH';
    if (corruptionPatterns.unknown.length > 0) return 'MEDIUM';
    if (corruptionPatterns.encoding.length > 0) return 'MEDIUM';
    if (corruptionPatterns.whitespace.length > 0 || corruptionPatterns.lineEndings.length > 0) return 'LOW';
    return 'LOW';
  }

  /**
   * Get corruption details
   */
  getCorruptionDetails(corrupted, patterns) {
    return corrupted.map(c => {
      const pattern = this.detectPattern(c);
      return {
        file: c.file,
        pattern,
        severity: this.getSeverity(c),
        expectedHash: c.expected.substring(0, 16),
        actualHash: c.actual.substring(0, 16),
        recoveryAction: this.getRecoveryAction(c)
      };
    });
  }

  /**
   * Get severity for individual file
   */
  getSeverity(corruption) {
    const pattern = this.detectPattern(corruption);
    const severityMap = {
      injection: 'CRITICAL',
      truncation: 'HIGH',
      encoding: 'MEDIUM',
      unknown: 'MEDIUM',
      whitespace: 'LOW',
      lineEndings: 'LOW'
    };
    return severityMap[pattern] || 'MEDIUM';
  }

  /**
   * Get recovery action for file
   */
  getRecoveryAction(corruption) {
    const pattern = this.detectPattern(corruption);
    const actions = {
      injection: 'URGENT: Security incident! Isolate and investigate.',
      truncation: 'Restore from backup or version control.',
      encoding: 'Re-save file with correct encoding (UTF-8).',
      unknown: 'Manual review and comparison required.',
      whitespace: 'Auto-fix with code formatter.',
      lineEndings: 'Auto-fix with line ending normalizer.'
    };
    return actions[pattern];
  }

  /**
   * Get recommended actions
   */
  getRecommendedActions(corruptionPatterns) {
    const actions = [];

    if (corruptionPatterns.injection.length > 0) {
      actions.push({
        priority: 'CRITICAL',
        action: 'SECURITY INCIDENT: Possible code injection detected',
        details: 'Isolate environment and investigate immediately',
        automated: false
      });
    }

    if (corruptionPatterns.truncation.length > 0) {
      actions.push({
        priority: 'HIGH',
        action: 'Restore truncated files from version control',
        command: 'git checkout HEAD -- <corrupted-file>',
        automated: true
      });
    }

    if (corruptionPatterns.encoding.length > 0) {
      actions.push({
        priority: 'MEDIUM',
        action: 'Fix file encoding issues',
        details: 'Re-save files with UTF-8 encoding',
        automated: false
      });
    }

    if (corruptionPatterns.unknown.length > 0) {
      actions.push({
        priority: 'MEDIUM',
        action: 'Review unknown corruption patterns',
        details: 'Manual investigation required',
        automated: false
      });
    }

    if (corruptionPatterns.whitespace.length > 0 || corruptionPatterns.lineEndings.length > 0) {
      actions.push({
        priority: 'LOW',
        action: 'Fix formatting issues',
        command: 'npm run format',
        automated: true
      });
    }

    return actions;
  }

  /**
   * Get next steps
   */
  getNextSteps(corruptionPatterns) {
    const steps = [
      'DO NOT proceed with deployment',
      'Review corrupted files listed above',
      'Identify corruption pattern',
    ];

    if (corruptionPatterns.injection.length > 0) {
      steps.unshift('🚨 SECURITY INCIDENT - Follow security response procedures');
    } else {
      steps.push('Restore from last known good state or fix manually');
      steps.push('Re-run integrity verification');
      steps.push('Only proceed when all files verified');
    }

    return steps;
  }

  /**
   * Get recovery commands
   */
  getRecoveryCommands(corrupted, lastKnownGood) {
    const commands = [];

    if (lastKnownGood) {
      commands.push({
        description: 'Restore all corrupted files from last known good commit',
        command: `git checkout ${lastKnownGood.identifier} -- ${corrupted.map(c => c.file).join(' ')}`
      });
    }

    commands.push({
      description: 'Restore specific file from last commit',
      command: 'git checkout HEAD -- <file-path>'
    });

    commands.push({
      description: 'Verify integrity after restoration',
      command: 'npm run integrity:verify'
    });

    return commands;
  }

  /**
   * Format corruption report for display
   */
  formatReport(handoff) {
    const lines = [];

    lines.push('\n' + '='.repeat(60));
    lines.push('🔒 INTEGRITY VERIFICATION FAILED');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`📊 Summary:`);
    lines.push(`   Total Files: ${handoff.summary.totalFiles}`);
    lines.push(`   Verified: ${handoff.summary.totalVerified} ✅`);
    lines.push(`   Corrupted: ${handoff.summary.totalCorrupted} ❌`);
    lines.push(`   Missing: ${handoff.summary.totalMissing} ⚠️`);
    lines.push(`   Severity: ${handoff.summary.severity}`);
    lines.push('');

    if (handoff.corruptionAnalysis.details.length > 0) {
      lines.push('🔴 Corrupted Files:');
      handoff.corruptionAnalysis.details.forEach(detail => {
        lines.push(`   ${detail.file}`);
        lines.push(`     Pattern: ${detail.pattern}`);
        lines.push(`     Severity: ${detail.severity}`);
        lines.push(`     Expected: ${detail.expectedHash}...`);
        lines.push(`     Actual: ${detail.actualHash}...`);
        lines.push(`     Action: ${detail.recoveryAction}`);
        lines.push('');
      });
    }

    if (handoff.missingFiles.length > 0) {
      lines.push('⚠️  Missing Files:');
      handoff.missingFiles.forEach(missing => {
        lines.push(`   ${missing.file}`);
        lines.push(`     Severity: ${missing.severity}`);
      });
      lines.push('');
    }

    if (handoff.recommendedActions.length > 0) {
      lines.push('💡 Recommended Actions:');
      handoff.recommendedActions.forEach(action => {
        const icon = action.priority === 'CRITICAL' ? '🚨' :
                    action.priority === 'HIGH' ? '🔴' :
                    action.priority === 'MEDIUM' ? '🟡' : '🟢';
        lines.push(`   ${icon} ${action.action}`);
        if (action.details) {
          lines.push(`      ${action.details}`);
        }
        if (action.command) {
          lines.push(`      Command: ${action.command}`);
        }
      });
      lines.push('');
    }

    if (handoff.lastKnownGood) {
      lines.push('📜 Last Known Good State:');
      lines.push(`   Commit: ${handoff.lastKnownGood.commit}`);
      lines.push(`   Timestamp: ${handoff.lastKnownGood.timestamp}`);
      lines.push(`   Restore: ${handoff.lastKnownGood.restoredWith}`);
      lines.push('');
    }

    lines.push('📋 Next Steps:');
    handoff.nextSteps.forEach((step, i) => {
      lines.push(`   ${i + 1}. ${step}`);
    });
    lines.push('');

    lines.push('='.repeat(60));
    lines.push('');

    return lines.join('\n');
  }
}

// CLI interface
if (require.main === module) {
  const detector = new CorruptionDetector();

  // Test with sample data
  console.log('\n🔍 Corruption Detector Test\n');

  const testCorruption = [
    {
      file: 'test.js',
      expected: 'abc123',
      actual: 'abc<script>alert(1)</script>123'
    },
    {
      file: 'truncated.txt',
      expected: 'a'.repeat(1000),
      actual: 'a'.repeat(100)
    }
  ];

  const patterns = detector.analyzeCorruption(testCorruption);
  console.log('Detected patterns:', Object.keys(patterns).filter(k => patterns[k].length > 0));

  console.log('\n✅ Corruption Detector is ready\n');
}

module.exports = CorruptionDetector;
