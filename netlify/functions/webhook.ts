// netlify/functions/webhook.ts
// Riceve eventi da Stripe (checkout.session.completed),
// legge il file .zip del font dal filesystem,
// e lo invia via email al cliente tramite Resend.
//
// ─── VARIABILI D'AMBIENTE ─────────────────────────────────────────────────────────
//   STRIPE_SECRET_KEY       → sk_live_...
//   STRIPE_WEBHOOK_SECRET   → whsec_...
//   RESEND_API_KEY          → re_...
//   FROM_EMAIL              → info@davstudios.it
//   SITE_URL                → https://davstudios.it
// ─────────────────────────────────────────────────────────────────────────────────

import Stripe from 'stripe';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import type { Handler } from '@netlify/functions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
});

const resend = new Resend(process.env.RESEND_API_KEY!);

// ─── CATALOGO FONT ────────────────────────────────────────────────────────────────
// Per ogni font definisci:
//   - files: percorso dei file ZIP (relativi alla root del repo)
//   - prices: prezzi formattati per il riepilogo nell'email
//
// ─── STRUTTURA FILE ZIP NEL REPO ─────────────────────────────────────────────────
//   fonts/
//   └── alexandria/
//       ├── Alexandria-Personal.zip
//       ├── Alexandria-Commercial.zip
//       ├── Alexandria-Extended.zip
//       ├── Alexandria-SaaS.zip
//       ├── Alexandria-Broadcast.zip
//       └── Alexandria-Enterprise.zip
// ─────────────────────────────────────────────────────────────────────────────────
const FONT_CATALOG: Record<string, {
    files: Record<string, string>;
    prices: Record<string, string>;
}> = {

    'alexandria': {
        files: {
            personal:   'fonts/alexandria/Alexandria-Personal.zip',
            commercial: 'fonts/alexandria/Alexandria-Commercial.zip',
            extended:   'fonts/alexandria/Alexandria-Extended.zip',
            saas:       'fonts/alexandria/Alexandria-SaaS.zip',
            broadcast:  'fonts/alexandria/Alexandria-Broadcast.zip',
            enterprise: 'fonts/alexandria/Alexandria-Enterprise.zip',
        },
        prices: {
            personal:   '€19,99',
            commercial: '€49,99',
            extended:   '€89,99',
            saas:       '€199,99',
            broadcast:  '€249,99',
            enterprise: '€499,99',
        },
    },

    'nexora-sans': {
        files: {
            personal:   'fonts/nexora-sans/NexoraSans-Personal.zip',
            commercial: 'fonts/nexora-sans/NexoraSans-Commercial.zip',
            extended:   'fonts/nexora-sans/NexoraSans-Extended.zip',
            saas:       'fonts/nexora-sans/NexoraSans-SaaS.zip',
            broadcast:  'fonts/nexora-sans/NexoraSans-Broadcast.zip',
            enterprise: 'fonts/nexora-sans/NexoraSans-Enterprise.zip',
        },
        prices: {
            personal:   '€24,99',
            commercial: '€59,99',
            extended:   '€109,99',
            saas:       '€249,99',
            broadcast:  '€299,99',
            enterprise: '€599,99',
        },
    },

};

const LICENSE_NAMES: Record<string, string> = {
    personal:   'Personal',
    commercial: 'Commercial',
    extended:   'Extended',
    saas:       'SaaS / App',
    broadcast:  'Broadcast',
    enterprise: 'Enterprise',
};

