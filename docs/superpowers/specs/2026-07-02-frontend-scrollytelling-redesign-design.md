# Frontend Scrollytelling Redesign — Design Spec

日期：2026-07-02
范围：`frontend/`（index.html / styles.css / app.js）全量重写
目标：把现有「大学生作业感」的静态展示页，重designed 成 Linear/Vercel 气质的暗色科技风全站 scrollytelling 单页，第一屏能 amaze，同时经得起细看和移动端访问。

## 背景与目标

- 观众：技术面试官（现场演示 / 简历长期链接），两种场景都要成立。
- 内容主体不变：ChatOps Command Bot 的 broker(确定性门卫) + worker(AI 纯大脑) 架构。
- 允许：重写全部结构、样式、脚本、文案。技术事实不得改变。
- 不允许：接触后端代码；引入构建步骤。

## 技术方案

纯静态三文件，零构建：

- GSAP 3.13 + ScrollTrigger（已有，CDN）
- **新增依赖：Lenis（CDN，~4KB）** 提供惯性平滑滚动 — 已获用户批准
- 新增 Google Fonts：JetBrains Mono（等宽点缀，标签/编号/代码感元素）
- 中文正文/标题走系统字体栈（PingFang SC / Noto Sans SC fallback）

## 视觉语言

- 底色近黑（#0a0a0f 系），单一主题色 teal（延续 #2dd4bf），微光渐变点缀，克制。
- 细网格背景 + 贯穿页面的垂直「光束线」作为叙事轴。
- 卡片：低饱和边框 + 玻璃质感（subtle backdrop blur），hover 微光晕。
- 排版：超大字重中文标题；巨大半透明编号（01/02/03…）；等宽字体做元数据点缀。

## 页面结构（6 幕叙事线）

### 第 1 幕 · Hero（全屏）
- 超大标题（方向：「确定性做骨架，AI 只做大脑」）+ 一行副标题说清项目。
- 网格背景 + 光束线起点。标题逐词浮入；下滚时 hero 视差退场。
- 顶部固定极简 nav（毛玻璃），滚动时出现。

### 第 2 幕 · 理念三原则
- 三原则（确定性优先 / 一线程一实例 / config 驱动）改为逐条 stagger 浮入的大字排版，巨大半透明编号，每条一句注解。

### 第 3 幕 · 架构总览（pin 场景 ①）
- 重绘架构 SVG：IM 入口 → broker → queue → worker，pin 在屏幕。
- 滚动 scrub 驱动：连线描边动画逐段点亮（stroke-dashoffset），节点点亮时侧边浮出说明。

### 第 4 幕 · 一条命令的一生（pin 场景 ②，全页高潮）
- 合并原「核心流程时序」+「模拟对话」两个 section。
- 布局：左侧 pin 住仿 IM 聊天窗口，右侧 6 步流程说明随滚动逐步高亮。
- 聊天窗口随滚动逐条播放对话（触发 → 出卡 → 点按钮 → worker 分析中 → 结构化报告回帖），当前步骤在 mini 架构图上同步发光。
- 原「点击查看说明」交互删除，全部滚动驱动。

### 第 5 幕 · 五大机制
- 现有 5 个机制面板改为 bento 交错网格，滚动 stagger 浮入。
- 文案沿用现有内容，微调适配排版。

### 第 6 幕 · 收尾
- 一屏结尾：「新增一个能力 = 一份 config + 一个 skill」+ 脱敏声明 footer。

## 文案

- 全页文案重写一轮：技术事实不动，表达从说明书腔改为叙事腔（hero 标题、每幕引导句、对话对白节奏）。已获用户授权。
- 代码注释英文；页面文案简体中文。

## 降级与可访问性

- `prefers-reduced-motion: reduce`：禁用所有动画与 Lenis，内容直接可见。
- 窄屏（<900px）：pin 场景退化为纵向顺序布局，不 pin；聊天演示改为简单 reveal。
- 无 JS / CDN 失败：内容默认可见（动画用 `gsap.from` + CSS 默认可见策略，避免白屏）。

## 错误处理与测试

- 用本地 http server + Chrome 浏览器工具验证：滚动全程无 console error、pin 场景正反向滚动行为正确、reduced-motion 与窄屏降级正确。
- 验收标准：① 第一屏有明显视觉冲击；② 两个 pin 场景滚动正反向都流畅；③ 移动端宽度可正常阅读全部内容；④ 无 console error。

## 明确不做

- 不上框架、不加构建步骤。
- 不改 backend、不加真实后端连接。
- 不做多页面、不做 i18n。
