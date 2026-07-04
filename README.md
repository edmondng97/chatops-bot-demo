# ChatOps Command Bot — Architecture Demo

A desensitized "IM command bot platform" architecture showcase. Core idea: hand the
deterministic, dead-simple flow entirely to a **no-LLM gatekeeper**, and only delegate the
parts that genuinely need analysis to a **short-lived AI worker**.

> 脱敏的「IM 命令机器人平台」架构展示。核心理念：确定性死流程交给无 LLM 的门卫全包，
> 只有真正需要分析的部分才交给短命 AI worker。

---

## English

### What's inside

- **`backend/`** — Runnable. NestJS deterministic gatekeeper + config-driven flow engine + mock AI worker. Zero external services, runs entirely in memory.
- **`frontend/`** — A static explainer page (no API calls): architecture diagram, core-flow sequence, a simulated IM chat demo, and engineering decisions.

### Prerequisites

- Node.js ≥ 18 and npm.

### Run the backend

```bash
cd backend
npm install
npm run build && npm start      # or hot-reload: npm run start:dev
```

In **another shell**, drive one full command loop:

```bash
cd backend
bash demo.sh
```

You will see one full loop: `keyword → env card → branch card → ready → mock worker report`.

> Default port is `3000`. If it's taken, run both sides with the same port:
> `PORT=3137 npm start` and `PORT=3137 bash demo.sh`.

### Run the tests

```bash
cd backend
npm test
```

### View the frontend

Just open `frontend/index.html` in a browser (double-click it) — no build, no server needed.
A zh/en language toggle is built into the page.

### Add a new capability (no routing/lifecycle changes)

1. Drop a `backend/src/flows/<command>.json` (declares `triggers / closePolicy / worker.skill / steps[]`).
2. Register it in `FlowRegistryService`'s `flows` array.

The stateless StepEngine and session lifecycle handle the rest.

---

## 中文

### 项目组成

- **`backend/`** — 可运行。NestJS 确定性门卫 + config 驱动流程引擎 + mock AI worker，零外部依赖，全内存运行。
- **`frontend/`** — 纯静态解说页，不接任何 API：架构图 + 核心理念、核心流程时序、模拟 IM 对话演示、工程决策。

### 环境要求

- Node.js ≥ 18 与 npm。

### 运行后端

```bash
cd backend
npm install
npm run build && npm start      # 或热重载：npm run start:dev
```

**另开一个 shell**，跑一遍完整命令回路：

```bash
cd backend
bash demo.sh
```

会看到一个完整回路：`关键词 → 环境卡片 → 分支卡片 → 就绪 → mock worker 报告`。

> 端口默认 `3000`。被占用时，两边用同一端口启动：
> `PORT=3137 npm start` 与 `PORT=3137 bash demo.sh`。

### 运行测试

```bash
cd backend
npm test
```

### 查看前端

直接用浏览器打开 `frontend/index.html`（双击即可）——无需构建、无需服务器。页面内置中/英切换。

### 新增一个能力（无需改路由 / 生命周期）

1. 放一份 `backend/src/flows/<command>.json`（声明 `triggers / closePolicy / worker.skill / steps[]`）。
2. 在 `FlowRegistryService` 的 `flows` 数组里注册。

其余由无状态的 StepEngine 与 session 生命周期自动接管。

---

## 看点 / Highlights

- 两层架构：常驻确定性门卫 + 短命纯大脑 worker。 / Two-layer architecture: a resident deterministic gatekeeper + a short-lived pure-brain worker.
- config 驱动可扩展：新增能力 = 加一份 JSON。 / Config-driven extensibility: a new capability = one JSON file.
- 线程隔离的 session 状态机：`ACTIVE → AWAITING_FEEDBACK → CLOSED`。 / Thread-isolated session state machine.
- 工程规范与技术权衡（持久层 vs 缓存、threadKey 选型、fail-fast）。 / Engineering conventions and trade-offs.

> 仅用于技术演示，不含任何真实业务 / 凭证信息。 / For technical demonstration only — no real business data or credentials.
