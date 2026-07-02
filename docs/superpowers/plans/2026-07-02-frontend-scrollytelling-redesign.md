# Frontend Scrollytelling Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `frontend/` (index.html / styles.css / app.js) into a Linear/Vercel-grade dark scrollytelling single page telling the broker+worker architecture story in 6 acts.

**Architecture:** Pure static, zero build. One HTML file with 6 `<section class="act">` blocks; one CSS file organized by design tokens → base → per-act; one JS file organized as `initLenis / initHero / initPrinciples / initArch / initLifecycle / initMechanisms / initFinale`, each guarded by the same motion-capability check. Two pinned ScrollTrigger scenes (Act 3 architecture, Act 4 command-lifecycle) carry the narrative; everything else is reveal/stagger.

**Tech Stack:** GSAP 3.13 + ScrollTrigger (CDN, already in use), Lenis (CDN, new — approved), Google Fonts JetBrains Mono, system CJK font stack.

## Global Constraints

- Pure static three files under `frontend/`; NO build step, NO framework.
- Only new dependencies allowed: Lenis CDN script + JetBrains Mono font. Nothing else.
- Technical facts of the copy must not change (broker = deterministic, no-LLM, resident; worker = short-lived subprocess; thread isolation; config-driven; 5 mechanisms content).
- Page copy in Simplified Chinese; code comments in English.
- Palette: background `#0a0a0f` family; single accent teal `#2dd4bf`; secondary text `#8b949e` family. No other hues except the existing worker blue `#58a6ff` as a secondary accent inside diagrams.
- `prefers-reduced-motion: reduce` OR missing GSAP → all content visible with zero animation (use `gsap.from`-style reveals with CSS-visible defaults; never hide content in CSS).
- Below 900px viewport width: no pinning; pinned scenes degrade to stacked vertical layout with simple reveals.
- Commit after every task; never commit without the plan's commit step.
- Verification is browser-based (no unit test framework in this project): local server `python3 -m http.server 8777 -d frontend`, then check console errors + scroll behavior. Use the claude-in-chrome / agent-browser tooling or ask the main session to verify.

## File Structure

- `frontend/index.html` — full rewrite. Semantic sections: `nav`, `#hero`, `#principles`, `#arch`, `#lifecycle`, `#mechanisms`, `#finale`, footer inside finale. Loads fonts, Lenis, GSAP, ScrollTrigger, `app.js` (all `defer` except GSAP order preserved).
- `frontend/styles.css` — full rewrite. Order: `:root` tokens → reset/base → background layers (grid + beam) → nav → per-act sections → responsive (`@media (max-width: 900px)`) → `@media (prefers-reduced-motion: reduce)`.
- `frontend/app.js` — full rewrite. Module pattern: capability check once, then per-act init functions. Keeps `CHAT_SCRIPT` data (copy may be polished, facts unchanged).

---

### Task 1: HTML skeleton + CSS foundation (tokens, background, nav, base type)

**Files:**
- Modify: `frontend/index.html` (full replace)
- Modify: `frontend/styles.css` (full replace)

**Interfaces:**
- Produces: the section IDs `#hero #principles #arch #lifecycle #mechanisms #finale`, CSS custom properties (`--bg --panel --border --accent --accent-2 --text --muted --mono`), classes `.act .act-inner .glass .kicker .mono` used by all later tasks. JS hooks are `data-` attributes and IDs defined per act in later tasks.

- [ ] **Step 1: Replace index.html with the new skeleton**

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ChatOps Command Bot — 确定性做骨架，AI 只做大脑</title>
  <meta name="description" content="broker/worker 双层架构展示：确定性门卫全包流程，AI 只做分析。" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="bg-grid" aria-hidden="true"></div>
  <div class="beam" aria-hidden="true"></div>

  <nav class="nav" id="nav">
    <span class="brand mono">chatops-bot</span>
    <div class="nav-links">
      <a href="#principles">理念</a>
      <a href="#arch">架构</a>
      <a href="#lifecycle">一条命令的一生</a>
      <a href="#mechanisms">机制</a>
    </div>
  </nav>

  <header class="act" id="hero"><!-- Task 2 fills --></header>
  <section class="act" id="principles"><!-- Task 3 fills --></section>
  <section class="act" id="arch"><!-- Task 4 fills --></section>
  <section class="act" id="lifecycle"><!-- Task 5 fills --></section>
  <section class="act" id="mechanisms"><!-- Task 6 fills --></section>
  <section class="act" id="finale"><!-- Task 6 fills --></section>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"></script>
  <script src="https://unpkg.com/lenis@1.3.4/dist/lenis.min.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Replace styles.css foundation (tokens, base, background, nav)**

