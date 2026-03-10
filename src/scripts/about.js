function ready(cb) {
    if (document.readyState !== 'loading') cb();
    else document.addEventListener('DOMContentLoaded', cb);
}
const hasMouse = () => window.matchMedia('(pointer: fine)').matches;
const lerp     = (a, b, t) => a + (b - a) * t;

function initSkillBars() {
    const bars = document.querySelectorAll('.skill-bar');
    if (!bars.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const fill = entry.target.querySelector('.skill-bar__fill');
                    if (fill) {
                        const width = fill.dataset.width || '0';
                        setTimeout(() => {
                            fill.style.width = width + '%';
                        }, 200);
                    }
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.3 }
    );

    bars.forEach((b) => observer.observe(b));
}

function initTiltCards() {
    if (!hasMouse()) return;

    const cards = document.querySelectorAll('.value-card');
    const MAX_TILT = 10;

    cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect   = card.getBoundingClientRect();
            const cx     = rect.left + rect.width  / 2;
            const cy     = rect.top  + rect.height / 2;
            const dx     = (e.clientX - cx) / (rect.width  / 2);
            const dy     = (e.clientY - cy) / (rect.height / 2);
            const rotX   = -dy * MAX_TILT;
            const rotY   =  dx * MAX_TILT;

            card.style.transform    = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px)`;
            card.style.transition   = 'transform .1s ease';
            card.style.boxShadow    = `
                ${-rotY * .8}px ${rotX * .8}px 40px rgba(0,0,0,.12),
                0 20px 60px rgba(0,0,0,.10)
            `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform  = '';
            card.style.transition = 'transform .6s cubic-bezier(.34,1.36,.64,1), box-shadow .4s';
            card.style.boxShadow  = '';
        });
    });
}

function initTimeline() {
    const nodes = document.querySelectorAll('.timeline-node');
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                nodes.forEach((node, i) => {
                    setTimeout(() => {
                        node.style.opacity   = '1';
                        node.style.transform = 'translateX(0)';
                    }, i * 180);
                });
                observer.disconnect();
            }
        },
        { threshold: 0.2 }
    );
    nodes.forEach((node) => {
        node.style.opacity   = '0';
        node.style.transform = 'translateX(-16px)';
        node.style.transition = 'opacity .5s var(--ease), transform .5s var(--ease)';
    });

    const section = document.querySelector('.story-timeline');
    if (section) observer.observe(section);
}

function initNameSplit() {
    const nameEl = document.querySelector('.about-hero__name');
    if (!nameEl) return;
    const lines = nameEl.innerHTML.split('<br>');
    nameEl.innerHTML = lines
        .map((line) =>
            line
                .replace(/<span>(.*?)<\/span>/g, (_, inner) =>
                    `<span>${splitChars(inner)}</span>`
                )
                .replace(/(?![^<]*>)./g, (char) =>
                    char.trim() ? `<span class="char">${char}</span>` : char
                )
        )
        .join('<br>');

    function splitChars(str) {
        return str.replace(/./g, (c) => `<span class="char">${c}</span>`);
    }

    const chars = nameEl.querySelectorAll('.char');
    chars.forEach((c, i) => {
        c.style.display       = 'inline-block';
        c.style.opacity       = '0';
        c.style.transform     = 'translateY(20px)';
        c.style.transition    = `opacity .5s var(--ease), transform .5s var(--ease)`;
        c.style.transitionDelay = `${0.1 + i * 0.03}s`;
    });
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            chars.forEach((c) => {
                c.style.opacity   = '1';
                c.style.transform = 'translateY(0)';
            });
        });
    });
}

function initPhotoParallax() {
    if (!hasMouse()) return;

    const photo = document.querySelector('.about-hero__photo');
    if (!photo) return;

    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        photo.style.transform = `translateY(${y * 0.12}px)`;
    }, { passive: true });
}

function initStatsHighlight() {
    const strip = document.querySelector('.stats-strip__inner');
    if (!strip) return;

    const items = strip.querySelectorAll('.stat-item');

    items.forEach((item) => {
        item.addEventListener('mouseenter', () => {
            items.forEach((other) => {
                if (other !== item) {
                    other.style.opacity   = '.35';
                    other.style.transform = 'scale(.97)';
                }
            });
            const num = item.querySelector('.stat-number');
            if (num) {
                num.style.color     = '#34aadc';
                num.style.transform = 'scale(1.08)';
                num.style.transition = 'color .2s, transform .3s var(--ease-spring)';
            }
        });

        item.addEventListener('mouseleave', () => {
            items.forEach((other) => {
                other.style.opacity   = '1';
                other.style.transform = 'scale(1)';
            });
            const num = item.querySelector('.stat-number');
            if (num) {
                num.style.color     = '#fff';
                num.style.transform = 'scale(1)';
            }
        });
    });

    items.forEach((i) => {
        i.style.transition = 'opacity .25s var(--ease), transform .3s var(--ease)';
    });
}
ready(() => {
    initSkillBars();
    initTyped();
    initTiltCards();
    initTimeline();
    initPhotoParallax();
    initStatsHighlight();

    console.log('%c✦ about.js caricato', 'color:#34aadc;font-weight:600;');
});