# StudySync benchmark results

Produced by `scripts/bench.py` (see its docstring for method). Local dev
stack: macOS (Apple Silicon), Postgres 16 + Redis via Homebrew, one uvicorn
worker per service (API :8010, realtime :8001 + :8002 sharing Redis pub/sub).
Numbers are from the run below; re-run and replace this file rather than
editing numbers by hand.

## Run: 2026-07-10

Command: `cd backend && ulimit -n 4096 && uv run python ../scripts/bench.py --clients 150`

### HTTP GET /rooms (authenticated read, 50 concurrent workers, 20s)

- requests: 15,161, errors: 0
- throughput: 758 req/s sustained
- latency: p50 37.9 ms / p95 205.7 ms / p99 332.0 ms

Earlier runs the same day measured 738-878 req/s with p50 23-39 ms on the
same setup; quote conservatively as "700+ req/s, p50 under 40 ms".

### Realtime presence fan-out (150 Socket.IO clients, 2 instances)

150 distinct authenticated users connect (websocket transport), split evenly
across the two realtime instances, and join one room; one actor flips its
presence status 10 times; every client timestamps the matching
`presence_update`. Latency covers server processing, the Redis pub/sub
cross-instance hop, and websocket delivery.

- connect + join for all 150 clients: 0.7 s
- deliveries: 1,500 / 1,500 (100%, none lost)
- delivery latency: p50 10.5 ms / p95 49.6 ms / max 55.5 ms

## Caveats (keep claims honest)

- Single-machine loopback numbers: no network RTT, but also client and
  servers compete for the same CPU. Treat as architecture validation, not
  cloud capacity numbers.
- The 150-client fan-out crossing two instances demonstrates the Redis
  pub/sub horizontal scale-out path end to end.
- macOS default `ulimit -n 256` breaks the 150-client run; raise it first.
