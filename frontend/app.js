// Static architecture showcase — no network requests. Motion: GSAP + Lenis.
'use strict';

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGSAP = !!(window.gsap && window.ScrollTrigger);
const MOTION = hasGSAP && !prefersReduced;

if (MOTION) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });
}

// step: which .ls-step lights up when this message appears (0-5).
const CHAT_SCRIPT = [
  { cls: 'user', step: 0,
    zh: '@bot diagnose',
    en: '@bot diagnose' },
  { cls: 'bot', step: 1,
    zh: '收到。已按 thread 创建命令实例。',
    en: 'Got it. Created a command instance for this thread.' },
  { cls: 'card', step: 2,
    zh: '<div class="card-title">🌐 请选择环境</div>第 1/2 步 · 环境<div><span class="pill">QAT</span><span class="pill">UAT</span><span class="pill">PROD</span></div>',
    en: '<div class="card-title">🌐 Select environment</div>Step 1/2 · Environment<div><span class="pill">QAT</span><span class="pill">UAT</span><span class="pill">PROD</span></div>' },
  { cls: 'user', step: 3,
    zh: '选择：UAT',
    en: 'Selected: UAT' },
  { cls: 'card', step: 3,
    zh: '<div class="card-title">🌿 输入分支</div>第 2/2 步 · 分支<div><span class="pill">main（默认）</span></div>',
    en: '<div class="card-title">🌿 Enter branch</div>Step 2/2 · Branch<div><span class="pill">main (default)</span></div>' },
  { cls: 'user', step: 3,
    zh: '玩家 12345 在 13:20 请求失败',
    en: 'Player 12345 request failed at 13:20' },
  { cls: 'bot', step: 4,
    zh: '⏳ 向导完成，worker 子进程分析中…',
    en: '⏳ Wizard complete, worker subprocess analyzing…' },
  { cls: 'card', step: 5,
    zh: '<div class="card-title">📋 诊断报告（模拟）</div>环境=UAT · 分支=main\n根因：上游服务返回空额度。\n置信度 82%。',
    en: '<div class="card-title">📋 Diagnostic report (simulated)</div>env=UAT · branch=main\nRoot cause: upstream service returned an empty quota.\nConfidence 82%.' },
];

