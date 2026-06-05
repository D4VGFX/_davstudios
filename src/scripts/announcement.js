/* ═══════════════════════════════════════════════════════════
   announcement.js
   Barra promozionale animata sotto la navbar.
   Standalone — importabile in qualsiasi pagina Astro.

   UTILIZZO:
     import '../scripts/announcement.js';
     oppure
     <script src="/scripts/announcement.js"></script>

   PERSONALIZZAZIONE:
     - Cambia MESSAGES per aggiornare il testo
     - Cambia BG_COLOR e TEXT_COLOR per i colori
     - Cambia SPEED per la velocità dello scroll
     - Cambia LINK per il link al click (null = nessun link)
═══════════════════════════════════════════════════════════ */

(function () {

    /* ── CONFIGURAZIONE ──────────────────────────────────── */
    var MESSAGES  = [
        '✦ NUOVA SEZIONE FONTSHOP',
        '✦ FONT ORIGINALI CON LICENZA',
        '✦ CONSEGNA IMMEDIATA VIA EMAIL',
        '✦ NUOVA SEZIONE FONTSHOP',
        '✦ FONT ORIGINALI CON LICENZA',
        '✦ CONSEGNA IMMEDIATA VIA EMAIL',
    ];
    var BG_COLOR   = '#0071E3';   /* colore sfondo — accent del sito */
    var TEXT_COLOR = '#F5F5F7';   /* colore testo */
    var SPEED      = 40;          /* px al secondo — più alto = più veloce */
    var LINK       = '/fontshop'; /* URL al click — null per disabilitare */
    var BAR_ID     = 'announcement-bar';
    /* ─────────────────────────────────────────────────────── */

    function ready(cb) {
        if (document.readyState !== 'loading') cb();
        else document.addEventListener('DOMContentLoaded', cb);
    }

    function buildBar() {
        /* Evita duplicati se lo script viene caricato più volte */
        if (document.getElementById(BAR_ID)) return;

        /* ── Inject CSS ─────────────────────────────────── */
        var style = document.createElement('style');
        style.textContent = [
            '#' + BAR_ID + ' {',
            '  position: sticky;',
            '  top: 60px;',              /* si posiziona subito sotto la navbar (altezza ~60px) */
            '  left: 0;',
            '  right: 0;',
            '  z-index: 90;',           /* sotto la navbar (z-index 999) ma sopra tutto il resto */
            '  background: ' + BG_COLOR + ';',
            '  overflow: hidden;',
            '  height: 36px;',
            '  display: flex;',
            '  align-items: center;',
            '  cursor: ' + (LINK ? 'pointer' : 'default') + ';',
            '  user-select: none;',
            '  -webkit-user-select: none;',
            '}',

            '#' + BAR_ID + '__track {',
            '  display: flex;',
            '  align-items: center;',
            '  white-space: nowrap;',
            '  will-change: transform;',
            '}',

            '#' + BAR_ID + '__track span {',
            '  font-family: "Plus Jakarta Sans", -apple-system, sans-serif;',
            '  font-size: 11px;',
            '  font-weight: 700;',
            '  letter-spacing: 2.5px;',
            '  text-transform: uppercase;',
            '  color: ' + TEXT_COLOR + ';',
            '  padding: 0 40px;',
            '  opacity: .9;',
            '}',

            /* Fade sui bordi */
            '#' + BAR_ID + '::before,',
            '#' + BAR_ID + '::after {',
            '  content: "";',
            '  position: absolute;',
            '  top: 0; bottom: 0;',
            '  width: 60px;',
            '  z-index: 2;',
            '  pointer-events: none;',
            '}',
            '#' + BAR_ID + '::before {',
            '  left: 0;',
            '  background: linear-gradient(to right, ' + BG_COLOR + ', transparent);',
            '}',
            '#' + BAR_ID + '::after {',
            '  right: 0;',
            '  background: linear-gradient(to left, ' + BG_COLOR + ', transparent);',
            '}',

            /* Hover leggero */
            '#' + BAR_ID + ':hover #' + BAR_ID + '__track span {',
            '  opacity: 1;',
            '}',
        ].join('\n');
        document.head.appendChild(style);

        /* ── Costruisci il DOM ──────────────────────────── */
        var bar   = document.createElement('div');
        bar.id    = BAR_ID;
        bar.setAttribute('role', 'marquee');
        bar.setAttribute('aria-label', 'Annuncio: Nuova sezione FontShop');

        var track = document.createElement('div');
        track.id  = BAR_ID + '__track';

        /* Raddoppia i messaggi per il loop continuo */
        var allMessages = MESSAGES.concat(MESSAGES);
        allMessages.forEach(function (msg) {
            var span       = document.createElement('span');
            span.textContent = msg;
            track.appendChild(span);
        });

        bar.appendChild(track);

        /* Click → link */
        if (LINK) {
            bar.addEventListener('click', function () {
                window.location.href = LINK;
            });
        }

        /* ── Inserisci dopo la navbar ───────────────────── */
        var navbar = document.querySelector('.navbar');
        if (navbar && navbar.parentNode) {
            navbar.parentNode.insertBefore(bar, navbar.nextSibling);
        } else {
            /* Fallback: inserisci come primo figlio del body */
            document.body.insertBefore(bar, document.body.firstChild);
        }

        /* ── Animazione ticker ──────────────────────────── */
        var trackWidth  = 0;
        var halfWidth   = 0;
        var offset      = 0;
        var lastTime    = null;
        var paused      = false;

        function measure() {
            trackWidth = track.scrollWidth;
            halfWidth  = trackWidth / 2;
        }

        function tick(timestamp) {
            if (!lastTime) lastTime = timestamp;
            var delta = timestamp - lastTime;
            lastTime  = timestamp;

            if (!paused) {
                offset += (SPEED * delta) / 1000;
                /* Reset seamless quando supera la metà */
                if (offset >= halfWidth) offset -= halfWidth;
                track.style.transform = 'translateX(-' + offset + 'px)';
            }

            requestAnimationFrame(tick);
        }

        /* Pausa on hover */
        bar.addEventListener('mouseenter', function () { paused = true; });
        bar.addEventListener('mouseleave', function () { paused = false; });

        /* Pausa quando la pagina non è visibile */
        document.addEventListener('visibilitychange', function () {
            paused = document.hidden;
            if (!paused) lastTime = null; /* reset per evitare salti */
        });

        /* Avvia */
        window.addEventListener('load', function () {
            measure();
            requestAnimationFrame(tick);
        });

        /* Ricalcola se la finestra viene ridimensionata */
        window.addEventListener('resize', measure, { passive: true });
    }

    ready(buildBar);

})();