export const handler: Handler = async (event) => {

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    const sig  = event.headers['stripe-signature'];
    const body = event.body;

    if (!sig || !body) {
        return { statusCode: 400, body: 'Missing signature or body' };
    }

    let stripeEvent: Stripe.Event;
    try {
        stripeEvent = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err);
        return { statusCode: 400, body: 'Webhook Error: Invalid signature' };
    }

    if (stripeEvent.type !== 'checkout.session.completed') {
        console.log(`ℹ️ Evento ignorato: ${stripeEvent.type}`);
        return { statusCode: 200, body: 'Event ignored' };
    }

    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    const meta    = session.metadata || {};

    const font         = meta.font;
    const license      = meta.license;
    const buyerName    = meta.buyer_name    || 'Cliente';
    const buyerEmail   = meta.buyer_email   || session.customer_email || '';
    const buyerCompany = meta.buyer_company || '';

    if (!font || !license || !buyerEmail) {
        console.error('❌ Metadata mancanti nella sessione:', meta);
        return { statusCode: 400, body: 'Metadata mancanti' };
    }

    // Recupera il font dal catalogo
    const fontEntry = FONT_CATALOG[font];
    if (!fontEntry) {
        console.error(`❌ Font non trovato nel catalogo: ${font}`);
        return { statusCode: 404, body: 'Font non trovato nel catalogo' };
    }

    const zipRelPath = fontEntry.files[license];
    if (!zipRelPath) {
        console.error(`❌ File non trovato per font=${font} license=${license}`);
        return { statusCode: 404, body: 'Font file not found in map' };
    }

    const zipAbsPath = path.join(process.cwd(), zipRelPath);

    let zipBuffer: Buffer;
    try {
        zipBuffer = fs.readFileSync(zipAbsPath);
    } catch (err) {
        console.error(`❌ Errore lettura file: ${zipAbsPath}`, err);
        return { statusCode: 500, body: 'Errore lettura file font' };
    }

    const fontDisplayName    = font.charAt(0).toUpperCase() + font.slice(1);
    const licenseDisplayName = LICENSE_NAMES[license]  || license;
    const licensePrice       = fontEntry.prices[license] || '';
    const zipFileName        = `${fontDisplayName}-${licenseDisplayName.replace(/\s*\/\s*/g, '-')}.zip`;

    const emailHtml = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Il tuo font è pronto — David (FontShop by _davstudios)</title>
