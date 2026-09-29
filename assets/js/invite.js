// ===== 邀請函彈出視窗 =====
(function initInvite() {
  const dialog = document.getElementById('invite-dialog');
  const openBtn = document.getElementById('invite-open');
  const closeBtn = document.getElementById('invite-close');
  const toggle = document.getElementById('invite-toggle');
  const card = document.getElementById('invite-card');
  const sceneSlot = document.getElementById('invite-scene-slot');
  if (!dialog || !toggle || !card || typeof dialog.showModal !== 'function') return;

  const section = dialog.querySelector('.invite');
  const label = toggle.querySelector('.invite__label');
  let celebrated = false;

  /* 派對現場只有一份 DOM（avatar.js 的走動計時器綁在上面），
     所以用搬移而非複製；記住原位置，關閉時放回頁尾 */
  const sceneParts = ['party-count', 'party-floor']
    .map(id => document.getElementById(id))
    .filter(Boolean)
    .map(el => ({ el, parent: el.parentNode, next: el.nextSibling }));

  function borrowScene() {
    sceneParts.forEach(({ el }) => sceneSlot.appendChild(el));
  }

  function returnScene() {
    sceneParts.forEach(({ el, parent, next }) => parent.insertBefore(el, next));
  }

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WAX_COLORS = ['#b3123e', '#7a0a26', '#d63a5c', '#8c0e30'];

  /* 封蠟碎成像素方塊往外噴，再受重力落下；放進 dialog 內才不會被 top layer 蓋住 */
  function shatterSeal() {
    const seal = toggle.querySelector('.invite__seal');
    if (REDUCED_MOTION || !seal) return;
    const rect = seal.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 18; i++) {
      const shard = document.createElement('span');
      const size = 6 + Math.floor(Math.random() * 3) * 3;
      shard.className = 'seal-shard';
      Object.assign(shard.style, {
        left: `${cx + (Math.random() - 0.5) * rect.width * 0.6}px`,
        top: `${cy + (Math.random() - 0.5) * rect.height * 0.6}px`,
        width: `${size}px`,
        height: `${size}px`,
        background: WAX_COLORS[i % WAX_COLORS.length],
      });
      dialog.appendChild(shard);
      const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 50 + Math.random() * 70;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const spin = (Math.random() - 0.5) * 540;
      shard.animate([
        { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(calc(-50% + ${dx * 1.3}px), calc(-50% + ${dy + 140}px)) rotate(${spin}deg)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 300, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)', fill: 'forwards' })
        .onfinish = () => shard.remove();
    }
  }

  function setEnvelope(open) {
    toggle.setAttribute('aria-expanded', String(open));
    section.classList.toggle('is-open', open);
    card.hidden = !open;
    label.textContent = open ? '收起邀請函' : '點我拆開邀請函';
  }

  function openDialog() {
    if (dialog.open) return;
    borrowScene();
    dialog.showModal();
  }

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    setEnvelope(open);

    if (open) shatterSeal();

    /* 彩紙只在第一次拆信時噴，反覆開合不會一直洗版；burstParticles 定義在 main.js */
    if (open && !celebrated && typeof burstParticles === 'function') {
      celebrated = true;
      burstParticles(toggle, dialog);
    }
  });

  closeBtn.addEventListener('click', () => dialog.close());

  /* 彈窗開著時錨點會被遮住，且關閉時瀏覽器會把焦點還給開啟按鈕而跳回頂端，
     所以先關窗再自己捲動到目標 */
  dialog.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    dialog.close();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* 點到 dialog 本體（即背景遮罩區）才關閉，點內容不會誤關 */
  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close();
  });

  /* Esc 也會觸發 close，統一在這裡收尾 */
  dialog.addEventListener('close', () => {
    returnScene();
    setEnvelope(false);
  });

  if (openBtn) openBtn.addEventListener('click', openDialog);

  openDialog();
}());
