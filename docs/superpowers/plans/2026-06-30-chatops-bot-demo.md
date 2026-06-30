# ChatOps Command Bot — Architecture Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desensitized, self-contained demo of a "ChatOps command bot" platform — a runnable NestJS backend (deterministic gatekeeper + config-driven flow engine + mock AI worker) plus a static, no-API frontend that explains the architecture for interviews.

**Architecture:** Two independent deliverables. `backend/` is a NestJS app exposing `POST /message` (simulating an inbound IM message) that runs a config-driven wizard, advances a thread-isolated session state machine, dispatches to a mock worker, and returns a card JSON — no external services. `frontend/` is a single static page (vanilla HTML/CSS/JS, zero build, zero network) showing architecture diagram, core philosophy, an interactive flow timeline, a scripted IM-chat demo, and code-convention cards.

**Tech Stack:** Backend — NestJS 10 + TypeScript 5, Jest. Frontend — plain HTML/CSS/JS.

## Global Constraints

- Node ≥ 18, TypeScript 5.x, NestJS 10.x.
- Backend has ZERO external runtime deps beyond Nest core (no Redis/BullMQ/SLS/Lark SDK/Mongo). Session store is in-memory.
- All identifiers/copy desensitized: no real company/product names, no real App IDs / AccessKeys / repo names / tenant info. Generic "ChatOps assistant" shell; sample command is `diagnose`.
- Code comments in English; user-facing docs/explanations in Simplified Chinese.
- Conventions copied from source project: kebab-case filenames, PascalCase classes, camelCase methods; `interfaces/{module}/index.ts` barrel exports; no `forwardRef`; no cross-boundary Service→Service.
- i18n: every UI text has both `en` and `zh`, enforced at compile time via `satisfies`.
- Frontend makes ZERO network requests (open `index.html` via file://).
- Do not commit until each task's tests pass; frequent small commits.

---

## PART A — BACKEND (runnable)

### Task 1: Scaffold NestJS backend

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/nest-cli.json`
- Create: `backend/jest.config.js`
- Create: `backend/src/main.ts`
- Create: `backend/src/app.module.ts`
- Create: `backend/.gitignore`

**Interfaces:**
- Produces: a bootable Nest app on port 3000; `AppModule` to which later modules attach.

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "chatops-bot-demo-backend",
  "version": "0.1.0",
  "description": "Desensitized ChatOps command bot — deterministic gatekeeper + config-driven flow engine + mock AI worker.",
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:dev": "nest start --watch",
    "test": "jest"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/testing": "^10.3.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.11.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "declaration": false,
    "outDir": "./dist",
    "baseUrl": "./",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 3: Create `backend/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true }
}
```

- [ ] **Step 4: Create `backend/jest.config.js`**

```js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
};
```

- [ ] **Step 5: Create `backend/.gitignore`**

```
node_modules/
dist/
```

- [ ] **Step 6: Create `backend/src/main.ts`**

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Deterministic gatekeeper listens here; in production this is fronted by an IM WebSocket.
  await app.listen(3000);
  // eslint-disable-next-line no-console
  console.log('[broker] ChatOps bot demo listening on http://localhost:3000');
}
bootstrap();
```

- [ ] **Step 7: Create `backend/src/app.module.ts`**

```ts
import { Module } from '@nestjs/common';

@Module({})
export class AppModule {}
```

- [ ] **Step 8: Install and verify build**

Run: `cd backend && npm install && npm run build`
Expected: `dist/main.js` produced, no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
cd backend && git add -A && git commit -m "chore(backend): scaffold NestJS app"
```

---

### Task 2: Flow interfaces + `diagnose` flow config

**Files:**
- Create: `backend/src/interfaces/flow/index.ts`
- Create: `backend/src/interfaces/flow/flow.types.ts`
- Create: `backend/src/flows/diagnose.json`
- Test: `backend/src/flows/diagnose.spec.ts`

**Interfaces:**
- Produces: `FlowStep`, `FlowConfig`, `LocaleText`, `StepType` types; the `diagnose` flow config loadable as JSON.

- [ ] **Step 1: Write the failing test**

`backend/src/flows/diagnose.spec.ts`:
```ts
import { FlowConfig } from '../interfaces/flow';
import diagnose from './diagnose.json';

