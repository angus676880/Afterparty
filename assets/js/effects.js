// ===== 星塵粒子背景 =====
(function initStars() {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '-1',
    pointerEvents: 'none',
  });
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function spawn() {
    stars = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.3 + 0.2,
      vy: Math.random() * 0.22 + 0.04,
      alpha: Math.random() * 0.5 + 0.12,
      phase: Math.random() * Math.PI * 2,
      freq: Math.random() * 0.012 + 0.004,
    }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const brightness = Math.sin(t * s.freq + s.phase) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${(s.alpha * brightness).toFixed(3)})`;
      ctx.fill();
      s.y -= s.vy;
      if (s.y < -2) {
        s.y = canvas.height + 2;
        s.x = Math.random() * canvas.width;
      }
    }
    requestAnimationFrame(draw);
  }

  resize();
  spawn();
  requestAnimationFrame(draw);
  window.addEventListener('resize', () => { resize(); spawn(); });
}());

// ===== 滑鼠光暈 =====
document.addEventListener('mousemove', ({ clientX: x, clientY: y }) => {
  document.documentElement.style.setProperty('--mouse-x', `${x}px`);
  document.documentElement.style.setProperty('--mouse-y', `${y}px`);
});

// ===== Scroll Reveal =====
const revealObserver = new IntersectionObserver(
  entries => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) {
      target.classList.add('is-visible');
      revealObserver.unobserve(target);
    }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== 標題 Glitch =====
(function initGlitch() {
  const title = document.querySelector('.hero__title');
  if (!title) return;

  function glitch() {
    title.classList.add('is-glitching');
    setTimeout(() => title.classList.remove('is-glitching'), 380);
    setTimeout(glitch, 10);
  }
  setTimeout(glitch, 2000);
}());

// ===== 浮動光球（注入到 hero） =====
(function initOrbs() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const configs = [
    { size: '280px', color: 'rgba(224,64,251,0.18)',  top: '-8%',   left: '-6%',  delay: '0s' },
    { size: '200px', color: 'rgba(64,196,255,0.13)',  top: '25%',   right: '-4%', delay: '-3s' },
    { size: '230px', color: 'rgba(255,214,0,0.08)',   bottom: '5%', left: '35%',  delay: '-5.5s' },
  ];

  configs.forEach(({ size, color, delay, ...pos }) => {
    const orb = document.createElement('div');
    orb.setAttribute('aria-hidden', 'true');
    Object.assign(orb.style, {
      position: 'absolute',
      width: size,
      height: size,
      background: color,
      borderRadius: '50%',
      filter: 'blur(55px)',
      pointerEvents: 'none',
      animation: `orb-float 9s ease-in-out ${delay} infinite`,
      ...pos,
    });
    hero.appendChild(orb);
  });
}());
