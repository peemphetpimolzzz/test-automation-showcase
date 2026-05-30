import http from 'k6/http';
import { check, sleep } from 'k6';

// Smoke load test against the SUT. Reaches the API over the compose network using
// the service name (BASE_URL=http://api:3000), not localhost.
const BASE_URL = __ENV.BASE_URL || 'http://api:3000';

export const options = {
  vus: 10,
  duration: '35s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300'],
    checks: ['rate>0.99'],
  },
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export default function () {
  // Health check.
  const health = http.get(`${BASE_URL}/api/health`);
  check(health, {
    'health is 200': (r) => r.status === 200,
    'health reports ok': (r) => r.json('status') === 'ok',
  });

  // Create a task.
  const created = http.post(
    `${BASE_URL}/api/tasks`,
    JSON.stringify({ title: `load task ${__VU}-${__ITER}` }),
    { headers: JSON_HEADERS },
  );
  check(created, {
    'create is 201': (r) => r.status === 201,
    'create returns an id': (r) => typeof r.json('id') === 'string',
  });

  const id = created.json('id');

  // List tasks.
  const listed = http.get(`${BASE_URL}/api/tasks`);
  check(listed, { 'list is 200': (r) => r.status === 200 });

  if (id) {
    // Advance and then delete to keep the dataset from growing unbounded.
    const patched = http.patch(
      `${BASE_URL}/api/tasks/${id}`,
      JSON.stringify({ status: 'done' }),
      { headers: JSON_HEADERS },
    );
    check(patched, { 'patch is 200': (r) => r.status === 200 });

    const deleted = http.del(`${BASE_URL}/api/tasks/${id}`);
    check(deleted, { 'delete is 204': (r) => r.status === 204 });
  }

  sleep(0.5);
}

// Write a machine-readable summary alongside the default stdout output. The
// output path is configurable so it can target a container-writable mount.
const SUMMARY_PATH = __ENV.SUMMARY_PATH || '/output/k6-summary.json';

export function handleSummary(data) {
  return {
    stdout: textSummary(data),
    [SUMMARY_PATH]: JSON.stringify(data, null, 2),
  };
}

// Compact text summary so CI logs stay readable without the k6 HTML reporter.
function textSummary(data) {
  const metrics = data.metrics || {};
  const lines = ['', '=== k6 smoke summary ==='];
  const failed = metrics.http_req_failed?.values?.rate ?? 0;
  const p95 = metrics.http_req_duration?.values?.['p(95)'] ?? 0;
  const checks = metrics.checks?.values?.rate ?? 0;
  lines.push(`http_req_failed rate : ${(failed * 100).toFixed(3)}%`);
  lines.push(`http_req_duration p95: ${p95.toFixed(2)}ms`);
  lines.push(`checks pass rate     : ${(checks * 100).toFixed(3)}%`);
  lines.push('');
  return lines.join('\n');
}