// Static text swapped between zh/en. Selector -> {zh, en} innerHTML.
const TRANSLATIONS = [
  { sel: '#heroTitle', zh: '确定性做骨架，<br />AI 只做大脑。', en: 'Deterministic skeleton.<br />AI is just the brain.' },
  { sel: '#heroSub', zh: '一个 IM 命令机器人的双层架构：常驻的确定性门卫包办解析、路由、向导与生命周期；短命的 AI worker 只负责真正需要分析的部分。',
    en: 'A two-layer IM command bot: a resident, deterministic gatekeeper handles parsing, routing, wizards and lifecycle; a short-lived AI worker only steps in when real analysis is needed.' },

  { sel: '#principles .kicker', zh: '01 — PRINCIPLES · 核心理念', en: '01 — PRINCIPLES · Core Principles' },
  { sel: '#principle-1 h3', zh: '确定性优先', en: 'Determinism first' },
  { sel: '#principle-1 p', zh: '能用死流程做掉的绝不交给模型：解析、路由、向导、生命周期，全部跑在无 LLM 的门卫里，永远不会退化。',
    en: "Anything a fixed flow can handle never touches the model: parsing, routing, wizards, lifecycle — all run in the no-LLM gatekeeper, so they never degrade." },
  { sel: '#principle-2 h3', zh: '一线程一实例', en: 'One thread, one instance' },
  { sel: '#principle-2 p', zh: '一个 thread 就是一个命令实例，从生到死。状态严格按线程隔离，绝不串台，这是铁律。',
    en: "One thread is one command instance, from birth to death. State is strictly isolated per thread — never crosses over. That's the law." },
  { sel: '#principle-3 h3', zh: 'config 驱动扩展', en: 'Config-driven extension' },
  { sel: '#principle-3 p', zh: '新增一个能力 = 一份 JSON + 一个 worker skill。路由和生命周期内核一行不动。',
    en: 'A new capability = one JSON config + one worker skill. Routing and lifecycle internals stay untouched.' },

  { sel: '#arch .kicker', zh: '02 — ARCHITECTURE · 架构总览', en: '02 — ARCHITECTURE · Overview' },
  { sel: '#arch h2', zh: '常驻的门卫，短命的大脑。', en: 'A resident gatekeeper, a short-lived brain.' },
  { sel: '#t-im-1', zh: 'IM 入口', en: 'IM Gateway', text: true },
  { sel: '#t-im-2', zh: 'WebSocket', en: 'WebSocket', text: true },
  { sel: '#t-broker-1', zh: 'broker · 确定性门卫', en: 'broker · deterministic gatekeeper', text: true },
  { sel: '#t-broker-2', zh: '解析 / 路由 / 向导 / session', en: 'parse / route / wizard / session', text: true },
  { sel: '#t-broker-3', zh: '无 LLM · 常驻进程', en: 'no LLM · resident process', text: true },
  { sel: '#t-queue', zh: 'queue', en: 'queue', text: true },
  { sel: '#t-worker-1', zh: 'worker · 纯大脑', en: 'worker · pure brain', text: true },
  { sel: '#t-worker-2', zh: '短命子进程 · 跑完即退', en: 'short-lived subprocess · exits when done', text: true },
  { sel: '.arch-note[data-step="0"]', zh: '<strong>IM 入口</strong> — 消息经 WebSocket 进来，按 threadKey 落到唯一 session。',
    en: '<strong>IM Gateway</strong> — messages arrive over WebSocket and land on a unique session by threadKey.' },
  { sel: '.arch-note[data-step="1"]', zh: '<strong>broker</strong> — 确定性门卫：解析、路由、向导、生命周期全包，一行 LLM 都没有。',
    en: '<strong>broker</strong> — the deterministic gatekeeper: parsing, routing, wizards, lifecycle — all covered, zero lines of LLM.' },
  { sel: '.arch-note[data-step="2"]', zh: '<strong>worker</strong> — 只有真正需要分析时才被拉起的子进程，跑完即退，崩了也不影响门卫。',
    en: '<strong>worker</strong> — a subprocess spun up only when real analysis is needed; it exits when done, and crashing never touches the gatekeeper.' },

  { sel: '#lifecycle .kicker', zh: '03 — LIFECYCLE · 一条命令的一生', en: '03 — LIFECYCLE · Life of a Command' },
  { sel: '#lifecycle h2', zh: '从一句 @bot，到一份结构化报告。', en: 'From an @bot mention to a structured report.' },
  { sel: '.ls-step[data-step="0"] .ls-step-text', zh: '入口收消息 — 按 threadKey 定位或创建 session，线程隔离。',
    en: 'Message received — locate or create a session by threadKey, thread-isolated.' },
  { sel: '.ls-step[data-step="1"] .ls-step-text', zh: '命令路由 — FlowRegistry 按 trigger 关键词匹配命令。',
    en: 'Command routed — FlowRegistry matches the command by trigger keyword.' },
  { sel: '.ls-step[data-step="2"] .ls-step-text', zh: 'config 出卡 — StepEngine 读配置渲染当前步骤卡片。',
    en: 'Card rendered — StepEngine reads config to render the current step card.' },
  { sel: '.ls-step[data-step="3"] .ls-step-text', zh: '向导收集 — 按钮/输入收集值，session 状态机推进。',
    en: 'Wizard collects — buttons/inputs gather values, the session state machine advances.' },
  { sel: '.ls-step[data-step="4"] .ls-step-text', zh: '派活 worker — broker 拉起短命子进程做分析。',
    en: 'Worker dispatched — broker spins up a short-lived subprocess to analyze.' },
  { sel: '.ls-step[data-step="5"] .ls-step-text', zh: '回复 thread — 结构化报告发回同一线程。',
    en: 'Reply posted — a structured report is sent back to the same thread.' },

  { sel: '#mechKicker', zh: '04 — MECHANISMS · 核心机制', en: '04 — MECHANISMS · Core Mechanisms' },
  { sel: '#mechH2', zh: '门卫靠这五件事，把确定性活全包住。', en: 'Five mechanisms let the gatekeeper own every deterministic task.' },
  { sel: '#mech-1 .mech-title', zh: '队列去重 / 故障隔离', en: 'Dedup / Fault Isolation' },
  { sel: '#mech-1-desc', zh: '同一话题、同一时刻只跑一个调查。重复请求当场去重、明确回绝，不排队。分析崩溃只死子进程，门卫照常运转。',
    en: 'Only one investigation runs per topic at a time. Duplicate requests are rejected on the spot, never queued. If analysis crashes, only the subprocess dies — the gatekeeper keeps running.' },
  { sel: '#mech-1-flow-1', zh: '<code>重复请求</code> → <span class="stop">⊘ 去重 · 回「正在调查中」</span>',
    en: '<code>duplicate request</code> → <span class="stop">⊘ deduped · replies "already investigating"</span>' },
  { sel: '#mech-1-flow-2', zh: '<code>AI 崩溃</code> → <span class="ok">只死子进程 · 门卫不受影响</span>',
    en: '<code>AI crash</code> → <span class="ok">only the subprocess dies · gatekeeper unaffected</span>' },
  { sel: '#mech-2 .mech-title', zh: '会话状态 / 生命周期', en: 'Session State / Lifecycle' },
  { sel: '#mech-2-desc', zh: '每个话题一个会话，三态自动流转。正常收尾先问一句反馈，系统故障则直接关闭、不打扰用户。',
    en: 'One session per topic, cycling through three states automatically. A normal wrap-up asks for feedback first; a system failure just closes quietly.' },
  { sel: '#mech-2-flow', zh: '<span class="ok">进行中</span> → <code>待反馈</code> → <code>已关闭</code>',
    en: '<span class="ok">in progress</span> → <code>pending feedback</code> → <code>closed</code>' },
  { sel: '#mech-2-note', zh: '闲置 2 小时自动收尾 · 可随时唤起重填', en: 'Auto-closes after 2h idle · can be reopened and refilled anytime' },
  { sel: '#mech-3 .mech-title', zh: '线程隔离 / Bot 行为', en: 'Thread Isolation / Bot Behavior' },
  { sel: '#mech-3-desc', zh: '一个话题 = 一个命令实例，状态严格按话题隔离，绝不串台。群里靠卡片按钮收集输入，不靠逐条打字。',
    en: 'One topic = one command instance; state is strictly isolated per topic, never crosses over. In groups, input is collected via card buttons, not typed line by line.' },
  { sel: '#mech-3-flow', zh: '<code>群聊</code> → 需 @ 机器人 · <code>私聊</code> → 直接处理',
    en: '<code>group chat</code> → requires @mention · <code>DM</code> → handled directly' },
  { sel: '#mech-4 .mech-title', zh: '配置驱动 / 可复用', en: 'Config-driven / Reusable' },
  { sel: '#mech-4-desc', zh: '加一个新能力，只写一份 config + 一个分析 skill，不碰路由和生命周期内核。向导与反馈共用同一套步骤引擎。',
    en: 'Adding a new capability only takes one config + one analysis skill — routing and lifecycle internals stay untouched. Wizards and feedback share the same step engine.' },
  { sel: '#mech-4-flow', zh: '<code>新能力</code> → config + skill → <span class="ok">内核不动</span>',
    en: '<code>new capability</code> → config + skill → <span class="ok">internals untouched</span>' },
  { sel: '#mech-5 .mech-title', zh: 'Feedback（综合案例）', en: 'Feedback (a full example)' },
  { sel: '#mech-5-desc', zh: '反馈把前面几件事串起来：挂在「待反馈」状态上，复用同一套步骤引擎，config 里开个开关即接入。',
    en: 'Feedback ties everything together: it hangs off the "pending feedback" state, reuses the same step engine, and is enabled with one config flag.' },
  { sel: '#mech-5-flow', zh: '<code>裁决</code> → <code>三轴评价</code> → <span class="ok">落库归档</span>',
    en: '<code>verdict</code> → <code>3-axis rating</code> → <span class="ok">stored & archived</span>' },
  { sel: '#mech-5-note', zh: '无回应则每日轻提醒，多次无果自动放弃 · 可随时重填覆盖',
    en: 'A gentle daily nudge if unanswered, auto-abandoned after repeated silence · can be refilled anytime' },

  { sel: '#finaleLine', zh: '新增一个能力<br /><span class="eq mono">=</span> 一份 config <span class="plus mono">+</span> 一个 skill。',
    en: 'A new capability<br /><span class="eq mono">=</span> one config <span class="plus mono">+</span> one skill.' },
  { sel: '#finaleSub', zh: '内核不动，边界清晰。这就是确定性骨架的意义。', en: 'The internals never move, the boundaries stay clean. That is the point of a deterministic skeleton.' },
  { sel: '#finaleFooter', zh: '脱敏架构展示 · 仅用于技术演示，不含任何真实业务 / 凭证信息',
    en: 'Desensitized architecture showcase · for technical demonstration only, no real business data or credentials' },
];