```css
/* ---------- tokens ---------- */
:root {
  --bg: #0a0a0f;
  --bg-soft: #0e0e15;
  --panel: rgba(255, 255, 255, 0.03);
  --border: rgba(255, 255, 255, 0.08);
  --accent: #2dd4bf;
  --accent-2: #58a6ff;
  --text: #ececf1;
  --muted: #8b8b99;
  --mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  --sans: -apple-system, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;
}

/* ---------- base ---------- */
* { box-sizing: border-box; margin: 0; }
html { scroll-behavior: auto; } /* Lenis owns smoothing */
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  line-height: 1.7;
  overflow-x: hidden;
}
a { color: inherit; text-decoration: none; }
.mono { font-family: var(--mono); }
.kicker {
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--accent);
}
.act { position: relative; padding: 18vh 24px; }
.act-inner { max-width: 1080px; margin: 0 auto; }
.glass {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* ---------- background layers ---------- */
.bg-grid {
  position: fixed; inset: 0; z-index: -2; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 90% 70% at 50% 0%, black 40%, transparent 100%);
}
.beam {
  position: absolute; top: 0; bottom: 0; left: 50%; width: 1px; z-index: -1;
  background: linear-gradient(180deg, transparent, rgba(45,212,191,0.35) 15%, rgba(45,212,191,0.12) 85%, transparent);
  pointer-events: none;
}

/* ---------- nav ---------- */
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 28px;
  background: rgba(10,10,15,0.6);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
}
.nav .brand { font-size: 14px; color: var(--accent); font-weight: 700; }
.nav-links { display: flex; gap: 26px; font-size: 14px; color: var(--muted); }
.nav-links a:hover { color: var(--text); }
```

Also append at the bottom of the file the two media-query shells later tasks add into:

```css
/* ---------- responsive ---------- */
@media (max-width: 900px) {
  .act { padding: 12vh 18px; }
  .nav-links { gap: 16px; font-size: 13px; }
}

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 3: Stub app.js so the page loads clean**

Replace `frontend/app.js` with:

```js
// Static architecture showcase — no network requests. Motion: GSAP + Lenis.
'use strict';

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGSAP = !!(window.gsap && window.ScrollTrigger);
const MOTION = hasGSAP && !prefersReduced;

if (MOTION) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });
}

function initLenis() {
  if (!MOTION || !window.Lenis) return;
  const lenis = new Lenis({ autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  if (MOTION) ScrollTrigger.refresh();
});
```

- [ ] **Step 4: Verify page loads with zero console errors**

Run: `python3 -m http.server 8777 -d frontend` (background), open `http://localhost:8777`.
Expected: dark page, grid background, fixed nav, empty sections; console shows no errors; Lenis smooth-scroll active (inertial feel).

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): dark scrollytelling foundation — tokens, grid bg, nav, Lenis"
```

---

### Task 2: Act 1 — Hero (full-screen impact + entrance/exit motion)

**Files:**
- Modify: `frontend/index.html` (fill `#hero`)
- Modify: `frontend/styles.css` (append hero styles)
- Modify: `frontend/app.js` (add `initHero`, call it in DOMContentLoaded)

**Interfaces:**
- Consumes: `.act`, tokens, `MOTION` flag from Task 1.
- Produces: `initHero()` — no exports; `.hero-word` span pattern reused nowhere else.

- [ ] **Step 1: Fill `#hero` markup**

```html
<header class="act" id="hero">
  <div class="act-inner hero-inner">
    <p class="kicker">CHATOPS COMMAND BOT · ARCHITECTURE SHOWCASE</p>
    <h1 class="hero-title" id="heroTitle">确定性做骨架，<br />AI 只做大脑。</h1>
    <p class="hero-sub">一个 IM 命令机器人的双层架构：常驻的确定性门卫包办解析、路由、向导与生命周期；短命的 AI worker 只负责真正需要分析的部分。</p>
    <div class="hero-meta mono">
      <span>broker · deterministic</span>
      <span>worker · short-lived</span>
      <span>config-driven</span>
    </div>
    <div class="scroll-hint mono" aria-hidden="true">SCROLL ↓</div>
  </div>
</header>
```

- [ ] **Step 2: Append hero CSS**

