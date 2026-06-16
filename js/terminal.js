/* ============================================================
   terminal.js — global cyberpunk-terminal enhancements
   Loaded on every page. Defensive: each module no-ops if its
   target elements are absent.
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Highlight the correct nav link for the current page ---- */
  function initActiveNav() {
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav-links a').forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      a.classList.toggle('active', href === here || (here === '' && href === 'index.html'));
    });
  }

  /* ---- 2. Scroll reveal: auto-tag common blocks, fade them in ---- */
  function initReveal() {
    if (reduceMotion) return;
    const selectors = '.about-item, .project-card, .cv-item, .blog-post, .contact-card, .stat-row, .skill-category, .featured-project, .timeline-entry';
    const els = Array.from(document.querySelectorAll(selectors));
    if (!els.length || !('IntersectionObserver' in window)) return;

    els.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${Math.min(i % 6, 6) * 60}ms`;
    });

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12 });

    els.forEach(el => io.observe(el));
  }

  /* ---- 3. Animate stat / XP bars when they scroll into view ---- */
  function initStatBars() {
    const bars = Array.from(document.querySelectorAll('.stat-bar > span[data-level]'));
    if (!bars.length) return;

    const fill = span => { span.style.width = Math.max(0, Math.min(100, +span.dataset.level || 0)) + '%'; };

    if (!('IntersectionObserver' in window) || reduceMotion) { bars.forEach(fill); return; }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => { if (e.isIntersecting) { fill(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.4 });
    bars.forEach(b => io.observe(b));
  }

  /* ---- 4. Typewriter for [data-typewriter] elements ----
     Element holds newline-separated lines in data-lines.            */
  function initTypewriter() {
    document.querySelectorAll('[data-typewriter]').forEach(el => {
      const lines = (el.getAttribute('data-lines') || el.textContent || '')
        .split('\n').map(s => s.trim()).filter(Boolean);
      if (!lines.length) return;
      el.textContent = '';

      if (reduceMotion) { el.textContent = lines[0]; return; }

      let li = 0, ci = 0, deleting = false;
      const tick = () => {
        const full = lines[li];
        el.textContent = full.slice(0, ci);
        if (!deleting && ci < full.length) { ci++; setTimeout(tick, 45); }
        else if (!deleting && ci === full.length) { deleting = true; setTimeout(tick, 1600); }
        else if (deleting && ci > 0) { ci--; setTimeout(tick, 22); }
        else { deleting = false; li = (li + 1) % lines.length; setTimeout(tick, 350); }
      };
      tick();
    });
  }

  /* ---- 5. Subtle sound toggle (OFF by default) ---- */
  function initSound() {
    let ctx = null;
    let enabled = false;

    const btn = document.createElement('button');
    btn.id = 'sfxToggle';
    btn.setAttribute('aria-label', 'Toggle interface sound');
    btn.title = 'Toggle interface sound';
    btn.innerHTML = '<i class="fas fa-volume-xmark"></i>';
    Object.assign(btn.style, {
      position: 'fixed', bottom: '2rem', left: '2rem', width: '44px', height: '44px',
      borderRadius: '8px', border: '1px solid var(--line)', background: 'rgba(8,9,13,0.8)',
      color: 'var(--text-muted)', cursor: 'pointer', zIndex: 900, backdropFilter: 'blur(6px)',
      transition: 'all 0.3s ease'
    });
    document.body.appendChild(btn);

    const blip = (freq = 440, dur = 0.06, type = 'square', gain = 0.04) => {
      if (!enabled) return;
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.stop(ctx.currentTime + dur);
    };
    window.__blip = blip; // exposed for the easter egg

    btn.addEventListener('click', () => {
      enabled = !enabled;
      btn.innerHTML = enabled ? '<i class="fas fa-volume-high"></i>' : '<i class="fas fa-volume-xmark"></i>';
      btn.style.color = enabled ? 'var(--primary-color)' : 'var(--text-muted)';
      btn.style.borderColor = enabled ? 'var(--primary-color)' : 'var(--line)';
      if (enabled) { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); blip(660, 0.08); }
    });

    document.addEventListener('click', e => {
      if (!enabled) return;
      const t = e.target.closest('a.project-link, a.project-btn, .cta-button, .filter-btn, .download-cv-btn, button');
      if (t && t !== btn) blip(520, 0.05);
    });
    document.addEventListener('pointerover', e => {
      if (!enabled) return;
      if (e.target.closest('.nav-links a')) blip(880, 0.03, 'square', 0.02);
    });
  }

  /* ---- 6. Konami code easter egg ---- */
  function initKonami() {
    const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let pos = 0;
    document.addEventListener('keydown', e => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = (k === seq[pos]) ? pos + 1 : (k === seq[0] ? 1 : 0);
      if (pos === seq.length) { pos = 0; unlock(); }
    });

    function toast(msg) {
      const t = document.createElement('div');
      t.textContent = msg;
      Object.assign(t.style, {
        position: 'fixed', top: '90px', left: '50%', transform: 'translateX(-50%) translateY(-20px)',
        fontFamily: 'var(--mono)', fontSize: '0.95rem', color: '#04110c', fontWeight: '700',
        background: 'linear-gradient(135deg, var(--primary-color), var(--neon-cyan))',
        padding: '0.7rem 1.3rem', borderRadius: '8px', zIndex: 10000, opacity: '0',
        boxShadow: '0 0 24px rgba(46,230,166,0.6)', transition: 'all 0.4s ease', pointerEvents: 'none'
      });
      document.body.appendChild(t);
      requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
      setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(-20px)'; setTimeout(() => t.remove(), 500); }, 3200);
    }

    function unlock() {
      if (window.__blip) { window.__blip(660,0.08); setTimeout(()=>window.__blip(880,0.08),90); setTimeout(()=>window.__blip(1320,0.12),180); }
      toast('🏆 ACHIEVEMENT UNLOCKED — DEVELOPER MODE');
      if (!reduceMotion) matrixRain();
    }

    function matrixRain() {
      if (document.getElementById('matrix-fx')) return;
      const cv = document.createElement('canvas');
      cv.id = 'matrix-fx';
      Object.assign(cv.style, { position: 'fixed', inset: '0', zIndex: 9997, pointerEvents: 'none', opacity: '0.5' });
      document.body.appendChild(cv);
      const ctx = cv.getContext('2d');
      const resize = () => { cv.width = innerWidth; cv.height = innerHeight; };
      resize(); addEventListener('resize', resize);
      const chars = '01ラヴェンTAHMID<>/{}#$%*+'.split('');
      const cols = Math.floor(cv.width / 16);
      const drops = Array(cols).fill(1);
      let frames = 0;
      const loop = () => {
        ctx.fillStyle = 'rgba(8,9,13,0.08)';
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.fillStyle = '#2ee6a6';
        ctx.font = '15px monospace';
        drops.forEach((y, i) => {
          ctx.fillText(chars[(Math.random() * chars.length) | 0], i * 16, y * 16);
          if (y * 16 > cv.height && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        });
        if (frames++ < 420) requestAnimationFrame(loop);
        else { cv.style.transition = 'opacity 1s ease'; cv.style.opacity = '0'; setTimeout(() => cv.remove(), 1000); }
      };
      loop();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initActiveNav();
    initReveal();
    initStatBars();
    initTypewriter();
    initSound();
    initKonami();
  });
})();
