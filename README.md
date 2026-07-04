# ChatOps Command Bot — Architecture Demo

A desensitized "IM command bot platform" architecture showcase. Core idea: hand the
deterministic, dead-simple flow entirely to a **no-LLM gatekeeper**, and only delegate the
parts that genuinely need analysis to a **short-lived AI worker**.

> 脱敏的「IM 命令机器人平台」架构展示。核心理念：确定性死流程交给无 LLM 的门卫全包，
> 只有真正需要分析的部分才交给短命 AI worker。

---

## Overview / 概览

**EN** — Teams run ops commands inside an IM chat (e.g. "diagnose this failure"). A naive
bot pipes everything through an LLM, which is slow, non-deterministic, and expensive for the
90% of the interaction that is just menu-picking. This demo splits the bot into two layers:

- **Deterministic gatekeeper (no LLM)** — a long-running NestJS service that owns *everything
  predictable*: matching a keyword to a command, walking the user through option cards
  (env → branch → …), and managing per-thread session lifecycle. Zero AI, so it's fast,
  cheap, and 100% reproducible.
- **Short-lived AI worker (pure brain)** — spawned *only* for the one step that genuinely
  needs reasoning (analyzing the failure). It takes structured input, returns a report, and
  dies. In production it's a `claude -p` subprocess; here it's mocked. It never touches the
  IM channel — the gatekeeper owns all I/O.

The dividing line: **if the behavior can be written down as a flow, the gatekeeper does it;
only open-ended analysis reaches the LLM.**

**中文** — 团队在 IM 会话里跑运维命令（比如「诊断这次失败」）。朴素做法是把所有输入都灌给
LLM——但整个交互里 90% 只是选菜单，用 LLM 又慢、又不确定、又贵。本 demo 把机器人拆成两层：

- **确定性门卫（无 LLM）** —— 常驻的 NestJS 服务，掌管*所有可预测的部分*：关键词匹配命令、
  用选项卡片带用户逐步走完（环境 → 分支 → …）、管理每个线程的 session 生命周期。零 AI，
  所以快、便宜、100% 可复现。
- **短命 AI worker（纯大脑）** —— *只*在真正需要推理的那一步（分析失败原因）被拉起。吃结构化
  输入、吐一份报告、然后退出。生产环境是一个 `claude -p` 子进程，这里用 mock 代替。它从不碰
  IM 通道——所有 I/O 都归门卫。

分界线：**能写成流程的，门卫全包；只有开放式的分析才交给 LLM。**

## Core concepts / 核心概念

| Concept | EN | 中文 |
|---|---|---|
| **Deterministic gatekeeper** | No-LLM service owning routing + lifecycle + card rendering | 无 LLM 服务，掌管路由 + 生命周期 + 卡片渲染 |
| **Config-driven flow** | A capability = one `flows/<cmd>.json` (`triggers / steps / closePolicy / worker.skill`); no code changes to routing | 一个能力 = 一份 `flows/<cmd>.json`；不动路由代码 |
| **Stateless StepEngine** | Renders the next option card from config + session state; holds no state itself | 依据 config + session 状态渲染下一张卡片，自身不存状态 |
| **Thread-isolated session** | One state machine per IM thread: `ACTIVE → AWAITING_FEEDBACK → CLOSED`, plus an idle sweeper | 每个 IM 线程一个状态机 + 空闲清扫 |
| **Short-lived worker** | Pure-brain subprocess for the analysis step; returns a report, never touches the IM channel | 分析步骤的纯大脑子进程，返回报告，不碰 IM 通道 |

## Flow / 运行流程

```
IM thread                Gateway            Orchestrator + StepEngine        AI worker
   │  "diagnose"    POST /message   ──►  match command, upsert session
   │  ◄───────────────────────────────  render env card
   │  pick env=uat  ──────────────────►  advance step, render branch card
   │  ◄───────────────────────────────  render branch card
   │  pick branch   ──────────────────►  steps done → "ready, describe the issue"
   │  free text     ──────────────────►  spawn worker  ─────────────────►  analyze
   │  ◄───────────────────────────────  deliver report  ◄────────────────  return result, exit
   │                                     session → AWAITING_FEEDBACK
```

**EN** — Keyword enters the gatekeeper, which matches it to a config-defined flow and
upserts a thread session. The stateless StepEngine renders each option card; the user's
picks advance `stepIndex`. Once all steps are satisfied the session is "ready"; the next
free-text message triggers the short-lived worker, whose report the gatekeeper delivers back
to the thread and moves the session to `AWAITING_FEEDBACK`.

**中文** — 关键词进入门卫，匹配到 config 定义的流程并 upsert 线程 session。无状态 StepEngine
逐张渲染选项卡片，用户的选择推进 `stepIndex`。所有步骤满足后 session 进入「就绪」；下一条自由
文本触发短命 worker，门卫把它的报告发回线程，并将 session 转入 `AWAITING_FEEDBACK`。

`bash demo.sh` drives exactly this loop end to end. / `bash demo.sh` 就是端到端跑一遍这个回路。

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