```css
/* ---------- hero ---------- */
#hero { min-height: 100vh; display: flex; align-items: center; }
.hero-title {
  font-size: clamp(44px, 8vw, 96px);
  font-weight: 800; line-height: 1.15; letter-spacing: -0.02em;
  margin: 24px 0;
  background: linear-gradient(180deg, #fff 60%, rgba(255,255,255,0.55));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.hero-sub { max-width: 560px; color: var(--muted); font-size: 17px; }
.hero-meta { display: flex; gap: 22px; margin-top: 36px; font-size: 12px; color: var(--accent); flex-wrap: wrap; }
.hero-meta span { border: 1px solid var(--border); border-radius: 999px; padding: 6px 14px; }
.scroll-hint { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); font-size: 11px; letter-spacing: 0.3em; color: var(--muted); }
```

- [ ] **Step 3: Add `initHero` to app.js**

```js
function initHero() {
  if (!MOTION) return;
  // Split title into word spans for staggered entrance.
  const title = document.getElementById('heroTitle');
  const frag = document.createDocumentFragment();
  title.childNodes.forEach((node) => {
    if (node.nodeName === 'BR') { frag.appendChild(document.createElement('br')); return; }
    for (const ch of node.textContent) {
      const s = document.createElement('span');
      s.className = 'hero-word';
      s.style.display = 'inline-block';
      s.textContent = ch;
      frag.appendChild(s);
    }
  });
  title.replaceChildren(frag);

  gsap.timeline()
    .from('.nav', { y: -24, autoAlpha: 0, duration: 0.6 })
    .from('#hero .kicker', { y: 20, autoAlpha: 0, duration: 0.5 }, '-=0.2')
    .from('.hero-word', { y: 60, autoAlpha: 0, rotationX: -40, stagger: 0.035, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.2')
    .from('.hero-sub, .hero-meta span', { y: 24, autoAlpha: 0, stagger: 0.06, duration: 0.6 }, '-=0.3')
    .from('.scroll-hint', { autoAlpha: 0, duration: 0.8 });

  // Parallax exit: hero content drifts up + fades as user scrolls away.
  gsap.to('.hero-inner', {
    y: -120, autoAlpha: 0, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 35%', scrub: true },
  });
}
```

And call it: `initHero();` inside the DOMContentLoaded handler (before `ScrollTrigger.refresh()`).

- [ ] **Step 4: Verify**

Reload page. Expected: title characters spring in on load; scrolling down fades/lifts hero; scrolling back restores it; no console errors. With DevTools emulate `prefers-reduced-motion: reduce` and reload: title fully visible, no animation.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): hero act — char-stagger entrance and parallax exit"
```

---

### Task 3: Act 2 — 理念三原则 (oversized numbered editorial reveals)

**Files:**
- Modify: `frontend/index.html` (fill `#principles`)
- Modify: `frontend/styles.css` (append)
- Modify: `frontend/app.js` (add `initPrinciples`)

**Interfaces:**
- Consumes: tokens, `MOTION`.
- Produces: `.principle` row pattern (not reused).

- [ ] **Step 1: Fill `#principles` markup**

