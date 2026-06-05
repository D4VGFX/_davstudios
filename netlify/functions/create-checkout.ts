// netlify/functions/create-checkout.ts
// Crea una Stripe Checkout Session e restituisce l'URL di pagamento.
//
// ─── VARIABILI D'AMBIENTE ─────────────────────────────────────────────────────────
//   STRIPE_SECRET_KEY      → sk_live_... (oppure sk_test_... per i test)
//   SITE_URL               → https://davstudios.it
// ─────────────────────────────────────────────────────────────────────────────────

import Stripe from 'stripe';
import type { Handler } from '@netlify/functions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
});

// ─── CATALOGO FONT ────────────────────────────────────────────────────────────────
// Per ogni font definisci:
//   - prices: prezzi attesi (validazione anti-manomissione lato client)
//   - priceIds: Price ID di Stripe (uno per ogni licenza)
//
// Come aggiungere un nuovo font:
//   1. Crea i 6 prodotti su Stripe Dashboard con i tuoi prezzi
//   2. Copia i Price ID (price_xxx) qui sotto
//   3. Inserisci gli stessi prezzi in LICENSE_PRICES nel webhook.ts
// ─────────────────────────────────────────────────────────────────────────────────
const FONT_CATALOG: Record<string, {
    prices: Record<string, number>;
    priceIds: Record<string, string>;
}> = {

    'alexandria': {
        prices: {
            personal:   19.99,
            commercial: 49.99,
            extended:   89.99,
            saas:       199.99,
            broadcast:  249.99,
            enterprise: 499.99,
        },
        priceIds: {
            personal:   'price_1TdZO6Drv9xxc9DMkBOjI9Z4',
            commercial: 'price_1TdZarDrv9xxc9DMbaa44bht',
            extended:   'price_1TdZsCDrv9xxc9DMeh1pFgXq',
            saas:       'price_1TdZxgDrv9xxc9DM18eEJiv5',
            broadcast:  'price_1Tda1pDrv9xxc9DMb8WdmLUC',
            enterprise: 'price_1TdbmJDrv9xxc9DMUPXObhpL',
        },
    },

    'nexora-sans': {
        prices: {
            personal:   24.99,
            commercial: 59.99,
            extended:   109.99,
            saas:       249.99,
            broadcast:  299.99,
            enterprise: 599.99,
        },
        priceIds: {
            personal:   'price_1Te9pfDrv9xxc9DMVQUt7umz',
            commercial: 'price_1TeA4QDrv9xxc9DMRepiGViS',
            extended:   'price_1TeA7PDrv9xxc9DMF2B8AtJT',
            saas:       'price_1TeADsDrv9xxc9DM33LcNk8P',
            broadcast:  'price_1TeA0SDrv9xxc9DMk4JFibuI',
            enterprise: 'price_1TeAALDrv9xxc9DMmNTsUzY8',
        },
    },

};

export const handler: Handler = async (event) => {

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    let body: {
        font: string;
        license: string;
        price: number;
        name: string;
        email: string;
        company?: string;
    };

    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'JSON non valido' }),
        };
    }

    const { font, license, price, name, email, company } = body;

    // Validazione campi obbligatori
    if (!font || !license || !name || !email || !price) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Campi obbligatori mancanti' }),
        };
    }

    // Validazione email
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Indirizzo email non valido' }),
        };
    }

    // Recupera il font dal catalogo
    const fontEntry = FONT_CATALOG[font];
    if (!fontEntry) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Font non trovato nel catalogo' }),
        };
    }

    // Validazione prezzo per quel font specifico (anti-manomissione)
    const expectedPrice = fontEntry.prices[license];
    if (!expectedPrice || price !== expectedPrice) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Prezzo non valido' }),
        };
    }

    // Recupera il Price ID Stripe per quel font + licenza
    const priceId = fontEntry.priceIds[license];
    if (!priceId) {
        console.error(`Price ID non configurato per font=${font} license=${license}`);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Prodotto non disponibile. Riprova più tardi.' }),
        };
    }

    const siteUrl = process.env.SITE_URL || 'https://davstudios.it';

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [{ price: priceId, quantity: 1 }],
            metadata: {
                font,
                license,
                buyer_name:    name,
                buyer_email:   email,
                buyer_company: company || '',
            },
            success_url: `${siteUrl}/fontshop/grazie?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url:  `${siteUrl}/fontshop/${font}#licenze`,
            locale: 'it',
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: session.url }),
        };

    } catch (err: unknown) {
        console.error('Stripe checkout error:', err);
        const message = err instanceof Error ? err.message : 'Errore durante la creazione del pagamento';
        return {
            statusCode: 500,
            body: JSON.stringify({ error: message }),
        };
    }
};