</head>
<body style="margin:0;padding:0;background:#FBFBFD;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBFBFD;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:24px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,.08);">

          <tr>
            <td style="background:#1D1D1F;padding:40px 44px 36px;text-align:center;">
              <p style="margin:0 0 24px;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.3);">
                David · (FontShop by _davstudios)
              </p>
              <h1 style="margin:0 0 8px;font-size:56px;font-weight:700;letter-spacing:-2.5px;color:#ffffff;line-height:1;">
                ${fontDisplayName}
              </h1>
              <p style="margin:0;">
                <span style="display:inline-block;background:rgba(0,113,227,.25);border:1px solid rgba(0,113,227,.4);border-radius:100px;padding:5px 16px;font-size:12px;font-weight:600;letter-spacing:.5px;color:#60a5fa;">
                  Licenza ${licenseDisplayName}
                </span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:linear-gradient(90deg,#0071E3 0%,#34aadc 100%);height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td style="background:#ffffff;padding:40px 44px 32px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#AEAEB2;">Ciao</p>
              <p style="margin:0 0 28px;font-size:26px;font-weight:700;letter-spacing:-.5px;color:#1D1D1F;line-height:1.2;">
                ${buyerName}${buyerCompany ? `<br><span style="font-size:15px;font-weight:400;color:#6E6E73;">${buyerCompany}</span>` : ''} 👋
              </p>
              <p style="margin:0 0 14px;font-size:16px;font-weight:300;color:#6E6E73;line-height:1.8;">
                Grazie per il tuo acquisto! Il font <strong style="color:#1D1D1F;font-weight:600;">${fontDisplayName}</strong> con licenza <strong style="color:#1D1D1F;font-weight:600;">${licenseDisplayName}</strong> è allegato a questa email come file <strong style="color:#1D1D1F;font-weight:600;">.zip</strong>.
              </p>
              <p style="margin:0 0 32px;font-size:16px;font-weight:300;color:#6E6E73;line-height:1.8;">
                All'interno trovi i file in formato <strong style="color:#1D1D1F;font-weight:600;">OTF, TTF, WOFF2 e WOFF</strong>, più il <strong style="color:#1D1D1F;font-weight:600;">PDF della licenza</strong> firmato digitalmente.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;border-radius:16px;margin-bottom:24px;overflow:hidden;">
                <tr><td style="padding:20px 24px 6px;">
                  <p style="margin:0 0 14px;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#AEAEB2;">Riepilogo ordine</p>
                </td></tr>
                <tr><td style="padding:0 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:13px;font-weight:400;color:#6E6E73;padding:9px 0;border-bottom:1px solid rgba(0,0,0,.05);">Font</td>
                      <td style="font-size:13px;font-weight:600;color:#1D1D1F;text-align:right;padding:9px 0;border-bottom:1px solid rgba(0,0,0,.05);">${fontDisplayName}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;font-weight:400;color:#6E6E73;padding:9px 0;border-bottom:1px solid rgba(0,0,0,.05);">Licenza</td>
                      <td style="font-size:13px;font-weight:600;color:#1D1D1F;text-align:right;padding:9px 0;border-bottom:1px solid rgba(0,0,0,.05);">${licenseDisplayName}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;font-weight:400;color:#6E6E73;padding:9px 0;border-bottom:1px solid rgba(0,0,0,.05);">Email</td>
                      <td style="font-size:13px;font-weight:600;color:#1D1D1F;text-align:right;padding:9px 0;border-bottom:1px solid rgba(0,0,0,.05);">${buyerEmail}</td>
                    </tr>
                    <tr>
                      <td style="font-size:15px;font-weight:700;color:#1D1D1F;padding:12px 0 20px;">Totale pagato</td>
                      <td style="font-size:15px;font-weight:700;color:#0071E3;text-align:right;padding:12px 0 20px;">${licensePrice}</td>
                    </tr>
                  </table>
                </td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,113,227,.04);border:1px solid rgba(0,113,227,.14);border-left:3px solid #0071E3;border-radius:0 12px 12px 0;margin-bottom:32px;">
                <tr><td style="padding:14px 18px;">
                  <p style="margin:0;font-size:13px;font-weight:300;color:#1D1D1F;line-height:1.7;">
                    💡 <strong style="font-weight:600;">Conserva questa email</strong> — contiene la tua prova d'acquisto. Il PDF della licenza allegato allo zip definisce i termini d'uso del font.
                  </p>
                </td></tr>
              </table>

              <p style="margin:0;font-size:14px;font-weight:300;color:#6E6E73;line-height:1.75;">
                Per domande o upgrade di licenza, rispondi a questa email oppure scrivimi su <a href="https://davstudios.it/contattami" style="color:#0071E3;text-decoration:none;font-weight:500;">davstudios.it/contattami</a>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#F5F5F7;padding:24px 44px;border-top:1px solid rgba(0,0,0,.05);text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:-.3px;color:#1D1D1F;">_davstudios</p>
              <p style="margin:0 0 12px;font-size:11px;font-weight:300;color:#AEAEB2;line-height:1.6;">Design & Sviluppo Web · Fasano, Puglia</p>
              <p style="margin:0;font-size:11px;color:#AEAEB2;">
                <a href="https://davstudios.it/fontshop" style="color:#0071E3;text-decoration:none;font-weight:500;">FontShop</a>
                &nbsp;·&nbsp;
                <a href="https://davstudios.it" style="color:#AEAEB2;text-decoration:none;">davstudios.it</a>
                &nbsp;·&nbsp;
                <a href="https://davstudios.it/privacy-policy" style="color:#AEAEB2;text-decoration:none;">Privacy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;

    try {
        const { data, error } = await resend.emails.send({
            from:    `David (FontShop by _davstudios) <${process.env.FROM_EMAIL || 'info@davstudios.it'}>`,
            to:      buyerEmail,
            subject: `${fontDisplayName} — Licenza ${licenseDisplayName} | FontShop by _davstudios`,
            html:    emailHtml,
            attachments: [{
                filename: zipFileName,
                content:  zipBuffer.toString('base64'),
            }],
        });

        if (error) {
            console.error('❌ Resend error:', error);
            return { statusCode: 500, body: JSON.stringify({ error: 'Errore invio email', detail: error }) };
        }

        console.log(`✅ Email inviata a ${buyerEmail} — ${fontDisplayName} ${licenseDisplayName} (ID: ${data?.id})`);
        return { statusCode: 200, body: JSON.stringify({ success: true, emailId: data?.id }) };

    } catch (err) {
        console.error('❌ Errore imprevisto Resend:', err);
        return { statusCode: 500, body: JSON.stringify({ error: "Errore imprevisto durante l'invio email" }) };
    }
};