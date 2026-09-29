/**
 * 派對化身系統：像素風紙娃娃產生器 + 虛擬派對現場
 *
 * 共享名單串接步驟（讓所有賓客互相看到彼此的化身）：
 * 1. 在 Google 表單新增一個「簡答」問題（例如取名「化身代碼」），
 *    依 main.js 開頭的方法找出它的 entry ID，
 *    替換 index.html 中 id="field-avatar" 那個 hidden input 的 name。
 * 2. 開啟表單的回應試算表 → 檔案 → 共用 → 發布到網路
 *    → 選擇該工作表、格式選「逗號分隔值 (.csv)」→ 複製網址貼到下方 SHEET_CSV_URL。
 * 3. 若姓名不在試算表的 B 欄，調整 NAME_COLUMN（A=0 是時間戳記）。
 *
 * 注意：Google 發布的 CSV 約有 5 分鐘快取，新報名可能稍晚才出現在現場。
 */
(function initAvatarSystem() {
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSLosDCRRIWidQFGWRu2eVF1_Af-YiyOw6adsTdPlYSNmg_DhKEwDV0UsXTHTMJbhiDzhcMRYHkMyxR/pub?gid=1437939750&single=true&output=csv';
  const NAME_COLUMN = 1;
  const STORAGE_KEY = 'afterparty-avatars';
  const AVATAR_CODE_RE = /^v1:\d+-\d+-\d+-\d+-\d+$/;

  /* 新人設定：名字改這裡 */
  const COUPLE_NAMES = { groom: 'Angus', bride: 'Bess' };

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== 像素化身零件（16×24 格） ===== */

  const INK = '#1a1a24';
  const SKINS = ['#f6d7b0', '#e8b98a', '#c98d5e', '#8d5a3a'];
  const HAIR_COLORS = ['#26262e', '#6b4226', '#e8c04a', '#e040fb', '#40c4ff'];

  /* rect = [x, y, 寬, 高, 顏色, 透明度?]，shape-rendering: crispEdges 保持像素邊緣 */
  function rectsMarkup(rects) {
    return rects
      .map(r => `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" fill="${r[4]}"${r[5] ? ` opacity="${r[5]}"` : ''}/>`)
      .join('');
  }

  function pixelSvg(rects, w, h) {
    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rectsMarkup(rects)}</svg>`;
  }

  /* 標準身形：長袖上衣 + 長褲 + 鞋 */
  function baseBody(skin, coat, pants) {
    return [
      [4, 10, 8, 6, coat],
      [3, 10, 1, 5, coat], [12, 10, 1, 5, coat],
      [3, 15, 1, 1, skin], [12, 15, 1, 1, skin],
      [5, 16, 2, 6, pants], [9, 16, 2, 6, pants],
      [4, 22, 3, 1, INK], [9, 22, 3, 1, INK],
    ];
  }

  const HAIR_STYLES = [
    {
      label: '清爽平頭',
      pixels: c => [[5, 2, 6, 1, c], [4, 3, 1, 2, c], [11, 3, 1, 2, c]],
    },
    {
      label: '俐落短髮',
      pixels: c => [[4, 2, 8, 2, c], [4, 4, 1, 2, c], [11, 4, 1, 2, c]],
    },
    {
      label: '飄逸長髮',
      pixels: c => [[4, 2, 8, 2, c], [3, 3, 2, 9, c], [11, 3, 2, 9, c]],
    },
    {
      label: '元氣丸子頭',
      pixels: c => [[6, 0, 4, 2, c], [4, 2, 8, 2, c], [7, 2, 2, 1, '#ffd600'], [4, 4, 1, 1, c], [11, 4, 1, 1, c]],
    },
    {
      label: '蓬鬆爆炸頭',
      pixels: c => [[4, 0, 8, 1, c], [3, 1, 10, 2, c], [2, 3, 2, 3, c], [12, 3, 2, 3, c], [4, 3, 8, 1, c]],
    },
    {
      label: '俏皮雙馬尾',
      pixels: c => [
        [4, 2, 8, 2, c],
        [2, 1, 2, 4, c], [12, 1, 2, 4, c],
        [2, 4, 2, 1, '#ffd600'], [12, 4, 2, 1, '#ffd600'],
        [2, 5, 1, 5, c], [13, 5, 1, 5, c],
      ],
    },
    {
      label: '龐克莫霍克',
      pixels: c => [[7, 0, 2, 4, c]],
    },
    {
      label: '波浪捲髮',
      pixels: c => [
        [4, 2, 8, 2, c],
        [3, 3, 2, 3, c], [11, 3, 2, 3, c],
        [2, 5, 2, 3, c], [12, 5, 2, 3, c],
        [3, 8, 2, 3, c], [11, 8, 2, 3, c],
      ],
    },
  ];

  const OUTFITS = [
    {
      label: '紳士西裝',
      pixels: skin => [
        ...baseBody(skin, '#1f2a4d', '#1f2a4d'),
        [7, 10, 2, 4, '#f0f0f0'],
        [6, 11, 4, 1, '#ff4081'],
      ],
    },
    {
      label: '金光亮片裝',
      pixels: skin => [
        ...baseBody(skin, '#c9971c', '#3a2c55'),
        [6, 10, 4, 1, '#a87a12'],
        [5, 11, 1, 1, '#ffffff', 0.85], [9, 12, 1, 1, '#ffffff', 0.85], [7, 14, 1, 1, '#ffffff', 0.85],
        [10, 10, 1, 1, '#ffffff', 0.85], [6, 13, 1, 1, '#ffffff', 0.85],
        [4, 12, 1, 1, '#ffffff', 0.5], [11, 11, 1, 1, '#ffffff', 0.5],
      ],
    },
    {
      label: '夏威夷派對衫',
      pixels: skin => [
        [4, 10, 8, 6, '#0e9594'],
        [3, 10, 1, 2, '#0e9594'], [12, 10, 1, 2, '#0e9594'],
        [3, 12, 1, 4, skin], [12, 12, 1, 4, skin],
        [6, 10, 1, 1, '#f0f0f0'], [9, 10, 1, 1, '#f0f0f0'],
        [5, 12, 1, 1, '#fdfdfd'], [8, 11, 1, 1, '#fdfdfd'], [10, 14, 1, 1, '#fdfdfd'], [6, 14, 1, 1, '#fdfdfd'],
        [9, 13, 1, 1, '#ffd600'],
        [5, 16, 2, 2, '#0b7776'], [9, 16, 2, 2, '#0b7776'],
        [5, 18, 2, 4, skin], [9, 18, 2, 4, skin],
        [4, 22, 3, 1, INK], [9, 22, 3, 1, INK],
      ],
    },
    {
      label: '舒適連帽衫',
      pixels: skin => [
        [5, 9, 6, 1, '#474054'],
        ...baseBody(skin, '#5c5470', '#3a3547'),
        [5, 10, 6, 1, '#474054'],
        [6, 11, 1, 2, '#d9d4e3'], [9, 11, 1, 2, '#d9d4e3'],
        [6, 14, 4, 2, '#524a63'],
      ],
    },
    {
      label: '復古迪斯可',
      pixels: skin => [
        ...baseBody(skin, '#7b1fa2', '#7b1fa2'),
        [5, 10, 1, 2, '#9b30c9'], [10, 10, 1, 2, '#9b30c9'],
        [7, 10, 2, 2, skin],
        [6, 12, 1, 1, '#ffd600'], [7, 13, 2, 1, '#ffd600'], [9, 12, 1, 1, '#ffd600'],
        [4, 20, 3, 2, '#7b1fa2'], [9, 20, 3, 2, '#7b1fa2'],
      ],
    },
    {
      label: '甜美小洋裝',
      pixels: skin => [
        [4, 10, 8, 4, '#ff8ab8'],
        [3, 10, 1, 5, skin], [12, 10, 1, 5, skin],
        [3, 15, 1, 1, skin], [12, 15, 1, 1, skin],
        [6, 10, 1, 1, '#fdfdfd'], [9, 10, 1, 1, '#fdfdfd'],
        [7, 13, 2, 1, '#ffd600'],
        [3, 14, 10, 3, '#ff8ab8'],
        [3, 16, 10, 1, '#e56a9f'],
        [5, 17, 2, 5, skin], [9, 17, 2, 5, skin],
        [4, 22, 3, 1, '#e56a9f'], [9, 22, 3, 1, '#e56a9f'],
      ],
    },
    {
      label: '星光晚禮服',
      pixels: skin => [
        [4, 10, 8, 6, '#b3123e'],
        [3, 10, 1, 5, skin], [12, 10, 1, 5, skin],
        [3, 15, 1, 1, skin], [12, 15, 1, 1, skin],
        [6, 10, 4, 1, '#8c0e30'],
        [3, 16, 10, 3, '#b3123e'],
        [2, 19, 12, 3, '#b3123e'],
        [5, 12, 1, 1, '#ffd600', 0.9], [9, 14, 1, 1, '#ffd600', 0.9], [7, 17, 1, 1, '#ffd600', 0.9],
        [4, 20, 1, 1, '#ffd600', 0.9], [10, 19, 1, 1, '#ffd600', 0.9],
      ],
    },
    {
      label: '丹寧吊帶裙',
      pixels: skin => [
        [4, 10, 8, 3, '#f0f0f0'],
        [3, 10, 1, 2, '#f0f0f0'], [12, 10, 1, 2, '#f0f0f0'],
        [3, 12, 1, 4, skin], [12, 12, 1, 4, skin],
        [5, 10, 1, 3, '#3f6cb5'], [10, 10, 1, 3, '#3f6cb5'],
        [5, 12, 1, 1, '#ffd600'], [10, 12, 1, 1, '#ffd600'],
        [4, 13, 8, 3, '#3f6cb5'],
        [3, 16, 10, 2, '#3f6cb5'],
        [5, 18, 2, 4, skin], [9, 18, 2, 4, skin],
        [4, 22, 3, 1, '#f0f0f0'], [9, 22, 3, 1, '#f0f0f0'],
      ],
    },
    {
      /* full：全身布偶裝，會套住頭臉與髮型（renderGuest 據此跳過本體不畫）。
         新服裝一律加在陣列尾端，索引位移會讓既有化身代碼穿錯衣服 */
      label: '恐龍裝',
      full: true,
      pixels: () => [
        [3, 1, 10, 6, '#43a047'],
        [5, 0, 1, 1, '#2e7d32'], [10, 0, 1, 1, '#2e7d32'],
        [4, 2, 2, 2, '#fdfdfd'], [10, 2, 2, 2, '#fdfdfd'],
        [5, 3, 1, 1, INK], [10, 3, 1, 1, INK],
        [6, 5, 1, 1, '#2e7d32'], [9, 5, 1, 1, '#2e7d32'],
        [3, 7, 10, 2, '#2e7d32'],
        [4, 7, 1, 1, '#fdfdfd'], [6, 7, 1, 1, '#fdfdfd'], [8, 7, 1, 1, '#fdfdfd'], [10, 7, 1, 1, '#fdfdfd'],
        [4, 9, 8, 7, '#43a047'],
        [6, 10, 4, 6, '#d7e8a0'],
        [3, 10, 1, 3, '#43a047'], [12, 10, 1, 3, '#43a047'],
        [3, 12, 1, 1, '#2e7d32'], [12, 12, 1, 1, '#2e7d32'],
        [12, 13, 2, 2, '#43a047'], [14, 14, 1, 2, '#43a047'], [15, 15, 1, 1, '#2e7d32'],
        [4, 16, 3, 6, '#43a047'], [9, 16, 3, 6, '#43a047'],
        [3, 22, 4, 1, '#2e7d32'], [9, 22, 4, 1, '#2e7d32'],
      ],
    },
  ];

  const ACCESSORIES = [
    { label: '不戴配件', pixels: () => [] },
    {
      label: '霓虹墨鏡',
      pixels: () => [[5, 5, 6, 1, '#111120'], [4, 5, 1, 1, '#ff4081'], [11, 5, 1, 1, '#ff4081']],
    },
    {
      label: '派對尖帽',
      pixels: () => [[7, 0, 2, 1, '#ffd600'], [7, 1, 2, 1, '#e040fb'], [6, 2, 4, 1, '#ffd600']],
    },
    {
      label: '香檳杯',
      pixels: () => [
        [12, 11, 2, 2, '#f9e9a8'], [12, 13, 1, 2, '#e8e8f0'],
        [14, 9, 1, 1, '#ffd600'], [13, 10, 1, 1, '#ffd600'],
      ],
    },
    {
      label: '螢光項圈',
      pixels: () => [[6, 9, 4, 1, '#69f0ae'], [5, 9, 1, 1, '#69f0ae', 0.5], [10, 9, 1, 1, '#69f0ae', 0.5]],
    },
    {
      label: 'DJ 耳機',
      pixels: () => [
        [5, 1, 6, 1, '#26262e'], [4, 1, 1, 2, '#26262e'], [11, 1, 1, 2, '#26262e'],
        [4, 3, 2, 3, '#26262e'], [10, 3, 2, 3, '#26262e'],
        [4, 4, 1, 1, '#e040fb'], [11, 4, 1, 1, '#e040fb'],
      ],
    },
    {
      label: '閃亮皇冠',
      pixels: () => [
        [5, 1, 6, 1, '#ffd600'],
        [5, 0, 1, 1, '#ffd600'], [7, 0, 2, 1, '#ffd600'], [10, 0, 1, 1, '#ffd600'],
        [7, 1, 2, 1, '#ff4081'],
      ],
    },
    {
      label: '甜美蝴蝶結',
      pixels: () => [[9, 1, 2, 2, '#ff4081'], [12, 1, 2, 2, '#ff4081'], [11, 2, 1, 1, '#ffd6e8']],
    },
    {
      label: '紳士翹鬍子',
      pixels: () => [[6, 6, 4, 1, '#4a3320'], [5, 5, 1, 1, '#4a3320'], [10, 5, 1, 1, '#4a3320']],
    },
    {
      label: '天使光環',
      pixels: () => [[5, 0, 6, 1, '#ffd600', 0.85]],
    },
  ];

  function headAndFace(skin) {
    return [
      [7, 9, 2, 1, skin],
      [5, 3, 6, 6, skin],
      [6, 5, 1, 1, INK], [9, 5, 1, 1, INK],
      [7, 7, 2, 1, '#b23a48'],
      [5, 6, 1, 1, '#ff6e96', 0.45], [10, 6, 1, 1, '#ff6e96', 0.45],
    ];
  }

  function renderGuest(s) {
    const skin = SKINS[s.skin];
    const outfit = OUTFITS[s.outfit];
    /* 全身布偶裝把整個人（頭臉、髮型）都套住，只保留外掛配件 */
    const person = outfit.full
      ? []
      : [...headAndFace(skin), ...HAIR_STYLES[s.hair].pixels(HAIR_COLORS[s.hairColor])];
    return pixelSvg([
      ...outfit.pixels(skin),
      ...person,
      ...ACCESSORIES[s.acc].pixels(skin),
    ], 16, 24);
  }

  /* ===== 新人專屬造型 ===== */

  function renderGroom() {
    const skin = SKINS[0];
    return pixelSvg([
      ...baseBody(skin, '#14141f', '#14141f'),
      [7, 10, 2, 3, '#f0f0f0'],
      [6, 11, 4, 1, '#26262e'],
      [5, 11, 1, 1, '#ff4081'],
      ...headAndFace(skin),
      ...HAIR_STYLES[1].pixels('#26262e'),
    ], 16, 24);
  }

  function renderBride() {
    const skin = SKINS[0];
    return pixelSvg([
      [4, 10, 8, 6, '#fdfdfd'],
      [3, 10, 1, 5, skin], [12, 10, 1, 5, skin],
      [3, 15, 1, 1, skin], [12, 15, 1, 1, skin],
      [4, 15, 8, 1, '#ffd6e8'],
      [3, 16, 10, 3, '#fdfdfd'],
      [2, 19, 12, 3, '#fdfdfd'],
      [2, 21, 12, 1, '#ffd6e8'],
      ...headAndFace(skin),
      ...HAIR_STYLES[2].pixels('#6b4226'),
      [3, 2, 2, 9, '#ffffff', 0.55], [11, 2, 2, 9, '#ffffff', 0.55],
      [5, 1, 6, 1, '#fdfdfd'],
      [7, 0, 2, 1, '#ffd600'],
      [7, 13, 2, 1, '#ff4081'], [6, 13, 1, 1, '#ffd600'], [9, 13, 1, 1, '#ffd600'],
      [7, 14, 2, 1, '#2e7d32'],
    ], 16, 24);
  }

  /* ===== 隨機派對裝飾 ===== */

  function drawCake() {
    return pixelSvg([
      [2, 14, 12, 1, '#9e9eb8'],
      [3, 10, 10, 4, '#fdf5ff'], [3, 13, 10, 1, '#ff8ab8'],
      [5, 6, 6, 4, '#ffd6e8'], [5, 9, 6, 1, '#ff4081'],
      [7, 4, 1, 2, '#40c4ff'], [7, 3, 1, 1, '#ffd600'],
      [9, 4, 1, 2, '#69f0ae'], [9, 3, 1, 1, '#ffd600'],
    ], 16, 16);
  }

  function drawCocktail() {
    return pixelSvg([
      [1, 1, 10, 1, '#b3ecff'],
      [2, 2, 8, 1, '#ff6fb5'], [3, 3, 6, 1, '#ff6fb5'], [4, 4, 4, 1, '#ff6fb5'],
      [5, 5, 2, 1, '#b3ecff'], [5, 6, 2, 4, '#b3ecff'], [3, 10, 6, 1, '#b3ecff'],
      [8, 0, 1, 2, '#ffd600'],
      [3, 1, 1, 1, '#ff1744'],
    ], 12, 12);
  }

  function drawGift() {
    return pixelSvg([
      [4, 0, 1, 2, '#ffd600'], [7, 0, 1, 2, '#ffd600'], [5, 1, 2, 2, '#ffd600'],
      [1, 3, 10, 2, '#2ea8dd'], [5, 3, 2, 2, '#ffd600'],
      [2, 5, 8, 7, '#40c4ff'], [5, 5, 2, 7, '#ffd600'],
    ], 12, 13);
  }

  function drawBalloons() {
    function balloon(x, y, c) {
      return [
        [x + 1, y, 2, 1, c], [x, y + 1, 4, 2, c], [x + 1, y + 3, 2, 1, c], [x + 1, y + 4, 1, 1, c],
      ];
    }
    return pixelSvg([
      ...balloon(1, 1, '#ff4081'),
      ...balloon(6, 0, '#ffd600'),
      ...balloon(10, 2, '#40c4ff'),
      [3, 6, 1, 10, '#9e9eb8', 0.8], [8, 5, 1, 11, '#9e9eb8', 0.8], [12, 7, 1, 9, '#9e9eb8', 0.8],
    ], 15, 18);
  }

  /* 亮片分成兩組交錯閃爍，做出球面旋轉的錯覺 */
  function drawDiscoBall() {
    const ball = rectsMarkup([
      [5, 0, 1, 4, '#9e9eb8'],
      [4, 4, 4, 1, '#b9c4cc'], [3, 5, 6, 1, '#b9c4cc'], [2, 6, 8, 5, '#b9c4cc'],
      [3, 11, 6, 1, '#b9c4cc'], [4, 12, 4, 1, '#b9c4cc'],
    ]);
    const frameA = rectsMarkup([
      [4, 6, 1, 1, '#ffffff', 0.9], [7, 8, 1, 1, '#ffffff', 0.9], [5, 10, 1, 1, '#ffffff', 0.9], [8, 5, 1, 1, '#ffffff', 0.9],
      [6, 7, 1, 1, '#40c4ff', 0.8], [4, 9, 1, 1, '#40c4ff', 0.8], [8, 10, 1, 1, '#40c4ff', 0.8],
    ]);
    const frameB = rectsMarkup([
      [6, 6, 1, 1, '#ffffff', 0.9], [3, 8, 1, 1, '#ffffff', 0.9], [7, 10, 1, 1, '#ffffff', 0.9], [5, 5, 1, 1, '#ffffff', 0.9],
      [8, 7, 1, 1, '#40c4ff', 0.8], [6, 9, 1, 1, '#40c4ff', 0.8], [4, 11, 1, 1, '#40c4ff', 0.8],
    ]);
    return `<svg viewBox="0 0 12 14" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${ball}<g class="disco__a">${frameA}</g><g class="disco__b">${frameB}</g></svg>`;
  }

  function drawSpeaker() {
    return pixelSvg([
      [1, 0, 10, 15, '#232332'],
      [1, 0, 10, 1, '#e040fb', 0.5],
      [5, 2, 2, 2, '#9e9eb8'],
      [4, 6, 4, 1, '#3a3a4a'], [3, 7, 6, 4, '#3a3a4a'], [4, 11, 4, 1, '#3a3a4a'],
      [5, 8, 2, 2, '#e040fb'],
    ], 12, 16);
  }

  function drawNeonHeart() {
    return pixelSvg([
      [2, 1, 2, 1, '#ff4081'], [6, 1, 2, 1, '#ff4081'],
      [1, 2, 8, 2, '#ff4081'],
      [2, 4, 6, 1, '#ff4081'],
      [3, 5, 4, 1, '#ff4081'],
      [4, 6, 2, 1, '#ff4081'],
      [3, 2, 1, 1, '#ffd6e8'],
    ], 10, 8);
  }

  function drawChampagneTower() {
    function glass(x, y) {
      return [[x, y, 2, 2, '#f9e9a8']];
    }
    return pixelSvg([
      ...glass(5, 0),
      ...glass(3, 3), ...glass(7, 3),
      ...glass(1, 6), ...glass(5, 6), ...glass(9, 6),
      [0, 9, 12, 2, '#5d4a7e'],
      [6, 0, 1, 1, '#ffffff', 0.8], [4, 3, 1, 1, '#ffffff', 0.8], [10, 6, 1, 1, '#ffffff', 0.8],
    ], 12, 11);
  }

  /* zone 決定貼牆、掛天花板還是放地板；每次載入隨機取捨與擺位。
     always 的項目（迪斯可球）必定出現，其餘隨機取捨 */
  const DECO_POOL = [
    { draw: drawDiscoBall, zone: 'ceiling', width: 40, cls: 'party-deco--disco', always: true },
    { draw: drawCake, zone: 'floor', width: 54 },
    { draw: drawCocktail, zone: 'floor', width: 38 },
    { draw: drawGift, zone: 'floor', width: 36 },
    { draw: drawChampagneTower, zone: 'floor', width: 44 },
    { draw: drawSpeaker, zone: 'floor', width: 40 },
    { draw: drawSpeaker, zone: 'floor', width: 34 },
    { draw: drawBalloons, zone: 'wall', width: 52 },
    { draw: drawBalloons, zone: 'wall', width: 44 },
    { draw: drawNeonHeart, zone: 'wall', width: 46, cls: 'party-deco--neon' },
  ];

  /* ===== 編碼 / 解碼 ===== */

  function encodeAvatar(s) {
    return `v1:${s.skin}-${s.hair}-${s.hairColor}-${s.outfit}-${s.acc}`;
  }

  /* 索引一律夾在合法範圍內，避免試算表被塞壞資料時整個現場掛掉 */
  function decodeAvatar(code) {
    const m = /^v1:(\d+)-(\d+)-(\d+)-(\d+)-(\d+)$/.exec((code || '').trim());
    if (!m) return null;
    const clamp = (n, len) => Math.min(Number(n), len - 1);
    return {
      skin: clamp(m[1], SKINS.length),
      hair: clamp(m[2], HAIR_STYLES.length),
      hairColor: clamp(m[3], HAIR_COLORS.length),
      outfit: clamp(m[4], OUTFITS.length),
      acc: clamp(m[5], ACCESSORIES.length),
    };
  }

  /* ===== 產生器 UI ===== */

  const previewEl = document.getElementById('avatar-preview');
  const controlsEl = document.getElementById('avatar-controls');
  const randomBtn = document.getElementById('avatar-random');
  const hiddenInput = document.getElementById('field-avatar');
  const floorEl = document.getElementById('party-floor');
  const countEl = document.getElementById('party-count');
  const refreshBtn = document.getElementById('party-refresh');
  const hintEl = document.getElementById('party-hint');

  if (!previewEl || !controlsEl || !floorEl) return;

  const state = { skin: 0, hair: 1, hairColor: 0, outfit: 0, acc: 0 };

  const CONTROL_GROUPS = [
    { key: 'skin', label: '膚色', type: 'color', options: SKINS },
    { key: 'hair', label: '髮型', type: 'chip', options: HAIR_STYLES.map(h => h.label) },
    { key: 'hairColor', label: '髮色', type: 'color', options: HAIR_COLORS },
    { key: 'outfit', label: '服裝', type: 'chip', options: OUTFITS.map(o => o.label) },
    { key: 'acc', label: '配件', type: 'chip', options: ACCESSORIES.map(a => a.label) },
  ];

  function updateAvatar() {
    previewEl.innerHTML = renderGuest(state);
    if (hiddenInput) hiddenInput.value = encodeAvatar(state);
  }

  function buildControls() {
    controlsEl.innerHTML = CONTROL_GROUPS.map(group => `
      <fieldset class="avatar-group">
        <legend>${group.label}</legend>
        <div class="avatar-group__options">
          ${group.options.map((opt, i) => `
            <label class="avatar-option">
              <input type="radio" name="avatar-${group.key}" value="${i}" ${i === state[group.key] ? 'checked' : ''} />
              ${group.type === 'color'
                ? `<span class="avatar-option__dot" style="background:${opt}"></span><span class="visually-hidden">${group.label}選項 ${i + 1}</span>`
                : `<span class="avatar-option__chip">${opt}</span>`}
            </label>`).join('')}
        </div>
      </fieldset>`).join('');

    controlsEl.addEventListener('change', e => {
      if (!e.target.matches('input[type="radio"]')) return;
      state[e.target.name.replace('avatar-', '')] = Number(e.target.value);
      updateAvatar();
    });
  }

  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      CONTROL_GROUPS.forEach(group => {
        state[group.key] = Math.floor(Math.random() * group.options.length);
        const input = controlsEl.querySelector(`input[name="avatar-${group.key}"][value="${state[group.key]}"]`);
        if (input) input.checked = true;
      });
      updateAvatar();
    });
  }

  /* ===== 名單資料 ===== */

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  /* localStorage 可能被停用（如 Safari 無痕），失敗時靜默退回空名單 */
  function loadLocal() {
    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(list) ? list.filter(g => g && AVATAR_CODE_RE.test(g.code)) : [];
    } catch {
      return [];
    }
  }

  function saveLocal(guest) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loadLocal().concat(guest)));
    } catch {
      /* 無法寫入就只在本次瀏覽顯示 */
    }
  }

  /* 許願池欄位可能含逗號與換行，須完整處理 CSV 引號規則 */
  function parseCsv(text) {
    const rows = [[]];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else { inQuotes = false; }
        } else {
          cell += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        rows[rows.length - 1].push(cell);
        cell = '';
      } else if (ch === '\n') {
        rows[rows.length - 1].push(cell);
        cell = '';
        rows.push([]);
      } else if (ch !== '\r') {
        cell += ch;
      }
    }
    rows[rows.length - 1].push(cell);
    if (rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop();
    return rows;
  }

  /* 化身欄位靠格式自動偵測，欄位順序變動也不會壞；
     許願池欄位則靠標題含「許願」辨認，找不到就不顯示心願 */
  function rowsToGuests(rows) {
    const guests = [];
    const wishCol = (rows[0] || []).findIndex(h => h.includes('許願'));
    for (const row of rows.slice(1)) {
      const code = row.find(c => AVATAR_CODE_RE.test(c.trim()));
      if (!code) continue;
      guests.push({
        name: (row[NAME_COLUMN] || '').trim() || '神秘嘉賓',
        code: code.trim(),
        wish: wishCol >= 0 ? (row[wishCol] || '').trim() : '',
      });
    }
    return guests;
  }

  function mergeGuests(remote, local) {
    const seen = new Set(remote.map(g => `${g.name}|${g.code}`));
    return remote.concat(local.filter(g => {
      const key = `${g.name}|${g.code}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }));
  }

  /* ===== 派對現場 ===== */

  const GUEST_MIN_Y = 42;
  const GUEST_MAX_Y = 88;
  const GUEST_EMOJIS = ['💬', '🍻', '🎶', '😄', '🥂', '✨', '🕺', '💃'];
  const COUPLE_EMOJIS = ['💍', '🥰', '❤️', '🎂'];

  let liveGuests = [];
  let coupleLives = [];
  let emptyEl = null;

  function randomSpot() {
    return {
      x: 6 + Math.random() * 88,
      y: GUEST_MIN_Y + Math.random() * (GUEST_MAX_Y - GUEST_MIN_Y),
    };
  }

  /* 越靠下（越近）畫越大，做出景深 */
  function depthScale(y) {
    return 0.7 + ((y - GUEST_MIN_Y) / (GUEST_MAX_Y - GUEST_MIN_Y)) * 0.5;
  }

  function placeGoer(el, x, y) {
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.zIndex = Math.max(2, Math.round(y));
    el.style.setProperty('--scale', depthScale(y).toFixed(3));
  }

  /* 用 button 讓人物可被點擊與鍵盤操作；button 內只能放行內元素，所以全用 span */
  function goerMarkup(svg, name, extraClass = '') {
    return `<button type="button" class="partygoer ${extraClass}">
      <span class="partygoer__bubble" aria-hidden="true"></span>
      <span class="partygoer__sprite">${svg}</span>
      <span class="partygoer__name">${escapeHtml(name)}</span>
    </button>`;
  }

  /* first：進場後極短延遲且必定移動，讓頁面一打開就有動靜 */
  function scheduleWander(g, first) {
    const delay = first ? 200 + Math.random() * 1200 : 2200 + Math.random() * 6000;
    g.timer = setTimeout(() => {
      if (first || Math.random() < 0.65) {
        const to = randomSpot();
        const dur = Math.max(900, Math.hypot(to.x - g.x, to.y - g.y) * 110);
        g.el.style.transition = `left ${dur}ms linear, top ${dur}ms linear, transform ${dur}ms linear`;
        g.el.style.setProperty('--dir', to.x < g.x ? '-1' : '1');
        g.el.classList.add('is-walking');
        placeGoer(g.el, to.x, to.y);
        g.x = to.x;
        g.y = to.y;
        g.timer = setTimeout(() => {
          g.el.classList.remove('is-walking');
          scheduleWander(g);
        }, dur);
      } else {
        scheduleWander(g);
      }
    }, delay);
  }

  function spawnGuest(guest) {
    const decoded = decodeAvatar(guest.code);
    if (!decoded) return;
    const spot = randomSpot();
    const wrap = document.createElement('div');
    wrap.innerHTML = goerMarkup(renderGuest(decoded), guest.name);
    const el = wrap.firstElementChild;
    placeGoer(el, spot.x, spot.y);
    floorEl.appendChild(el);
    const live = { el, x: spot.x, y: spot.y, timer: 0, wish: guest.wish || '' };
    liveGuests.push(live);
    if (!REDUCED_MOTION) scheduleWander(live, true);
  }

  function buildStaticScene() {
    /* 新人從前排中央進場，之後和賓客一樣自由走動 */
    const couples = [
      { name: COUPLE_NAMES.groom, svg: renderGroom(), x: 44 },
      { name: COUPLE_NAMES.bride, svg: renderBride(), x: 56 },
    ];
    couples.forEach(({ name, svg, x }) => {
      const wrap = document.createElement('div');
      wrap.innerHTML = goerMarkup(svg, name, 'partygoer--couple');
      const el = wrap.firstElementChild;
      placeGoer(el, x, 86);
      floorEl.appendChild(el);
      const live = { el, x, y: 86, timer: 0, couple: true };
      coupleLives.push(live);
      if (!REDUCED_MOTION) scheduleWander(live, true);
    });

    /* 隨機挑裝飾與位置，每次載入都不一樣 */
    const floorSlots = [7, 14, 21, 79, 86, 93].sort(() => Math.random() - 0.5);
    const wallSlots = [
      { x: 8, y: 6 }, { x: 16, y: 15 }, { x: 24, y: 8 },
      { x: 76, y: 14 }, { x: 84, y: 8 }, { x: 92, y: 17 },
    ].sort(() => Math.random() - 0.5);
    DECO_POOL.forEach(deco => {
      if (!deco.always && Math.random() > 0.85) return;
      /* 迪斯可球是彩蛋開關，用 button 才能被點擊與鍵盤操作 */
      const el = document.createElement(deco.zone === 'ceiling' ? 'button' : 'div');
      if (deco.zone === 'ceiling') {
        el.type = 'button';
        el.setAttribute('aria-label', '迪斯可球');
        el.addEventListener('click', startDisco);
      }
      el.className = `party-deco${deco.cls ? ` ${deco.cls}` : ''}`;
      el.innerHTML = deco.draw();
      el.style.width = `${deco.width}px`;
      if (deco.zone === 'floor') {
        const x = floorSlots.pop();
        if (x === undefined) return;
        const y = 58 + Math.random() * 28;
        el.classList.add('party-deco--floor');
        placeGoer(el, x + (Math.random() * 4 - 2), y);
      } else if (deco.zone === 'wall') {
        const slot = wallSlots.pop();
        if (!slot) return;
        el.style.left = `${slot.x}%`;
        el.style.top = `${slot.y}%`;
        el.style.zIndex = 2;
      } else {
        el.style.left = `${38 + Math.random() * 24}%`;
        el.style.top = '0';
        /* 比迪斯可燈光遮罩（z-index 2）高一層，關燈時球仍亮著 */
        el.style.zIndex = 3;
        /* 以掛點置中，寬幅彩旗才不會超出右緣 */
        el.style.transform = 'translateX(-50%)';
      }
      floorEl.appendChild(el);
    });

    emptyEl = document.createElement('p');
    emptyEl.className = 'party-scene__empty';
    emptyEl.textContent = '賓客名單載入中⋯ 🎈';
    floorEl.appendChild(emptyEl);

    /* 隨機讓某人冒出聊天泡泡；進場後先快速冒一次，馬上有互動感 */
    if (!REDUCED_MOTION) {
      /* 賓客閒聊：心願、台詞、表情符號三種混著出現；正在說話的人不會被打斷 */
      const guestLine = g => {
        const roll = Math.random();
        if (g.wish && roll < 0.35) return { text: g.wish, ms: 4200 };
        if (roll < 0.7) return { text: randomOf(GUEST_QUIPS), ms: 3000 };
        return { text: randomOf(GUEST_EMOJIS), ms: 2400 };
      };
      const popBubble = () => {
        const pool = liveGuests
          .concat(coupleLives)
          .filter(g => !g.el.classList.contains('is-talking'));
        if (!pool.length) return;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const { text, ms } = pick.couple ? { text: randomOf(COUPLE_EMOJIS), ms: 2400 } : guestLine(pick);
        showBubble(pick.el, text, ms);
      };
      setTimeout(popBubble, 700);
      setInterval(popBubble, 1500);
    }
  }

  /* ===== 點人物互動 ===== */

  const GUEST_QUIPS = [
    '今晚不醉不歸！', '麻將三缺一，來嗎？', 'KTV 麥克風是我的', '狼人殺我絕對是好人',
    '飛鏢比一場？', '撞球誰要單挑？', 'Switch 派對走起', '恭喜新人！', '桌遊我全都要',
  ];
  const WISH_MAX = 40;

  function randomOf(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  const bubbleTimers = new WeakMap();

  function showBubble(el, text, ms) {
    const bubble = el.querySelector('.partygoer__bubble');
    bubble.textContent = text.length > WISH_MAX ? `${text.slice(0, WISH_MAX)}…` : text;
    el.classList.add('is-talking');
    clearTimeout(bubbleTimers.get(el));
    bubbleTimers.set(el, setTimeout(() => el.classList.remove('is-talking'), ms));
  }

  /* 從新人頭上冒出一串像素愛心 */
  function burstHearts(el) {
    if (REDUCED_MOTION) return;
    const floorRect = floorEl.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const cx = rect.left - floorRect.left + rect.width / 2;
    const cy = rect.top - floorRect.top + rect.height * 0.2;
    for (let i = 0; i < 7; i++) {
      const heart = document.createElement('span');
      heart.className = 'pixel-heart';
      heart.setAttribute('aria-hidden', 'true');
      heart.innerHTML = drawNeonHeart();
      heart.style.left = `${cx}px`;
      heart.style.top = `${cy}px`;
      floorEl.appendChild(heart);
      const dx = (Math.random() - 0.5) * 120;
      const dy = -60 - Math.random() * 90;
      heart.animate([
        { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 500, easing: 'ease-out', fill: 'forwards' })
        .onfinish = () => heart.remove();
    }
  }

  floorEl.addEventListener('click', e => {
    const el = e.target.closest('.partygoer');
    if (!el) return;
    const live = liveGuests.concat(coupleLives).find(g => g.el === el);
    if (!live) return;
    if (live.couple) {
      showBubble(el, randomOf(COUPLE_EMOJIS), 2400);
      burstHearts(el);
      return;
    }
    showBubble(el, live.wish || randomOf(GUEST_QUIPS), live.wish ? 4200 : 2400);
    if (!REDUCED_MOTION) {
      /* 重新觸發動畫需先移除 class 並強制重排 */
      el.classList.remove('is-dancing');
      void el.offsetWidth;
      el.classList.add('is-dancing');
    }
  });

  /* ===== 迪斯可彩蛋：點迪斯可球 → 關燈、彩色光束掃射、全場跳舞 ===== */

  const DISCO_MS = 10000;
  const DANCE_EMOJIS = ['🕺', '💃', '🎶', '🪩', '✨'];
  let discoTimer = 0;

  function startDisco() {
    if (floorEl.classList.contains('is-disco')) return;
    const lights = document.createElement('div');
    lights.className = 'disco-lights';
    lights.setAttribute('aria-hidden', 'true');
    lights.innerHTML = '<span class="disco-lights__beams"></span><span class="disco-lights__spots"></span>';
    floorEl.appendChild(lights);
    floorEl.classList.add('is-disco');
    liveGuests.concat(coupleLives).forEach(g => showBubble(g.el, randomOf(DANCE_EMOJIS), DISCO_MS));
    clearTimeout(discoTimer);
    discoTimer = setTimeout(() => {
      floorEl.classList.remove('is-disco');
      lights.remove();
    }, DISCO_MS);
  }

  floorEl.addEventListener('animationend', e => {
    const el = e.target.closest('.partygoer');
    if (el && e.animationName === 'goer-dance') el.classList.remove('is-dancing');
  });

  let guests = loadLocal();

  function renderGuests() {
    liveGuests.forEach(g => {
      clearTimeout(g.timer);
      g.el.remove();
    });
    liveGuests = [];

    const seated = guests.filter(g => decodeAvatar(g.code));
    seated.forEach(spawnGuest);
    emptyEl.hidden = seated.length > 0;
    countEl.textContent = seated.length
      ? `🎉 新人已就位，${seated.length} 位賓客到場同樂中`
      : '新人已就位，賓客名單載入中⋯';
  }

  async function refreshRemote() {
    if (!SHEET_CSV_URL) return;
    try {
      const bust = `${SHEET_CSV_URL.includes('?') ? '&' : '?'}t=${Date.now()}`;
      const res = await fetch(SHEET_CSV_URL + bust);
      if (!res.ok) throw new Error(res.status);
      const remote = rowsToGuests(parseCsv(await res.text()));
      guests = mergeGuests(remote, loadLocal());
      if (hintEl) hintEl.hidden = true;
      renderGuests();
    } catch {
      if (hintEl) {
        hintEl.textContent = '名單載入失敗，請稍後再試。';
        hintEl.hidden = false;
      }
    }
  }

  if (refreshBtn) {
    if (!SHEET_CSV_URL) {
      refreshBtn.hidden = true;
    } else {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        await refreshRemote();
        refreshBtn.disabled = false;
      });
    }
  }

  if (!SHEET_CSV_URL && hintEl) {
    hintEl.textContent = '※ 尚未串接共享名單，目前只看得到這台裝置送出的化身（串接方式見 assets/js/avatar.js 開頭說明）。';
    hintEl.hidden = false;
  }

  /* 報名成功（main.js 發出）→ 立即進場並記到本機，不用等試算表快取 */
  document.addEventListener('rsvp-success', e => {
    const guest = {
      name: (e.detail && e.detail.name) || '神秘嘉賓',
      code: encodeAvatar(state),
    };
    saveLocal(guest);
    guests.push(guest);
    spawnGuest(guest);
    emptyEl.hidden = true;
    countEl.textContent = `🎉 新人已就位，${guests.filter(g => decodeAvatar(g.code)).length} 位賓客到場同樂中`;
  });

  buildControls();
  updateAvatar();
  buildStaticScene();
  renderGuests();
  refreshRemote();
}());
