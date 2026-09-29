// ===== 邀請函信封開合 =====
(function initInvite() {
  const section = document.querySelector('.invite');
  const toggle = document.getElementById('invite-toggle');
  const card = document.getElementById('invite-card');
  if (!section || !toggle || !card) return;

  const label = toggle.querySelector('.invite__label');
  let celebrated = false;

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    section.classList.toggle('is-open', open);
    card.hidden = !open;
    label.textContent = open ? '收起邀請函' : '點我拆開邀請函';

    /* 彩紙只在第一次拆信時噴，反覆開合不會一直洗版；burstParticles 定義在 main.js */
    if (open && !celebrated && typeof burstParticles === 'function') {
      celebrated = true;
      burstParticles(toggle);
    }
  });
}());