const NAV_LINKS = [
  { href: '#principles', zh: '理念', en: 'Principles' },
  { href: '#arch', zh: '架构', en: 'Architecture' },
  { href: '#lifecycle', zh: '一条命令的一生', en: 'Lifecycle' },
  { href: '#mechanisms', zh: '机制', en: 'Mechanisms' },
];

const PAGE_META = {
  zh: { title: 'ChatOps Command Bot — 确定性做骨架，AI 只做大脑', desc: 'broker/worker 双层架构展示：确定性门卫全包流程，AI 只做分析。', chatLabel: '模拟 IM 对话（纯前端演示）' },
  en: { title: 'ChatOps Command Bot — Deterministic Skeleton, AI Is Just the Brain', desc: 'broker/worker two-layer architecture: a deterministic gatekeeper owns the flow, AI only analyzes.', chatLabel: 'Simulated IM conversation (frontend-only demo)' },
};

let LANG = localStorage.getItem('lang') === 'en' ? 'en' : 'zh';
let chatNodes = [];

function splitHeroWords(el) {
  const frag = document.createDocumentFragment();
  el.childNodes.forEach((node) => {
    if (node.nodeName === 'BR') { frag.appendChild(document.createElement('br')); return; }
    for (const ch of node.textContent) {
      // A lone space as the entire content of an inline-block box counts as
      // both leading and trailing whitespace, so browsers collapse it to
      // zero width — English words would run together. Keep spaces as
      // plain text nodes; only animate non-space characters.
      if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); continue; }
      const s = document.createElement('span');
      s.className = 'hero-word';
      s.style.display = 'inline-block';
      s.textContent = ch;
      frag.appendChild(s);
    }
  });
  el.replaceChildren(frag);
}

