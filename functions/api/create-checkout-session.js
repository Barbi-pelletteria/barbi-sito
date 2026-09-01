// Cloudflare Pages Function: crea una Stripe Checkout Session in modalità
// TEST e restituisce l'URL a cui reindirizzare il browser del cliente.
// Equivalente a netlify/functions/create-checkout-session.js (tenuta al suo
// posto finché questa migrazione non è confermata) — stessa logica, sintassi
// diversa perché qui gira su Cloudflare Workers (Request/Response del Fetch
// standard, env al posto di process.env), non su Node.
// La chiave segreta Stripe vive SOLO nelle variabili d'ambiente del progetto
// Cloudflare Pages, mai nel codice.

import Stripe from 'stripe';

const jsonResponse = (data, status) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequestPost({ request, env }) {
  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return jsonResponse(
      {
        error:
          'STRIPE_SECRET_KEY non configurata su Cloudflare Pages. Settings → Environment variables → aggiungi STRIPE_SECRET_KEY (chiave che inizia con sk_test_).',
      },
      500
    );
  }
  if (!stripeSecretKey.startsWith('sk_test_')) {
    return jsonResponse(
      {
        error:
          'La chiave Stripe configurata non è una chiave di TEST (deve iniziare con sk_test_). Per questo pacchetto non si usano mai chiavi live.',
      },
      500
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Corpo della richiesta non valido.' }, 400);
  }

  const { items, siteUrl, consensoMarketing } = body;
  if (!Array.isArray(items) || items.length === 0) {
    return jsonResponse({ error: 'Carrello vuoto.' }, 400);
  }

  try {
    // httpClient esplicito: Cloudflare Workers non ha i moduli http/https di
    // Node, solo fetch. La build "workerd" del pacchetto stripe (vedi
    // exports map di node_modules/stripe/package.json) lo farebbe anche da
    // sola quando Cloudflare la bundla, ma dichiararlo qui non dipende da
    // quella risoluzione automatica.
    const stripe = new Stripe(stripeSecretKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });
    const origin = siteUrl || new URL(request.url).origin;

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

    return jsonResponse({ url: session.url }, 200);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