```html
<section class="act" id="principles">
  <div class="act-inner">
    <p class="kicker">01 — PRINCIPLES · 核心理念</p>
    <div class="principle">
      <span class="p-num mono" aria-hidden="true">01</span>
      <div><h3>确定性优先</h3><p>能用死流程做掉的绝不交给模型：解析、路由、向导、生命周期，全部跑在无 LLM 的门卫里，永远不会退化。</p></div>
    </div>
    <div class="principle">
      <span class="p-num mono" aria-hidden="true">02</span>
      <div><h3>一线程一实例</h3><p>一个 thread 就是一个命令实例，从生到死。状态严格按线程隔离，绝不串台，这是铁律。</p></div>
    </div>
    <div class="principle">
      <span class="p-num mono" aria-hidden="true">03</span>
      <div><h3>config 驱动扩展</h3><p>新增一个能力 = 一份 JSON + 一个 worker skill。路由和生命周期内核一行不动。</p></div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Append CSS**

```css
/* ---------- principles ---------- */
.principle {
  display: grid; grid-template-columns: 180px 1fr; gap: 28px;
  align-items: center; padding: 56px 0;
  border-bottom: 1px solid var(--border);
}
.p-num {
  font-size: clamp(72px, 10vw, 128px); font-weight: 700; line-height: 1;
  color: transparent;
  -webkit-text-stroke: 1px rgba(45, 212, 191, 0.35);
}
.principle h3 { font-size: 26px; margin-bottom: 8px; }
.principle p { color: var(--muted); max-width: 620px; }
@media (max-width: 900px) {
  .principle { grid-template-columns: 1fr; gap: 8px; padding: 36px 0; }
}
```

- [ ] **Step 3: Add `initPrinciples`**

```js
function initPrinciples() {
  if (!MOTION) return;
  gsap.utils.toArray('.principle').forEach((row) => {
    gsap.timeline({
      scrollTrigger: { trigger: row, start: 'top 80%', toggleActions: 'play none none reverse' },
    })
      .from(row.querySelector('.p-num'), { x: -60, autoAlpha: 0, duration: 0.7 })
      .from(row.querySelectorAll('h3, p'), { y: 30, autoAlpha: 0, stagger: 0.1, duration: 0.6 }, '-=0.4');
  });
}
```

Call in DOMContentLoaded. Also add once (shared by all remaining acts) a generic kicker reveal:

```js
function initKickers() {
  if (!MOTION) return;
  gsap.utils.toArray('.act .kicker').forEach((k) => {
    gsap.from(k, { scrollTrigger: { trigger: k, start: 'top 88%' }, autoAlpha: 0, letterSpacing: '0.6em', duration: 0.8 });
  });
}
```

- [ ] **Step 4: Verify** — scroll down/up: rows play and reverse; reduced-motion shows all; no console errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): principles act — oversized numbered editorial reveals"
```

---

### Task 4: Act 3 — 架构总览 pinned scene (SVG draw-on-scrub)

**Files:**
- Modify: `frontend/index.html` (fill `#arch`)
- Modify: `frontend/styles.css` (append)
- Modify: `frontend/app.js` (add `initArch`)

**Interfaces:**
- Consumes: tokens, `MOTION`.
- Produces: SVG node ids `n-im n-broker n-worker`, path ids `e1 e2` — reused by Task 5's mini-map ONLY as a visual reference (Task 5 has its own copy). Class `.arch-note[data-step]` for the side captions.

- [ ] **Step 1: Fill `#arch` markup**

Redrawn diagram: rounded-rect nodes with glow, two connector paths, caption stack on the right. `pathLength="1"` normalizes dash animation.

