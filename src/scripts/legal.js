function ready(cb) {
    if (document.readyState !== 'loading') cb();
    else document.addEventListener('DOMContentLoaded', cb);
}

function initReadingBar() {
    var fill = document.getElementById('reading-fill');
    if (!fill) return;

    function update() {
        var scrollTop  = window.scrollY;
        var docHeight  = document.documentElement.scrollHeight - window.innerHeight;
        var pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        fill.style.width = Math.min(pct, 100) + '%';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
}

function initTocHighlight() {
    var sections = document.querySelectorAll('.legal-section[id]');
    var links    = document.querySelectorAll('.toc-link');
    if (!sections.length || !links.length) return;

    var activeId = null;

    var observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    activeId = entry.target.id;
                    links.forEach(function (link) {
                        var isActive = link.getAttribute('href') === '#' + activeId;
                        link.classList.toggle('active', isActive);
                    });
                }
            });
        },
        { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );

    sections.forEach(function (section) {
        observer.observe(section);
    });
}

function initTocScroll() {
    document.querySelectorAll('.toc-link').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var href = link.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            e.preventDefault();
            var target = document.querySelector(href);
            if (!target) return;
            var top = target.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top: top, behavior: 'smooth' });
        });
    });
}

ready(function () {
    initReadingBar();
    initTocHighlight();
    initTocScroll();

    console.log('%c✦ legal.js caricato', 'color:#0071E3;font-weight:600;');
});