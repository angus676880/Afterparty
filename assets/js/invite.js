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

    /* 彩紙只在第一次拆信時噴，反覆開合不會一直洗版；burstParticles 定義在 main.js */
    if (open && !celebrated && typeof burstParticles === 'function') {
      celebrated = true;
      burstParticles(toggle);
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
