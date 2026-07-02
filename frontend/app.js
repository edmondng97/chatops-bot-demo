// Frontend is 100% static — no network requests. Motion is GSAP-driven.
'use strict';
window.__init = window.__init || [];

// --- Flow timeline: click a step to highlight + show its responsibility ---
window.__init.push(() => {
  const tl = document.getElementById('tl');
  const out = document.getElementById('tl-desc');
  if (!tl || !out) return;
  tl.querySelectorAll('li').forEach((li) => {
    li.addEventListener('click', () => {
      tl.querySelectorAll('li').forEach((x) => x.classList.remove('active'));
      li.classList.add('active');
      out.textContent = li.getAttribute('data-desc');
    });
  });
});

// --- Chat script (shared by GSAP demo + reduced-motion fallback) ---
const CHAT_SCRIPT = [
  { cls: 'user', html: '@bot diagnose' },
  { cls: 'card', html: '<div class="card-title">🌐 请选择环境</div>第 1/2 步 · 环境<div><span class="pill">QAT</span><span class="pill">UAT</span><span class="pill">PROD</span></div>' },
  { cls: 'user', html: '选择：UAT' },
  { cls: 'card', html: '<div class="card-title">🌿 输入分支</div>第 2/2 步 · 分支<div><span class="pill">main（默认）</span></div>' },
  { cls: 'user', html: '玩家 12345 在 13:20 请求失败' },
  { cls: 'bot', html: '⏳ worker 分析中…' },
  { cls: 'card', html: '<div class="card-title">📋 诊断报告（模拟）</div>环境=UAT 分支=main\n根因：上游服务返回空额度。\n置信度 82%。' },
];

function buildChatNodes(chat) {
  return CHAT_SCRIPT.map((item) => {
    const el = document.createElement('div');
    el.className = 'msg ' + item.cls;
    el.innerHTML = item.html;
    chat.appendChild(el);
    return el;
  });
}

// --- GSAP-powered motion: entrances, scroll reveals, scroll-scrubbed chat ---
window.__init.push(() => {
  const chat = document.getElementById('chat');
  const nodes = chat ? buildChatNodes(chat) : [];

  const hasGSAP = window.gsap && window.ScrollTrigger;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fallback: no GSAP or reduced motion → show everything statically.
  if (!hasGSAP || prefersReduced) {
    document.body.classList.add('no-anim');
    nodes.forEach((el) => el.classList.add('show'));
    const bar = document.getElementById('chatProgress');
    if (bar) bar.style.width = '100%';
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });
  document.body.classList.add('gsap-on');

  // 1) Nav slides down, brand + links stagger in.
  gsap.from('.nav', { y: -24, autoAlpha: 0, duration: 0.7, ease: 'power2.out' });
  gsap.from('.nav .brand, .nav a', { y: -14, autoAlpha: 0, stagger: 0.06, delay: 0.15, duration: 0.6 });

  // 2) Section headings + leads rise as they enter.
  gsap.utils.toArray('.section > h2').forEach((h) => {
    gsap.from(h, {
      scrollTrigger: { trigger: h, start: 'top 85%' },
      y: 40, autoAlpha: 0, duration: 0.8,
    });
  });
  gsap.utils.toArray('.section > .lead').forEach((p) => {
    gsap.from(p, {
      scrollTrigger: { trigger: p, start: 'top 88%' },
      y: 24, autoAlpha: 0, duration: 0.7, delay: 0.05,
    });
  });

  // 3) Panels/cards batch in with an overshoot stagger — the "wow" beat.
  ScrollTrigger.batch('.grid .panel', {
    start: 'top 88%',
    onEnter: (els) => gsap.from(els, {
      y: 46, autoAlpha: 0, scale: 0.94, rotationX: 8, transformOrigin: '50% 100%',
      duration: 0.85, stagger: 0.09, ease: 'back.out(1.5)', overwrite: true,
    }),
  });

  // 4) Architecture SVG assembles: boxes pop, connectors draw.
  const svg = document.querySelector('#philosophy svg');
  if (svg) {
    gsap.from(svg.querySelectorAll('rect'), {
      scrollTrigger: { trigger: svg, start: 'top 82%' },
      scale: 0, transformOrigin: '50% 50%', autoAlpha: 0,
      duration: 0.7, stagger: 0.12, ease: 'back.out(1.7)',
    });
    gsap.from(svg.querySelectorAll('line'), {
      scrollTrigger: { trigger: svg, start: 'top 82%' },
      scaleX: 0, transformOrigin: 'left center', autoAlpha: 0,
      duration: 0.5, stagger: 0.15, delay: 0.4, ease: 'power2.out',
    });
    gsap.from(svg.querySelectorAll('text'), {
      scrollTrigger: { trigger: svg, start: 'top 82%' },
      autoAlpha: 0, duration: 0.5, stagger: 0.05, delay: 0.6,
    });
  }

  // 5) Timeline steps slide in from the left with a spring.
  gsap.from('#tl li', {
    scrollTrigger: { trigger: '#tl', start: 'top 82%' },
    x: -48, autoAlpha: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.4)',
  });

  // 6) Scroll-driven chat: each message plays in as it scrolls into view,
  //    and reverses (recalls) when scrolled back up — time-sequenced by scroll.
  const bar = document.getElementById('chatProgress');
  if (nodes.length) {
    nodes.forEach((el) => {
      gsap.from(el, {
        autoAlpha: 0, y: 34, scale: 0.95, duration: 0.55, ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 86%',
          toggleActions: 'play none none reverse', // down = play, up = recall
        },
      });
    });
    if (bar) {
      ScrollTrigger.create({
        trigger: chat, start: 'top 82%', end: 'bottom 65%',
        onUpdate: (self) => { bar.style.width = Math.round(self.progress * 100) + '%'; },
      });
    }
  }

  ScrollTrigger.refresh();
});

document.addEventListener('DOMContentLoaded', () => {
  window.__init.forEach((fn) => fn());
});
