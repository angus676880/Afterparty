# afterparty — Frontend Static Web Project

## Project Overview

Static frontend website. No server-side rendering, no build server required in development — open `index.html` directly or serve via a local static server.

## Tech Stack

- **HTML5** — semantic markup
- **CSS3** — vanilla CSS, variables (`--var`), Flexbox/Grid layout
- **JavaScript** — vanilla ES modules (`type="module"`), no bundler required for development
- **No framework** unless explicitly added

## File Structure

```
afterparty/
├── index.html          # entry point
├── pages/              # additional HTML pages
├── assets/
│   ├── css/
│   │   └── main.css
│   ├── js/
│   │   └── main.js
│   ├── img/            # optimized images (webp preferred)
│   └── fonts/
└── CLAUDE.md
```

## Development

### Local server (recommended over opening file://)

```bash
# Python
python -m http.server 8080

# Node.js (npx, no install)
npx serve .

# VS Code: Live Server extension
```

Open `http://localhost:8080` in the browser.

### Linting / formatting

```bash
# HTML validation
npx html-validate "**/*.html"

# CSS
npx stylelint "assets/css/**/*.css"

# JS
npx eslint "assets/js/**/*.js"
```

No config files exist yet — add them if linters are adopted.

## Code Style

### HTML
- Use semantic elements (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`) over `<div>` soup
- Every `<img>` must have a meaningful `alt` attribute
- One `<h1>` per page; heading levels must not skip
- Prefer `defer` over `async` for script tags to preserve DOM order

### CSS
- Define all colours and spacing as CSS custom properties at `:root`
- Mobile-first: base styles → `@media (min-width: …)` overrides
- Class names: lowercase kebab-case (`.card-title`, not `.cardTitle`)
- No `!important` except last-resort third-party overrides
- Avoid `id` selectors for styling; reserve `id` for JS hooks and anchors

### JavaScript
- ES2020+ syntax; use `const`/`let`, never `var`
- Pure functions where possible; keep DOM manipulation isolated from logic
- No `console.log` left in committed code
- Prefer `addEventListener` over inline `onclick`/`onload` attributes in HTML

### 註解語言
- 所有程式碼註解（HTML、CSS、JS）一律使用**繁體中文**撰寫
- 僅在 WHY 不明顯時才加註解：隱藏限制、特殊處理原因、第三方相容性備註
- 不要寫「做了什麼」的描述，只寫「為什麼這樣做」

## Performance Targets

- Images: use WebP with `<picture>` fallback; max 150 KB per image
- No render-blocking resources: CSS in `<head>`, scripts at end of `<body>` or `defer`
- Aim for Lighthouse Performance ≥ 90 on desktop

## Accessibility (a11y)

- All interactive elements reachable by keyboard (`Tab` / `Enter` / `Space`)
- Colour contrast ratio ≥ 4.5:1 (WCAG AA)
- ARIA roles only when native HTML semantics are insufficient
- Test with a screen reader before marking a feature complete

## Browser Support

Latest two versions of Chrome, Firefox, Edge, Safari. No IE11 support.

## Deployment

Static hosting — push to GitLab and use **GitLab Pages** (`.gitlab-ci.yml` `pages` job) or any static host (Netlify, Vercel, Cloudflare Pages).

Sample `.gitlab-ci.yml`:

```yaml
pages:
  stage: deploy
  script:
    - echo "Deploying static site"
  artifacts:
    paths:
      - public
  only:
    - main
```

Move or copy site files into `public/` as part of the pipeline if your root is not already named `public`.

## Git Conventions

- Branch names: `feat/…`, `fix/…`, `chore/…`
- Commit messages: imperative mood, present tense — `add hero section`, `fix mobile nav overflow`
- No binary assets committed unless unavoidable; use Git LFS for large files

## What NOT to do

- Do not add a JS framework unless the project scope explicitly requires it
- Do not inline large blocks of CSS or JS in HTML files
- Do not commit minified files — keep source readable; minification is a build/CI step
- Do not introduce Node.js dependencies without discussing it first
