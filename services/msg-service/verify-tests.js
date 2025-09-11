#!/usr/bin/env node

/**
 * Complete Test Verification Script
 * 
 * This script verifies the entire test suite setup and provides
 * a comprehensive report of test coverage and functionality.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function printHeader(title) {
  const border = '='.repeat(title.length + 4);
  console.log(colorize(border, 'cyan'));
  console.log(colorize(`  ${title}  `, 'cyan'));
  console.log(colorize(border, 'cyan'));
  console.log();
}

function printSection(title) {
  console.log(colorize(`📋 ${title}`, 'yellow'));
  console.log(colorize('-'.repeat(title.length + 4), 'yellow'));
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', reject);
  });
}

async function checkFileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkTestSetup() {
  printSection('Test Setup Verification');
  
  const requiredFiles = [
    'jest.config.js',
    'tests/setup.js',
    'tests/unit/messageModel.test.js',
    'tests/unit/conversationModel.test.js',
    'tests/unit/messageController.test.js',
    'tests/unit/conversationController.test.js',
    'tests/unit/dbConfig.test.js',
    'tests/integration/messageRoutes.test.js',
    'tests/integration/conversationRoutes.test.js',
    'tests/integration/socketIO.test.js'
  ];

  let allFilesExist = true;

  for (const file of requiredFiles) {
    const exists = await checkFileExists(file);
    if (exists) {
      console.log(colorize(`✅ ${file}`, 'green'));
    } else {
      console.log(colorize(`❌ ${file}`, 'red'));
      allFilesExist = false;
    }
  }

  console.log();
  return allFilesExist;
}

async function checkDependencies() {
  printSection('Dependencies Check');
  
  const packageJson = JSON.parse(await fs.promises.readFile('package.json', 'utf8'));
  const devDeps = packageJson.devDependencies || {};
  
  const requiredDeps = [
    'jest',
    'supertest',
    'socket.io-client',
    'mongodb-memory-server',
    '@types/jest'
  ];

  let allDepsInstalled = true;

  for (const dep of requiredDeps) {
    if (devDeps[dep]) {
      console.log(colorize(`✅ ${dep} (${devDeps[dep]})`, 'green'));
    } else {
      console.log(colorize(`❌ ${dep} - Missing`, 'red'));
      allDepsInstalled = false;
    }
  }

  console.log();
  return allDepsInstalled;
}

async function runTestSuite(type, timeout = 60000) {
  printSection(`Running ${type} Tests`);
  
  const commands = {
    unit: ['npx', ['jest', '--testPathPattern=unit', '--verbose']],
    integration: ['npx', ['jest', '--testPathPattern=integration', '--verbose']],
    coverage: ['npx', ['jest', '--coverage', '--verbose']]
  };

  const [command, args] = commands[type];
  
  console.log(colorize(`Command: ${command} ${args.join(' ')}`, 'magenta'));
  console.log();

  const startTime = Date.now();
  
  try {
    const result = await Promise.race([
      runCommand(command, args),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      )
    ]);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (result.code === 0) {
      console.log(colorize(`✅ ${type} tests completed successfully in ${duration}s`, 'green'));
      
      // Extract test results
      const testResults = result.stdout.match(/Tests:\s+(\d+) passed/);
      if (testResults) {
        console.log(colorize(`📊 Tests passed: ${testResults[1]}`, 'blue'));
      }
      
      // Extract coverage if available
      if (type === 'coverage') {
        const coverageMatch = result.stdout.match(/All files[^|]*\|\s*(\d+\.?\d*)/);
        if (coverageMatch) {
          console.log(colorize(`📈 Coverage: ${coverageMatch[1]}%`, 'blue'));
        }
      }
    } else {
      console.log(colorize(`❌ ${type} tests failed`, 'red'));
      console.log(colorize('Error output:', 'red'));
      console.log(result.stderr.substring(0, 500));
    }
    
    console.log();
    return result.code === 0;
  } catch (error) {
    console.log(colorize(`❌ ${type} tests failed: ${error.message}`, 'red'));
    console.log();
    return false;
  }
}

async function generateTestReport() {
  printSection('Test Coverage Report');
  
  const coverageExists = await checkFileExists('coverage/lcov-report/index.html');
  
  if (coverageExists) {
    console.log(colorize('✅ Coverage report generated successfully', 'green'));
    console.log(colorize('📊 Open coverage/lcov-report/index.html to view detailed report', 'blue'));
  } else {
    console.log(colorize('❌ Coverage report not found', 'red'));
    console.log(colorize('💡 Run: npm run test:coverage', 'yellow'));
  }
  
  console.log();
}

async function main() {
  printHeader('Message Service Test Verification');
  
  console.log(colorize('🔍 This script will verify the complete test setup and run all tests.', 'blue'));
  console.log(colorize('⏱️  This may take a few minutes...', 'yellow'));
  console.log();
  
  const results = {
    setup: false,
    dependencies: false,
    unitTests: false,
    integrationTests: false,
    coverage: false
  };
  
  try {
    // Check test setup
    results.setup = await checkTestSetup();
    
    // Check dependencies
    results.dependencies = await checkDependencies();
    
    if (!results.setup || !results.dependencies) {
      console.log(colorize('❌ Setup verification failed. Please fix the issues above.', 'red'));
      process.exit(1);
    }
    
    // Run unit tests
    results.unitTests = await runTestSuite('unit', 120000);
    
    // Run integration tests
    results.integrationTests = await runTestSuite('integration', 180000);
    
    // Generate coverage report
    results.coverage = await runTestSuite('coverage', 180000);
    
    // Generate final report
    await generateTestReport();
    
    // Summary
    printSection('Test Verification Summary');
    
    const checks = [
      ['Test Setup', results.setup],
      ['Dependencies', results.dependencies],
      ['Unit Tests', results.unitTests],
      ['Integration Tests', results.integrationTests],
      ['Coverage Report', results.coverage]
    ];
    
    for (const [check, passed] of checks) {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const color = passed ? 'green' : 'red';
      console.log(colorize(`${status} ${check}`, color));
    }
    
    console.log();
    
    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
      console.log(colorize('🎉 All tests passed! The Message Service is ready for production.', 'green'));
      console.log(colorize('📚 See TEST_DOCUMENTATION.md for detailed information.', 'blue'));
    } else {
      console.log(colorize('⚠️  Some tests failed. Please review the output above.', 'yellow'));
    }
    
  } catch (error) {
    console.error(colorize('💥 Test verification failed:', 'red'));
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(colorize('Script execution failed:', 'red'));
    console.error(error);
    process.exit(1);
  });
}