// Sets all static (non-dynamic) copy for a language: meta, nav, one-shot
// text nodes. Safe to call before hero/chat are built.
function setStaticText(lang) {
  document.documentElement.lang = lang === 'zh' ? 'zh' : 'en';

  const meta = PAGE_META[lang];
  document.getElementById('pageTitle').textContent = meta.title;
  document.getElementById('metaDesc').setAttribute('content', meta.desc);
  const chatEl = document.getElementById('lsChat');
  if (chatEl) chatEl.setAttribute('aria-label', meta.chatLabel);

  NAV_LINKS.forEach((link) => {
    const a = document.querySelector('.nav-links a[href="' + link.href + '"]');
    if (a) a.textContent = link[lang];
  });

  TRANSLATIONS.forEach(({ sel, text, ...langs }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    if (text) el.textContent = langs[lang];
    else el.innerHTML = langs[lang];
  });

  const toggle = document.getElementById('langToggle');
  if (toggle) toggle.textContent = lang === 'zh' ? 'EN' : '中';
}

// Full language switch: static text + hero re-split + already-built chat nodes.
function applyLang(lang) {
  LANG = lang;
  localStorage.setItem('lang', lang);
  setStaticText(lang);
  // Hero title was split into per-char spans for the entrance animation;
  // rebuild the spans after swapping text so the new chars render (they
  // default to visible — no GSAP-hidden inline styles carry over).
  splitHeroWords(document.getElementById('heroTitle'));
  chatNodes.forEach((el, i) => { el.innerHTML = CHAT_SCRIPT[i][lang]; });
}

function initLangToggle() {
  const toggle = document.getElementById('langToggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => applyLang(LANG === 'zh' ? 'en' : 'zh'));
}

function initLenis() {
  if (!MOTION || !window.Lenis) return;
  const lenis = new Lenis({ autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

function initHero() {
  if (!MOTION) return;
  // Split title into word spans for staggered entrance.
  splitHeroWords(document.getElementById('heroTitle'));

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

// Safety net: if any init throws, strip GSAP inline styles so content stays visible.
function safeInit(fn) {
  try { fn(); } catch (err) {
    console.error('init failed, revealing content:', err);
    if (window.gsap) gsap.set('.nav, .act, .act *', { clearProps: 'opacity,visibility,transform' });
  }
}

function initKickers() {
  if (!MOTION) return;
  gsap.utils.toArray('.act .kicker').forEach((k) => {
    gsap.from(k, { scrollTrigger: { trigger: k, start: 'top 88%' }, autoAlpha: 0, letterSpacing: '0.6em', duration: 0.8 });
  });
}

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

function initArch() {
  const notes = gsap.utils.toArray('#arch .arch-note');
  const archNodes = gsap.utils.toArray('#arch .arch-node');
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
        archNodes.forEach((g, i) => g.classList.toggle('lit', i <= step));
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

function initLifecycle() {
  const chat = document.getElementById('lsChat');
  const steps = gsap.utils.toArray('.ls-step');
  const nodes = CHAT_SCRIPT.map((m) => {
    const el = document.createElement('div');
    el.className = 'msg ' + m.cls;
    el.innerHTML = m[LANG];
    chat.appendChild(el);
    return el;
  });
  chatNodes = nodes;

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

document.addEventListener('DOMContentLoaded', () => {
  // Apply any stored language preference to static copy before hero/chat
  // are built, so their initial render is already in the right language.
  setStaticText(LANG);
  safeInit(initLenis);
  safeInit(initHero);
  safeInit(initKickers);
  safeInit(initPrinciples);
  safeInit(initArch);
  safeInit(initLifecycle);
  safeInit(initMechanisms);
  safeInit(initFinale);
  safeInit(initLangToggle);
  if (MOTION) ScrollTrigger.refresh();
});
