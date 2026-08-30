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

  const { items, siteUrl, consensoMarketing } = body;
  if (!Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Carrello vuoto.' }) };
  }

  try {
    const stripe = Stripe(stripeSecretKey);
    const origin = siteUrl || process.env.URL || 'http://localhost:8888';

    // Prezzo unitario = prezzo del prodotto + eventuale sovrapprezzo iniziali.
    // Il totale è sempre ricalcolato qui dai singoli importi, non fidandosi di
    // un totale mandato dal client.
    const unitAmount = (it) =>
      (it.prezzoCentesimi || 0) + (it.iniziali ? it.inizialiCentesimi || 0 : 0);

    // Nome leggibile nel dashboard/app Stripe di Stefano: il colore separato
    // da un trattino lungo, le iniziali fra parentesi se presenti. Da questo
    // testo, e da questo soltanto, Stefano capisce cosa preparare.
    const line_items = items.map((it) => {
      const nome = it.nome || it.slug;
      const conColore = it.colore ? `${nome} — ${it.colore}` : nome;
      const nomeCompleto = it.iniziali ? `${conColore} (iniziali: ${it.iniziali})` : conColore;
      return {
        price_data: {
          currency: 'eur',
          product_data: { name: nomeCompleto },
          unit_amount: unitAmount(it),
        },
        quantity: it.quantita,
      };
    });

    const totaleCentesimi = items.reduce(
      (somma, it) => somma + unitAmount(it) * it.quantita,
      0
    );

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      // Solo Italia per ora, coerente con DECISIONI.md D-006: l'estero si
      // valuta dopo. Senza questo campo Stripe non chiede un indirizzo e
      // Stefano non saprebbe dove spedire.
      shipping_address_collection: { allowed_countries: ['IT'] },
      // Consenso email marketing (offerte/promozioni), scelto nel checkout:
      // registrato qui, non in un database che non esiste — Stefano lo vede
      // nel dettaglio dell'ordine su Stripe. Le email sugli ordini non
      // dipendono da questo: quelle sono transazionali, non marketing.
      metadata: { consenso_marketing: consensoMarketing ? 'si' : 'no' },
      success_url: `${origin}/conferma-ordine?session_id={CHECKOUT_SESSION_ID}&value=${(totaleCentesimi / 100).toFixed(2)}&currency=EUR`,
      cancel_url: `${origin}/carrello`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
