/**
 * Google 表單串接設定
 *
 * 替換步驟：
 * 1. 開啟你的 Google 表單 → 點右上角「傳送」→ 複製連結
 * 2. 把連結中的 /viewform 改成 /formResponse，貼到 FORM_ACTION
 * 3. 在 Chrome 開啟空白表單 → 開發者工具 → Network tab
 *    → 填一筆測試資料送出 → 找到 formResponse 的 POST 請求
 *    → 在 Payload 中找到每個欄位對應的 entry.xxxxxxxxx
 *    → 把 HTML 裡 name="entry.xxxxxxxxx" 的佔位符全部替換掉
 *
 * 範例：
 * FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSe實際表單ID/formResponse'
 */
const FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLScO5mobWJaKIFmA3gjdz20hviLtJXRpnWvfkpOuOW4qMyw5hg/formResponse';

const DEADLINE = new Date('2026-08-26T00:00:00+08:00');

const form = document.getElementById('rsvp-form');
const successPanel = document.getElementById('rsvp-success');
const iframe = document.getElementById('hidden-iframe');
const submitBtn = form.querySelector('.btn-submit');

/* 截止後鎖定表單 */
if (new Date() >= DEADLINE) {
  form.querySelectorAll('input, select, textarea, button').forEach(el => {
    el.disabled = true;
  });
  const notice = document.createElement('p');
  notice.className = 'form-closed-notice';
  notice.textContent = '報名已於 8/20 截止，感謝所有參與者！';
  form.insertAdjacentElement('afterend', notice);
}

/** 驗證單一欄位，回傳錯誤訊息；無誤回傳空字串 */
function validateField(input) {
  if (input.required && !input.value.trim()) return '此欄位為必填';
  if (input.type === 'email' && input.value && !input.validity.valid) return '請輸入有效的電子郵件';
  return '';
}

/** 顯示或清除欄位錯誤訊息 */
function setFieldError(input, message) {
  /* 化身系統的 hidden input 不在 .form-group 內，直接略過 */
  const group = input.closest('.form-group');
  const errorEl = group && group.querySelector('.field-error');
  if (!errorEl) return;
  errorEl.textContent = message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

/** 送出前做一次完整驗證，回傳是否全部通過 */
function validateAll() {
  const fields = form.querySelectorAll('input, select, textarea');
  let valid = true;
  fields.forEach(field => {
    const msg = validateField(field);
    setFieldError(field, msg);
    if (msg) valid = false;
  });
  return valid;
}

/* 即時驗證（blur 時觸發） */
form.addEventListener('focusout', e => {
  if (!e.target.matches('input, select, textarea')) return;
  setFieldError(e.target, validateField(e.target));
});

/* 送出成功後化身入座需要用到姓名，先在送出當下記起來 */
let submittedName = '';

/* 送出表單 */
form.addEventListener('submit', e => {
  e.preventDefault();

  if (!validateAll()) return;

  submittedName = document.getElementById('field-name').value.trim();

  /* 將 form action 導向 Google 表單，並用隱藏 iframe 攔截跳轉 */
  form.action = FORM_ACTION;
  form.method = 'POST';
  form.target = 'hidden-iframe';

  /* 顯示載入狀態 */
  submitBtn.disabled = true;
  submitBtn.classList.add('is-loading');

  /* 等 iframe 載入完成即視為送出成功
     （Google 表單不回傳 JSON，無法偵測真正的成功/失敗） */
  iframe.addEventListener('load', handleSuccess, { once: true });

  form.submit();
});

function handleSuccess() {
  submitBtn.disabled = false;
  submitBtn.classList.remove('is-loading');

  burstParticles(submitBtn);
  showSuccessPopup();

  /* 通知化身系統讓剛報名的賓客入座（avatar.js 監聽） */
  document.dispatchEvent(new CustomEvent('rsvp-success', { detail: { name: submittedName } }));
}

function showSuccessPopup() {
  const overlay = document.createElement('div');
  overlay.className = 'success-overlay';
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('role', 'dialog');
  overlay.innerHTML = `
    <div class="success-popup">
      <span class="success-popup__icon" aria-hidden="true">🎉</span>
      <h3 id="popup-title">報名成功！</h3>
      <p>我們收到你的報名了，<br>期待在派對上見到你！</p>
      <button class="success-popup__close" autofocus>收到！</button>
    </div>
  `;
  document.body.appendChild(overlay);

  function close() {
    overlay.remove();
    form.hidden = true;
    successPanel.hidden = false;
  }

  overlay.querySelector('.success-popup__close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, { once: true });
}

/* container：modal dialog 位於最上層（top layer），粒子須放進 dialog 內才看得到 */
function burstParticles(originEl, container = document.body) {
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = ['#ffd600', '#e040fb', '#40c4ff', '#ff4081', '#69f0ae', '#ff6f00'];

  for (let i = 0; i < 36; i++) {
    const p = document.createElement('div');
    const angle = (i / 36) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist = 100 + Math.random() * 200;
    const size = 6 + Math.random() * 10;

    Object.assign(p.style, {
      position: 'fixed',
      left: `${cx}px`,
      top: `${cy}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: Math.random() > 0.4 ? '50%' : '3px',
      background: colors[Math.floor(Math.random() * colors.length)],
      pointerEvents: 'none',
      zIndex: '2000',
    });
    container.appendChild(p);

    p.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist + 60}px)) scale(0)`, opacity: 0 },
    ], {
      duration: 550 + Math.random() * 450,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards',
    }).onfinish = () => p.remove();
  }
}
