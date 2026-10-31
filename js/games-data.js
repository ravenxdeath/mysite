/* Curated catalog. Builds stay on itch.io or their own host, not in this repository.
   upload is the public itch embed-upload ID, not the game's store/widget ID.
   The current Godot exports are non-threaded and support the hosted player. */
window.RAVEN_GAMES = [
    {
        id: 'pocket-monsters', title: 'Pocket Monsters', category: 'browser', jam: false,
        meta: 'Color-linking puzzle · Web game', engine: 'Cocos Creator · TypeScript',
        description: 'Everyone needs a friend. Connect matching little monsters across five colorful puzzles.',
        url: 'https://pocket-monster.tahmidraven.com/', embed: 'https://pocket-monster.tahmidraven.com/', image: 'images/games/pocket-monsters.webp', aspect: '16 / 9',
        controls: 'Connect matching monsters using the on-screen controls. See the in-game instructions for puzzle rules.'
    },
    {
        id: 'the-last-tribe', title: 'The Last Tribe', category: 'browser', jam: true,
        meta: 'Brackeys 2026.2 · 66 / 2,181', engine: 'Godot · GDScript',
        description: 'Gather resources, survive the wilderness, and uncover the shapeshifters hiding among your tribe.',
        role: 'My contribution: shaders & system design.',
        url: 'https://dan5626.itch.io/the-last-tribe', image: 'images/games/the-last-tribe.webp', upload: '19024954',
        controls: 'See the in-game instructions for movement, gathering, and investigation controls.'
    },
    {
        id: 'crooked-garden', title: 'Crooked Garden', category: 'browser', jam: true,
        meta: 'LittleJS Jam 3', engine: 'LittleJS · JavaScript',
        description: 'Grow a vine, loop around bugs, and restore three gardens before your water runs out.',
        role: 'Combos, rewinds, retries & cross-platform leaderboards.',
        url: 'https://ravendeath.itch.io/crooked-garden', image: 'images/games/crooked-garden.webp', upload: '20112202', aspect: '1280 / 800',
        controls: 'Click or touch and drag to grow. Shift: burst. Space / Esc: pause. Z: rewind. R: retry.'
    },
    {
        id: 'lastpunch', title: 'LastPunch', category: 'browser', jam: true,
        meta: 'GMTK Game Jam 2026', engine: 'Godot · GDScript',
        description: 'Timed boss fights with upgrade-card choices between rounds. Make every punch count.',
        role: 'My contribution: programming, shaders, systems & gameplay design.',
        url: 'https://ravendeath.itch.io/lastpunch-gmtk2026', image: 'images/games/lastpunch-gmtk2026.webp', upload: '18530573',
        controls: 'Follow the controls on the game’s title screen.'
    },
    {
        id: 'feastfury', title: 'FeastFury', category: 'browser', jam: false,
        meta: 'Endless tap-blast · Web game', engine: 'Cocos Creator · TypeScript',
        description: 'Pop connected snacks, break crates, and beat the rising diner rush in an endless tap-blast puzzle.',
        url: 'https://feastfury.tahmidraven.com/', embed: 'https://feastfury.tahmidraven.com/', image: 'images/games/feastfury.webp', aspect: '4 / 3',
        controls: 'Click or tap a group of two or more matching snacks. Break adjacent crates, use powerups, and clear waves before the tide overwhelms the board. Escape: pause.'
    },
    {
        id: 'meadow-run', title: 'Meadow Run', category: 'browser', jam: false,
        meta: 'Endless harvesting · Web game', engine: 'Cocos Creator · TypeScript',
        description: 'Harvest carrots, sell your haul at the market, and upgrade your tools in a growing low-poly farm adventure.',
        url: 'https://meadow-run.tahmidraven.com/', embed: 'https://meadow-run.tahmidraven.com/', image: 'images/games/meadow-run.webp', aspect: '16 / 10',
        controls: 'WASD, arrow keys, or drag to move. Harvest carrots, sell at the market, and upgrade your tools. Escape: pause.'
    },
    {
        id: 'uber-yeets', title: 'UberYeets', category: 'browser', jam: false,
        meta: 'Racing · Browser game', engine: 'Racing',
        description: 'A browser-playable racing experiment. Jump in and take it for a spin.',
        url: 'https://ravendeath.itch.io/uber-yeets', image: 'images/games/uber-yeets.webp', upload: '18622223',
        controls: 'Follow the driving instructions shown in-game.'
    },
    {
        id: 'seriouspoker', title: 'SeriousPoker', category: 'browser', jam: false,
        meta: 'Card game · Browser game', engine: 'Card game',
        description: 'Can you win the entire pot? Take a seat at the table and play your hand.',
        url: 'https://ravendeath.itch.io/seriouspoker', image: 'images/games/seriouspoker.webp', upload: '18240417',
        controls: 'Use the on-screen card and betting controls.'
    },
    {
        id: 'rougeknight', title: 'RougeKnight', category: 'browser', jam: false,
        meta: 'Pixel-art adventure', engine: 'Godot · GDScript',
        description: 'An underpaid knight heads out into the kingdom to collect a little extra coin.',
        url: 'https://ravendeath.itch.io/rougeknight', image: 'images/games/rougeknight.webp', upload: '16720265',
        controls: 'Follow the movement and combat instructions in-game.'
    },
    {
        id: 'defuseit', title: 'DefuseIt / Aim Trainer', category: 'browser', jam: false,
        meta: 'Shooter · Aim trainer', engine: 'Aim trainer',
        description: 'A browser-based aim-training experiment. Put your precision to the test.',
        url: 'https://ravendeath.itch.io/defuseit-aimtrainer', image: 'images/games/defuseit-aimtrainer.webp', upload: '16805744', aspect: '1080 / 720',
        controls: 'Use the aiming controls shown in-game. A mouse is recommended.'
    },
    {
        id: 'minisnake', title: 'MiniSnake', category: 'browser', jam: false,
        meta: 'Arcade · 30-second challenge', engine: 'Arcade',
        description: 'A short snake game with a timer and scoreboard. How much can you do in 30 seconds?',
        url: 'https://ravendeath.itch.io/minisnake', image: 'images/games/minisnake.webp', upload: '15464247',
        controls: 'Follow the directional controls shown in-game.'
    },
    {
        id: 'spaceoutcast', title: 'SpaceOutcast v1', category: 'download', jam: false,
        meta: 'Shooter · Download', engine: 'Shooter',
        description: 'An early space-shooter project. Fire away — available as a downloadable build.',
        url: 'https://ravendeath.itch.io/spaceoutcast-v1', image: 'images/games/spaceoutcast-v1.webp'
    }
];
