function ready(cb) {
    if (document.readyState !== 'loading') cb();
    else document.addEventListener('DOMContentLoaded', cb);
}

const hasMouse = () => window.matchMedia('(pointer: fine)').matches;

const lerp = (a, b, t) => a + (b - a) * t;

function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
}

function initNavbarShrink() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const update = () => {
        if (window.scrollY > 40) {
            navbar.style.background = 'rgba(251,251,253,.95)';
            navbar.style.boxShadow  = '0 1px 20px rgba(0,0,0,.08)';
        } else {
            navbar.style.background = 'rgba(251,251,253,.85)';
            navbar.style.boxShadow  = 'none';
        }
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
}

function initParallax() {
    const target = document.querySelector('.hero-header');
    if (!target || !hasMouse()) return;

    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        target.style.transform = `translateY(${y * 0.18}px)`;
        target.style.opacity   = Math.max(0, 1 - y / 500);
    }, { passive: true });
}

function initStaggerCards() {
    const cards = document.querySelectorAll('.image-box');
    if (!cards.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const i   = Array.from(cards).indexOf(entry.target);
                    const el  = entry.target;
                    el.style.transitionDelay = `${i * 0.12}s`;
                    el.classList.add('visible');
                    observer.unobserve(el);
                }
            });
        },
        { threshold: 0.1 }
    );

    cards.forEach((card) => {
        card.classList.add('reveal');
        observer.observe(card);
    });
}

function initMagneticButtons() {
    if (!hasMouse()) return;

    const selectors = '.btn-oval, .btn-contattami, .btn-rect';
    const buttons   = document.querySelectorAll(selectors);

    buttons.forEach((btn) => {
        btn.addEventListener('mousemove', (e) => {
            const rect   = btn.getBoundingClientRect();
            const cx     = rect.left + rect.width  / 2;
            const cy     = rect.top  + rect.height / 2;
            const dx     = (e.clientX - cx) * 0.28;
            const dy     = (e.clientY - cy) * 0.28;
            btn.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.transition = 'transform .4s cubic-bezier(.34,1.36,.64,1)';
            setTimeout(() => { btn.style.transition = ''; }, 400);
        });
    });
}

function initCursorGlow() {
    if (!hasMouse()) return;

    const glow = document.createElement('div');
    glow.id = 'cursor-glow';
    Object.assign(glow.style, {
        position:        'fixed',
        top:             '0',
        left:            '0',
        width:           '80px',
        height:          '80px',
        borderRadius:    '50%',
        background:      'radial-gradient(circle, rgba(0,113,227,.125) 0%, transparent 70%)',
        pointerEvents:   'none',
        zIndex:          '9998',
        transform:       'translate(-50%, -50%)',
        transition:      'opacity .3s',
        willChange:      'transform',
    });
    document.body.appendChild(glow);

    let mouseX = window.innerWidth  / 2;
    let mouseY = window.innerHeight / 2;
    let glowX  = mouseX;
    let glowY  = mouseY;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { glow.style.opacity = '1'; });

    (function loop() {
        glowX = lerp(glowX, mouseX, 0.07);
        glowY = lerp(glowY, mouseY, 0.07);
        glow.style.transform = `translate(${glowX - 40}px, ${glowY - 40}px)`;
        requestAnimationFrame(loop);
    })();
}

function initCounters() {
    const counters = document.querySelectorAll('.count-up');
    if (!counters.length) return;

    const ease = (t) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const animateCounter = (el) => {
        const target   = parseFloat(el.dataset.count) || 0;
        const suffix   = el.dataset.suffix || '';
        const duration = 1600;
        const start    = performance.now();

        const tick = (now) => {
            const elapsed  = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const value    = Math.round(ease(progress) * target);
            el.textContent = value + suffix;
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = target + suffix;
        };

        requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    counters.forEach((c) => observer.observe(c));
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const id     = link.getAttribute('href').slice(1);
            const target = id ? document.getElementById(id) : null;
            if (!target) return;

            e.preventDefault();
            const navH   = document.querySelector('.navbar')?.offsetHeight || 60;
            const top    = target.getBoundingClientRect().top + window.scrollY - navH - 16;

            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
}


function initHamburger() {
    var btn     = document.querySelector('.nav-hamburger');
    var drawer  = document.getElementById('nav-drawer');
    var overlay = document.getElementById('nav-overlay');
    if (!btn || !drawer) return;

    function open() {
        btn.classList.add('is-open');
        drawer.classList.add('is-open');
        if (overlay) overlay.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }
    function close() {
        btn.classList.remove('is-open');
        drawer.classList.remove('is-open');
        if (overlay) overlay.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    btn.addEventListener('click', function() {
        btn.classList.contains('is-open') ? close() : open();
    });
    if (overlay) overlay.addEventListener('click', close);

    drawer.querySelectorAll('a').forEach(function(a) {
        a.addEventListener('click', close);
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') close();
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) close();
    });
}

ready(() => {
    initHamburger();
    initScrollReveal();
    initNavbarShrink();
    initParallax();
    initStaggerCards();
    initMagneticButtons();
    initCursorGlow();
    initCounters();
    initSmoothScroll();

    console.log('%c✦ animations.js caricato', 'color:#0071E3;font-weight:600;');
});