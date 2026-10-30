/* Start a server first: python3 -m http.server 4173 --bind 127.0.0.1 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';

async function alignedRows(page, gridSelector, cardSelector, tracks) {
    await page.evaluate(() => document.fonts.ready);
    const issues = await page.locator(gridSelector).evaluateAll((grids, { cardSelector, tracks }) => {
        const failures = [];
        for (const grid of grids) {
            if (!grid.getClientRects().length) continue;
            const rows = new Map();
            for (const card of grid.querySelectorAll(`:scope > ${cardSelector}`)) {
                const y = Math.round(card.getBoundingClientRect().top);
                if (!rows.has(y)) rows.set(y, []);
                rows.get(y).push(card);
            }
            for (const cards of rows.values()) {
                if (cards.length < 2) continue;
                for (const track of tracks) {
                    const values = cards.map(card => card.querySelector(track)).filter(Boolean).map(el => el.getBoundingClientRect().top);
                    if (values.length > 1 && Math.max(...values) - Math.min(...values) > 1) failures.push({ track, values });
                }
            }
        }
        return failures;
    }, { cardSelector, tracks });
    assert.deepEqual(issues, [], `Aligned tracks in ${gridSelector}`);
}

async function playerGeometry(root) {
    return root.evaluate(player => {
        const bounds = element => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
        };
        return { root: bounds(player), stage: bounds(player.querySelector('.player-stage')), iframe: player.querySelector('iframe') ? bounds(player.querySelector('iframe')) : null };
    });
}

function fillsPlayer(geometry) {
    assert.ok(Math.abs(geometry.root.left - geometry.stage.left) < 1, 'Player stage starts at the left edge');
    assert.ok(Math.abs(geometry.root.right - geometry.stage.right) < 1, 'Player stage fills the right edge');
    if (geometry.iframe) {
        assert.ok(Math.abs(geometry.stage.width - geometry.iframe.width) < 1, 'Iframe fills stage width');
        assert.ok(Math.abs(geometry.stage.height - geometry.iframe.height) < 1, 'Iframe fills stage height');
    }
}

(async () => {
    const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
    try {
        await mkdir('test-results', { recursive: true });
        const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const fixture = route => route.fulfill({ contentType: 'text/html', body: '<h1>Hosted game fixture</h1>' });
        await context.route('https://itch.io/embed-upload/**', fixture);
        await context.route('https://feastfury.tahmidraven.com/**', fixture);
        await context.route('https://meadow-run.tahmidraven.com/**', fixture);
        const pages = ['index.html', 'games.html', 'aboutme.html', 'projects.html', 'cv.html', 'myblog.html', 'contacts.html', 'email.html'];
        for (const path of pages) {
            const response = await page.goto(`${base}/${path}`);
            assert.equal(response.status(), 200, path);
            await page.locator('h1').first().waitFor();
            assert.equal(await page.locator('link[rel="icon"]').getAttribute('href'), 'images/punchline.png');
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path}: desktop overflow`);
            assert.equal(await page.locator('a').evaluateAll(links => links.some(link => /[↗→↓]/.test(link.textContent))), false, 'No decorative link arrows');
            if (path !== 'email.html') {
                assert.equal(await page.locator('#main').count(), 1);
                assert.equal(await page.locator('.nav-resume .fa-download').count(), 1, 'Resume navigation has a download icon');
                assert.equal(await page.locator('.footer-socials .social-icon').count(), 7, 'All social icons in footer');
                assert.equal(await page.locator('.footer-name, .footer-links').count(), 0, 'No repeated footer name or navigation');
            }
        }
        await page.goto(`${base}/index.html`);
        assert.equal(await page.locator('.game-card').count(), 11, 'Homepage carousel contains all games');
        const carousel = page.locator('[data-selected-games]');
        assert.equal(await page.locator('[data-games-previous], [data-games-next], #games-scroll-hint, .carousel-controls').count(), 0, 'No carousel controls or hint');
        assert.equal(await carousel.evaluate(el => getComputedStyle(el).scrollbarWidth), 'none');
        assert.ok(await carousel.evaluate(el => el.scrollWidth > el.clientWidth), 'Carousel scrolls horizontally');
        await carousel.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => {
            const el = document.querySelector('[data-selected-games]');
            const step = el.querySelector('.game-card').getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap);
            return Math.abs(el.scrollLeft - step) < 2;
        }, null, { timeout: 7500 });
        await carousel.evaluate(el => { el.scrollTo({ left: el.scrollWidth, behavior: 'instant' }); });
        await page.waitForFunction(() => document.querySelector('[data-selected-games]').scrollLeft < 2, null, { timeout: 7500 });
        await carousel.dispatchEvent('pointerdown');
        await carousel.evaluate(el => { el.scrollTo({ left: 500, behavior: 'instant' }); });
        assert.ok(await carousel.evaluate(el => el.scrollLeft > 0), 'Manual swipe/scroll remains available');
        await carousel.dispatchEvent('pointerup');
        await carousel.evaluate(el => { el.scrollTo({ left: 0, behavior: 'instant' }); });
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        assert.equal(await page.locator('.hero-socials .social-icon').count(), 7);
        assert.match(await page.locator('.featured-art img').getAttribute('src'), /feastfury/);
        assert.equal(await page.locator('iframe').count(), 0, 'No autoloaded games');
        await alignedRows(page, '.game-grid', '.game-card', ['.game-meta', 'h3', '.game-description', '.game-actions']);
        assert.equal(await page.locator('[aria-labelledby="builds-title"]').count(), 0, 'No Behind the Build homepage section');
        assert.equal(await page.locator('.section-actions a[href="games.html"]').textContent(), 'The full arcade');
        assert.equal(await page.locator('.section-actions a[href="projects.html"]').textContent(), 'All projects');
        await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
        await page.screenshot({ path: 'test-results/home-preview.png' });
        await page.locator('[data-play="feastfury"]').click();
        const modal = page.locator('dialog');
        assert.equal(await modal.isVisible(), true);
        assert.equal(await modal.locator('[data-game-select] option').count(), 10);
        assert.match(await modal.locator('iframe').getAttribute('src'), /feastfury/);
        fillsPlayer(await playerGeometry(modal.locator('[data-modal-player]')));
        await modal.locator('[data-game-select]').selectOption('lastpunch');
        assert.equal(await page.locator('iframe').count(), 0, 'Changing dropdown unloads old game');
        await modal.locator('[data-launch]').click();
        assert.match(await modal.locator('iframe').getAttribute('src'), /18530573/);
        await modal.locator('.player-close').click();
        await page.waitForFunction(() => document.querySelectorAll('iframe').length === 0);
        assert.equal(await page.locator('[data-play="feastfury"]').evaluate(el => el === document.activeElement), true);

        await page.goto(`${base}/games.html`);
        const station = page.locator('[data-inline-player]');
        assert.equal(await page.locator('.game-card').count(), 11);
        assert.equal(await page.locator('#game-pomokaijuu, #game-vangtinai').count(), 0, 'Apps are not listed in Games');
        assert.equal(await station.locator('[data-game-select] option').count(), 10);
        assert.equal(await page.locator('iframe').count(), 0);
        await page.getByRole('button', { name: 'Browser playable', exact: true }).click();
        assert.equal(await page.locator('.game-card').count(), 10);
        await page.getByRole('button', { name: 'Downloads', exact: true }).click();
        assert.equal(await page.locator('.game-card').count(), 1);
        await page.getByRole('button', { name: 'Game jams', exact: true }).click();
        assert.equal(await page.locator('.game-card').count(), 3);
        await page.getByRole('button', { name: 'All games', exact: true }).click();
        await page.locator('#game-search').fill('LittleJS');
        assert.equal(await page.locator('.game-card').count(), 1);
        await page.locator('#game-search').fill('nothingmatches123');
        assert.equal(await page.locator('.game-card').count(), 0);
        assert.equal(await page.locator('[data-game-empty]').isVisible(), true);
        await page.locator('#game-search').fill('');
        for (const id of ['feastfury', 'meadow-run', 'the-last-tribe', 'crooked-garden', 'lastpunch', 'uber-yeets', 'seriouspoker', 'rougeknight', 'defuseit', 'minisnake']) {
            await station.locator('[data-game-select]').selectOption(id);
            assert.equal(await page.locator('iframe').count(), 0);
            await station.locator('[data-launch]').click();
            assert.equal(await station.locator('iframe').count(), 1, `${id} is launchable`);
            await station.locator('[data-reload]').click();
            assert.equal(await page.locator('iframe').count(), 1, 'Exactly one game runs');
        }
        await station.locator('[data-stop]').click();
        assert.equal(await page.locator('iframe').count(), 0);
        // A short viewport must not transfer max-height through aspect-ratio
        // into a narrower stage (the previous one-sided-gap bug).
        for (const [width, height] of [[1280, 720], [1920, 1080], [768, 600], [390, 844]]) {
            await page.setViewportSize({ width, height });
            let expectedHeight;
            for (const id of ['feastfury', 'meadow-run', 'the-last-tribe', 'crooked-garden', 'lastpunch', 'uber-yeets', 'seriouspoker', 'rougeknight', 'defuseit', 'minisnake']) {
                await station.locator('[data-game-select]').selectOption(id);
                const preview = await playerGeometry(station);
                fillsPlayer(preview);
                expectedHeight ??= preview.stage.height;
                assert.ok(Math.abs(expectedHeight - preview.stage.height) < 1, `${id}: consistent player height at ${width}×${height}`);
                await station.locator('[data-launch]').click();
                const playing = await playerGeometry(station);
                fillsPlayer(playing);
                assert.ok(Math.abs(preview.stage.height - playing.stage.height) < 1, 'Loading does not resize the stage');
            }
            await station.locator('[data-stop]').click();
        }
        await page.setViewportSize({ width: 1280, height: 1000 });
        await page.locator('[data-play="crooked-garden"]').click();
        assert.match(await station.locator('iframe').getAttribute('src'), /20112202/);
        await station.locator('[data-stop]').click();
        await alignedRows(page, '.game-grid', '.game-card', ['.game-meta', 'h3', '.game-description', '.game-actions']);
        await page.goto(`${base}/games.html?game=lastpunch#play`);
        assert.equal(await station.locator('[data-game-select]').inputValue(), 'lastpunch');
        assert.equal(await page.locator('iframe').count(), 0, 'Deep link only previews');
        await page.screenshot({ path: 'test-results/arcade-desktop.png', fullPage: true });

        await page.goto(`${base}/projects.html`);
        const codeButtons = page.locator('.project-link[href^="https://github.com/"]');
        assert.ok(await codeButtons.count() > 0);
        assert.equal(await codeButtons.evaluateAll(links => links.every(link => getComputedStyle(link).backgroundColor === 'rgb(16, 17, 16)')), true, 'Every GitHub code button uses the dark style');
        assert.equal(await page.locator('a[href="https://ravendeath.itch.io/pomokaijuu"]').count(), 1, 'PomoKaijuu stays in Projects');
        assert.equal(await page.locator('a[href="https://ravendeath.itch.io/vangtinai"]').count(), 1, 'VangtiNai stays in Projects');
        await page.getByRole('button', { name: 'Tools & pipelines', exact: true }).click();
        assert.equal(await page.locator('.category-section:visible').count(), 1);
        await alignedRows(page, '.projects-grid', '.project-card', ['.project-description', '.tech-stack', '.project-link']);
        await page.locator('.category-section:visible').screenshot({ path: 'test-results/aligned-tools.png' });
        await page.getByRole('button', { name: 'All Projects', exact: true }).click();
        await alignedRows(page, '.projects-grid', '.project-card', ['.project-description', '.tech-stack', '.project-links, .project-card > .project-link']);
        assert.equal(await page.locator('.category-section[data-category="game"]').count(), 1, 'One unified Games project section');
        assert.equal(await page.locator('.projects-grid > [data-project-game]').count(), 5, 'New games use the normal project grid');
        assert.equal(await page.locator('[data-project-game] button.project-link .fa-play').count(), 5);
        assert.equal(await page.locator('.game-card, [data-recent-games]').count(), 0, 'No separate arcade-style project cards');
        assert.equal(await page.locator('[data-project-game] a').filter({ hasText: 'Details' }).count(), 0);
        assert.equal(await page.locator('[data-project-game="crooked-garden"] a[href="https://github.com/TahmidRaven/Crooked_Garden_LittleJS"]').count(), 1, 'Verified public source gets a Code button');
        await page.locator('[data-play="rougeknight"]').click();
        assert.equal(await modal.locator('[data-game-select]').inputValue(), 'rougeknight');
        assert.match(await modal.locator('iframe').getAttribute('src'), /16720265/);
        assert.equal(await page.locator('[data-play="rougeknight"] .fa-download').count(), 0, 'RougeKnight uses Play, not Download');
        await modal.locator('.player-close').click();
        await page.waitForFunction(() => document.querySelectorAll('iframe').length === 0);
        await page.goto(`${base}/cv.html`);
        const download = await page.locator('a[download]').getAttribute('href');
        assert.equal(download, 'TAHMID_IQBAL_GD_Nov26.pdf');
        assert.equal(await page.locator('.resume-actions a.button.secondary').textContent(), 'View PDF');
        assert.equal((await context.request.get(`${base}/${download}`)).status(), 200);

        for (const width of [390, 320, 768]) {
            await page.setViewportSize({ width, height: 900 });
            for (const path of pages) {
                await page.goto(`${base}/${path}`);
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path}: ${width}px overflow`);
                if (path !== 'email.html') {
                    await page.locator('.menu-toggle').click();
                    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
                    await page.locator('.nav-links').waitFor({ state: 'visible' });
                    await page.keyboard.press('Escape');
                    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
                }
            }
        }
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`${base}/index.html`);
        await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
        await page.goto(`${base}/games.html`);
        await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
        await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))));
        await page.screenshot({ path: 'test-results/arcade-mobile.png', fullPage: true });
        assert.deepEqual(errors, [], 'No uncaught JavaScript errors');
        console.log('PASS: 8 pages at 4 widths; aligned card tracks; 7 social icons; 11 games; apps retained only in Projects; all 10 browser games selectable/loadable; consistent full-width player at 4 viewport sizes; filters; player lifecycle; modal focus; deep links; resume.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
