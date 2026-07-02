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

document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initHero();
  if (MOTION) ScrollTrigger.refresh();
});
