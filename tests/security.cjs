/* Browser-level checks for the static site's protections. No third-party scans. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const pages = ['index.html', 'games.html', 'projects.html', 'aboutme.html', 'cv.html', 'myblog.html', 'contacts.html', 'email.html'];

(async () => {
    const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
    try {
        const context = await browser.newContext();
        let blockedOriginRequests = 0;
        await context.route('https://blocked.invalid/**', route => { blockedOriginRequests++; return route.abort(); });
        await context.addInitScript(() => {
            window.__policyViolations = [];
            document.addEventListener('securitypolicyviolation', event => {
                window.__policyViolations.push({ directive: event.effectiveDirective, blocked: event.blockedURI });
            });
        });
        const page = await context.newPage();
        let policy;
        for (const name of pages) {
            await page.goto(`${base}/${name}`);
            await page.locator('h1').first().waitFor();
            await page.evaluate(() => document.fonts.ready);
            const current = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
            policy ??= current;
            assert.equal(current, policy, `${name}: consistent CSP`);
            assert.ok(current.includes("script-src 'self';"), 'No unsafe-inline/eval for scripts');
            assert.equal(await page.locator('meta[name="referrer"]').getAttribute('content'), 'strict-origin-when-cross-origin');
            assert.equal(await page.locator('script:not([src])').count(), 0, 'No inline application scripts');
            assert.ok(await page.evaluate(() => {
                const children = [...document.head.children];
                const csp = children.findIndex(node => node.matches('meta[http-equiv="Content-Security-Policy"]'));
                const resource = children.findIndex(node => node.matches('script, link, style'));
                return resource < 0 || csp < resource;
            }), 'CSP precedes resource loading');
            const fontAwesome = page.locator('link[href*="font-awesome"]');
            if (await fontAwesome.count()) {
                assert.match(await fontAwesome.getAttribute('integrity'), /^sha384-/);
                assert.equal(await fontAwesome.getAttribute('crossorigin'), 'anonymous');
                assert.ok(await fontAwesome.evaluate(link => !!link.sheet), `${name}: pinned stylesheet loaded`);
                assert.ok(await page.evaluate(() => document.fonts.check('900 16px "Font Awesome 6 Free"')), 'Icon font available');
            }
            assert.deepEqual(await page.evaluate(() => window.__policyViolations), [], `${name}: no application CSP violations`);
        }

        // Same-origin official PDF preview stays allowed. Its native renderer is
        // browser-specific; verify the object, PDF response, and lack of CSP blocks.
        await page.goto(`${base}/cv.html`);
        const pdf = await context.request.get(`${base}/TAHMID_IQBAL_GD_Nov26.pdf`);
        assert.equal(pdf.status(), 200);
        assert.match(pdf.headers()['content-type'], /application\/pdf/);
        await page.locator('details summary').click();
        assert.ok(await page.locator('object.resume-preview').isVisible());
        assert.deepEqual(await page.evaluate(() => window.__policyViolations), []);

        // Deliberately inject only harmless local test canaries, then verify that
        // the browser (not merely string escaping) refuses them.
        await page.goto(`${base}/games.html`);
        await page.evaluate(() => {
            const inline = document.createElement('script');
            inline.textContent = 'window.__inlineCanary = true';
            document.body.appendChild(inline);
            const baseTag = document.createElement('base');
            baseTag.href = 'https://blocked.invalid/';
            document.head.appendChild(baseTag);
            const frame = document.createElement('iframe');
            frame.src = 'https://blocked.invalid/frame';
            document.body.appendChild(frame);
        });
        await page.waitForFunction(() => ['script-src-elem', 'base-uri', 'frame-src'].every(d => window.__policyViolations.some(v => v.directive === d)));
        assert.equal(await page.evaluate(() => !!window.__inlineCanary), false);
        assert.ok((await page.evaluate(() => document.baseURI)).startsWith(base));
        assert.equal(await page.evaluate(async () => {
            try { await fetch('https://blocked.invalid/'); return false; }
            catch { return true; }
        }), true, 'Unexpected connections blocked');
        await page.waitForFunction(() => window.__policyViolations.some(v => v.directive === 'connect-src'));
        await page.evaluate(() => {
            const form = document.createElement('form');
            form.action = 'https://blocked.invalid/form';
            form.method = 'post';
            document.body.appendChild(form);
            form.submit();
        });
        await page.waitForFunction(() => window.__policyViolations.some(v => v.directive === 'form-action'));
        assert.equal(blockedOriginRequests, 0, 'CSP canaries are blocked before network access');

        // A modified CDN response must fail its pinned integrity check even
        // though that CDN is allowed by the CSP.
        await context.route('**/all.min.css?security-test=1', route => route.fulfill({
            contentType: 'text/css', headers: { 'access-control-allow-origin': '*' }, body: 'body { --tampered-css: loaded; }'
        }));
        await page.goto(`${base}/games.html`);
        const integrityBlocked = await page.evaluate(() => new Promise(resolve => {
            const original = document.querySelector('link[integrity]');
            const tampered = original.cloneNode();
            tampered.href += '?security-test=1';
            tampered.onload = () => resolve(false);
            tampered.onerror = () => resolve(true);
            document.head.appendChild(tampered);
        }));
        assert.equal(integrityBlocked, true, 'Tampered CDN stylesheet rejected');
        assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--tampered-css')), 'loaded');

        // A controlled cross-origin fixture exercises real sandbox restrictions
        // with user activation, without attempting navigation on a third-party host.
        await context.route('https://feastfury.tahmidraven.com/**', route => route.fulfill({
            contentType: 'text/html', body: `<body style="margin:0;height:100vh;display:grid;place-items:center"><button id="escape">Sandbox test</button><script>
                window.parentReadable = true;
                try { parent.document.body; } catch { window.parentReadable = false; }
                localStorage.setItem('portfolio-sandbox-test', 'works');
                window.storageWorks = localStorage.getItem('portfolio-sandbox-test') === 'works';
                localStorage.removeItem('portfolio-sandbox-test');
                document.getElementById('escape').onclick = () => {
                    window.navigationAttempted = true;
                    try { top.location.href = 'https://blocked.invalid/'; }
                    catch { window.navigationBlocked = true; }
                };
            </script>`
        }));
        await page.goto(`${base}/games.html`);
        const station = page.locator('[data-inline-player]');
        await station.locator('[data-launch]').click();
        const iframe = station.locator('iframe');
        const tokens = (await iframe.getAttribute('sandbox')).split(' ');
        for (const capability of ['allow-scripts', 'allow-same-origin', 'allow-pointer-lock']) assert.ok(tokens.includes(capability));
        for (const capability of ['allow-top-navigation', 'allow-top-navigation-by-user-activation', 'allow-forms', 'allow-downloads', 'allow-modals']) assert.ok(!tokens.includes(capability));
        const game = page.frameLocator('[data-inline-player] iframe');
        await game.locator('#escape').waitFor();
        assert.equal(await game.locator('body').evaluate(() => window.parentReadable), false, 'Game cannot read portfolio DOM');
        assert.equal(await game.locator('body').evaluate(() => window.storageWorks), true, 'Game origin storage preserved');
        await game.locator('#escape').press('Enter');
        await page.frames().find(frame => frame.url().startsWith('https://feastfury.tahmidraven.com/')).waitForFunction(() => window.navigationAttempted === true);
        assert.equal(blockedOriginRequests, 0, 'Even user-activated top navigation never reaches the network');
        assert.ok(page.url().startsWith(base));
        await station.locator('[data-fullscreen]').click();
        await page.waitForFunction(() => !!document.fullscreenElement);
        await page.evaluate(() => document.exitFullscreen());
        await station.locator('[data-stop]').click();

        // Bad catalog embed addresses are rejected before an iframe is created.
        for (const address of ['https://blocked.invalid/game', `${base}/games.html`, 'javascript:alert(1)']) {
            await page.evaluate(address => { window.RAVEN_GAMES.find(game => game.id === 'feastfury').embed = address; }, address);
            await station.locator('[data-launch]').click();
            assert.equal(await station.locator('iframe').count(), 0);
            assert.match(await station.locator('[data-player-status]').textContent(), /not approved/);
        }
        console.log('PASS: CSP on 8 pages; no normal CSP violations; inline script/base/frame/connect canaries blocked; real CDN SRI; PDF preview permitted; sandbox blocks parent DOM/top navigation; game storage/fullscreen preserved; unapproved embed URLs refused.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