```html
<section class="act" id="arch">
  <div class="act-inner arch-wrap">
    <div class="arch-sticky">
      <p class="kicker">02 — ARCHITECTURE · 架构总览</p>
      <h2>常驻的门卫，短命的大脑。</h2>
      <svg viewBox="0 0 760 240" width="100%" role="img" aria-label="broker/worker 两层架构图">
        <g id="n-im" class="arch-node">
          <rect x="20" y="90" width="150" height="64" rx="10" fill="var(--bg-soft)" stroke="rgba(255,255,255,0.2)"/>
          <text x="95" y="118" fill="#ececf1" font-size="13" text-anchor="middle">IM 入口</text>
          <text x="95" y="138" fill="#8b8b99" font-size="11" text-anchor="middle">WebSocket</text>
        </g>
        <path id="e1" d="M 170 122 H 250" pathLength="1" stroke="#2dd4bf" stroke-width="2" fill="none"/>
        <g id="n-broker" class="arch-node">
          <rect x="250" y="70" width="240" height="104" rx="10" fill="var(--bg-soft)" stroke="#2dd4bf"/>
          <text x="370" y="102" fill="#2dd4bf" font-size="14" text-anchor="middle" font-weight="700">broker · 确定性门卫</text>
          <text x="370" y="126" fill="#8b8b99" font-size="11" text-anchor="middle">解析 / 路由 / 向导 / session</text>
          <text x="370" y="146" fill="#8b8b99" font-size="11" text-anchor="middle">无 LLM · 常驻进程</text>
        </g>
        <path id="e2" d="M 490 122 H 570" pathLength="1" stroke="#58a6ff" stroke-width="2" fill="none"/>
        <text x="530" y="112" fill="#8b8b99" font-size="10" text-anchor="middle" font-family="var(--mono)">queue</text>
        <g id="n-worker" class="arch-node">
          <rect x="570" y="90" width="170" height="64" rx="10" fill="var(--bg-soft)" stroke="#58a6ff"/>
          <text x="655" y="118" fill="#58a6ff" font-size="13" text-anchor="middle">worker · 纯大脑</text>
          <text x="655" y="138" fill="#8b8b99" font-size="11" text-anchor="middle">短命子进程 · 跑完即退</text>
        </g>
      </svg>
      <div class="arch-notes">
        <p class="arch-note" data-step="0"><strong>IM 入口</strong> — 消息经 WebSocket 进来，按 threadKey 落到唯一 session。</p>
        <p class="arch-note" data-step="1"><strong>broker</strong> — 确定性门卫：解析、路由、向导、生命周期全包，一行 LLM 都没有。</p>
        <p class="arch-note" data-step="2"><strong>worker</strong> — 只有真正需要分析时才被拉起的子进程，跑完即退，崩了也不影响门卫。</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Append CSS**

```css
/* ---------- arch (pinned scene) ---------- */
#arch h2 { font-size: clamp(28px, 4vw, 44px); margin: 14px 0 34px; letter-spacing: -0.01em; }
.arch-node rect { filter: drop-shadow(0 0 0 transparent); }
.arch-node.lit rect { filter: drop-shadow(0 0 14px rgba(45,212,191,0.35)); }
.arch-notes { margin-top: 28px; display: grid; gap: 10px; min-height: 88px; }
.arch-note { color: var(--muted); font-size: 15px; opacity: 0.25; transition: opacity 0.3s; }
.arch-note.active { opacity: 1; color: var(--text); }
```

- [ ] **Step 3: Add `initArch`**

Pinned scrubbed timeline; each label activates via timeline callbacks driven by scrub position (callbacks fire both directions because we toggle classes from `onUpdate` thresholds, not `add()` callbacks — the prior pinned-chat bug was reverse callbacks not firing).

```js
function initArch() {
  const notes = gsap.utils.toArray('#arch .arch-note');
  if (!MOTION || window.innerWidth < 900) { notes.forEach((n) => n.classList.add('active')); return; }

  gsap.set('#e1, #e2', { strokeDasharray: 1, strokeDashoffset: 1 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#arch', start: 'top top', end: '+=1600',
      pin: true, scrub: 0.6,
      onUpdate(self) {
        // Threshold-based highlighting works in both scroll directions.
        const step = self.progress < 0.33 ? 0 : self.progress < 0.72 ? 1 : 2;
        notes.forEach((n, i) => n.classList.toggle('active', i === step));
        document.querySelectorAll('#arch .arch-node').forEach((g, i) => g.classList.toggle('lit', i <= step));
      },
    },
  });

  tl.from('#n-im', { autoAlpha: 0, y: 30, duration: 0.6 })
    .to('#e1', { strokeDashoffset: 0, duration: 0.8 })
    .from('#n-broker', { autoAlpha: 0, scale: 0.9, transformOrigin: '50% 50%', duration: 0.8 })
    .to('#e2', { strokeDashoffset: 0, duration: 0.8 })
    .from('#n-worker', { autoAlpha: 0, y: 30, duration: 0.6 })
    .to({}, { duration: 0.5 }); // hold beat before unpin
}
```

- [ ] **Step 4: Verify** — Scene pins; connectors draw with scroll; captions light in sync; reverse scroll un-draws; narrow window (<900px) shows everything statically without pin; no console errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): pinned architecture scene with scroll-drawn connectors"
```

---

### Task 5: Act 4 — 一条命令的一生 (pinned chat + step sync; page climax)

**Files:**
- Modify: `frontend/index.html` (fill `#lifecycle`)
- Modify: `frontend/styles.css` (append)
- Modify: `frontend/app.js` (add `CHAT_SCRIPT`, `initLifecycle`)

**Interfaces:**
- Consumes: tokens, `MOTION`.
- Produces: `CHAT_SCRIPT` array (`{cls, html, step}`), where `step` (0–5) maps each message to one of the 6 flow steps `.ls-step[data-step]`.

- [ ] **Step 1: Fill `#lifecycle` markup**

