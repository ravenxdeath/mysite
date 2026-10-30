/* Optional network integration check. Opens real public builds, never submits scores. */
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';

(async () => {
    const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
    try {
        await fs.mkdir('test-results/live', { recursive: true });
        const index = await browser.newPage();
        await index.goto(`${base}/games.html`);
        const games = await index.evaluate(() => window.RAVEN_GAMES.filter(game => game.category === 'browser'));
        await index.close();
        let next = 0;
        const results = [];
        async function worker() {
            while (next < games.length) {
                const game = games[next++];
                const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                try {
                    await page.goto(`${base}/games.html?game=${game.id}#play`);
                    const station = page.locator('[data-inline-player]');
                    await station.locator('[data-launch]').click();
                    const host = page.frameLocator('[data-inline-player] .player-stage iframe');
                    const frame = game.upload ? host.frameLocator('iframe') : host;
                    await frame.locator('canvas').first().waitFor({ state: 'visible', timeout: 60000 });
                    // Godot's canvas exists during download; startup only succeeds when
                    // its status overlay is removed. Don't mistake a canvas for readiness.
                    await frame.locator('#status').waitFor({ state: 'detached', timeout: 60000 });
                    if (['meadow-run', 'feastfury'].includes(game.id)) {
                        await page.frames().find(f => f.url().startsWith(game.embed)).waitForFunction(() => window.cc?.director.getScene()?.getChildByName('Canvas'), null, { timeout: 60000 });
                    }
                    await station.screenshot({ path: `test-results/live/${game.id}.png` });
                    results.push({ game: game.title, ready: true, errors });
                } catch (error) {
                    results.push({ game: game.title, ready: false, reason: error.message.split('\n')[0], errors });
                } finally { await page.close(); }
            }
        }
        await Promise.all([worker(), worker(), worker()]);
        console.log(JSON.stringify(results, null, 2));
        await fs.writeFile('test-results/live/results.json', JSON.stringify(results, null, 2));
        if (results.some(result => !result.ready)) process.exitCode = 1;
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
