# Tahmid Raven — Portfolio

Personal portfolio of **Tahmid Iqbal (Raven)**, game developer.
Hosted on GitHub Pages at [tahmidraven.com](https://tahmidraven.com).

## November 2026 — After Hours Arcade

Ink-black, ivory, and warm orange. The original favicon and font palette remain:
Space Grotesk, Orbitron, JetBrains Mono, and Share Tech Mono.

- `index.html`: all games in a swipeable carousel that advances one card every
  five seconds. No visible scrollbar, carousel buttons, or hint text. Autoplay
  pauses during interaction/gameplay and respects reduced-motion preferences.
  Arcade/All projects buttons, introduction, and contact remain.
- `games.html`: searchable, filterable game library and click-to-load player.
- All ten current browser games are available in the shared dropdown player;
  Meadow Run and FeastFury have original covers generated in their respective game
  repositories. The hero features FeastFury. All seven original social icons remain.
- `projects.html`: the existing project archive plus pipeline tools, with new and
  older games combined in one Games section using the same project-card layout.
  Source links use Code buttons only where a public repository is verified.
- `aboutme.html`: personal background, photos, experience, education, interests, and skills.
- `myblog.html`: the original book reviews.
- `cv.html`: current PDF download/optional preview and expanded portfolio history.
- `contacts.html`: contact/social links and an explicitly mail-app-based contact form.
- `email.html`: retained as a working legacy contact URL.

The June PDF and `cv.tex` are retained as historical assets. The current downloadable
resume is `TAHMID_IQBAL_GD_Nov26.pdf`, copied from the separate resume repository.

## Run locally

No build or runtime dependency is required:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open <http://127.0.0.1:4173>. GitHub Pages publishes the repository root from
`Nov26deploy`. `.nojekyll` keeps this a plain static site with no build step.

## Maintain the arcade

Edit `js/games-data.js`. Each entry includes its stable ID, title, description,
contribution/credits where applicable, source URL, cover, category, and embed config.

- `upload`: public itch.io **embed-upload** ID, not the store widget's game ID.
- `embed`: separate HTTPS build URL (for example, FeastFury).
- `category: 'download'`: downloadable games/apps, with no embedded Play action.
- `jam`: enables the Game jams filter. Add only verified jam participation.
- Optional `controls`, `role`, and local `image` path.

Game builds remain externally hosted; only optimized cover artwork is stored here.
The current itch exports are non-threaded and can run in embedded frames. A game
connects to its host only after **Play game** (or a card's explicit Play action).
The Games page has an inline dropdown player; cards elsewhere open a modal with
the same dropdown. Changing selection, stopping, or closing removes the old iframe
to stop audio/CPU. Fullscreen, restart, Escape-to-close for the modal, focus
restoration, and original-host fallback are supported. External builds can change,
so test the original and embedded experience when updating a game's upload. Future
threaded exports may need host/header changes or a different embed strategy.
Download-only projects never get a misleading browser Play action.
PomoKaijuu and VangtiNai are apps, so they stay in Projects, not the Games catalog.
The catalog contains ten browser games and one downloadable game.

The player uses a definite full width and a shared viewport ratio (landscape on
desktop, portrait on small screens), independent of the selected game. Its height
cap cannot shrink its width. The iframe fills that stage; each hosted engine
controls its own aspect-correct rendering and any necessary internal letterboxing.
Never publish client playable-ad builds without permission.

FeastFury's current build is an endless **tap-blast** puzzle (not swap/match-3).
Its cover is composed from the existing diner, mascot, fonts, and a real board
capture. Meadow Run's cover uses a real deployed-game capture and its existing
fonts. Regenerate with `tools/generate_cover.py` in each game repo, then copy the
corresponding `social/cover.webp` into `images/games/`. The game repositories also
include full-size share PNGs and Open Graph/Twitter metadata in their release flow.

## Design files

`css/style.css` retains the original base components and Google Fonts import.
`css/arcade.css` is the shared new design layer, loaded last on every page.
`js/main.js` handles accessible navigation and common interactions.
`js/arcade.js` renders game cards and the player. The previous `js/terminal.js`
is retained but no longer loaded (no boot screen, scanlines, or interface audio).
Card grids use CSS subgrid: titles, descriptions, tags, and action rows share
tracks across each row. Text is not truncated to fake alignment. Link arrows are
removed, while functional controls and social icons are retained.

## UI smoke tests

With the local server running:

```sh
npm install
npx playwright install chromium
npm test
```

To use an installed Chromium-based browser instead:

```sh
BROWSER_EXECUTABLE="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test
```

If your shell sets `NODE_OPTIONS=--no-experimental-fetch`, clear it for Playwright:
`NODE_OPTIONS='' BROWSER_EXECUTABLE="/path/to/browser" npm test`.

Tests cover desktop/mobile pages at four widths, no horizontal overflow,
shared card-track alignment, navigation, retained favicon, all seven social icons,
arrow-free links, catalog filters/search, all ten dropdown options, iframe
loading/switching/unloading, focus, deep links, and PDF delivery.
They stub the external itch frame for deterministic UI testing; they do not prove each
externally hosted game completes loading or gameplay. Screenshots go in ignored
`test-results/`. External fonts and Font Awesome require a network connection.

`npm run test:live` optionally checks the actual external builds: canvases must
appear, Godot startup overlays must be removed, and the two directly hosted Cocos
games must reach a loaded scene. This is a startup check, not a complete gameplay
test; it records third-party warnings/errors in `test-results/live/results.json`.

## Security hardening — no hosting or DNS changes

The `.html` URL extension is normal for a static website, not a vulnerability.
The following protections are implemented in the site's own files:

- **CSP on all eight HTML pages**, placed before any resource loads. Scripts are
  restricted to this site's origin; inline scripts and `eval` are not allowed.
  The Projects filter now lives in `js/main.js` rather than an inline script.
- **Explicit resource allowlists:** site images and the existing YouTube thumbnail;
  Google Fonts and the pinned Font Awesome CDN; the official same-origin PDF; and
  game frames from itch.io's embed-upload path or the two approved game subdomains.
  Parent-page network connections and injected base URLs are blocked. Contact
  forms are restricted to `mailto:`; the website still never sends/stores messages.
- **Subresource Integrity:** every Font Awesome 6.5.1 stylesheet link includes a
  verified SHA-384 digest and anonymous CORS mode. Modified CDN CSS is rejected.
- **Explicit referrer policy:** `strict-origin-when-cross-origin` prevents the
  portfolio's path/query from being sent to another origin, while retaining the
  origin information needed by normal embeds and external resources.
- **Sandboxed game frames** block direct top-level navigation (even following a
  user gesture), forms, downloads, and browser modals. Scripts, origin storage,
  pointer lock, orientation lock, and fullscreen remain available for gameplay.
  Popups and sandbox escape **for those new popup windows only** remain allowed
  so in-game credit/creator links can open normally; browser popup blocking still
  applies. The embedded frame itself cannot remove its restrictions.
- **Embed URL validation:** only HTTPS URLs on the three approved embed origins
  are accepted, with numeric itch upload IDs. URLs with credentials, unapproved
  origins, or the portfolio's own origin are refused. This same-origin guard is
  important when combining `allow-scripts` with `allow-same-origin`: game frames
  remain cross-origin from the portfolio, preserving the browser's isolation.

### Intentional limits

- Inline **styles** remain allowed for the existing layouts and dynamic sizing;
  this does not permit inline JavaScript. Google Fonts CSS is allowlisted but not
  integrity-pinned because its response varies by browser. The PDF object is
  restricted to this origin rather than disabled, to retain resume preview.
- A parent-page CSP does not audit or restrict every request made inside a
  separately hosted game. Those games and their providers remain trust boundaries;
  sandboxing is defense in depth, not proof that third-party code is harmless.
- HTML meta policies cannot enforce `frame-ancestors`, `X-Frame-Options`,
  `X-Content-Type-Options`, or other HTTP response headers. No fake meta equivalents,
  proxy/CDN setup, hosting configuration, DNS, or game-repo changes were made.
- Testing is not a comprehensive penetration test or a complete gameplay audit.

### Verify before pushing

With the local HTTP server running, use the browser setup documented above:

```sh
npm test
npm run test:security
npm run test:live
npm audit
```

`test:security` uses Chromium to verify consistent CSPs and no normal page-policy
violations, rejection of harmless inline-script/base/frame/connect/form canaries,
rejection of deliberately modified CDN CSS, allowed PDF preview, blocked sandbox
parent-DOM/top-navigation access, working game-origin storage and fullscreen,
and rejection of unapproved embed URLs. Test fixtures intercept their network
requests locally; they do not attack the external game providers.

The UI suite covers all eight pages at four widths, filters, the carousel,
navigation, and game-player lifecycle. The live suite additionally checks startup
of all ten real game exports under the sandbox. Some itch exports already log
service-worker permission warnings; those are recorded separately from startup
failures. These checks do not guarantee every level, device, or browser is bug-free.
