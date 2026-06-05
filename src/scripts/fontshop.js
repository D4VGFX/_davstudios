function ready(cb) {
    if (document.readyState !== 'loading') cb();
    else document.addEventListener('DOMContentLoaded', cb);
}

/* ── UTILITY ─────────────────────────────────────────────── */
function formatPrice(price) {
    return parseFloat(price).toFixed(2).replace('.', ',');
}

/* ── MODAL CHECKOUT ──────────────────────────────────────── */
function initCheckoutModal() {
    var backdrop = document.getElementById('checkout-backdrop');
    var modal    = document.getElementById('checkout-modal');
    var closeBtn = document.getElementById('modal-close');
    if (!modal || !backdrop) return;

    var currentFont    = '';
    var currentLicense = '';
    var currentPrice   = 0;

    function openModal(fontId, licenseId, licenseName, price) {
        currentFont    = fontId;
        currentLicense = licenseId;
        currentPrice   = price;

        var fontName       = fontId.charAt(0).toUpperCase() + fontId.slice(1);
        var priceFormatted = formatPrice(price);

        document.getElementById('modal-title').textContent     = fontName + ' — ' + licenseName;
        document.getElementById('modal-price').textContent     = '€' + priceFormatted;
        document.getElementById('summary-font').textContent    = fontName;
        document.getElementById('summary-license').textContent = licenseName;
        document.getElementById('summary-price').textContent   = '€' + priceFormatted;

        backdrop.classList.add('show');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        setTimeout(function () {
            var nameInput = document.getElementById('buyer-name');
            if (nameInput) nameInput.focus();
        }, 350);
    }

    function closeModal() {
        backdrop.classList.remove('show');
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // Apri modal da bottoni licenza
    document.querySelectorAll('.fd-lic-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var fontId      = btn.getAttribute('data-font');
            var licenseId   = btn.getAttribute('data-license');
            var price       = parseFloat(btn.getAttribute('data-price')); // ← parseFloat invece di parseInt
            var name        = btn.getAttribute('data-name') || '';
            var licenseName = name.split('—')[1] ? name.split('—')[1].trim() : licenseId;
            openModal(fontId, licenseId, licenseName, price);
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
    });

    // Submit checkout
    var submitBtn = document.getElementById('btn-checkout');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async function () {
        var nameInput    = document.getElementById('buyer-name');
        var emailInput   = document.getElementById('buyer-email');
        var companyInput = document.getElementById('buyer-company');

        var valid = true;

        [nameInput, emailInput].forEach(function (input) {
            if (!input) return;
            input.classList.remove('error');
            if (!input.value.trim()) {
                input.classList.add('error');
                valid = false;
            }
        });

        if (emailInput && emailInput.value.trim()) {
            var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRe.test(emailInput.value.trim())) {
                emailInput.classList.add('error');
                valid = false;
            }
        }

        if (!valid) {
            submitBtn.classList.add('shake');
            setTimeout(function () { submitBtn.classList.remove('shake'); }, 600);
            return;
        }

        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Reindirizzamento…';

        try {
            var res = await fetch('/.netlify/functions/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    font:    currentFont,
                    license: currentLicense,
                    price:   currentPrice,
                    name:    nameInput.value.trim(),
                    email:   emailInput.value.trim(),
                    company: companyInput ? companyInput.value.trim() : ''
                })
            });

            var data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Errore sconosciuto');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            submitBtn.classList.remove('loading');
            submitBtn.textContent = 'Riprova — si è verificato un errore';
            setTimeout(function () {
                submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Procedi al pagamento';
                submitBtn.classList.remove('loading');
            }, 3000);
        }
    });

    [document.getElementById('buyer-name'), document.getElementById('buyer-email')].forEach(function (input) {
        if (!input) return;
        input.addEventListener('input', function () {
            input.classList.remove('error');
        });
    });
}

/* ── FONT TESTER ─────────────────────────────────────────── */
function initFontTester() {
    var area   = document.getElementById('tester-area');
    var range  = document.getElementById('size-range');
    var sizeEl = document.getElementById('size-val');
    if (!area || !range) return;

    range.addEventListener('input', function () {
        var val = range.value;
        area.style.fontSize = val + 'px';
        if (sizeEl) sizeEl.textContent = val;
    });

    area.addEventListener('focus', function () {
        if (area.textContent === area.getAttribute('data-placeholder')) {
            area.textContent = '';
        }
    });

    area.addEventListener('blur', function () {
        if (!area.textContent.trim()) {
            area.textContent = area.getAttribute('data-placeholder') || '';
        }
    });
}

/* ── SHAKE ANIMATION ─────────────────────────────────────── */
function injectShakeStyle() {
    var style = document.createElement('style');
    style.textContent = [
        '@keyframes shake {',
        '  0%,100%{transform:translateX(0)}',
        '  20%{transform:translateX(-6px)}',
        '  40%{transform:translateX(6px)}',
        '  60%{transform:translateX(-4px)}',
        '  80%{transform:translateX(4px)}',
        '}',
        '.shake { animation: shake .5s var(--ease) both; }'
    ].join('');
    document.head.appendChild(style);
}

/* ── CARD HOVER (catalogo) ───────────────────────────────── */
function initCardHover() {
    var hasMouse = window.matchMedia('(pointer: fine)').matches;
    if (!hasMouse) return;

    document.querySelectorAll('.fs-card:not(.fs-card--soon)').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            var dx   = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
            var dy   = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
            card.style.transform  = 'perspective(900px) rotateX(' + (-dy * 4) + 'deg) rotateY(' + (dx * 4) + 'deg) translateY(-6px)';
            card.style.transition = 'transform .1s ease';
        });
        card.addEventListener('mouseleave', function () {
            card.style.transform  = '';
            card.style.transition = 'transform .5s var(--ease)';
        });
    });
}

/* ── STICKY SCROLL (pagina font) ─────────────────────────── */
function initStickyLicenseCTA() {
    var strip = document.querySelector('.fd-back-strip');
    if (!strip) return;

    var licSection = document.getElementById('licenze');
    if (!licSection) return;

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            strip.style.opacity = entry.isIntersecting ? '1' : '0.5';
        });
    }, { threshold: 0.1 });

    observer.observe(licSection);
}

ready(function () {
    injectShakeStyle();
    initCheckoutModal();
    initFontTester();
    initCardHover();
    initStickyLicenseCTA();

    console.log('%c✦ fontshop.js caricato', 'color:#0071E3;font-weight:600;');
});

    document.addEventListener('DOMContentLoaded', () => {
        const carousel = document.getElementById('fontCarousel');
        const btnPrev = document.querySelector('.fs-carousel-btn.prev');
        const btnNext = document.querySelector('.fs-carousel-btn.next');

        if(carousel && btnPrev && btnNext) {
            btnNext.addEventListener('click', () => {
                // Scorre esattamente della larghezza di un'immagine
                carousel.scrollBy({ left: carousel.offsetWidth, behavior: 'smooth' });
            });
            btnPrev.addEventListener('click', () => {
                carousel.scrollBy({ left: -carousel.offsetWidth, behavior: 'smooth' });
            });
        }
    });