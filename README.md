# ChatOps Command Bot — Architecture Demo

**Language / 语言:** [English](#english) · [中文](#中文)

A desensitized "IM command bot platform" architecture demo — read it in your language below.

---

## English

A desensitized "IM command bot platform" architecture demo. The core idea: hand every
deterministic, predictable step to a **no-LLM gatekeeper**, and delegate only the parts that
genuinely need reasoning to a **short-lived AI worker**.

### 1. What is this?

Teams run ops commands inside an IM chat (e.g. "diagnose this failure"). A naive bot pipes
every message through an LLM — slow, non-deterministic, and expensive, when 90% of the
interaction is just menu-picking. This demo splits the bot into **two layers**:

- **Deterministic gatekeeper (no LLM)** — a long-running NestJS service that owns *everything
  predictable*: matching a keyword to a command, walking the user through option cards
  (env → branch → …), and managing per-thread session lifecycle. Zero AI → fast, cheap, 100%
  reproducible.
- **Short-lived AI worker (pure brain)** — spawned *only* for the one step that truly needs
  reasoning (analyzing the failure). It takes structured input, returns a report, and exits.
  In production it's a `claude -p` subprocess; here it's mocked. It never touches the IM
  channel — the gatekeeper owns all I/O.

> **The dividing line:** if the behavior can be written down as a flow, the gatekeeper does
> it; only open-ended analysis reaches the LLM.

### 2. Core concepts

- **Deterministic gatekeeper** — no-LLM service owning routing + session lifecycle + card rendering.
- **Config-driven flow** — a capability is one `flows/<cmd>.json` (`triggers / steps / closePolicy / worker.skill`); adding one needs no routing code changes.
- **Stateless StepEngine** — renders the next option card from config + session state; holds no state itself.
- **Thread-isolated session** — one state machine per IM thread (`ACTIVE → AWAITING_FEEDBACK → CLOSED`) plus an idle sweeper.
- **Short-lived worker** — pure-brain subprocess for the analysis step; returns a report, never touches the IM channel.

### 3. How it flows

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

A keyword enters the gatekeeper, which matches it to a config-defined flow and upserts a
thread session. The stateless StepEngine renders each option card; the user's picks advance
`stepIndex`. Once all steps are satisfied the session is "ready"; the next free-text message
triggers the short-lived worker, whose report the gatekeeper delivers back to the thread,
moving the session to `AWAITING_FEEDBACK`. `bash demo.sh` drives exactly this loop.

### 4. Project layout

- **`backend/`** — runnable. NestJS gatekeeper + config-driven flow engine + mock AI worker. Zero external services, runs entirely in memory.
- **`frontend/`** — a static explainer page (no API calls): architecture diagram, flow sequence, a simulated IM chat demo, and engineering decisions. Has a built-in zh/en toggle.

### 5. Run it

Prerequisite: **Node.js ≥ 18** and npm.

```bash
# 1. Start the backend
cd backend
npm install
npm run build && npm start      # or hot-reload: npm run start:dev

# 2. In another shell, drive one full command loop
cd backend
bash demo.sh

# 3. Run the tests
npm test
```

`demo.sh` prints one full loop: `keyword → env card → branch card → ready → mock worker report`.

> Default port is `3000`. If taken, run both sides with the same port:
> `PORT=3137 npm start` and `PORT=3137 bash demo.sh`.

To view the frontend, just open `frontend/index.html` in a browser — no build, no server.

### 6. Add a new capability (no routing/lifecycle changes)

1. Drop a `backend/src/flows/<command>.json` (declares `triggers / closePolicy / worker.skill / steps[]`).
2. Register it in `FlowRegistryService`'s `flows` array.

The stateless StepEngine and session lifecycle handle the rest.

> For technical demonstration only — no real business data or credentials.

---

## 中文

脱敏的「IM 命令机器人平台」架构展示。核心理念：所有确定、可预测的步骤交给**无 LLM 门卫**，
只有真正需要推理的部分才交给**短命 AI worker**。

### 1. 这是什么？

团队在 IM 会话里跑运维命令（比如「诊断这次失败」）。朴素做法是把每条消息都灌给 LLM——又慢、
又不确定、又贵，而整个交互里 90% 只是在选菜单。本 demo 把机器人拆成**两层**：

- **确定性门卫（无 LLM）** —— 常驻的 NestJS 服务，掌管*所有可预测的部分*：关键词匹配命令、
  用选项卡片带用户逐步走完（环境 → 分支 → …）、管理每个线程的 session 生命周期。零 AI →
  快、便宜、100% 可复现。
- **短命 AI worker（纯大脑）** —— *只*在真正需要推理的那一步（分析失败原因）被拉起。吃结构化
  输入、吐一份报告、然后退出。生产环境是一个 `claude -p` 子进程，这里用 mock 代替。它从不碰
  IM 通道——所有 I/O 都归门卫。

> **分界线：** 能写成流程的，门卫全包；只有开放式的分析才交给 LLM。

### 2. 核心概念

- **确定性门卫** —— 无 LLM 服务，掌管路由 + session 生命周期 + 卡片渲染。
- **config 驱动流程** —— 一个能力 = 一份 `flows/<cmd>.json`（`triggers / steps / closePolicy / worker.skill`）；新增能力不动路由代码。
- **无状态 StepEngine** —— 依据 config + session 状态渲染下一张卡片，自身不存状态。
- **线程隔离 session** —— 每个 IM 线程一个状态机（`ACTIVE → AWAITING_FEEDBACK → CLOSED`）+ 空闲清扫。
- **短命 worker** —— 分析步骤的纯大脑子进程，返回报告，不碰 IM 通道。

### 3. 运行流程

```
IM 线程                  网关               编排器 + StepEngine              AI worker
   │  "diagnose"    POST /message   ──►  匹配命令，upsert session
   │  ◄───────────────────────────────  渲染环境卡片
   │  选 env=uat    ──────────────────►  推进步骤，渲染分支卡片
   │  ◄───────────────────────────────  渲染分支卡片
   │  选 branch     ──────────────────►  步骤走完 → 「就绪，请描述问题」
   │  自由文本      ──────────────────►  拉起 worker  ─────────────────►  分析
   │  ◄───────────────────────────────  下发报告      ◄────────────────  返回结果，退出
   │                                     session → AWAITING_FEEDBACK
```

关键词进入门卫，匹配到 config 定义的流程并 upsert 线程 session。无状态 StepEngine 逐张渲染
选项卡片，用户的选择推进 `stepIndex`。所有步骤满足后 session 进入「就绪」；下一条自由文本触发
短命 worker，门卫把它的报告发回线程，并将 session 转入 `AWAITING_FEEDBACK`。`bash demo.sh`
就是端到端跑一遍这个回路。

### 4. 项目组成

- **`backend/`** —— 可运行。NestJS 门卫 + config 驱动流程引擎 + mock AI worker，零外部依赖，全内存运行。
- **`frontend/`** —— 纯静态解说页，不接任何 API：架构图、流程时序、模拟 IM 对话演示、工程决策。内置中/英切换。

### 5. 如何运行

前置要求：**Node.js ≥ 18** 与 npm。

```bash
# 1. 启动后端
cd backend
npm install
npm run build && npm start      # 或热重载：npm run start:dev

# 2. 另开一个 shell，跑一遍完整命令回路
cd backend
bash demo.sh

# 3. 运行测试
npm test
```

`demo.sh` 会打印一个完整回路：`关键词 → 环境卡片 → 分支卡片 → 就绪 → mock worker 报告`。

> 端口默认 `3000`。被占用时，两边用同一端口启动：
> `PORT=3137 npm start` 与 `PORT=3137 bash demo.sh`。

查看前端：直接用浏览器打开 `frontend/index.html`——无需构建、无需服务器。

### 6. 新增一个能力（无需改路由 / 生命周期）

1. 放一份 `backend/src/flows/<command>.json`（声明 `triggers / closePolicy / worker.skill / steps[]`）。
2. 在 `FlowRegistryService` 的 `flows` 数组里注册。

其余由无状态的 StepEngine 与 session 生命周期自动接管。

> 仅用于技术演示，不含任何真实业务 / 凭证信息。
