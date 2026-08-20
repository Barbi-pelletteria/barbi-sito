// Funzione serverless Netlify: crea una Stripe Checkout Session in modalità
// TEST e restituisce l'URL a cui reindirizzare il browser del cliente.
// La chiave segreta Stripe vive SOLO qui (variabile d'ambiente su Netlify),
// mai nel codice lato client — vedi SETUP.md per come impostarla.

const Stripe = require('stripe');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Metodo non consentito.' }) };
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          'STRIPE_SECRET_KEY non configurata su Netlify. Site settings → Environment variables → aggiungi STRIPE_SECRET_KEY (chiave che inizia con sk_test_). Vedi SETUP.md, passo B2.',
      }),
    };
  }
  if (!stripeSecretKey.startsWith('sk_test_')) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          'La chiave Stripe configurata non è una chiave di TEST (deve iniziare con sk_test_). Per questo pacchetto non si usano mai chiavi live — vedi NON FARE nel pacchetto di setup.',
      }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Corpo della richiesta non valido.' }) };
  }

  const { items, siteUrl } = body;
  if (!Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Carrello vuoto.' }) };
  }

  try {
    const stripe = Stripe(stripeSecretKey);
    const origin = siteUrl || process.env.URL || 'http://localhost:8888';

    // NOTA: prezzoTestCentesimi è un valore tecnico di collaudo (vedi
    // src/data/prodotti.js), non un prezzo reale. Ogni riga usa quel valore
    // finché blocco 4 (DOMANDE_APERTURA.md) non porta il prezzo vero.
    const line_items = items.map((it) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: `Prodotto di collaudo — ${it.slug}` },
        unit_amount: it.prezzoTestCentesimi,
      },
      quantity: it.quantita,
    }));

    const totaleCentesimi = items.reduce(
      (somma, it) => somma + it.prezzoTestCentesimi * it.quantita,
      0
    );

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${origin}/conferma-ordine?session_id={CHECKOUT_SESSION_ID}&value=${(totaleCentesimi / 100).toFixed(2)}&currency=EUR`,
      cancel_url: `${origin}/carrello`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