```html
<section class="act" id="lifecycle">
  <div class="act-inner">
    <p class="kicker">03 — LIFECYCLE · 一条命令的一生</p>
    <h2>从一句 @bot，到一份结构化报告。</h2>
    <div class="ls-wrap">
      <div class="ls-chat glass" id="lsChat" aria-label="模拟 IM 对话（纯前端演示）"></div>
      <ol class="ls-steps" id="lsSteps">
        <li class="ls-step" data-step="0"><span class="mono">STEP 1</span>入口收消息 — 按 threadKey 定位或创建 session，线程隔离。</li>
        <li class="ls-step" data-step="1"><span class="mono">STEP 2</span>命令路由 — FlowRegistry 按 trigger 关键词匹配命令。</li>
        <li class="ls-step" data-step="2"><span class="mono">STEP 3</span>config 出卡 — StepEngine 读配置渲染当前步骤卡片。</li>
        <li class="ls-step" data-step="3"><span class="mono">STEP 4</span>向导收集 — 按钮/输入收集值，session 状态机推进。</li>
        <li class="ls-step" data-step="4"><span class="mono">STEP 5</span>派活 worker — broker 拉起短命子进程做分析。</li>
        <li class="ls-step" data-step="5"><span class="mono">STEP 6</span>回复 thread — 结构化报告发回同一线程。</li>
      </ol>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Append CSS**

```css
/* ---------- lifecycle (pinned climax) ---------- */
#lifecycle h2 { font-size: clamp(28px, 4vw, 44px); margin: 14px 0 34px; letter-spacing: -0.01em; }
.ls-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
.ls-chat { padding: 22px; display: flex; flex-direction: column; gap: 12px; min-height: 420px; }
.msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 14px; white-space: pre-line; }
.msg.user { align-self: flex-end; background: rgba(45,212,191,0.12); border: 1px solid rgba(45,212,191,0.3); }
.msg.bot { align-self: flex-start; background: var(--panel); border: 1px solid var(--border); color: var(--muted); }
.msg.card { align-self: flex-start; background: var(--bg-soft); border: 1px solid var(--border); width: 85%; }
.card-title { font-weight: 700; margin-bottom: 6px; }
.pill { display: inline-block; border: 1px solid var(--accent); color: var(--accent); border-radius: 999px; padding: 2px 12px; margin: 6px 6px 0 0; font-size: 12px; font-family: var(--mono); }
.ls-steps { list-style: none; padding: 0; display: grid; gap: 14px; }
.ls-step { padding: 14px 18px; border-left: 2px solid var(--border); color: var(--muted); opacity: 0.35; transition: opacity 0.3s, border-color 0.3s; }
.ls-step .mono { display: block; font-size: 11px; color: var(--accent); letter-spacing: 0.2em; margin-bottom: 4px; }
.ls-step.active { opacity: 1; color: var(--text); border-left-color: var(--accent); }
@media (max-width: 900px) { .ls-wrap { grid-template-columns: 1fr; } }
```

- [ ] **Step 3: Add chat data + `initLifecycle`**

```js
// step: which .ls-step lights up when this message appears (0-5).
const CHAT_SCRIPT = [
  { cls: 'user', html: '@bot diagnose', step: 0 },
  { cls: 'bot',  html: '收到。已按 thread 创建命令实例。', step: 1 },
  { cls: 'card', html: '<div class="card-title">🌐 请选择环境</div>第 1/2 步 · 环境<div><span class="pill">QAT</span><span class="pill">UAT</span><span class="pill">PROD</span></div>', step: 2 },
  { cls: 'user', html: '选择：UAT', step: 3 },
  { cls: 'card', html: '<div class="card-title">🌿 输入分支</div>第 2/2 步 · 分支<div><span class="pill">main（默认）</span></div>', step: 3 },
  { cls: 'user', html: '玩家 12345 在 13:20 请求失败', step: 3 },
  { cls: 'bot',  html: '⏳ 向导完成，worker 子进程分析中…', step: 4 },
  { cls: 'card', html: '<div class="card-title">📋 诊断报告（模拟）</div>环境=UAT · 分支=main\n根因：上游服务返回空额度。\n置信度 82%。', step: 5 },
];

