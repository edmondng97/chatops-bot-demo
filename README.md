# ChatOps Command Bot — Architecture Demo

脱敏的「IM 命令机器人平台」架构展示。核心理念：确定性死流程交给无 LLM 的门卫全包，
只有真正需要分析的部分才交给短命 AI worker。

## 两部分

- `backend/` — 可运行。NestJS 确定性门卫 + config 驱动流程引擎 + mock AI worker。
  `cd backend && npm install && npm start`，另开一个 shell 跑 `bash demo.sh`。
  （端口默认 3000，被占用时用 `PORT=3137 npm start` + `PORT=3137 bash demo.sh`。）
- `frontend/` — 纯静态解说页，不接任何 API。双击 `frontend/index.html` 即看：
  架构图 + 核心理念、核心流程时序、模拟 IM 对话演示、代码规范 & 技术决策。

## 看点

- 两层架构：常驻确定性门卫 + 短命纯大脑 worker。
- config 驱动可扩展：新增能力 = 加一份 JSON。
- 线程隔离的 session 状态机：ACTIVE → AWAITING_FEEDBACK → CLOSED。
- 工程规范与技术权衡（持久层 vs 缓存、threadKey 选型、fail-fast）。

> 仅用于技术演示，不含任何真实业务 / 凭证信息。
