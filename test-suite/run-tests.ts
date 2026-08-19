/**
 * CLI Test Runner - Headless Automated Test Execution
 * Run with: npm test or npx tsx test-suite/run-tests.ts
 */

import { ALL_TEST_CASES, runTestCases } from '../src/utils/testEngine';

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  🏛️  ENTERPRISE ACCOUNTING AUDIT STUDIO - AUTOMATED TEST SUITE');
  console.log('  Testing Double-Entry Invariants, SOX 404 RBAC, Multi-Tenant & Entities');
  console.log('='.repeat(80) + '\n');

  console.log(`Discovered ${ALL_TEST_CASES.length} Test Scenarios across 15 Domain Categories.\n`);

  const startTime = Date.now();
  const { results, summary } = await runTestCases(ALL_TEST_CASES, (res, idx, total) => {
    const icon = res.status === 'PASSED' ? '✅' : '❌';
    const statusFormatted = res.status === 'PASSED' ? '\x1b[32mPASSED\x1b[0m' : '\x1b[31mFAILED\x1b[0m';
    const codePadded = res.code.padEnd(8);
    const timeFormatted = `(${res.durationMs}ms)`.padStart(8);

    console.log(` [${idx.toString().padStart(2)}/${total}] ${icon} ${codePadded} ${res.name.slice(0, 48).padEnd(48)} [${statusFormatted}] ${timeFormatted}`);

    if (res.status === 'FAILED' && res.errorMessage) {
      console.log(`       \x1b[31m💥 Error: ${res.errorMessage}\x1b[0m`);
    }
  });

  const durationMs = Date.now() - startTime;

  console.log('\n' + '-'.repeat(80));
  console.log('  TEST EXECUTION SUMMARY');
  console.log('-'.repeat(80));
  console.log(`  Total Test Cases : ${summary.total}`);
  console.log(`  Passed           : \x1b[32m${summary.passed}\x1b[0m`);
  console.log(`  Failed           : ${summary.failed > 0 ? '\x1b[31m' : '\x1b[32m'}${summary.failed}\x1b[0m`);
  console.log(`  Total Assertions : ${summary.totalAssertions}`);
  console.log(`  Pass Rate        : \x1b[32m${summary.passRate.toFixed(1)}%\x1b[0m`);
  console.log(`  Total Time       : ${durationMs}ms`);
  console.log('='.repeat(80) + '\n');

  if (summary.failed > 0) {
    console.error('❌ Test suite failed with regressions.');
    process.exit(1);
  } else {
    console.log('✅ All test scenarios passed successfully! Application integrity is 100% verified.\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unhandled Test Runner Exception:', err);
  process.exit(1);
});
