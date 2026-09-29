// ===== 派對倒數計時 =====
(function initCountdown() {
  /* 須與 index.html 的日期時間、assets/after-party.ics 的 DTSTART 保持一致 */
  const PARTY_START = new Date('2026-10-25T22:00:00+08:00');
  /* 22:00 到凌晨 04:00 顯示「進行中」，需與 .ics 的 DTEND 一致 */
  const PARTY_LENGTH_MS = 6 * 60 * 60 * 1000;

  const el = document.getElementById('countdown');
  if (!el) return;

  const pad = n => String(n).padStart(2, '0');

  function remainingText(ms) {
    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `距離派對還有 <strong>${days}</strong> 天 <strong>${pad(hours)}</strong> 時 <strong>${pad(mins)}</strong> 分 <strong>${pad(secs)}</strong> 秒`;
  }

  let timer = 0;

  function tick() {
    const diff = PARTY_START - Date.now();
    if (diff > 0) {
      el.innerHTML = remainingText(diff);
    } else if (diff > -PARTY_LENGTH_MS) {
      el.textContent = '🎉 派對進行中，快來秘密基地！';
    } else {
      el.textContent = '派對圓滿結束，謝謝大家一起同樂 ❤️';
      clearInterval(timer);
    }
  }

  el.hidden = false;
  tick();
  timer = setInterval(tick, 1000);
}());
