function ready(cb) {
    if (document.readyState !== 'loading') cb();
    else document.addEventListener('DOMContentLoaded', cb);
}

function initForm() {
    var form    = document.getElementById('contact-form');
    var success = document.getElementById('form-success');
    if (!form) return;

    
    function validateField(input) {
        var val   = input.value.trim();
        var field = input.closest('.field');
        if (!field) return true;

        var isRequired = input.hasAttribute('required');
        var isEmail    = input.type === 'email';
        var ok         = true;

        if (isRequired && !val) ok = false;
        if (isEmail && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) ok = false;

        field.classList.toggle('field--error', !ok);
        return ok;
    }

    
    form.querySelectorAll('input, textarea, select').forEach(function (el) {
        el.addEventListener('blur', function () { validateField(el); });
        el.addEventListener('input', function () {
            if (el.closest('.field--error')) validateField(el);
        });
    });

    
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var valid = true;
        form.querySelectorAll('input[required], textarea[required]').forEach(function (el) {
            if (!validateField(el)) valid = false;
        });

        if (!valid) {
            
            var btn = form.querySelector('.btn-submit');
            btn.classList.add('shake');
            setTimeout(function () { btn.classList.remove('shake'); }, 600);
            return;
        }

        
        var btn = form.querySelector('.btn-submit');
        btn.disabled = true;
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Invio in corso…';

        setTimeout(function () {
            form.style.opacity = '0';
            form.style.transition = 'opacity .3s ease';
            setTimeout(function () {
                form.style.display = 'none';
                success.classList.add('show');
            }, 300);
        }, 1400);
    });
}

function initCharCounter() {
    var textarea = document.getElementById('msg');
    var counter  = document.getElementById('msg-counter');
    if (!textarea || !counter) return;

    var max = parseInt(textarea.getAttribute('maxlength') || 1000);

    function update() {
        var len  = textarea.value.length;
        var left = max - len;
        counter.textContent = left + ' caratteri rimanenti';
        counter.style.color = left < 80 ? '#FF3B30' : '';
    }

    textarea.addEventListener('input', update);
    update();
}

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
        '.shake { animation: shake .5s var(--ease) both; }',
        '.field--error input, .field--error textarea, .field--error select {',
        '  border-color: #FF3B30 !important;',
        '  box-shadow: 0 0 0 3px rgba(255,59,48,.1) !important;',
        '}'
    ].join('');
    document.head.appendChild(style);
}

function initTimezone() {
    var el = document.getElementById('visitor-tz');
    if (!el) return;
    try {
        var tz   = Intl.DateTimeFormat().resolvedOptions().timeZone;
        var time = new Date().toLocaleTimeString('it-IT', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit'
        });
        el.textContent = 'Il tuo orario attuale: ' + time + ' (' + tz.replace('_', ' ') + ')';
    } catch (e) {}
}

ready(function () {
    injectShakeStyle();
    initForm();
    initCharCounter();
    initTimezone();

    console.log('%c✦ contattami.js caricato', 'color:#0071E3;font-weight:600;');
});