// ===== 狼人殺身分預抽 =====
(function initWerewolf() {
  const card = document.getElementById('role-card');
  const drawBtn = document.getElementById('role-draw');
  const iconEl = document.getElementById('role-icon');
  const nameEl = document.getElementById('role-name');
  const lineEl = document.getElementById('role-line');
  const liveEl = document.getElementById('role-live');
  if (!card || !drawBtn) return;

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FLIP_MS = 450;

  /* 12×12 像素圖示；字元對應 palette 顏色，'.' 為透明 */
  const ROLES = [
    {
      name: '狼人',
      weight: 3,
      line: '天黑請閉眼……你不用閉。記得藏好尾巴。',
      palette: { G: '#8a8aa8', R: '#ff1744', W: '#d9d4e3', K: '#1a1a24' },
      art: [
        '.G........G.',
        '.GG......GG.',
        '.GGG....GGG.',
        '.GGGGGGGGGG.',
        'GGGGGGGGGGGG',
        'GGRGGGGGGRGG',
        'GGGGGGGGGGGG',
        '.GGGGGGGGGG.',
        '..GGGWWGGG..',
        '..GGWKKWGG..',
        '...GGWWGG...',
        '....GGGG....',
      ],
    },
    {
      name: '預言家',
      weight: 1,
      line: '你看穿一切，今晚誰在說謊你都知道。',
      palette: { P: '#40c4ff', L: '#e8f8ff', S: '#ffd600', B: '#6b4226' },
      art: [
        '....PPPP....',
        '..PPLLPPPP..',
        '.PPLLPPPPPP.',
        '.PLLPPPPPPP.',
        'PPLPPPPPPPPP',
        'PPPPPPPSPPPP',
        'PPPPPPSSSPPP',
        '.PPPPPPSPPP.',
        '.PPPPPPPPPP.',
        '..PPPPPPPP..',
        '..BBBBBBBB..',
        '.BBBBBBBBBB.',
      ],
    },
    {
      name: '女巫',
      weight: 1,
      line: '一瓶解藥、一瓶毒藥，用在誰身上看你心情。',
      palette: { C: '#6b4226', N: '#9e9eb8', G: '#69f0ae', L: '#fdfdfd', B: '#0e9594' },
      art: [
        '.....CC.....',
        '.....CC.....',
        '....NNNN....',
        '.....GG.....',
        '.....GG.....',
        '....GGGG....',
        '...GLGGGG...',
        '..GLGGGGGG..',
        '..GGGGBGGG..',
        '..GBGGGGBG..',
        '...GGGGGG...',
        '....GGGG....',
      ],
    },
    {
      name: '獵人',
      weight: 1,
      line: '就算倒下，也要帶走一個。',
      palette: { R: '#ff4081', W: '#fdfdfd', Y: '#ffd600', B: '#6b4226' },
      art: [
        '....RRRR..Y.',
        '..RRWWWWRYY.',
        '.RWWRRRRBW..',
        '.RWRRWWBRWR.',
        'RWRRWWBWRRWR',
        'RWRWRBRRWRWR',
        'RWRWRRRRWRWR',
        'RWRRWWWWRRWR',
        '.RWRRWWRRWR.',
        '.RWWRRRRWWR.',
        '..RRWWWWRR..',
        '....RRRR....',
      ],
    },
    {
      name: '守衛',
      weight: 1,
      line: '今晚你想守護誰？千萬別守到狼。',
      palette: { S: '#b9c4cc', B: '#3f6cb5', Y: '#ffd600' },
      art: [
        '.SSSSSSSSSS.',
        'SBBBBBBBBBBS',
        'SBBBBYYBBBBS',
        'SBBBBYYBBBBS',
        'SBBYYYYYYBBS',
        'SBBYYYYYYBBS',
        'SBBBBYYBBBBS',
        '.SBBBYYBBBS.',
        '.SBBBYYBBBS.',
        '..SBBBBBBS..',
        '...SBBBBS...',
        '....SSSS....',
      ],
    },
    {
      name: '平民',
      weight: 3,
      line: '什麼技能都沒有，但你有滿滿的真誠（和酒）。',
      palette: { Y: '#e8c04a', S: '#f6d7b0', K: '#1a1a24', R: '#b23a48', C: '#0e9594' },
      art: [
        '....YYYY....',
        '...YYYYYY...',
        'YYYYYYYYYYYY',
        '..SSSSSSSS..',
        '..SSSSSSSS..',
        '..SKSSSSKS..',
        '..SSSSSSSS..',
        '..SSSRRSSS..',
        '...SSSSSS...',
        '..CCCCCCCC..',
        '.CCCCCCCCCC.',
        '.CCCCCCCCCC.',
      ],
    },
  ];

  /* 同色相鄰像素合併成一條 rect，減少節點數 */
  function artToSvg({ art, palette }) {
    const rects = [];
    art.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        let w = 1;
        while (row[x + w] === ch) w++;
        if (palette[ch]) rects.push(`<rect x="${x}" y="${y}" width="${w}" height="1" fill="${palette[ch]}"/>`);
        x += w;
      }
    });
    return `<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects.join('')}</svg>`;
  }

  /* 依權重抽，比例貼近實際開局（狼與平民較多） */
  function pickRole() {
    const total = ROLES.reduce((sum, r) => sum + r.weight, 0);
    let n = Math.random() * total;
    return ROLES.find(r => (n -= r.weight) < 0) || ROLES[0];
  }

  function reveal(role) {
    iconEl.innerHTML = artToSvg(role);
    nameEl.textContent = role.name;
    lineEl.textContent = role.line;
    card.classList.add('is-revealed');
    liveEl.textContent = `你抽到的身分是${role.name}。${role.line}`;
    drawBtn.textContent = '🔁 再抽一次';
    drawBtn.disabled = false;
  }

  drawBtn.addEventListener('click', () => {
    const role = pickRole();
    drawBtn.disabled = true;
    if (REDUCED_MOTION) {
      reveal(role);
      return;
    }
    /* 已翻開時先蓋回去，等翻面動畫走完再換內容，才不會在翻轉途中看到新身分 */
    const wasRevealed = card.classList.contains('is-revealed');
    card.classList.remove('is-revealed');
    setTimeout(() => reveal(role), wasRevealed ? FLIP_MS : 0);
  });
}());
