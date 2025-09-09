#!/usr/bin/env tsx
// Advanced security scanner for 2025 cloud-native applications
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
}

class SecurityScanner {
  private issues: SecurityIssue[] = [];
  
  async scan(): Promise<void> {
    console.log('🔒 Starting comprehensive security scan...\n');
    
    await this.scanDependencies();
    await this.scanCodePatterns();
    await this.scanConfiguration();
    await this.scanSecrets();
    await this.scanPermissions();
    
    this.generateReport();
  }
  
  private async scanDependencies(): Promise<void> {
    console.log('📦 Scanning dependencies for vulnerabilities...');
    
    try {
      // Run npm audit and capture output
      const auditResult = execSync('npm audit --json', { 
        encoding: 'utf8',
        stdio: 'pipe' 
      });
      
      const audit = JSON.parse(auditResult);
      
      if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
        Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]: [string, any]) => {
          this.issues.push({
            severity: this.mapSeverity(vuln.severity),
            category: 'Dependencies',
            description: `Vulnerable dependency: ${pkg} - ${vuln.title}`,
            recommendation: vuln.fixAvailable ? 
              'Run npm audit fix' : 
              `Update ${pkg} to a secure version`,
          });
        });
      }
    } catch (error) {
      console.warn('⚠️  npm audit failed, continuing scan...');
    }
    
    // Check for outdated dependencies
    try {
      const outdatedResult = execSync('npm outdated --json', { 
        encoding: 'utf8',
        stdio: 'pipe' 
      });
      
      if (outdatedResult) {
        const outdated = JSON.parse(outdatedResult);
        Object.entries(outdated).forEach(([pkg, info]: [string, any]) => {
          if (info.current !== info.latest) {
            this.issues.push({
              severity: 'low',
              category: 'Dependencies',
              description: `Outdated dependency: ${pkg} (${info.current} → ${info.latest})`,
              recommendation: `Update ${pkg} to latest version`,
            });
          }
        });
      }
    } catch (error) {
      // npm outdated returns exit code 1 when outdated packages exist
    }
  }
  
  private async scanCodePatterns(): Promise<void> {
    console.log('🔍 Scanning code for security patterns...');
    
    const patterns = [
      {
        pattern: /(console\.log\(.*password.*\)|console\.log\(.*secret.*\)|console\.log\(.*token.*\))/gi,
        severity: 'high' as const,
        category: 'Information Disclosure',
        description: 'Potential password/secret logging',
        recommendation: 'Remove sensitive data from console.log statements',
      },
      {
        pattern: /(eval\(|Function\(.*\))/g,
        severity: 'critical' as const,
        category: 'Code Injection',
        description: 'Use of eval() or Function constructor',
        recommendation: 'Avoid dynamic code execution',
      },
      {
        pattern: /innerHTML\s*=.*\+/g,
        severity: 'medium' as const,
        category: 'XSS',
        description: 'Potential XSS via innerHTML concatenation',
        recommendation: 'Use textContent or proper sanitization',
      },
      {
        pattern: /document\.write\(/g,
        severity: 'medium' as const,
        category: 'XSS',
        description: 'Use of document.write()',
        recommendation: 'Use modern DOM manipulation methods',
      },
    ];
    
    await this.scanDirectory('.', patterns);
  }
  
  private async scanDirectory(dir: string, patterns: any[]): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules, .next, and other build directories
      if (entry.isDirectory() && !['node_modules', '.next', 'dist', 'build', '.git'].includes(entry.name)) {
        await this.scanDirectory(fullPath, patterns);
      } else if (entry.isFile() && /\.(js|ts|jsx|tsx)$/.test(entry.name)) {
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n');
          
          patterns.forEach(({ pattern, severity, category, description, recommendation }) => {
            let match;
            let lineNumber = 0;
            
            lines.forEach((line, index) => {
              if (pattern.test(line)) {
                this.issues.push({
                  severity,
                  category,
                  description,
                  file: fullPath,
                  line: index + 1,
                  recommendation,
                });
              }
            });
          });
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }
  
  private async scanConfiguration(): Promise<void> {
    console.log('⚙️  Scanning configuration files...');
    
    // Check Next.js config
    try {
      const nextConfig = await fs.readFile('next.config.js', 'utf8');
      
      if (!nextConfig.includes('Content-Security-Policy')) {
        this.issues.push({
          severity: 'high',
          category: 'Configuration',
          description: 'Missing Content Security Policy',
          file: 'next.config.js',
          recommendation: 'Add comprehensive CSP headers',
        });
      }
      
      if (nextConfig.includes('unsafe-eval') || nextConfig.includes('unsafe-inline')) {
        this.issues.push({
          severity: 'medium',
          category: 'Configuration',
          description: 'CSP uses unsafe-eval or unsafe-inline',
          file: 'next.config.js',
          recommendation: 'Remove unsafe CSP directives where possible',
        });
      }
    } catch (error) {
      // Next.js config not found or not readable
    }
    
    // Check package.json scripts
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      
      Object.entries(packageJson.scripts || {}).forEach(([name, script]: [string, any]) => {
        if (typeof script === 'string' && (script.includes('rm -rf') || script.includes('del /f'))) {
          this.issues.push({
            severity: 'low',
            category: 'Configuration',
            description: `Potentially dangerous script: ${name}`,
            file: 'package.json',
            recommendation: 'Review destructive commands in scripts',
          });
        }
      });
    } catch (error) {
      // package.json not found
    }
  }
  
  private async scanSecrets(): Promise<void> {
    console.log('🔐 Scanning for exposed secrets...');
    
    const secretPatterns = [
      /AKIA[0-9A-Z]{16}/, // AWS Access Key
      /sk-[a-zA-Z0-9]{48}/, // OpenAI API Key
      /ghp_[a-zA-Z0-9]{36}/, // GitHub Personal Access Token
      /xoxb-[0-9A-Za-z-]+/, // Slack Bot Token
      /-----BEGIN (PRIVATE|RSA) KEY-----/, // Private Keys
    ];
    
    await this.scanDirectoryForSecrets('.', secretPatterns);
  }
  
  private async scanDirectoryForSecrets(dir: string, patterns: RegExp[]): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !['node_modules', '.next', '.git'].includes(entry.name)) {
        await this.scanDirectoryForSecrets(fullPath, patterns);
      } else if (entry.isFile() && !/\.(jpg|jpeg|png|gif|pdf|zip|tar|gz)$/.test(entry.name)) {
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n');
          
          patterns.forEach((pattern) => {
            lines.forEach((line, index) => {
              if (pattern.test(line)) {
                this.issues.push({
                  severity: 'critical',
                  category: 'Secrets',
                  description: 'Potential secret or API key exposed',
                  file: fullPath,
                  line: index + 1,
                  recommendation: 'Remove secrets and use environment variables',
                });
              }
            });
          });
        } catch (error) {
          // Skip binary or unreadable files
        }
      }
    }
  }
  
  private async scanPermissions(): Promise<void> {
    console.log('🛡️  Scanning file permissions...');
    
    try {
      const stats = await fs.stat('.');
      // Check if directory has write permissions for others (security risk)
      // This is more relevant on Unix systems
      
      // Check for common permission issues
      const sensitiveFiles = ['.env', '.env.local', 'package-lock.json'];
      
      for (const file of sensitiveFiles) {
        try {
          const stats = await fs.stat(file);
          // Basic permission check (more detailed on Unix)
          // For now, just verify files exist and warn about potential issues
          
          if (file.startsWith('.env')) {
            this.issues.push({
              severity: 'low',
              category: 'Permissions',
              description: `Environment file ${file} exists`,
              file,
              recommendation: 'Ensure environment files are not committed to version control',
            });
          }
        } catch (error) {
          // File doesn't exist
        }
      }
    } catch (error) {
      // Permission scan failed
    }
  }
  
  private mapSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'moderate': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }
  
  private generateReport(): void {
    console.log('\n📋 Security Scan Report\n');
    console.log('=' .repeat(50));
    
    if (this.issues.length === 0) {
      console.log('✅ No security issues detected!');
      return;
    }
    
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    
    this.issues.forEach(issue => severityCounts[issue.severity]++);
    
    console.log('📊 Summary:');
    console.log(`  🔴 Critical: ${severityCounts.critical}`);
    console.log(`  🟠 High: ${severityCounts.high}`);
    console.log(`  🟡 Medium: ${severityCounts.medium}`);
    console.log(`  🟢 Low: ${severityCounts.low}`);
    console.log();
    
    // Group issues by severity
    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      const issues = this.issues.filter(i => i.severity === severity);
      if (issues.length === 0) return;
      
      const emoji = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
      }[severity];
      
      console.log(`${emoji} ${severity.toUpperCase()} Issues:`);
      
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.category}: ${issue.description}`);
        if (issue.file) {
          console.log(`     File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        }
        console.log(`     Recommendation: ${issue.recommendation}`);
        console.log();
      });
    });
    
    // Exit with error code if critical or high issues found
    if (severityCounts.critical > 0 || severityCounts.high > 0) {
      console.log('❌ Security scan failed due to critical or high severity issues.');
      process.exit(1);
    }
    
    console.log('✅ Security scan completed successfully.');
  }
}

// Run the security scan
if (require.main === module) {
  const scanner = new SecurityScanner();
  scanner.scan().catch(error => {
    console.error('❌ Security scan failed:', error);
    process.exit(1);
  });
}

export default SecurityScanner;