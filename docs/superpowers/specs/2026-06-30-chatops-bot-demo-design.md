# ChatOps Command Bot — Architecture Demo

> 面试用技术架构展示。脱敏自一套真实生产的「IM 命令机器人平台」，剥离公司业务、外部凭证与第三方依赖，
> 只保留可复用的架构思想、设计流程与工程规范。

## 0. 目标与非目标

**目标**
- 用一个**可运行的后端** + 一个**纯静态前端解说页**，在面试中演示：技术架构、核心设计理念、核心流程、代码规范。
- 后端零外部依赖，`npm install && npm start` 即可跑通一次完整「命令 → 向导 → worker → 回复」闭环。
- 前端不接任何 API，双击 `index.html` 即看；含架构图、核心理念、流程时序、模拟 IM 对话演示。
- 全程脱敏：无公司名、无真实 App ID / AccessKey、无具体业务逻辑，统一抽象为「通用 ChatOps 助手」。

**非目标**
- 不还原真实的飞书 WebSocket 接入、阿里云 SLS 查询、Claude CLI 子进程。
- 后端不连真实数据库 / 队列 / IM（全部内存模拟）。
- 前端演示是写死的剧本，不调用后端。

## 1. 核心理念（要在 demo 里讲清楚的）

- **确定性优先**：能用确定性死流程做掉的，**门卫（无 LLM）全包**；只有真正需要分析 / 动态的部分才丢给 **worker（AI 子进程）**。门卫是确定性代码，不会退化。
- **一个 thread = 一个命令实例，从生到死**：线程隔离是铁律。
- **能力 config 驱动、可扩展**：新增一个命令 = 加一份 JSON + 一个 worker skill，不碰路由 / 生命周期。
- **职责分层**：broker 持有所有出站与凭证；worker 是纯大脑，跑完即退、不碰 IM、崩溃只死自己。

## 2. 顶层结构

```
chatops-bot-demo/
├── backend/      # 可运行：NestJS 确定性门卫 + config 驱动流程引擎 + mock AI worker
├── frontend/     # 纯静态：架构图 + 核心理念 + 流程时序 + 模拟 IM 对话演示（不接 API）
├── docs/         # 本 spec 与实施计划
└── README.md     # 怎么跑、怎么讲、脱敏说明
```

两部分完全独立，互不依赖。

## 3. 后端设计（backend/，可运行）

技术栈：**NestJS + TypeScript**（保留真实的工程约定，不是摆拍）。移除 Redis/BullMQ/SLS/飞书 SDK，全部换内存模拟。

保留源项目最有价值的 4 个设计：

### 3.1 两层架构
- `broker`：NestJS 常驻门卫，无 LLM，承载解析 / 命令路由 / 向导状态机 / session 生命周期 / 出站。
- `worker`：短命「子进程」抽象，纯大脑。Demo 用 **mock 实现**（异步返回模拟「诊断报告」字符串），
  **保留真实契约**：worker 把报告作为最终输出返回，broker 读取后发回 thread；worker 不碰 IM。

### 3.2 config 驱动的流程引擎
- 一份 `flows/diagnose.json` 声明 `triggers / closePolicy / worker.skill / steps[] / feedback`。
- 一套无状态 `StepEngine` 支持三种 step：`choice`（按钮）/ `input`（输入框）/ `multiselect`（多选）。
- 支持动态选项 `source`（`{{collected}}` 模板）、`optional`、`when` 条件渲染。
- **新增能力 = 加一份 JSON**，不改路由 / 生命周期代码。

### 3.3 线程隔离的 session 状态机
- 生命周期：`ACTIVE → AWAITING_FEEDBACK → CLOSED`（CLOSED 为永久终态）。
- 按 `threadKey` 隔离（Demo 内存 store；注释说明生产用 MongoDB upsert + `threadKey` 唯一索引）。
- 保留 sweeper：闲置超时自动关闭。
- `closePolicy`：`conversational`（投递后保持 ACTIVE 可追问）/ `oneshot`（投递完即收尾）。

### 3.4 消息入口（demo 用，非真实 IM）
- `POST /message`：模拟「收到一条 IM 消息」，body 含 `threadKey / text / cardAction?`，返回卡片 JSON。
- 附 `demo.sh`（或 Node 脚本）串起一次完整多步向导，命令行可见
  `命令 → 出卡 → 收集输入 → worker 分析 → 结构化报告` 闭环。

### 3.5 目录（建议）
```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── interfaces/{flow,session,worker}/index.ts   # 桶导出
│   ├── flows/diagnose.json
│   └── modules/
│       ├── gateway/        # POST /message 入口控制器
│       ├── flow/           # StepEngine + FlowRegistry
│       ├── session/        # SessionService + Sweeper（内存 store）
│       └── worker/         # mock worker（保留 stdout-result 契约）
├── demo.sh
├── package.json
└── README.md
```

## 4. 前端设计（frontend/，纯静态，不接 API）

单页 `index.html` + `styles.css` + `app.js`（原生 HTML/CSS/JS，无构建、无依赖）。深色技术风，适合投屏。
四屏滚动：

1. **核心理念**：一句话主张 + 「确定性死流程门卫全包，只有分析交给 AI」哲学 + 两层架构 SVG 图。
2. **核心流程时序**：一条命令从入口到回复的时序图，点一步亮一步，讲 config 出卡 + session 状态流转。
3. **模拟 IM 对话演示**：仿 IM 聊天 UI，脚本化播放
   「用户 @bot diagnose → env 选择卡 → 选分支 → worker 分析中… → 结构化报告卡」全程动画。
   **全前端写死剧本，不连后端。**
4. **代码规范 / 技术决策**：卡片罗列工程纲领（命名、桶导出、i18n 编译期约束、禁 forwardRef / 跨层 Service）
   + 关键技术权衡（持久层 vs 缓存队列职责分工、threadKey 为何不用 thread_id、fail-fast 不降级）。

## 5. 脱敏清单（实现时必须执行）

- 公司 / 产品名 → 通用占位（无 Casino Plus / New Port / FPMS）。
- 真实 App ID / AccessKey / 域名 / 仓库名 → 占位或删除。
- 具体 bug 业务、SLS logstore、env 别名 → 抽象为通用「服务日志 / 环境」。
- 飞书专有字段名可保留为「IM 消息」抽象，不暴露真实租户信息。

## 6. 成功标准

- [ ] `cd backend && npm install && npm start`，运行 `demo.sh` 看到完整命令闭环输出。
- [ ] 新增一个命令只需加一份 `flows/*.json`，无需改路由代码（可在 README 演示）。
- [ ] 前端双击 `index.html` 即可看到四屏 + 可播放的模拟对话动画，零网络请求。
- [ ] 全仓库 grep 不到任何真实公司 / 凭证信息。
