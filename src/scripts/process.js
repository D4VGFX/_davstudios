function ready(cb) {
    if (document.readyState !== 'loading') cb();
    else document.addEventListener('DOMContentLoaded', cb);
}

function initAccordion() {
    const items = document.querySelectorAll('.phase-item');
    if (!items.length) return;

    function openItem(item) {
        items.forEach(function (other) {
            if (other !== item) {
                other.classList.remove('is-open');
                const h = other.querySelector('.phase-head');
                if (h) h.setAttribute('aria-expanded', 'false');
            }
        });
        item.classList.add('is-open');
        const head = item.querySelector('.phase-head');
        if (head) head.setAttribute('aria-expanded', 'true');

    }

    function toggleItem(item) {
        if (item.classList.contains('is-open')) {
            item.classList.remove('is-open');
            const head = item.querySelector('.phase-head');
            if (head) head.setAttribute('aria-expanded', 'false');
        } else {
            openItem(item);
        }
    }

    items.forEach(function (item) {
        const head = item.querySelector('.phase-head');
        if (!head) return;

        head.addEventListener('click', function () {
            toggleItem(item);
            setTimeout(function () {
                const top = item.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }, 60);
        });

        head.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleItem(item);
            }
        });
    });
    setTimeout(function () {
        if (items[0]) openItem(items[0]);
    }, 800);
}

function initTrackLine() {
    const section = document.querySelector('.proc-phases');
    const line    = document.getElementById('track-line');
    if (!section || !line) return;

    function update() {
        const rect     = section.getBoundingClientRect();
        const winH     = window.innerHeight;
        const total    = section.offsetHeight;
        const entered  = Math.min(Math.max(-rect.top + winH * 0.5, 0), total);
        const pct      = (entered / total) * 100;
        line.style.height = Math.min(pct, 100) + '%';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
}

function initToolChips() {
    const chips = document.querySelectorAll('.tool-chip');
    if (!chips.length) return;

    const observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    chips.forEach(function (chip) {
        observer.observe(chip);
    });
}

ready(function () {
    initAccordion();
    initTrackLine();
    initToolChips();

    console.log('%c✦ processo.js caricato', 'color:#0071E3;font-weight:600;');
});