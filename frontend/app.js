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
  { cls: 'user', html: '@bot diagnose', step: 0 },
  { cls: 'bot',  html: '收到。已按 thread 创建命令实例。', step: 1 },
  { cls: 'card', html: '<div class="card-title">🌐 请选择环境</div>第 1/2 步 · 环境<div><span class="pill">QAT</span><span class="pill">UAT</span><span class="pill">PROD</span></div>', step: 2 },
  { cls: 'user', html: '选择：UAT', step: 3 },
  { cls: 'card', html: '<div class="card-title">🌿 输入分支</div>第 2/2 步 · 分支<div><span class="pill">main（默认）</span></div>', step: 3 },
  { cls: 'user', html: '玩家 12345 在 13:20 请求失败', step: 3 },
  { cls: 'bot',  html: '⏳ 向导完成，worker 子进程分析中…', step: 4 },
  { cls: 'card', html: '<div class="card-title">📋 诊断报告（模拟）</div>环境=UAT · 分支=main\n根因：上游服务返回空额度。\n置信度 82%。', step: 5 },
];

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

document.addEventListener('DOMContentLoaded', () => {
  safeInit(initLenis);
  safeInit(initHero);
  safeInit(initKickers);
  safeInit(initPrinciples);
  safeInit(initArch);
  safeInit(initLifecycle);
  if (MOTION) ScrollTrigger.refresh();
});
