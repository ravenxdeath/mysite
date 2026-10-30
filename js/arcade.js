/* Curated game library and a shared dropdown player. Builds stay on their hosts. */
(() => {
    'use strict';
    const games = window.RAVEN_GAMES || [];
    const browserGames = games.filter(game => game.category === 'browser');
    const library = document.querySelector('[data-game-library]');
    const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

    function card(game) {
        const title = escapeHTML(game.title);
        const cover = game.image
            ? `<img src="${escapeHTML(game.image)}" alt="${title} cover art" width="1200" height="630" loading="lazy">`
            : `<span>${title}</span>`;
        const action = game.category === 'browser'
            ? `<button class="play-button" data-play="${game.id}" aria-label="Play ${title}"><span aria-hidden="true">▶</span> Play game</button>`
            : `<a class="play-button" href="${escapeHTML(game.url)}" target="_blank" rel="noopener noreferrer">Downloads</a>`;
        return `<article class="game-card" id="game-${game.id}">
            <a class="game-cover${game.image ? '' : ' placeholder'}" href="games.html?game=${game.id}#play" aria-label="Explore ${title}">${cover}</a>
            <div class="game-body"><p class="game-meta">${escapeHTML(game.meta)}</p><h3>${title}</h3><p class="game-description">${escapeHTML(game.description)}</p><p class="game-role"${game.role ? '' : ' aria-hidden="true"'}>${game.role ? escapeHTML(game.role) : ''}</p>
            <div class="game-actions">${action}<a href="${escapeHTML(game.url)}" target="_blank" rel="noopener noreferrer" aria-label="${title} project page (new tab)">Details</a></div></div></article>`;
    }
    const selected = document.querySelector('[data-selected-games]');
    if (selected) {
        const featuredIds = ['feastfury', 'meadow-run', 'the-last-tribe'];
        const orderedGames = [...featuredIds.map(id => games.find(game => game.id === id)).filter(Boolean), ...games.filter(game => !featuredIds.includes(game.id))];
        selected.innerHTML = orderedGames.map(card).join('');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let timer;
        let swiping = false;
        function schedule() {
            clearTimeout(timer);
            if (!reducedMotion.matches) timer = setTimeout(advance, 5000);
        }
        function advance() {
            const bounds = selected.getBoundingClientRect();
            // Don't move cards during a swipe, keyboard interaction, or gameplay.
            if (!document.hidden && !swiping && !selected.contains(document.activeElement) && !document.querySelector('dialog[open]') && bounds.bottom > 0 && bounds.top < innerHeight) {
                const step = selected.querySelector('.game-card').getBoundingClientRect().width + parseFloat(getComputedStyle(selected).columnGap);
                const atEnd = selected.scrollLeft + selected.clientWidth >= selected.scrollWidth - 2;
                selected.scrollTo({ left: atEnd ? 0 : selected.scrollLeft + step, behavior: atEnd ? 'instant' : 'smooth' });
            }
            schedule();
        }
        selected.addEventListener('pointerdown', () => { swiping = true; clearTimeout(timer); });
        const finishSwipe = () => { if (swiping) { swiping = false; schedule(); } };
        window.addEventListener('pointerup', finishSwipe);
        window.addEventListener('pointercancel', finishSwipe);
        selected.addEventListener('wheel', schedule, { passive: true });
        selected.addEventListener('focusout', schedule);
        document.addEventListener('visibilitychange', schedule);
        reducedMotion.addEventListener('change', schedule);
        schedule();
    }

    let filter = 'all';
    const search = document.getElementById('game-search');
    function renderLibrary() {
        const query = (search?.value || '').trim().toLowerCase();
        const visible = games.filter(game => (filter === 'all' || (filter === 'jam' ? game.jam : game.category === filter)) && `${game.title} ${game.engine} ${game.meta} ${game.description}`.toLowerCase().includes(query));
        library.innerHTML = visible.map(card).join('');
        document.querySelector('[data-game-count]').textContent = `${visible.length} ${visible.length === 1 ? 'game' : 'games'} / ${filter === 'all' ? 'the whole collection' : filter === 'jam' ? 'game-jam entries' : filter === 'browser' ? 'browser playable' : 'downloads'}`;
        document.querySelector('[data-game-empty]').hidden = visible.length !== 0;
    }
    if (library) {
        renderLibrary();
        search?.addEventListener('input', renderLibrary);
        document.querySelectorAll('[data-game-filter]').forEach(button => {
            button.addEventListener('click', () => {
                filter = button.dataset.gameFilter;
                document.querySelectorAll('[data-game-filter]').forEach(other => {
                    other.classList.toggle('active', other === button);
                    other.setAttribute('aria-pressed', String(other === button));
                });
                renderLibrary();
            });
        });
    }

    // Both the inline arcade and modal use this implementation. A change of game
    // always removes the previous iframe before showing the next game's preview.
    function createPlayer(root, prefix) {
        root.innerHTML = `<div class="player-header"><div><p class="eyebrow">PICK YOUR NEXT ROUND</p><h2 id="${prefix}-title">Browser arcade</h2></div><label class="player-picker" for="${prefix}-select">Choose a game<select id="${prefix}-select" data-game-select>${browserGames.map(game => `<option value="${game.id}">${escapeHTML(game.title)}</option>`).join('')}</select></label></div><div class="player-stage"></div><div class="player-tools"><button class="button" data-launch>Play game</button><button class="button secondary" data-reload hidden>Restart game</button><button class="button secondary" data-fullscreen hidden>Fullscreen</button><button class="button secondary" data-stop hidden>Stop game</button><a class="button secondary" data-original target="_blank" rel="noopener noreferrer">Open original</a></div><div class="player-note"><p data-controls></p><p data-player-status role="status" aria-live="polite"></p></div>`;
        const stage = root.querySelector('.player-stage');
        const picker = root.querySelector('[data-game-select]');
        const launch = root.querySelector('[data-launch]');
        const reload = root.querySelector('[data-reload]');
        const fullscreen = root.querySelector('[data-fullscreen]');
        const stopButton = root.querySelector('[data-stop]');
        const status = root.querySelector('[data-player-status]');
        let current = null;
        let loadTimer = null;
        let generation = 0;
        function unload() {
            generation++;
            clearTimeout(loadTimer);
            stage.replaceChildren();
        }
        function choose(game) {
            unload();
            current = game;
            picker.value = game.id;
            root.querySelector('h2').textContent = game.title;
            root.querySelector('[data-controls]').textContent = game.controls || game.description;
            root.querySelector('[data-original]').href = game.url;
            const preview = document.createElement('div');
            preview.className = 'player-preview';
            if (game.image) {
                const image = document.createElement('img');
                image.src = game.image;
                image.alt = `${game.title} cover`;
                preview.appendChild(image);
            }
            const text = document.createElement('p');
            text.textContent = game.category === 'download' ? 'This project is a download or app. Visit its original page to get it.' : 'Ready for another round? Press Play game to begin.';
            preview.appendChild(text);
            stage.appendChild(preview);
            launch.hidden = game.category !== 'browser';
            reload.hidden = fullscreen.hidden = stopButton.hidden = true;
            status.textContent = launch.hidden ? 'Download-only projects cannot run in the browser player.' : 'Only one game runs at a time. Changing the dropdown stops the current game; press Play to start your next one.';
            picker.closest('label').hidden = game.category !== 'browser';
        }
        function load() {
            if (!current || current.category !== 'browser') return;
            unload();
            const version = generation;
            const iframe = document.createElement('iframe');
            iframe.title = `${current.title} — hosted game`;
            iframe.allow = 'autoplay; fullscreen; gamepad';
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            iframe.src = current.embed || `https://itch.io/embed-upload/${current.upload}?color=101110`;
            status.textContent = 'Loading the game from its host. Some engine builds take a little longer; Open original is available if your browser cannot run it here.';
            iframe.addEventListener('load', () => {
                if (version !== generation) return;
                status.textContent = 'Host frame loaded. Click inside the game for keyboard controls, then use its Play or Start button if shown. Open original is always available.';
            });
            stage.replaceChildren(iframe);
            launch.hidden = true;
            reload.hidden = stopButton.hidden = false;
            fullscreen.hidden = !stage.requestFullscreen;
            loadTimer = setTimeout(() => {
                if (version === generation) status.textContent = 'Still blank or stuck loading? Your browser or the host may be blocking the embed. Try Open original, or pick another game.';
            }, 25000);
        }
        picker.addEventListener('change', () => choose(browserGames.find(game => game.id === picker.value)));
        launch.addEventListener('click', load);
        reload.addEventListener('click', load);
        stopButton.addEventListener('click', () => choose(current));
        fullscreen.addEventListener('click', async () => {
            try { await stage.requestFullscreen(); }
            catch { status.textContent = 'Fullscreen is unavailable in this browser. Try Open original.'; }
        });
        choose(browserGames.find(game => game.id === 'feastfury') || browserGames[0]);
        return { choose, load, unload };
    }

    const inlineRoot = document.querySelector('[data-inline-player]');
    const inlinePlayer = inlineRoot ? createPlayer(inlineRoot, 'arcade') : null;
    const dialog = document.createElement('dialog');
    dialog.className = 'game-dialog';
    dialog.setAttribute('aria-labelledby', 'modal-title');
    dialog.innerHTML = '<div class="player-dialog-bar"><span class="eyebrow">AFTER HOURS ARCADE</span><button class="player-close" aria-label="Close game">Close ×</button></div><div data-modal-player></div>';
    document.body.appendChild(dialog);
    const modalPlayer = createPlayer(dialog.querySelector('[data-modal-player]'), 'modal');
    let trigger = null;
    function closeDialog() { dialog.close(); }
    dialog.querySelector('.player-close').addEventListener('click', closeDialog);
    dialog.addEventListener('close', () => {
        modalPlayer.unload();
        document.body.classList.remove('no-scroll');
        trigger?.focus();
    });
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
    });
    document.addEventListener('click', event => {
        const button = event.target.closest('[data-play]');
        if (!button) return;
        const game = games.find(item => item.id === button.dataset.play);
        if (!game) return;
        if (inlinePlayer) {
            inlinePlayer.choose(game);
            inlinePlayer.load();
            inlineRoot.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
            inlineRoot.querySelector('[data-game-select]').focus({ preventScroll: true });
        } else {
            trigger = button;
            modalPlayer.choose(game);
            dialog.showModal();
            document.body.classList.add('no-scroll');
            modalPlayer.load(); // Clicking a Play action is the explicit load gesture.
        }
    });
    if (inlinePlayer) {
        const id = new URLSearchParams(location.search).get('game');
        const game = games.find(item => item.id === id);
        if (game) inlinePlayer.choose(game); // Shared URLs preview without auto-downloading.
    }
})();