describe('diagnose flow config', () => {
  const cfg = diagnose as unknown as FlowConfig;

  it('declares triggers, steps, closePolicy and worker skill', () => {
    expect(cfg.command).toBe('diagnose');
    expect(cfg.triggers.en).toContain('diagnose');
    expect(cfg.triggers.zh).toContain('诊断');
    expect(cfg.closePolicy).toBe('conversational');
    expect(cfg.worker.skill).toBe('diagnose-orchestrator');
    expect(cfg.steps.map((s) => s.id)).toEqual(['env', 'branch']);
  });

  it('every step text has both en and zh', () => {
    for (const step of cfg.steps) {
      expect(step.i18n.title.en).toBeTruthy();
      expect(step.i18n.title.zh).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest src/flows/diagnose.spec.ts`
Expected: FAIL — cannot find `./diagnose.json` / `../interfaces/flow`.

- [ ] **Step 3: Create `backend/src/interfaces/flow/flow.types.ts`**

```ts
export type Locale = 'en' | 'zh';

export type LocaleText = { [K in Locale]: string };

export type StepType = 'choice' | 'input' | 'multiselect';

export interface StepOption {
  key: string;
  i18n: LocaleText;
}

export interface FlowStep {
  id: string;
  type: StepType;
  /** Named dataset for dynamic options (resolved by the engine), e.g. 'env-list'. */
  source?: string;
  /** Static options for choice/multiselect when no source is given. */
  options?: StepOption[];
  /** Default value for input steps. */
  default?: string;
  /** Step is skippable. */
  optional?: boolean;
  /** Conditional render: only show when collected[field] === equals. */
  when?: { field: string; equals: string };
  i18n: { title: LocaleText; note?: LocaleText };
}

export type ClosePolicy = 'conversational' | 'oneshot';

export interface FlowConfig {
  command: string;
  triggers: { en: string[]; zh: string[] };
  closePolicy: ClosePolicy;
  worker: { skill: string };
  steps: FlowStep[];
  feedback?: { enabled: boolean };
}
```

- [ ] **Step 4: Create `backend/src/interfaces/flow/index.ts`**

```ts
// Barrel export — consumers import from 'interfaces/flow', never deep paths.
export * from './flow.types';
```

- [ ] **Step 5: Create `backend/src/flows/diagnose.json`**

```json
{
  "command": "diagnose",
  "triggers": { "en": ["diagnose"], "zh": ["诊断"] },
  "closePolicy": "conversational",
  "worker": { "skill": "diagnose-orchestrator" },
  "steps": [
    {
      "id": "env",
      "type": "choice",
      "options": [
        { "key": "qat", "i18n": { "en": "QAT", "zh": "QAT" } },
        { "key": "uat", "i18n": { "en": "UAT", "zh": "UAT" } },
        { "key": "prod", "i18n": { "en": "PROD", "zh": "PROD" } }
      ],
      "i18n": {
        "title": { "en": "🌐  Select environment", "zh": "🌐  请选择环境" },
        "note": { "en": "Step 1 of 2 · Environment", "zh": "第 1 / 2 步 · 环境" }
      }
    },
    {
      "id": "branch",
      "type": "input",
      "default": "main",
      "i18n": {
        "title": { "en": "🌿  Enter branch", "zh": "🌿  输入分支" },
        "note": { "en": "Step 2 of 2 · Branch", "zh": "第 2 / 2 步 · 分支" }
      }
    }
  ],
  "feedback": { "enabled": false }
}
```

- [ ] **Step 6: Enable JSON imports — update `backend/tsconfig.json`**

Add `"resolveJsonModule": true` to `compilerOptions` (insert after `"esModuleInterop": true,`):
```json
    "esModuleInterop": true,
    "resolveJsonModule": true,
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && npx jest src/flows/diagnose.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 8: Commit**

```bash
cd backend && git add -A && git commit -m "feat(flow): add flow interfaces and diagnose config"
```

---

### Task 3: Card render types + template helper

**Files:**
- Create: `backend/src/modules/flow/flow-template.ts`
- Create: `backend/src/modules/flow/card.types.ts`
- Test: `backend/src/modules/flow/flow-template.spec.ts`

**Interfaces:**
- Produces: `renderTemplate(tpl: string, vars: Record<string, unknown>): string`; `CardSpec`, `CardBlock` types used by the step engine and renderer.

- [ ] **Step 1: Write the failing test**

`backend/src/modules/flow/flow-template.spec.ts`:
```ts
import { renderTemplate } from './flow-template';

describe('renderTemplate', () => {
  it('substitutes {{collected.x}} tokens', () => {
    const out = renderTemplate('env={{collected.env}} branch={{collected.branch}}', {
      collected: { env: 'uat', branch: 'main' },
    });
    expect(out).toBe('env=uat branch=main');
  });

  it('leaves unknown tokens empty', () => {
    expect(renderTemplate('x={{collected.missing}}', { collected: {} })).toBe('x=');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest src/modules/flow/flow-template.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `backend/src/modules/flow/card.types.ts`**

```ts
import { Locale } from '../../interfaces/flow';

/** A minimal IM card abstraction — desensitized stand-in for a real IM card payload. */
export interface CardAction {
  text: string;
  value: Record<string, unknown>;
}

export type CardBlock =
  | { type: 'note'; text: string }
  | { type: 'buttons'; actions: CardAction[] }
  | { type: 'input'; placeholder: string; submit: string; value: Record<string, unknown> }
  | { type: 'text'; text: string };

export interface CardSpec {
  header: { title: string; color: string };
  blocks: CardBlock[];
  locale?: Locale;
}
```

- [ ] **Step 4: Create `backend/src/modules/flow/flow-template.ts`**

```ts
/** Resolve a dotted path like 'collected.env' against the vars object. */
function lookup(path: string, vars: Record<string, unknown>): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, vars);
}

/** Replace {{ path }} tokens; unknown tokens render as empty string. */
export function renderTemplate(tpl: string, vars: Record<string, unknown>): string {
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const value = lookup(path, vars);
    return value == null ? '' : String(value);
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx jest src/modules/flow/flow-template.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
cd backend && git add -A && git commit -m "feat(flow): add card types and template helper"
```

---

### Task 4: Stateless StepEngine

**Files:**
- Create: `backend/src/modules/flow/step-engine.service.ts`
- Test: `backend/src/modules/flow/step-engine.service.spec.ts`

**Interfaces:**
- Consumes: `FlowStep` (interfaces/flow), `CardSpec`/`CardBlock` (card.types).
- Produces: `StepEngineService` with:
  - `shouldRender(step: FlowStep, collected: Record<string, unknown>): boolean`
  - `renderStepCard(step: FlowStep, ctx: StepContext): CardSpec`
  - `StepContext` = `{ locale: Locale; threadKey: string; namespace: string; collected: Record<string, unknown> }`

- [ ] **Step 1: Write the failing test**

`backend/src/modules/flow/step-engine.service.spec.ts`:
```ts
import { StepEngineService } from './step-engine.service';
import { FlowStep } from '../../interfaces/flow';

const engine = new StepEngineService();
const ctx = { locale: 'zh' as const, threadKey: 'tk1', namespace: 'wizard', collected: {} };

describe('StepEngineService', () => {
  it('renders a choice step as buttons carrying threadKey + value', () => {
    const step: FlowStep = {
      id: 'env',
      type: 'choice',
      options: [{ key: 'uat', i18n: { en: 'UAT', zh: 'UAT' } }],
      i18n: { title: { en: 'Env', zh: '环境' } },
    };
    const card = engine.renderStepCard(step, ctx);
    expect(card.header.title).toBe('环境');
    const buttons = card.blocks.find((b) => b.type === 'buttons') as any;
    expect(buttons.actions[0].value).toMatchObject({ tk: 'tk1', stepId: 'env', value: 'uat' });
  });

  it('renders an input step with placeholder + submit', () => {
    const step: FlowStep = { id: 'branch', type: 'input', i18n: { title: { en: 'Branch', zh: '分支' } } };
    const card = engine.renderStepCard(step, ctx);
    const input = card.blocks.find((b) => b.type === 'input') as any;
    expect(input.value).toMatchObject({ tk: 'tk1', stepId: 'branch' });
  });

  it('shouldRender honors when-clause', () => {
    const step: FlowStep = {
      id: 'x', type: 'input',
      when: { field: 'env', equals: 'prod' },
      i18n: { title: { en: 'X', zh: 'X' } },
    };
    expect(engine.shouldRender(step, { env: 'uat' })).toBe(false);
    expect(engine.shouldRender(step, { env: 'prod' })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest src/modules/flow/step-engine.service.spec.ts`
Expected: FAIL — `StepEngineService` not found.

- [ ] **Step 3: Create `backend/src/modules/flow/step-engine.service.ts`**

```ts
import { Injectable } from '@nestjs/common';
import { FlowStep, Locale } from '../../interfaces/flow';
import { CardSpec } from './card.types';

export interface StepContext {
  locale: Locale;
  threadKey: string;
  namespace: string; // 'wizard' | 'feedback' — disambiguates the callback owner
  collected: Record<string, unknown>;
}

@Injectable()
export class StepEngineService {
  /** Evaluate when-clause. Absent when → always render. */
  shouldRender(step: FlowStep, collected: Record<string, unknown>): boolean {
    if (!step.when) return true;
    return collected[step.when.field] === step.when.equals;
  }

  /** Render a step to a CardSpec. choice → buttons; input → form. */
  renderStepCard(step: FlowStep, ctx: StepContext): CardSpec {
    const base = { stepId: step.id, tk: ctx.threadKey, namespace: ctx.namespace, locale: ctx.locale };
    const title = step.i18n.title[ctx.locale];
    const note = step.i18n.note?.[ctx.locale];
    const header = { title, color: 'turquoise' };
    const lead = note ? [{ type: 'note' as const, text: note }] : [];

    if (step.type === 'choice' || step.type === 'multiselect') {
      const opts = step.options ?? [];
      return {
        header,
        locale: ctx.locale,
        blocks: [
          ...lead,
          {
            type: 'buttons' as const,
            actions: opts.map((o) => ({ text: o.i18n[ctx.locale], value: { ...base, value: o.key } })),
          },
        ],
      };
    }

    // input
    return {
      header,
      locale: ctx.locale,
      blocks: [
        ...lead,
        {
          type: 'input' as const,
          placeholder: this.placeholder(step, ctx.locale),
          submit: ctx.locale === 'en' ? 'Submit' : '提交',
          value: { ...base },
        },
      ],
    };
  }

  private placeholder(step: FlowStep, locale: Locale): string {
    if (step.default) return locale === 'en' ? `default: ${step.default}` : `默认：${step.default}`;
    return locale === 'en' ? 'Type here…' : '请输入…';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest src/modules/flow/step-engine.service.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd backend && git add -A && git commit -m "feat(flow): add stateless StepEngine"
```

---

### Task 5: Session interfaces + in-memory state machine + sweeper

**Files:**
- Create: `backend/src/interfaces/session/index.ts`
- Create: `backend/src/interfaces/session/session.types.ts`
- Create: `backend/src/modules/session/session.service.ts`
- Test: `backend/src/modules/session/session.service.spec.ts`

**Interfaces:**
- Produces: `SessionState` = `'ACTIVE' | 'AWAITING_FEEDBACK' | 'CLOSED'`; `Session` = `{ threadKey: string; command: string; state: SessionState; locale: Locale; stepIndex: number; collected: Record<string, unknown>; updatedAt: number }`.
- `SessionService`:
  - `upsert(threadKey: string, command: string, locale: Locale): Session` — creates ACTIVE if absent.
  - `get(threadKey: string): Session | undefined`
  - `save(session: Session): void`
  - `close(threadKey: string): void` — sets CLOSED (permanent).
  - `sweepIdle(maxIdleMs: number, now: number): string[]` — closes ACTIVE sessions older than maxIdleMs; returns closed keys.

- [ ] **Step 1: Write the failing test**

`backend/src/modules/session/session.service.spec.ts`:
```ts
import { SessionService } from './session.service';

describe('SessionService', () => {
  let svc: SessionService;
  beforeEach(() => (svc = new SessionService()));

  it('upserts one session per threadKey (thread isolation)', () => {
    const a = svc.upsert('tk1', 'diagnose', 'zh');
    const again = svc.upsert('tk1', 'diagnose', 'zh');
    expect(again).toBe(a);
    expect(svc.upsert('tk2', 'diagnose', 'en')).not.toBe(a);
    expect(a.state).toBe('ACTIVE');
  });

  it('close sets permanent CLOSED state', () => {
    svc.upsert('tk1', 'diagnose', 'zh');
    svc.close('tk1');
    expect(svc.get('tk1')!.state).toBe('CLOSED');
  });

  it('sweepIdle closes only stale ACTIVE sessions', () => {
    const s = svc.upsert('tk1', 'diagnose', 'zh');
    s.updatedAt = 1000;
    svc.save(s);
    const closed = svc.sweepIdle(5000, 10000);
    expect(closed).toEqual(['tk1']);
    expect(svc.get('tk1')!.state).toBe('CLOSED');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest src/modules/session/session.service.spec.ts`
Expected: FAIL — `SessionService` not found.

- [ ] **Step 3: Create `backend/src/interfaces/session/session.types.ts`**

```ts
import { Locale } from '../flow';

export type SessionState = 'ACTIVE' | 'AWAITING_FEEDBACK' | 'CLOSED';

export interface Session {
  threadKey: string; // business key — one thread, one session (prod: MongoDB unique index)
  command: string;
  state: SessionState;
  locale: Locale;
  stepIndex: number;
  collected: Record<string, unknown>;
  updatedAt: number;
}
```

- [ ] **Step 4: Create `backend/src/interfaces/session/index.ts`**

```ts
export * from './session.types';
```

- [ ] **Step 5: Create `backend/src/modules/session/session.service.ts`**

```ts
import { Injectable } from '@nestjs/common';
import { Locale } from '../../interfaces/flow';
import { Session } from '../../interfaces/session';

/**
 * In-memory session store. In production this is a MongoDB `sessions` collection
 * keyed by a unique `threadKey` index (upsert per thread); CLOSED sessions are
 * retained permanently to feed a future learning loop. State never degrades to files.
 */
@Injectable()
export class SessionService {
  private readonly byThread = new Map<string, Session>();

  upsert(threadKey: string, command: string, locale: Locale): Session {
    const existing = this.byThread.get(threadKey);
    if (existing) return existing;
    const session: Session = {
      threadKey,
      command,
      state: 'ACTIVE',
      locale,
      stepIndex: 0,
      collected: {},
      updatedAt: this.now(),
    };
    this.byThread.set(threadKey, session);
    return session;
  }

  get(threadKey: string): Session | undefined {
    return this.byThread.get(threadKey);
  }

  save(session: Session): void {
    session.updatedAt = this.now();
    this.byThread.set(session.threadKey, session);
  }

  close(threadKey: string): void {
    const s = this.byThread.get(threadKey);
    if (s) s.state = 'CLOSED'; // permanent terminal state
  }

  /** Close ACTIVE sessions idle longer than maxIdleMs. Returns the closed keys. */
  sweepIdle(maxIdleMs: number, now: number): string[] {
    const closed: string[] = [];
    for (const s of this.byThread.values()) {
      if (s.state === 'ACTIVE' && now - s.updatedAt >= maxIdleMs) {
        s.state = 'CLOSED';
        closed.push(s.threadKey);
      }
    }
    return closed;
  }

  private now(): number {
    return Date.now();
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && npx jest src/modules/session/session.service.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
cd backend && git add -A && git commit -m "feat(session): in-memory thread-isolated state machine"
```

---

### Task 6: Mock AI worker (stdout-result contract)

**Files:**
- Create: `backend/src/interfaces/worker/index.ts`
- Create: `backend/src/modules/worker/worker.service.ts`
- Test: `backend/src/modules/worker/worker.service.spec.ts`

**Interfaces:**
- Produces: `WorkerRequest` = `{ skill: string; locale: Locale; collected: Record<string, unknown>; prompt: string }`; `WorkerResult` = `{ result: string }`.
- `WorkerService.run(req: WorkerRequest): Promise<WorkerResult>` — async, returns a mock structured report. Mirrors the real contract: the worker's final output is the report string; the broker (not the worker) sends it back to the thread.

- [ ] **Step 1: Write the failing test**

`backend/src/modules/worker/worker.service.spec.ts`:
```ts
import { WorkerService } from './worker.service';

describe('WorkerService (mock brain)', () => {
  it('returns a structured report string referencing collected context', async () => {
    const svc = new WorkerService();
    const out = await svc.run({
      skill: 'diagnose-orchestrator',
      locale: 'zh',
      collected: { env: 'uat', branch: 'main' },
      prompt: '玩家请求失败',
    });
    expect(out.result).toContain('uat');
    expect(out.result).toContain('main');
    expect(out.result.length).toBeGreaterThan(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest src/modules/worker/worker.service.spec.ts`
Expected: FAIL — `WorkerService` not found.

- [ ] **Step 3: Create `backend/src/interfaces/worker/index.ts`**

```ts
import { Locale } from '../flow';

export interface WorkerRequest {
  skill: string;
  locale: Locale;
  collected: Record<string, unknown>;
  prompt: string;
}

export interface WorkerResult {
  result: string;
}
```

- [ ] **Step 4: Create `backend/src/modules/worker/worker.service.ts`**

```ts
import { Injectable } from '@nestjs/common';
import { WorkerRequest, WorkerResult } from '../../interfaces/worker';

/**
 * Mock "AI worker". In production this spawns a short-lived `claude -p` subprocess
 * with the repo root as cwd, runs the named skill, and returns its final stdout
 * `result`. The worker is a pure brain: it never touches the IM channel — the broker
 * reads this result and sends it back to the thread. A crash here kills only itself.
 */
@Injectable()
export class WorkerService {
  async run(req: WorkerRequest): Promise<WorkerResult> {
    await this.simulateLatency();
    const env = String(req.collected.env ?? '?');
    const branch = String(req.collected.branch ?? '?');
    const report =
      req.locale === 'en'
        ? `[mock report] env=${env} branch=${branch}\nIssue: "${req.prompt}"\nRoot cause (mock): null credit returned by upstream service. Confidence 82%.`
        : `[模拟报告] 环境=${env} 分支=${branch}\n问题：「${req.prompt}」\n根因（模拟）：上游服务返回空额度。置信度 82%。`;
    return { result: report };
  }

  private simulateLatency(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 10));
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx jest src/modules/worker/worker.service.spec.ts`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
cd backend && git add -A && git commit -m "feat(worker): mock AI worker with stdout-result contract"
```

---

### Task 7: FlowRegistry + orchestration

**Files:**
- Create: `backend/src/modules/flow/flow-registry.service.ts`
- Create: `backend/src/modules/flow/flow-orchestrator.service.ts`
- Test: `backend/src/modules/flow/flow-orchestrator.service.spec.ts`

**Interfaces:**
- Consumes: `StepEngineService`, `SessionService`, `WorkerService`, `FlowConfig`.
- `FlowRegistryService.match(text: string): { config: FlowConfig; locale: Locale } | undefined` — infers command + locale from a trigger keyword.
- `FlowRegistryService.get(command: string): FlowConfig | undefined`
- Produces: `FlowOrchestratorService.handle(input: InboundMessage): Promise<OutboundReply>` where
  - `InboundMessage` = `{ threadKey: string; text?: string; action?: Record<string, unknown> }`
  - `OutboundReply` = `{ kind: 'card'; card: CardSpec } | { kind: 'text'; text: string }`

- [ ] **Step 1: Write the failing test**

`backend/src/modules/flow/flow-orchestrator.service.spec.ts`:
```ts
import { StepEngineService } from './step-engine.service';
import { SessionService } from '../session/session.service';
import { WorkerService } from '../worker/worker.service';
import { FlowRegistryService } from './flow-registry.service';
import { FlowOrchestratorService } from './flow-orchestrator.service';

function build() {
  const registry = new FlowRegistryService();
  const orch = new FlowOrchestratorService(
    registry,
    new StepEngineService(),
    new SessionService(),
    new WorkerService(),
  );
  return orch;
}

describe('FlowOrchestratorService', () => {
  it('keyword triggers the first wizard step as a card', async () => {
    const reply = await build().handle({ threadKey: 'tk1', text: '诊断' });
    expect(reply.kind).toBe('card');
    if (reply.kind === 'card') expect(reply.card.header.title).toContain('环境');
  });

  it('runs a full wizard then dispatches to the worker', async () => {
    const orch = build();
    await orch.handle({ threadKey: 'tk1', text: 'diagnose' }); // -> env card
    await orch.handle({ threadKey: 'tk1', action: { stepId: 'env', value: 'uat' } }); // -> branch card
    await orch.handle({ threadKey: 'tk1', action: { stepId: 'branch', value: 'main' } }); // -> enters conversation
    const reply = await orch.handle({ threadKey: 'tk1', text: 'request failed' }); // free text -> worker
    expect(reply.kind).toBe('text');
    if (reply.kind === 'text') {
      expect(reply.text).toContain('uat');
      expect(reply.text).toContain('main');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest src/modules/flow/flow-orchestrator.service.spec.ts`
Expected: FAIL — registry/orchestrator not found.

- [ ] **Step 3: Create `backend/src/modules/flow/flow-registry.service.ts`**

```ts
import { Injectable } from '@nestjs/common';
import { FlowConfig, Locale } from '../../interfaces/flow';
import diagnose from '../../flows/diagnose.json';

/**
 * Registry of config-driven flows. Adding a capability = adding one JSON file here.
 * Routing and lifecycle code stay untouched.
 */
@Injectable()
export class FlowRegistryService {
  private readonly flows: FlowConfig[] = [diagnose as unknown as FlowConfig];

  get(command: string): FlowConfig | undefined {
    return this.flows.find((f) => f.command === command);
  }

  /** Infer command + locale from a trigger keyword found anywhere in the text. */
  match(text: string): { config: FlowConfig; locale: Locale } | undefined {
    const lower = text.toLowerCase();
    for (const config of this.flows) {
      if (config.triggers.en.some((t) => lower.includes(t.toLowerCase()))) {
        return { config, locale: 'en' };
      }
      if (config.triggers.zh.some((t) => text.includes(t))) {
        return { config, locale: 'zh' };
      }
    }
    return undefined;
  }
}
```

- [ ] **Step 4: Create `backend/src/modules/flow/flow-orchestrator.service.ts`**

```ts
import { Injectable } from '@nestjs/common';
import { FlowConfig } from '../../interfaces/flow';
import { Session } from '../../interfaces/session';
import { SessionService } from '../session/session.service';
import { WorkerService } from '../worker/worker.service';
import { FlowRegistryService } from './flow-registry.service';
import { StepEngineService } from './step-engine.service';
import { CardSpec } from './card.types';

export interface InboundMessage {
  threadKey: string;
  text?: string;
  action?: Record<string, unknown>;
}

export type OutboundReply = { kind: 'card'; card: CardSpec } | { kind: 'text'; text: string };

@Injectable()
export class FlowOrchestratorService {
  constructor(
    private readonly registry: FlowRegistryService,
    private readonly steps: StepEngineService,
    private readonly sessions: SessionService,
    private readonly worker: WorkerService,
  ) {}

  async handle(input: InboundMessage): Promise<OutboundReply> {
    const existing = this.sessions.get(input.threadKey);

    // 1. New thread + keyword → create session, render first step.
    if (!existing || existing.state === 'CLOSED') {
      const matched = input.text ? this.registry.match(input.text) : undefined;
      if (!matched) return { kind: 'text', text: 'Unknown command. Try: diagnose / 诊断' };
      const session = this.sessions.upsert(input.threadKey, matched.config.command, matched.locale);
      return this.renderStep(matched.config, session);
    }

    const config = this.registry.get(existing.command)!;

    // 2. Card action → record value, advance.
    if (input.action && typeof input.action.value === 'string') {
      const stepId = String(input.action.stepId);
      existing.collected[stepId] = input.action.value;
      existing.stepIndex += 1;
      this.sessions.save(existing);
      if (existing.stepIndex < config.steps.length) return this.renderStep(config, existing);
      // Wizard finished — enter conversation (conversational policy).
      return { kind: 'text', text: existing.locale === 'en' ? 'Ready. Describe the issue.' : '准备就绪，请描述问题。' };
    }

    // 3. Free text after wizard → dispatch to worker.
    if (input.text && existing.stepIndex >= config.steps.length) {
      const out = await this.worker.run({
        skill: config.worker.skill,
        locale: existing.locale,
        collected: existing.collected,
        prompt: input.text,
      });
      this.sessions.save(existing);
      return { kind: 'text', text: out.result };
    }

    // 4. Mid-wizard free text → re-render current step.
    return this.renderStep(config, existing);
  }

  private renderStep(config: FlowConfig, session: Session): OutboundReply {
    let idx = session.stepIndex;
    while (idx < config.steps.length && !this.steps.shouldRender(config.steps[idx], session.collected)) {
      idx += 1;
    }
    if (idx >= config.steps.length) {
      return { kind: 'text', text: session.locale === 'en' ? 'Ready. Describe the issue.' : '准备就绪，请描述问题。' };
    }
    session.stepIndex = idx;
    this.sessions.save(session);
    const card = this.steps.renderStepCard(config.steps[idx], {
      locale: session.locale,
      threadKey: session.threadKey,
      namespace: 'wizard',
      collected: session.collected,
    });
    return { kind: 'card', card };
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx jest src/modules/flow/flow-orchestrator.service.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
cd backend && git add -A && git commit -m "feat(flow): add registry and orchestrator"
```

---

### Task 8: Gateway controller + module wiring + sweeper hookup

**Files:**
- Create: `backend/src/modules/gateway/gateway.controller.ts`
- Create: `backend/src/modules/session/session-sweeper.service.ts`
- Create: `backend/src/app.module.ts` (modify — replace stub)
- Test: `backend/src/modules/gateway/gateway.controller.spec.ts`

**Interfaces:**
- Consumes: `FlowOrchestratorService`.
- `GatewayController` exposes `POST /message` accepting `{ threadKey, text?, action? }`, returns `OutboundReply`.
- `SessionSweeperService` runs `sweepIdle` on an interval (started in `onModuleInit`, cleared in `onModuleDestroy`).

- [ ] **Step 1: Write the failing test**

`backend/src/modules/gateway/gateway.controller.spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { GatewayController } from './gateway.controller';
import { FlowOrchestratorService } from '../flow/flow-orchestrator.service';
import { FlowRegistryService } from '../flow/flow-registry.service';
import { StepEngineService } from '../flow/step-engine.service';
import { SessionService } from '../session/session.service';
import { WorkerService } from '../worker/worker.service';

describe('GatewayController', () => {
  it('routes an inbound message to a wizard card', async () => {
    const mod = await Test.createTestingModule({
      controllers: [GatewayController],
      providers: [
        FlowOrchestratorService, FlowRegistryService, StepEngineService,
        SessionService, WorkerService,
      ],
    }).compile();
    const ctrl = mod.get(GatewayController);
    const reply = await ctrl.message({ threadKey: 'tk1', text: 'diagnose' });
    expect(reply.kind).toBe('card');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest src/modules/gateway/gateway.controller.spec.ts`
Expected: FAIL — controller not found.

- [ ] **Step 3: Create `backend/src/modules/gateway/gateway.controller.ts`**

```ts
import { Body, Controller, Post } from '@nestjs/common';
import { FlowOrchestratorService, InboundMessage, OutboundReply } from '../flow/flow-orchestrator.service';

/**
 * Desensitized message entry. In production an IM WebSocket gateway feeds messages here;
 * this HTTP endpoint stands in for "received one IM message" so the demo runs with no
 * external services. threadKey = root_id ?? message_id in the real system.
 */
@Controller()
export class GatewayController {
  constructor(private readonly orchestrator: FlowOrchestratorService) {}

  @Post('message')
  message(@Body() body: InboundMessage): Promise<OutboundReply> {
    return this.orchestrator.handle(body);
  }
}
```

- [ ] **Step 4: Create `backend/src/modules/session/session-sweeper.service.ts`**

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SessionService } from './session.service';

/** Periodically closes idle ACTIVE sessions (mirrors the production 5-minute sweep). */
@Injectable()
export class SessionSweeperService implements OnModuleInit, OnModuleDestroy {
  private static readonly IDLE_MS = 2 * 60 * 60 * 1000; // 2h
  private static readonly TICK_MS = 5 * 60 * 1000; // 5m
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly sessions: SessionService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      this.sessions.sweepIdle(SessionSweeperService.IDLE_MS, Date.now());
    }, SessionSweeperService.TICK_MS);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
```

- [ ] **Step 5: Replace `backend/src/app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { GatewayController } from './modules/gateway/gateway.controller';
import { FlowOrchestratorService } from './modules/flow/flow-orchestrator.service';
import { FlowRegistryService } from './modules/flow/flow-registry.service';
import { StepEngineService } from './modules/flow/step-engine.service';
import { SessionService } from './modules/session/session.service';
import { SessionSweeperService } from './modules/session/session-sweeper.service';
import { WorkerService } from './modules/worker/worker.service';

@Module({
  controllers: [GatewayController],
  providers: [
    FlowOrchestratorService,
    FlowRegistryService,
    StepEngineService,
    SessionService,
    SessionSweeperService,
    WorkerService,
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Run the test + full suite**

Run: `cd backend && npx jest`
Expected: ALL specs PASS.

- [ ] **Step 7: Commit**

```bash
cd backend && git add -A && git commit -m "feat(gateway): POST /message entry + sweeper + module wiring"
```

---

### Task 9: Demo script + backend README

**Files:**
- Create: `backend/demo.sh`
- Create: `backend/README.md`

**Interfaces:**
- Consumes: running server on `:3000`.

- [ ] **Step 1: Create `backend/demo.sh`**

```bash
#!/usr/bin/env bash
# Drives one full command loop against a locally running broker.
# Usage: npm start (in another shell), then: bash demo.sh
set -euo pipefail
URL="http://localhost:3000/message"
TK="demo-thread-1"

post() { curl -s -X POST "$URL" -H 'Content-Type: application/json' -d "$1"; echo; }

echo "1) keyword 'diagnose' -> env card:"
post "{\"threadKey\":\"$TK\",\"text\":\"diagnose\"}"

echo "2) pick env=uat -> branch card:"
post "{\"threadKey\":\"$TK\",\"action\":{\"stepId\":\"env\",\"value\":\"uat\"}}"

echo "3) pick branch=main -> ready:"
post "{\"threadKey\":\"$TK\",\"action\":{\"stepId\":\"branch\",\"value\":\"main\"}}"

echo "4) free text -> mock worker report:"
post "{\"threadKey\":\"$TK\",\"text\":\"request failed for user 12345\"}"
```

- [ ] **Step 2: Create `backend/README.md`**

```markdown
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
```

- [ ] **Step 3: Verify the demo end-to-end**

Run (shell A): `cd backend && npm run build && npm start`
Run (shell B): `cd backend && bash demo.sh`
Expected: step 4 prints a mock report containing `uat` and `main`.

- [ ] **Step 4: Commit**

```bash
cd backend && git add -A && git commit -m "docs(backend): demo script and README"
```

---

## PART B — FRONTEND (static, no API)

### Task 10: Page scaffold + dark theme + section shell

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/styles.css`
- Create: `frontend/app.js`

**Interfaces:**
- Produces: a 4-section single page (理念 / 时序 / 模拟对话 / 规范) with anchor nav. Sections filled in later tasks.

- [ ] **Step 1: Create `frontend/index.html`**

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ChatOps Command Bot · 架构展示</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <nav class="nav">
    <span class="brand">ChatOps Bot · 架构展示</span>
    <a href="#philosophy">核心理念</a>
    <a href="#timeline">核心流程</a>
    <a href="#demo">模拟对话</a>
    <a href="#conventions">代码规范</a>
  </nav>

  <section id="philosophy" class="section"><!-- Task 11 --></section>
  <section id="timeline" class="section"><!-- Task 12 --></section>
  <section id="demo" class="section"><!-- Task 13 --></section>
  <section id="conventions" class="section"><!-- Task 14 --></section>

  <footer class="footer">脱敏架构展示 · 仅用于技术演示，不含任何真实业务 / 凭证信息</footer>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `frontend/styles.css`**

```css
:root {
  --bg: #0d1117; --panel: #161b22; --border: #30363d;
  --fg: #e6edf3; --muted: #8b949e; --accent: #2dd4bf; --accent2: #58a6ff;
  --radius: 12px; --max: 980px;
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--fg);
  font-family: -apple-system, "Segoe UI", Roboto, "PingFang SC", sans-serif; line-height: 1.6;
}
.nav {
  position: sticky; top: 0; display: flex; gap: 20px; align-items: center;
  padding: 14px 24px; background: rgba(13,17,23,.85); backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border); z-index: 10; font-size: 14px;
}
.nav .brand { font-weight: 700; margin-right: auto; color: var(--accent); }
.nav a { color: var(--muted); text-decoration: none; }
.nav a:hover { color: var(--fg); }
.section { max-width: var(--max); margin: 0 auto; padding: 64px 24px; }
.section h2 { font-size: 28px; margin: 0 0 8px; }
.section .lead { color: var(--muted); margin: 0 0 28px; }
.panel { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
.grid { display: grid; gap: 16px; }
.grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
.footer { text-align: center; color: var(--muted); padding: 40px 24px; border-top: 1px solid var(--border); font-size: 13px; }
@media (max-width: 720px) { .grid.cols-2, .grid.cols-3 { grid-template-columns: 1fr; } .nav a { display: none; } }
```

- [ ] **Step 3: Create `frontend/app.js`**

```js
// Frontend is 100% static — no network requests. Interactions are scripted below.
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  // Section initializers are attached by later tasks via window.__init hooks.
  (window.__init || []).forEach((fn) => fn());
});
window.__init = window.__init || [];
```

- [ ] **Step 4: Verify it opens**

Open `frontend/index.html` in a browser (file://). Expected: sticky nav + empty sections + footer, no console errors, no network requests.

- [ ] **Step 5: Commit**

```bash
git add frontend && git commit -m "feat(frontend): page scaffold + dark theme"
```

---

### Task 11: Philosophy section + two-layer architecture SVG

**Files:**
- Modify: `frontend/index.html` (fill `#philosophy`)

- [ ] **Step 1: Fill the `#philosophy` section** (replace the `<section id="philosophy" ...></section>` line)

```html
  <section id="philosophy" class="section">
    <h2>核心理念</h2>
    <p class="lead">能用确定性死流程做掉的，门卫（无 LLM）全包；只有真正需要分析的部分才交给 AI worker。</p>
    <div class="grid cols-3">
      <div class="panel"><h3>确定性优先</h3><p>解析 / 路由 / 向导 / 生命周期全在确定性门卫里，不会退化。</p></div>
      <div class="panel"><h3>一线程一实例</h3><p>一个 thread = 一个命令实例，从生到死，线程隔离是铁律。</p></div>
      <div class="panel"><h3>config 驱动可扩展</h3><p>新增能力 = 加一份 JSON + 一个 worker skill，不碰路由 / 生命周期。</p></div>
    </div>
    <div class="panel" style="margin-top:16px">
      <svg viewBox="0 0 760 200" width="100%" role="img" aria-label="两层架构图">
        <rect x="20" y="70" width="150" height="60" rx="8" fill="#161b22" stroke="#30363d"/>
        <text x="95" y="95" fill="#e6edf3" font-size="13" text-anchor="middle">IM 入口</text>
        <text x="95" y="115" fill="#8b949e" font-size="11" text-anchor="middle">WebSocket</text>
        <rect x="240" y="50" width="240" height="100" rx="8" fill="#161b22" stroke="#2dd4bf"/>
        <text x="360" y="80" fill="#2dd4bf" font-size="14" text-anchor="middle">broker · 确定性门卫</text>
        <text x="360" y="102" fill="#8b949e" font-size="11" text-anchor="middle">解析 / 路由 / 向导 / session</text>
        <text x="360" y="120" fill="#8b949e" font-size="11" text-anchor="middle">无 LLM · 常驻</text>
        <rect x="560" y="70" width="180" height="60" rx="8" fill="#161b22" stroke="#58a6ff"/>
        <text x="650" y="95" fill="#58a6ff" font-size="13" text-anchor="middle">worker · 纯大脑</text>
        <text x="650" y="115" fill="#8b949e" font-size="11" text-anchor="middle">短命子进程 · 跑完即退</text>
        <line x1="170" y1="100" x2="240" y2="100" stroke="#30363d" stroke-width="2"/>
        <line x1="480" y1="100" x2="560" y2="100" stroke="#30363d" stroke-width="2"/>
        <text x="520" y="92" fill="#8b949e" font-size="10" text-anchor="middle">queue</text>
      </svg>
    </div>
  </section>
```

- [ ] **Step 2: Verify**

Reload `index.html`. Expected: three philosophy cards + an architecture SVG render correctly.

- [ ] **Step 3: Commit**

```bash
git add frontend/index.html && git commit -m "feat(frontend): philosophy section + architecture diagram"
```

---

### Task 12: Interactive flow timeline

**Files:**
- Modify: `frontend/index.html` (fill `#timeline`)
- Modify: `frontend/app.js` (append timeline init)
- Modify: `frontend/styles.css` (append timeline styles)

- [ ] **Step 1: Fill the `#timeline` section**

```html
  <section id="timeline" class="section">
    <h2>核心流程时序</h2>
    <p class="lead">一条命令从入口到回复。点击任意一步高亮查看职责。</p>
    <ol class="timeline" id="tl">
      <li data-desc="门卫收到 IM 消息，按 threadKey 定位/创建 session（线程隔离）。">① 入口收消息</li>
      <li data-desc="FlowRegistry 按 trigger 关键词匹配命令并推断语言。">② 命令路由</li>
      <li data-desc="StepEngine 读 config 渲染当前 step 卡片（choice / input / multiselect）。">③ config 出卡</li>
      <li data-desc="用户点按钮 / 填输入 → 收集值 → session 状态机推进 stepIndex。">④ 向导收集</li>
      <li data-desc="向导跑完，broker 派活给短命 worker 子进程（纯大脑）。">⑤ 派活 worker</li>
      <li data-desc="worker 返回 result，broker 读 stdout 把结构化报告发回同一 thread。">⑥ 回复 thread</li>
    </ol>
    <div class="panel" id="tl-desc">点击上方任意步骤查看说明。</div>
  </section>
```

- [ ] **Step 2: Append timeline styles to `frontend/styles.css`**

```css
.timeline { list-style: none; display: flex; flex-wrap: wrap; gap: 10px; padding: 0; margin: 0 0 16px; }
.timeline li {
  flex: 1 1 140px; padding: 14px; background: var(--panel); border: 1px solid var(--border);
  border-radius: var(--radius); cursor: pointer; font-size: 14px; transition: border-color .15s, transform .15s;
}
.timeline li:hover { transform: translateY(-2px); }
.timeline li.active { border-color: var(--accent); color: var(--accent); }
```

- [ ] **Step 3: Append timeline init to `frontend/app.js`** (before the final line)

```js
window.__init.push(() => {
  const tl = document.getElementById('tl');
  const out = document.getElementById('tl-desc');
  if (!tl || !out) return;
  tl.querySelectorAll('li').forEach((li) => {
    li.addEventListener('click', () => {
      tl.querySelectorAll('li').forEach((x) => x.classList.remove('active'));
      li.classList.add('active');
      out.textContent = li.getAttribute('data-desc');
    });
  });
});
```

- [ ] **Step 4: Verify**

Reload. Click each step → it highlights and the panel shows its description.

- [ ] **Step 5: Commit**

```bash
git add frontend && git commit -m "feat(frontend): interactive flow timeline"
```

---

### Task 13: Scripted IM chat demo

**Files:**
- Modify: `frontend/index.html` (fill `#demo`)
- Modify: `frontend/styles.css` (append chat styles)
- Modify: `frontend/app.js` (append chat player)

- [ ] **Step 1: Fill the `#demo` section**

```html
  <section id="demo" class="section">
    <h2>模拟对话演示</h2>
    <p class="lead">仿 IM 聊天，脚本化播放一次完整命令闭环（纯前端，不连后端）。</p>
    <div class="chat panel" id="chat"></div>
    <button class="btn" id="play">▶ 播放</button>
  </section>
```

- [ ] **Step 2: Append chat styles to `frontend/styles.css`**

```css
.chat { min-height: 320px; display: flex; flex-direction: column; gap: 12px; }
.msg { max-width: 78%; padding: 10px 14px; border-radius: var(--radius); font-size: 14px; white-space: pre-wrap; }
.msg.user { align-self: flex-end; background: #1f6feb33; border: 1px solid #1f6feb; }
.msg.bot { align-self: flex-start; background: var(--bg); border: 1px solid var(--border); }
.msg.card { align-self: flex-start; background: var(--bg); border: 1px solid var(--accent); }
.msg.card .card-title { color: var(--accent); font-weight: 600; margin-bottom: 6px; }
.msg .pill { display: inline-block; margin: 4px 6px 0 0; padding: 4px 10px; border: 1px solid var(--border); border-radius: 999px; font-size: 12px; }
.btn { margin-top: 16px; padding: 10px 20px; background: var(--accent); color: #08231f; border: 0; border-radius: var(--radius); font-weight: 700; cursor: pointer; }
```

- [ ] **Step 3: Append chat player to `frontend/app.js`** (before the final line)

```js
window.__init.push(() => {
  const chat = document.getElementById('chat');
  const play = document.getElementById('play');
  if (!chat || !play) return;

  // Canned script — mirrors the backend loop. No network.
  const script = [
    { cls: 'user', html: '@bot diagnose' },
    { cls: 'card', html: '<div class="card-title">🌐 请选择环境</div>第 1/2 步 · 环境<div><span class="pill">QAT</span><span class="pill">UAT</span><span class="pill">PROD</span></div>' },
    { cls: 'user', html: '选择：UAT' },
    { cls: 'card', html: '<div class="card-title">🌿 输入分支</div>第 2/2 步 · 分支<div><span class="pill">main（默认）</span></div>' },
    { cls: 'user', html: '玩家 12345 在 13:20 请求失败' },
    { cls: 'bot', html: '⏳ worker 分析中…' },
    { cls: 'card', html: '<div class="card-title">📋 诊断报告（模拟）</div>环境=UAT 分支=main\n根因：上游服务返回空额度。\n置信度 82%。' },
  ];

  function reset() { chat.innerHTML = ''; }
  function add(item) {
    const el = document.createElement('div');
    el.className = 'msg ' + item.cls;
    el.innerHTML = item.html;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
  }
  function playAll() {
    reset();
    play.disabled = true;
    let i = 0;
    const tick = () => {
      if (i >= script.length) { play.disabled = false; return; }
      add(script[i++]);
      setTimeout(tick, 700);
    };
    tick();
  }
  play.addEventListener('click', playAll);
  playAll();
});
```

- [ ] **Step 4: Verify**

Reload. The chat auto-plays the 7-step script; clicking ▶ 播放 replays it. No network requests in devtools.

- [ ] **Step 5: Commit**

```bash
git add frontend && git commit -m "feat(frontend): scripted IM chat demo"
```

---

### Task 14: Conventions + tech-decisions cards

**Files:**
- Modify: `frontend/index.html` (fill `#conventions`)

- [ ] **Step 1: Fill the `#conventions` section**

```html
  <section id="conventions" class="section">
    <h2>代码规范 & 技术决策</h2>
    <p class="lead">工程纲领与关键权衡 —— 面试讲解锚点。</p>
    <div class="grid cols-2">
      <div class="panel"><h3>工程纲领</h3>
        <ul>
          <li>kebab 文件名 · Pascal 类 · camel 方法</li>
          <li><code>interfaces/{module}</code> 桶导出，禁深路径 import</li>
          <li>禁 <code>forwardRef</code> · 禁跨边界 Service→Service</li>
          <li>i18n 每个 key en/zh 并排，漏一种语言编译失败</li>
          <li>注释用英文 · 对用户解释用简体中文</li>
        </ul>
      </div>
      <div class="panel"><h3>技术权衡</h3>
        <ul>
          <li><b>持久层 vs 缓存队列分工</b>：业务真相落数据库（按 threadKey upsert + 唯一索引）；Redis 只配做 cache + queue，绝不当可靠存储。</li>
          <li><b>threadKey 不用 thread_id</b>：thread_id 只在话题回复上出现、根消息事件里没有，会把一个话题劈成两个 key；用 root_id ?? message_id 才稳定。</li>
          <li><b>fail-fast 不降级</b>：持久层不可用则门卫启动失败（进程管理器重启兜底），运行期绝不退回文件存储。</li>
          <li><b>worker 纯大脑</b>：不持凭证、不碰 IM、崩溃只死自己；报告统一由 broker 出站。</li>
        </ul>
      </div>
    </div>
  </section>
```

- [ ] **Step 2: Verify**

Reload. Two cards render with conventions + tradeoffs.

- [ ] **Step 3: Commit**

```bash
git add frontend/index.html && git commit -m "feat(frontend): conventions and tech-decisions cards"
```

---

### Task 15: Top-level README + desensitization audit

**Files:**
- Create: `README.md` (repo root)

- [ ] **Step 1: Create root `README.md`**

```markdown
# ChatOps Command Bot — Architecture Demo

脱敏的「IM 命令机器人平台」架构展示。核心理念：确定性死流程交给无 LLM 的门卫全包，
只有真正需要分析的部分才交给短命 AI worker。

## 两部分

- `backend/` — 可运行。NestJS 确定性门卫 + config 驱动流程引擎 + mock AI worker。
  `cd backend && npm install && npm start`，另开一个 shell 跑 `bash demo.sh`。
- `frontend/` — 纯静态解说页，不接任何 API。双击 `frontend/index.html` 即看：
  架构图 + 核心理念、核心流程时序、模拟 IM 对话演示、代码规范 & 技术决策。

## 看点

- 两层架构：常驻确定性门卫 + 短命纯大脑 worker。
- config 驱动可扩展：新增能力 = 加一份 JSON。
- 线程隔离的 session 状态机：ACTIVE → AWAITING_FEEDBACK → CLOSED。
- 工程规范与技术权衡（持久层 vs 缓存、threadKey 选型、fail-fast）。

> 仅用于技术演示，不含任何真实业务 / 凭证信息。
```

- [ ] **Step 2: Run the desensitization audit**

Run from repo root:
```bash
grep -rInE 'casino|new ?port|fpms|snsoft|cli_aa|AccessKey|ALIBABA|lark.*secret' \
  --include='*.ts' --include='*.json' --include='*.js' --include='*.html' --include='*.md' \
  backend frontend README.md || echo "CLEAN"
```
Expected: `CLEAN` (no matches). If any match appears, replace with a generic placeholder and re-run.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "docs: root README + desensitization audit"
```

---

## Self-Review Notes (resolved)

- **Spec coverage:** 理念(Task 11) · 两层架构(Task 6,11) · config 驱动引擎(Task 2,3,4,7) · session 状态机+sweeper(Task 5,8) · 消息入口+demo(Task 8,9) · 前端四屏(Task 10-14) · 脱敏(Task 2 配置 + Task 15 审计) — all mapped.
- **Type consistency:** `CardSpec`/`CardBlock` (Task 3) consumed by StepEngine (Task 4) and orchestrator (Task 7); `Session`/`SessionState` (Task 5) consumed by orchestrator/sweeper; `WorkerRequest`/`WorkerResult` (Task 6) consumed by orchestrator; `InboundMessage`/`OutboundReply` (Task 7) consumed by controller (Task 8) — names consistent.
- **Placeholder scan:** every code step contains full code; no TBD/TODO.
```
