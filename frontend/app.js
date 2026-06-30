// Frontend is 100% static — no network requests. Interactions are scripted below.
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

// --- Scripted IM chat demo: mirrors the backend loop, no network ---
window.__init.push(() => {
  const chat = document.getElementById('chat');
  const play = document.getElementById('play');
  if (!chat || !play) return;

  const script = [
    { cls: 'user', html: '@bot diagnose' },
    { cls: 'card', html: '<div class="card-title">🌐 请选择环境</div>第 1/2 步 · 环境<div><span class="pill">QAT</span><span class="pill">UAT</span><span class="pill">PROD</span></div>' },
    { cls: 'user', html: '选择：UAT' },
    { cls: 'card', html: '<div class="card-title">🌿 输入分支</div>第 2/2 步 · 分支<div><span class="pill">main（默认）</span></div>' },
    { cls: 'user', html: '玩家 12345 在 13:20 请求失败' },
    { cls: 'bot', html: '⏳ worker 分析中…' },
    { cls: 'card', html: '<div class="card-title">📋 诊断报告（模拟）</div>环境=UAT 分支=main\n根因：上游服务返回空额度。\n置信度 82%。' },
  ];

  function reset() { chat.innerHTML = ''; }
  function add(item) {
    const el = document.createElement('div');
    el.className = 'msg ' + item.cls;
    el.innerHTML = item.html;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
  }
  function playAll() {
    reset();
    play.disabled = true;
    let i = 0;
    const tick = () => {
      if (i >= script.length) { play.disabled = false; return; }
      add(script[i++]);
      setTimeout(tick, 700);
    };
    tick();
  }
  play.addEventListener('click', playAll);
  playAll();
});

document.addEventListener('DOMContentLoaded', () => {
  window.__init.forEach((fn) => fn());
});
