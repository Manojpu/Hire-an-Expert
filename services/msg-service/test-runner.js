#!/usr/bin/env node

/**
 * Test Runner Script for Message Service
 * 
 * This script provides various testing options for the message service,
 * including unit tests, integration tests, and coverage reports.
 * 
 * Usage:
 *   npm test                  # Run all tests
 *   npm run test:unit         # Run only unit tests
 *   npm run test:integration  # Run only integration tests
 *   npm run test:coverage     # Run tests with coverage report
 *   npm run test:watch        # Run tests in watch mode
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for colored output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printBanner() {
  console.log(colorize('\n🧪 Message Service Test Suite', 'cyan'));
  console.log(colorize('================================', 'cyan'));
}

function printSection(title) {
  console.log(colorize(`\n📋 ${title}`, 'yellow'));
  console.log(colorize('-'.repeat(title.length + 4), 'yellow'));
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function checkTestFiles() {
  printSection('Checking Test Files');
  
  const testDirs = [
    'tests/unit',
    'tests/integration'
  ];
  
  const testFiles = [];
  
  for (const dir of testDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
        .filter(file => file.endsWith('.test.js'))
        .map(file => path.join(dir, file));
      testFiles.push(...files);
      console.log(colorize(`✅ Found ${files.length} test files in ${dir}`, 'green'));
    } else {
      console.log(colorize(`⚠️  Directory ${dir} not found`, 'yellow'));
    }
  }
  
  console.log(colorize(`\n📊 Total test files: ${testFiles.length}`, 'blue'));
  
  return testFiles;
}

async function runTests(type = 'all') {
  try {
    printBanner();
    
    // Check if test files exist
    const testFiles = await checkTestFiles();
    
    if (testFiles.length === 0) {
      console.log(colorize('\n❌ No test files found!', 'red'));
      process.exit(1);
    }
    
    // Determine Jest command based on test type
    let jestArgs = [];
    
    switch (type) {
      case 'unit':
        printSection('Running Unit Tests');
        jestArgs = ['--testPathPattern=unit'];
        break;
      case 'integration':
        printSection('Running Integration Tests');
        jestArgs = ['--testPathPattern=integration'];
        break;
      case 'coverage':
        printSection('Running Tests with Coverage');
        jestArgs = ['--coverage'];
        break;
      case 'watch':
        printSection('Running Tests in Watch Mode');
        jestArgs = ['--watch'];
        break;
      default:
        printSection('Running All Tests');
        break;
    }
    
    // Add common Jest options
    jestArgs.push(
      '--verbose',
      '--detectOpenHandles',
      '--forceExit'
    );
    
    console.log(colorize(`\n🚀 Starting tests...`, 'blue'));
    console.log(colorize(`Command: jest ${jestArgs.join(' ')}`, 'magenta'));
    
    await runCommand('npx', ['jest', ...jestArgs]);
    
    console.log(colorize('\n✅ All tests completed successfully!', 'green'));
    
    if (type === 'coverage') {
      console.log(colorize('\n📊 Coverage report generated in ./coverage directory', 'blue'));
    }
    
  } catch (error) {
    console.error(colorize('\n❌ Test execution failed:', 'red'));
    console.error(colorize(error.message, 'red'));
    process.exit(1);
  }
}

async function checkDependencies() {
  printSection('Checking Dependencies');
  
  const requiredDeps = [
    'jest',
    'supertest',
    'socket.io-client',
    'mongodb-memory-server'
  ];
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  for (const dep of requiredDeps) {
    if (allDeps[dep]) {
      console.log(colorize(`✅ ${dep} (${allDeps[dep]})`, 'green'));
    } else {
      console.log(colorize(`❌ ${dep} - NOT FOUND`, 'red'));
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  // Handle special commands
  if (command === 'check') {
    await checkTestFiles();
    await checkDependencies();
    return;
  }
  
  if (command === 'help') {
    printBanner();
    console.log(colorize('\nAvailable commands:', 'yellow'));
    console.log('  all         - Run all tests (default)');
    console.log('  unit        - Run only unit tests');
    console.log('  integration - Run only integration tests');
    console.log('  coverage    - Run tests with coverage report');
    console.log('  watch       - Run tests in watch mode');
    console.log('  check       - Check test setup and dependencies');
    console.log('  help        - Show this help message');
    return;
  }
  
  // Run tests
  await runTests(command);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error(colorize('Script execution failed:', 'red'));
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runTests, checkTestFiles, checkDependencies };
