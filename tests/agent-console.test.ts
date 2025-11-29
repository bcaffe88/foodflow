/**
 * TURN 8-9: Agent Console E2E Tests
 * Validação rápida do agent orchestrator
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const BASE_URL = "http://localhost:5000";
const results: TestResult[] = [];

async function runTests() {
  console.log("🚀 TURN 8-9: Agent Console E2E Tests\n");

  // Test 1: GET /api/agents/list
  try {
    const res = await fetch(`${BASE_URL}/api/agents/list`);
    const data = await res.json();
    const passed = res.ok && data.agents && data.agents.length === 18;
    results.push({
      name: "GET /api/agents/list returns 18 agents",
      passed,
      error: passed ? undefined : `Got ${data.agents?.length} agents, expected 18`,
    });
  } catch (e: any) {
    results.push({
      name: "GET /api/agents/list returns 18 agents",
      passed: false,
      error: e.message,
    });
  }

  // Test 2: POST /api/agents/execute (simple task)
  try {
    const res = await fetch(`${BASE_URL}/api/agents/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: "What is 2+2?",
        type: "calculation",
      }),
    });
    const data = await res.json();
    const passed = res.ok && data.result && data.agent;
    results.push({
      name: "POST /api/agents/execute returns agent response",
      passed,
      error: passed ? undefined : `Invalid response structure`,
    });
  } catch (e: any) {
    results.push({
      name: "POST /api/agents/execute returns agent response",
      passed: false,
      error: e.message,
    });
  }

  // Test 3: GET /api/agents/history (empty on first call)
  try {
    const res = await fetch(`${BASE_URL}/api/agents/history`);
    const data = await res.json();
    const passed = res.ok && Array.isArray(data.history);
    results.push({
      name: "GET /api/agents/history returns array",
      passed,
      error: passed ? undefined : `Invalid response`,
    });
  } catch (e: any) {
    results.push({
      name: "GET /api/agents/history returns array",
      passed: false,
      error: e.message,
    });
  }

  // Test 4: Frontend loads agent-console page
  try {
    const res = await fetch(`${BASE_URL}/admin/agent-console`);
    const passed = res.ok;
    results.push({
      name: "Frontend: /admin/agent-console loads",
      passed,
      error: passed ? undefined : `HTTP ${res.status}`,
    });
  } catch (e: any) {
    results.push({
      name: "Frontend: /admin/agent-console loads",
      passed: false,
      error: e.message,
    });
  }

  // Print results
  console.log("📊 TEST RESULTS:\n");
  let passCount = 0;
  results.forEach((r) => {
    if (r.passed) {
      console.log(`✅ ${r.name}`);
      passCount++;
    } else {
      console.log(`❌ ${r.name}`);
      console.log(`   Error: ${r.error}\n`);
    }
  });

  console.log(`\n📈 SUMMARY: ${passCount}/${results.length} tests passed`);
  console.log(`Build Status: ${passCount === results.length ? "✅ PASSING" : "⚠️ CHECK ERRORS"}`);
}

runTests().catch(console.error);