function initLifecycle() {
  const chat = document.getElementById('lsChat');
  const steps = gsap.utils.toArray('.ls-step');
  const nodes = CHAT_SCRIPT.map((m) => {
    const el = document.createElement('div');
    el.className = 'msg ' + m.cls;
    el.innerHTML = m.html;
    chat.appendChild(el);
    return el;
  });

  if (!MOTION || window.innerWidth < 900) {
    steps.forEach((s) => s.classList.add('active'));
    if (!MOTION) return;
    // Narrow screens: simple per-message reveal, no pin.
    nodes.forEach((el) => gsap.from(el, {
      autoAlpha: 0, y: 24, duration: 0.5,
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
    }));
    return;
  }

  gsap.set(nodes, { autoAlpha: 0, y: 30 });
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#lifecycle', start: 'top top', end: '+=2400',
      pin: true, scrub: 0.6,
      onUpdate(self) {
        // Active step follows the furthest currently-visible message (both directions).
        const shown = Math.min(nodes.length - 1, Math.floor(self.progress * nodes.length));
        const active = self.progress <= 0 ? -1 : CHAT_SCRIPT[shown].step;
        steps.forEach((s, i) => s.classList.toggle('active', i === active));
      },
    },
  });
  nodes.forEach((el) => tl.to(el, { autoAlpha: 1, y: 0, duration: 0.6 }, '+=0.25'));
  tl.to({}, { duration: 0.5 }); // hold beat before unpin
}
```

- [ ] **Step 4: Verify** — Scene pins; messages appear one-by-one with scroll; right-side step highlight tracks messages in BOTH directions; reverse fully recalls; narrow width shows stacked layout with simple reveals; reduced-motion shows all messages and steps; no console errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): lifecycle climax — pinned scroll-driven chat with step sync"
```

---

### Task 6: Act 5 bento mechanisms + Act 6 finale

**Files:**
- Modify: `frontend/index.html` (fill `#mechanisms`, `#finale`)
- Modify: `frontend/styles.css` (append)
- Modify: `frontend/app.js` (add `initMechanisms`, `initFinale`)

**Interfaces:**
- Consumes: `.glass`, tokens, `MOTION`.
- Produces: nothing consumed later.

- [ ] **Step 1: Fill `#mechanisms` markup (existing copy, bento layout)**

```html
<section class="act" id="mechanisms">
  <div class="act-inner">
    <p class="kicker">04 — MECHANISMS · 核心机制</p>
    <h2>门卫靠这五件事，把确定性活全包住。</h2>
    <div class="bento">
      <div class="glass bento-card span-2">
        <h3><span class="mono">01</span> 队列去重 / 故障隔离</h3>
        <p>同一话题、同一时刻只跑一个调查。重复请求当场去重、明确回绝，不排队。分析崩溃只死子进程，门卫照常运转。</p>
        <p class="flow"><code>重复请求</code> → <span class="stop">⊘ 去重 · 回「正在调查中」</span></p>
        <p class="flow"><code>AI 崩溃</code> → <span class="ok">只死子进程 · 门卫不受影响</span></p>
      </div>
      <div class="glass bento-card">
        <h3><span class="mono">02</span> 会话状态 / 生命周期</h3>
        <p>每个话题一个会话，三态自动流转。正常收尾先问一句反馈，系统故障则直接关闭、不打扰用户。</p>
        <p class="flow"><span class="ok">进行中</span> → <code>待反馈</code> → <code>已关闭</code></p>
        <p class="note">闲置 2 小时自动收尾 · 可随时唤起重填</p>
      </div>
      <div class="glass bento-card">
        <h3><span class="mono">03</span> 线程隔离 / Bot 行为</h3>
        <p>一个话题 = 一个命令实例，状态严格按话题隔离，绝不串台。群里靠卡片按钮收集输入，不靠逐条打字。</p>
        <p class="flow"><code>群聊</code> → 需 @ 机器人 · <code>私聊</code> → 直接处理</p>
      </div>
      <div class="glass bento-card">
        <h3><span class="mono">04</span> 配置驱动 / 可复用</h3>
        <p>加一个新能力，只写一份 config + 一个分析 skill，不碰路由和生命周期内核。向导与反馈共用同一套步骤引擎。</p>
        <p class="flow"><code>新能力</code> → config + skill → <span class="ok">内核不动</span></p>
      </div>
      <div class="glass bento-card span-2">
        <h3><span class="mono">05</span> Feedback（综合案例）</h3>
        <p>反馈把前面几件事串起来：挂在「待反馈」状态上，复用同一套步骤引擎，config 里开个开关即接入。</p>
        <p class="flow"><code>裁决</code> → <code>三轴评价</code> → <span class="ok">落库归档</span></p>
        <p class="note">无回应则每日轻提醒，多次无果自动放弃 · 可随时重填覆盖</p>
      </div>
    </div>
  </div>
</section>
```

And `#finale`:

```html
<section class="act" id="finale">
  <div class="act-inner finale-inner">
    <p class="kicker">05 — EXTEND · 收尾</p>
    <h2 class="finale-line">新增一个能力<br /><span class="eq mono">=</span> 一份 config <span class="plus mono">+</span> 一个 skill。</h2>
    <p class="hero-sub">内核不动，边界清晰。这就是确定性骨架的意义。</p>
    <footer class="footer">脱敏架构展示 · 仅用于技术演示，不含任何真实业务 / 凭证信息</footer>
  </div>
</section>
```

