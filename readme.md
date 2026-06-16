# Tahmid Raven — Portfolio 🌐⟁

The personal portfolio of **Tahmid "Raven" Iqbal** — Game Developer @ Revo Interactive.
Live at **[tahmidraven.com](https://tahmidraven.com)** · hosted on GitHub Pages.

> Revamped **June 2026** with a **Cyberpunk Terminal / neon-noir** theme — kept tasteful and
> recruiter-readable (it's a project showcase, not a game site).

---

## ✨ What's new in the June 2026 revamp

- **Cyberpunk-terminal design system** — neon-mint/cyan/magenta palette, CRT scanline overlay,
  monospace terminal accents, glowing neon cards & buttons. All in `css/style.css`.
- **Cinematic boot sequence** — the landing boots `raven.exe` with a typed BIOS-style log and
  progress bar (shown once per session, skippable with **Enter** / click).
- **Terminal HUD hero** — live status chip, typewriter command line, command-style buttons
  (`$ ./view_projects.sh`), and a HUD-framed photo carousel with a player stat panel.
- **Skill tree / XP bars** — skills on the About page render as animated level bars
  (`LV.90` etc.) that fill on scroll.
- **Playable easter eggs** — Konami code (`↑ ↑ ↓ ↓ ← → ← → B A`) unlocks "Developer Mode"
  (achievement toast + matrix rain), plus a subtle interface-sound toggle (off by default).
- **Updated content from the June 2026 CV** — added the **Revo Interactive** Game Developer
  roles, corrected the engine stack (**Unity, Cocos Creator, Defold, PixiJS**), and the CV
  download now points to `TAHMID_IQBAL_GD_June26.pdf`.

## 🗂 Pages

`index.html` · `projects.html` · `cv.html` · `aboutme.html` · `myblog.html` · `contacts.html`

## 🛠 Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript (no build step)
- **Fonts:** Space Grotesk, JetBrains Mono, Orbitron (Google Fonts)
- **Icons:** [Font Awesome](https://fontawesome.com/)
- **Scripts:** `js/main.js` (nav, carousel, back-to-top) · `js/terminal.js` (boot/typewriter
  helpers, scroll reveal, animated stat bars, sound toggle, Konami easter egg)
- **Hosting:** GitHub Pages → `tahmidraven.com`

## ♿ Accessibility

Respects `prefers-reduced-motion` (animations, typewriter, and reveals are disabled/instant),
keeps text high-contrast, and the boot sequence can always be skipped.
