# Load test: smoke profile

This is a **smoke** load test, not a stress or soak test. Its job is to confirm the
SUT stays healthy and fast under a small, steady amount of concurrent traffic — the
kind of guard you can run on every CI build without flakiness.

## Profile

- **Image:** `grafana/k6:0.55.0`
- **Virtual users:** 10
- **Duration:** ~35s
- **Target:** `http://api:3000` (the API service over the compose network)
- **Scenario per iteration:** health check → create task → list tasks → patch to `done` → delete

## Thresholds

| Metric | Threshold | Meaning |
| --- | --- | --- |
| `http_req_failed` | `rate<0.01` | Fewer than 1% of requests may fail (non-2xx/3xx or transport error). |
| `http_req_duration` | `p(95)<300` | 95% of requests complete in under 300 ms. |
| `checks` | `rate>0.99` | More than 99% of functional checks (status codes, body shape) pass. |

The thresholds are deliberately set with headroom for a single-node SQLite-backed
service so the gate is meaningful but stable in CI. They are not SLOs for a
production deployment.

## Output

The run writes `load/k6-summary.json` (full k6 metrics) via `handleSummary`, plus a
compact text summary to stdout. CI uploads the JSON as a build artifact.

## Running locally

```sh
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm k6
```
