# Backend — ChatOps Command Bot (desensitized demo)

Deterministic gatekeeper (NestJS, no LLM) + config-driven flow engine + mock AI worker.
Zero external services — runs entirely in memory.

## Run

```bash
npm install
npm run build && npm start      # or: npm run start:dev
```

In another shell:

```bash
bash demo.sh
```

You will see one full loop: keyword → env card → branch card → ready → mock worker report.

## Test

```bash
npm test
```

## Add a new capability (no routing/lifecycle changes)

1. Drop a `src/flows/<command>.json` (declares `triggers / closePolicy / worker.skill / steps[]`).
2. Register it in `FlowRegistryService`'s `flows` array.

That's it — the stateless StepEngine and session lifecycle handle the rest.

## Architecture notes

- `modules/gateway` — `POST /message` stands in for an IM WebSocket gateway.
- `modules/flow` — StepEngine (stateless card rendering), FlowRegistry, Orchestrator.
- `modules/session` — in-memory thread-isolated state machine (`ACTIVE → AWAITING_FEEDBACK → CLOSED`) + idle sweeper. Production uses MongoDB upsert on a unique `threadKey` index.
- `modules/worker` — mock brain. Production spawns a short-lived `claude -p` subprocess; the worker returns its report as stdout `result` and never touches the IM channel.