- [ ] **Step 2: Append CSS**

```css
/* ---------- mechanisms (bento) ---------- */
#mechanisms h2 { font-size: clamp(28px, 4vw, 44px); margin: 14px 0 34px; letter-spacing: -0.01em; }
.bento { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.bento-card { padding: 24px; transition: border-color 0.3s, box-shadow 0.3s; }
.bento-card:hover { border-color: rgba(45,212,191,0.4); box-shadow: 0 0 32px rgba(45,212,191,0.08); }
.bento-card.span-2 { grid-column: span 2; }
.bento-card h3 { font-size: 17px; margin-bottom: 10px; }
.bento-card h3 .mono { color: var(--accent); margin-right: 8px; font-size: 13px; }
.bento-card p { color: var(--muted); font-size: 14px; }
.flow { margin-top: 10px; font-size: 13px; }
.flow code { font-family: var(--mono); background: var(--panel); border: 1px solid var(--border); border-radius: 6px; padding: 1px 7px; font-size: 12px; }
.stop { color: #f87171; } .ok { color: var(--accent); }
.note { margin-top: 8px; font-size: 12px; color: var(--muted); opacity: 0.8; }
@media (max-width: 900px) { .bento { grid-template-columns: 1fr; } .bento-card.span-2 { grid-column: span 1; } }

/* ---------- finale ---------- */
#finale { min-height: 90vh; display: flex; align-items: center; text-align: center; }
.finale-inner { width: 100%; }
.finale-line { font-size: clamp(32px, 5.5vw, 64px); font-weight: 800; line-height: 1.3; margin: 20px 0; letter-spacing: -0.02em; }
.finale-line .eq, .finale-line .plus { color: var(--accent); }
#finale .hero-sub { margin: 0 auto; }
.footer { margin-top: 12vh; font-size: 12px; color: var(--muted); opacity: 0.7; }
```

- [ ] **Step 3: Add `initMechanisms` + `initFinale`**

```js
function initMechanisms() {
  if (!MOTION) return;
  ScrollTrigger.batch('.bento-card', {
    start: 'top 88%',
    onEnter: (els) => gsap.from(els, {
      y: 46, autoAlpha: 0, scale: 0.95, duration: 0.8, stagger: 0.08,
      ease: 'back.out(1.4)', overwrite: true,
    }),
  });
}

function initFinale() {
  if (!MOTION) return;
  gsap.from('#finale .finale-line, #finale .hero-sub, #finale .footer', {
    scrollTrigger: { trigger: '#finale', start: 'top 70%' },
    y: 40, autoAlpha: 0, stagger: 0.15, duration: 0.9,
  });
}
```

Final DOMContentLoaded block must be:

```js
document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initHero();
  initKickers();
  initPrinciples();
  initArch();
  initLifecycle();
  initMechanisms();
  initFinale();
  if (MOTION) ScrollTrigger.refresh();
});
```

- [ ] **Step 4: Verify** — bento cards stagger in; finale reveals; hover glow works; mobile single column.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): bento mechanisms grid and finale act"
```

---

### Task 7: Full-page QA sweep + polish pass

**Files:**
- Modify: `frontend/*` (fixes only, as found)

**Interfaces:** none.

- [ ] **Step 1: Run the full checklist in a real browser** (`python3 -m http.server 8777 -d frontend`)

1. Zero console errors from load through full scroll down and back up.
2. Hero: entrance plays once; parallax exit and return work.
3. Both pinned scenes: no jump/flicker at pin/unpin boundaries; reverse scroll fully recalls; no scroll-position jank with Lenis (`ScrollTrigger.refresh()` after DOM ready is required).
4. 375px-wide viewport: no horizontal scrollbar; pinned scenes stacked; all text readable.
5. `prefers-reduced-motion: reduce` emulation: every piece of content visible, nothing animates, no pin.
6. Kill the CDN (DevTools → block `cdnjs.cloudflare.com` and `unpkg.com`, reload): page content fully visible (this validates the no-JS-hide constraint).

- [ ] **Step 2: Fix anything found; keep fixes minimal and in-scope.**

- [ ] **Step 3: Screenshot the hero and both pinned scenes for the user to judge "shock & amazing".**

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "fix(frontend): QA sweep — pin boundaries, mobile, reduced-motion, no-CDN fallback"
```
