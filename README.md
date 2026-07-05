# ChatOps Command Bot

**Language / 语言:** [English](#english) · [中文](#中文)

A real IM command bot for Slack and Lark. The core idea: hand every deterministic,
predictable step to a **no-LLM gatekeeper**, and delegate only the parts that genuinely need
reasoning to a **short-lived Claude worker**.

---

## English

### 1. What is this?

Teams run ops commands inside an IM chat (e.g. "diagnose this failure"). A naive bot pipes
every message through an LLM — slow, non-deterministic, and expensive, when 90% of the
interaction is just menu-picking. This bot splits the work into **two layers**:

- **Deterministic gatekeeper (no LLM)** — a long-running NestJS service that owns *everything
  predictable*: matching a keyword to a command, walking the user through option cards
  (env → branch → …), and managing per-thread session lifecycle in MongoDB. Zero AI → fast,
  cheap, 100% reproducible.
- **Short-lived Claude worker (pure brain)** — a `claude -p` subprocess spawned *only* for the
  one step that truly needs reasoning (analyzing the issue). It investigates this repository
  read-only (`Read`/`Grep`/`Glob`), returns a structured card, and exits. It never touches the
  IM channel — the gatekeeper owns all I/O.

> **The dividing line:** if the behavior can be written down as a flow, the gatekeeper does
> it; only open-ended analysis reaches the LLM.

### 2. Core concepts

- **Channel adapters** — Slack (Bolt, Socket Mode) and Lark (WebSocket long connection) map
  platform events to one channel-neutral message contract; everything behind them is
  platform-agnostic.
- **Config-driven flow** — a capability is one `flows/<cmd>.json` (`triggers / steps /
  closePolicy / worker.skill`); adding one needs no routing code changes.
- **Stateless StepEngine** — renders the next option card from config + session state; holds no state itself.
- **Thread-isolated session (MongoDB)** — one state machine per IM thread
  (`ACTIVE → INVESTIGATING → AWAITING_FEEDBACK → CLOSED`), unique-indexed by `threadKey`;
  survives restarts. Each thread also pins its Claude session id, so follow-up questions
  resume the same Claude conversation with full context.
- **Investigation queue (BullMQ + Redis)** — investigations run async; the user gets an
  immediate "investigating…" ack and the report is pushed back into the same thread later.
- **Card validation + repair loop** — the worker must emit card JSON matching a channel-neutral
  grammar; invalid output is re-prompted to the *same* Claude session (max 2 rounds), then
  degrades to plain text so content is never lost.
- **Lifecycle sweeper** — idle `AWAITING_FEEDBACK` sessions get one nag after 2h, then close
  after another 2h of silence; idle `ACTIVE` sessions close with a notice.

### 3. How it flows

```
Slack / Lark              Adapter              Orchestrator + StepEngine        Queue + Claude worker
   │  "diagnose"     WebSocket event  ──►  match command, upsert session (Mongo)
   │  ◄────────────────────────────────  render env card
   │  pick env=uat   ──────────────────►  advance step, render branch card
   │  pick branch    ──────────────────►  steps done → "ready, describe the issue"
   │  free text      ──────────────────►  enqueue job, session → INVESTIGATING
   │  ◄────────────────────────────────  "Investigating…" ack
   │                                            consumer spawns `claude -p` ──►  read-only investigation
   │                                            validate card (≤2 repair rounds)
   │  ◄────────────────────────────────  report card pushed into the thread
   │                                       session → AWAITING_FEEDBACK
```

### 4. Project layout

- **`backend/`** — the bot. NestJS gatekeeper + channel adapters + config-driven flow engine +
  BullMQ investigation pipeline + Claude worker runner. Requires MongoDB and Redis (see §5).
- **`frontend/`** — a static explainer page (no API calls): architecture diagram, flow
  sequence, a scripted IM chat animation, and engineering decisions. Has a built-in zh/en toggle.
- **`docker-compose.yml`** — MongoDB (host port 27018) and Redis (host port 6380) on
  non-default ports so they never clash with locally installed services.

### 5. Run it

Prerequisites:

- **Node.js ≥ 20** and npm
- **MongoDB + Redis** — either `docker compose up -d` (ports 27018/6380), or point the env
  vars at your own local services. The backend **fails fast at startup if Mongo is
  unreachable**, and enqueueing fails loudly if Redis is down — there is no silent in-memory
  fallback.
- **A logged-in Claude Code CLI** (`claude`) on `PATH` — the investigation worker shells out
  to it (read-only tools, repo as working directory; override with `WORKER_CWD`).
- **Slack and/or Lark app credentials** — an adapter with no credentials logs a warning and
  disables itself; the rest of the app runs fine.

```bash
# 1. Infrastructure
docker compose up -d              # or use your own Mongo/Redis via env vars

# 2. Configure
cd backend
cp .env.example .env              # fill in Slack/Lark credentials (setup steps are in the file)

# 3. Start
npm install
npm run start:dev                 # or: npm run build && npm start

# 4. Tests
npm test
```

Slack setup (details in `.env.example`): create an app at api.slack.com/apps → enable
**Socket Mode** → App-Level Token (`connections:write`) → Bot Token Scopes `chat:write`,
`app_mentions:read`, `im:history` → subscribe to `app_mention` + `message.im` → enable
Interactivity → install. Then DM the bot or `@mention` it in a channel with a trigger word
(e.g. `diagnose`).

| Env var             | Default                             | Notes |
|----------------------|--------------------------------------|-------|
| `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` | — | Slack adapter (disabled if unset) |
| `LARK_APP_ID` / `LARK_APP_SECRET`     | — | Lark adapter (disabled if unset) |
| `MONGO_URI`          | `mongodb://localhost:27018/chatops`  | default matches docker compose; use `27017` for a local install |
| `REDIS_HOST`         | `localhost`                          | |
| `REDIS_PORT`         | `6380`                                | default matches docker compose; use `6379` for a local install |
| `WORKER_TIMEOUT_MS`  | `300000`                              | max time to wait for the investigation worker |
| `WORKER_CWD`         | process cwd                          | working directory for the `claude` subprocess |
| `IDLE_MS`            | `7200000`                             | idle time before a session gets a nag |
| `SWEEP_MS`           | `300000`                              | sweeper poll interval |
| `PORT`               | `3000`                                | HTTP port (keeps the process alive; adapters are the real entry points) |

> `IDLE_MS` and `SWEEP_MS` are read once at class load, so they must be set **before** the
> process starts (e.g. `IDLE_MS=60000 SWEEP_MS=10000 npm start`) — changing them at runtime has
> no effect.

Session state is persisted in MongoDB (`chatops.sessions`), so it survives a backend restart —
the same thread can resume mid-flow.

To view the frontend, just open `frontend/index.html` in a browser — no build, no server.

### 6. Add a new capability (no routing/lifecycle changes)

1. Drop a `backend/src/flows/<command>.json` (declares `triggers / closePolicy / worker.skill / steps[]`).
2. Register it in `FlowRegistryService`'s `flows` array.

The stateless StepEngine and session lifecycle handle the rest.

> No real business data or credentials in this repository.

---

## 中文

真实可用的 Slack / Lark IM 命令机器人。核心理念：所有确定、可预测的步骤交给**无 LLM 门卫**，
只有真正需要推理的部分才交给**短命 Claude worker**。

### 1. 这是什么？

团队在 IM 会话里跑运维命令（比如「诊断这次失败」）。朴素做法是把每条消息都灌给 LLM——又慢、
又不确定、又贵，而整个交互里 90% 只是在选菜单。本项目把机器人拆成**两层**：

- **确定性门卫（无 LLM）** —— 常驻的 NestJS 服务，掌管*所有可预测的部分*：关键词匹配命令、
  用选项卡片带用户逐步走完（环境 → 分支 → …）、把每个线程的 session 生命周期持久化在
  MongoDB。零 AI → 快、便宜、100% 可复现。
- **短命 Claude worker（纯大脑）** —— *只*在真正需要推理的那一步（分析问题）被拉起的
  `claude -p` 子进程。它以只读方式（`Read`/`Grep`/`Glob`）调查本仓库，返回一张结构化卡片，
  然后退出。它从不碰 IM 通道——所有 I/O 都归门卫。

> **分界线：** 能写成流程的，门卫全包；只有开放式的分析才交给 LLM。

### 2. 核心概念

- **渠道 adapter** —— Slack（Bolt，Socket Mode）与 Lark（WebSocket 长连接）把平台事件映射到
  同一套渠道中立的消息契约；后面的一切都与平台无关。
- **config 驱动流程** —— 一个能力 = 一份 `flows/<cmd>.json`（`triggers / steps / closePolicy / worker.skill`）；新增能力不动路由代码。
- **无状态 StepEngine** —— 依据 config + session 状态渲染下一张卡片，自身不存状态。
- **线程隔离 session（MongoDB）** —— 每个 IM 线程一个状态机
  （`ACTIVE → INVESTIGATING → AWAITING_FEEDBACK → CLOSED`），按 `threadKey` 唯一索引，重启不丢。
  每个线程还固定住自己的 Claude session id，同一线程追问会 resume 同一个 Claude 会话、带完整上下文。
- **调查队列（BullMQ + Redis）** —— 调查异步执行；用户立即收到「调查中…」确认，报告稍后推回同一线程。
- **卡片校验 + 修复循环** —— worker 必须输出符合渠道中立语法的卡片 JSON；不合法时带错误
  重新 prompt *同一个* Claude 会话（最多 2 轮），仍失败则降级为纯文本，内容绝不丢失。
- **生命周期清扫器** —— `AWAITING_FEEDBACK` 空闲 2 小时催一次反馈，再沉默 2 小时自动关闭；
  空闲的 `ACTIVE` session 关闭并附通知。

### 3. 运行流程

```
Slack / Lark              Adapter               编排器 + StepEngine             队列 + Claude worker
   │  "diagnose"     WebSocket 事件  ──►  匹配命令，upsert session（Mongo）
   │  ◄────────────────────────────────  渲染环境卡片
   │  选 env=uat     ──────────────────►  推进步骤，渲染分支卡片
   │  选 branch      ──────────────────►  步骤走完 → 「就绪，请描述问题」
   │  自由文本       ──────────────────►  任务入队，session → INVESTIGATING
   │  ◄────────────────────────────────  「调查中…」确认
   │                                            consumer 拉起 `claude -p` ──►  只读调查
   │                                            卡片校验（≤2 轮修复）
   │  ◄────────────────────────────────  报告卡片推回线程
   │                                       session → AWAITING_FEEDBACK
```

### 4. 项目组成

- **`backend/`** —— 机器人本体。NestJS 门卫 + 渠道 adapter + config 驱动流程引擎 + BullMQ
  调查管线 + Claude worker runner。需要 MongoDB 和 Redis（见 §5）。
- **`frontend/`** —— 纯静态解说页，不接任何 API：架构图、流程时序、脚本化的 IM 对话动画、
  工程决策。内置中/英切换。
- **`docker-compose.yml`** —— MongoDB（宿主机端口 27018）与 Redis（宿主机端口 6380），
  用非默认端口避免与本机已装服务冲突。

### 5. 如何运行

前置要求：

- **Node.js ≥ 20** 与 npm
- **MongoDB + Redis** —— `docker compose up -d`（端口 27018/6380），或通过环境变量指向你
  本机的服务。**Mongo 连不上时后端启动即失败**，Redis 挂掉时入队会立刻报错——没有静默的
  内存降级。
- **已登录的 Claude Code CLI**（`claude`）在 `PATH` 上 —— 调查 worker 通过它执行
  （只读工具，工作目录为仓库；可用 `WORKER_CWD` 覆盖）。
- **Slack 和/或 Lark 应用凭证** —— 未配置凭证的 adapter 会打印警告并自行禁用，其余功能不受影响。

```bash
# 1. 基础设施
docker compose up -d              # 或通过环境变量使用你自己的 Mongo/Redis

# 2. 配置
cd backend
cp .env.example .env              # 填入 Slack/Lark 凭证（配置步骤见文件内注释）

# 3. 启动
npm install
npm run start:dev                 # 或：npm run build && npm start

# 4. 测试
npm test
```

Slack 配置（细节见 `.env.example`）：在 api.slack.com/apps 创建应用 → 开启 **Socket
Mode** → App-Level Token（`connections:write`）→ Bot Token Scopes：`chat:write`、
`app_mentions:read`、`im:history` → 订阅 `app_mention` + `message.im` 事件 → 开启
Interactivity → 安装到工作区。然后私聊机器人或在频道 `@` 它并说出触发词（如 `diagnose`）。

| 环境变量              | 默认值                                | 说明 |
|----------------------|--------------------------------------|------|
| `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` | —      | Slack adapter（未设置则禁用） |
| `LARK_APP_ID` / `LARK_APP_SECRET`     | —      | Lark adapter（未设置则禁用） |
| `MONGO_URI`           | `mongodb://localhost:27018/chatops`  | 默认对应 docker compose；本机安装用 `27017` |
| `REDIS_HOST`          | `localhost`                          | |
| `REDIS_PORT`          | `6380`                                | 默认对应 docker compose；本机安装用 `6379` |
| `WORKER_TIMEOUT_MS`   | `300000`                              | 等待调查 worker 的最长时间 |
| `WORKER_CWD`          | 进程当前目录                          | `claude` 子进程的工作目录 |
| `IDLE_MS`             | `7200000`                             | session 触发催反馈前的空闲时长 |
| `SWEEP_MS`            | `300000`                              | 清扫器轮询间隔 |
| `PORT`                | `3000`                                | HTTP 端口（仅维持进程存活；真正的入口是 adapter） |

> `IDLE_MS` 与 `SWEEP_MS` 在类加载时读取一次，必须在**进程启动前**设置
> （如 `IDLE_MS=60000 SWEEP_MS=10000 npm start`）——运行期修改无效。

session 状态持久化在 MongoDB（`chatops.sessions`），后端重启不丢——同一线程可以从中断处继续。

查看前端：直接用浏览器打开 `frontend/index.html`——无需构建、无需服务器。

### 6. 新增一个能力（不动路由/生命周期）

1. 放一份 `backend/src/flows/<command>.json`（声明 `triggers / closePolicy / worker.skill / steps[]`）。
2. 在 `FlowRegistryService` 的 `flows` 数组里注册。

无状态 StepEngine 与 session 生命周期会处理其余一切。

> 本仓库不含任何真实业务数据或凭证。
