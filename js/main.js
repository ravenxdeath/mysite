/* Shared navigation and progressive enhancements. No build step required. */
document.addEventListener('DOMContentLoaded', () => {
    const socials = [
        ['GitHub', 'github', 'https://github.com/TahmidRaven'],
        ['LinkedIn', 'linkedin', 'https://www.linkedin.com/in/tahmidiqbal/'],
        ['Facebook', 'facebook', 'https://www.facebook.com/profile.php?id=100073382900528'],
        ['itch.io', 'itch-io', 'https://ravendeath.itch.io/'],
        ['Instagram', 'instagram', 'https://www.instagram.com/tahmid_raven/'],
        ['Discord', 'discord', 'https://discord.gg/VhcnyyrqFJ'],
        ['YouTube', 'youtube', 'https://www.youtube.com/@tahmidraven']
    ];
    const footer = document.querySelector('.footer-content');
    if (footer && !footer.querySelector('[data-social-links]')) {
        const group = document.createElement('div');
        group.className = 'footer-socials';
        group.dataset.socialLinks = '';
        group.setAttribute('aria-label', 'Social profiles');
        footer.appendChild(group);
    }
    document.querySelectorAll('[data-social-links]').forEach(group => {
        group.innerHTML = socials.map(([name, icon, url]) => `<a class="social-icon" href="${url}" aria-label="${name}" title="${name}" target="_blank" rel="noopener noreferrer"><i class="fab fa-${icon}" aria-hidden="true"></i></a>`).join('');
    });

    const menu = document.querySelector('.menu-toggle');
    document.querySelectorAll('.nav-resume').forEach(link => {
        const icon = document.createElement('i');
        icon.className = 'fas fa-download';
        icon.setAttribute('aria-hidden', 'true');
        link.prepend(icon);
    });
    const links = document.querySelector('.nav-links');
    const closeMenu = () => {
        links?.classList.remove('active');
        document.body.classList.remove('no-scroll');
        menu?.setAttribute('aria-expanded', 'false');
        menu?.setAttribute('aria-label', 'Open navigation');
    };
    menu?.addEventListener('click', () => {
        const open = menu.getAttribute('aria-expanded') !== 'true';
        links?.classList.toggle('active', open);
        document.body.classList.toggle('no-scroll', open);
        menu.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMenu();
    });
    links?.addEventListener('click', event => {
        if (event.target.closest('a')) closeMenu();
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);

    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === page) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.rel = 'noopener noreferrer';
    });
    document.querySelectorAll('.stat-bar > span[data-level]').forEach(bar => {
        bar.style.width = `${Math.max(0, Math.min(100, Number(bar.dataset.level) || 0))}%`;
    });
    document.querySelectorAll('.filter-btn[data-category]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.classList.contains('active')));
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn[data-category]').forEach(other => {
                other.classList.toggle('active', other === button);
                other.setAttribute('aria-pressed', String(other === button));
            });
            document.querySelectorAll('.category-section').forEach(section => {
                section.hidden = button.dataset.category !== 'all' && section.dataset.category !== button.dataset.category;
            });
        });
    });
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        const update = () => backToTop.classList.toggle('visible', window.scrollY > 300);
        window.addEventListener('scroll', update, { passive: true });
        update();
        backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
    }

    // A static site cannot deliver messages itself. Open the visitor's mail app instead.
    document.querySelector('[data-email-form]')?.addEventListener('submit', event => {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        const subject = encodeURIComponent(`Portfolio inquiry from ${fields.get('name')}`);
        const body = encodeURIComponent(`${fields.get('message')}\n\nFrom: ${fields.get('name')}\nReply to: ${fields.get('email')}`);
        location.href = `mailto:tahmidraven@gmail.com?subject=${subject}&body=${body}`;
        document.getElementById('email-form-status').textContent = 'Your email app has been requested. Review and send your message there, or email tahmidraven@gmail.com directly.';
    });
});
