// Cloudflare Pages Function: webhook Stripe per il pagamento andato a buon
// fine — il "segnale vero" da cui parte la sequenza di email post-acquisto
// (D-028 punto 2, D-010 Parte 3 del manuale, mai eseguita finora: il
// manuale la descriveva su Netlify, adattata qui a Cloudflare Pages
// Functions). Riceve l'evento, verifica che sia davvero Stripe a mandarlo
// (firma), e spedisce UN SOLO evento custom a Brevo — è l'automazione di
// Brevo stessa (configurata sul suo pannello, non qui) a occuparsi di
// mandare l'email 1 subito e l'email 2 dopo un ritardo: "i ritardi si
// configurano visivamente, senza altro codice" (manuale, Parte 3).
//
// Sequenza onesta (C-09 in CORREZIONI.md — vietate fasi di produzione
// finte): questa funzione non inventa nessun evento, riporta solo dati
// reali dell'ordine appena pagato.
//
// Niente idempotenza/deduplica: richiederebbe uno storage persistente
// (Cloudflare KV o simile), contro "niente database" già scelto per tutto
// il resto del sito. Nel raro caso di una ri-consegna dello stesso evento
// da parte di Stripe, il rischio accettato è una mail 1 doppia — non un
// danno per il cliente, non giustifica l'infrastruttura in più per un
// volume di 2 modelli e poche decine di ordini a settimana a regime.

import Stripe from 'stripe';

function formatEuro(centesimi) {
  return (centesimi / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

// Testo semplice, una riga per articolo — pensato per un merge tag di
// testo dentro l'email Brevo, non per essere ri-elaborato lì.
function formattaRiepilogo(righe) {
  return righe
    .map((r) => {
      const colore = r.c ? ` — ${r.c}` : '';
      const iniziali = r.i ? ` (iniziali: ${r.i})` : '';
      const quantita = r.q > 1 ? ` × ${r.q}` : '';
      return `${r.n}${colore}${iniziali}${quantita}: ${formatEuro(r.p * r.q)}`;
    })
    .join('\n');
}

export async function onRequestPost({ request, env }) {
  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  const brevoApiKey = env.BREVO_API_KEY;

  // Risponde a Stripe, non a un umano: qui conta solo lo status. 500 (non
  // 200) se manca la configurazione — Stripe ritenta più tardi da solo,
  // invece di perdere per sempre un evento arrivato durante il setup.
  if (!stripeSecretKey || !webhookSecret || !brevoApiKey) {
    return new Response('Configurazione mancante (STRIPE_WEBHOOK_SECRET o BREVO_API_KEY)', { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  const rawBody = await request.text();

  const stripe = new Stripe(stripeSecretKey, { httpClient: Stripe.createFetchHttpClient() });

  let event;
  try {
    // Async, non constructEvent: Cloudflare Workers non ha il modulo
    // crypto di Node, solo SubtleCrypto — la stessa ragione per cui
    // create-checkout-session.js dichiara l'httpClient esplicito.
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    // 400, non 500: firma non valida non si risolve ritentando.
    return new Response(`Firma non valida: ${err.message}`, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('ok', { status: 200 });
  }

  const session = event.data.object;
  if (session.payment_status !== 'paid') {
    return new Response('ok', { status: 200 });
  }

  const email = session.customer_details?.email;
  if (!email) {
    return new Response('ok', { status: 200 });
  }

  let righe = [];
  try {
    righe = JSON.parse(session.metadata?.riepilogo_ordine || '[]');
  } catch {
    righe = [];
  }

  const nomeCompleto = session.customer_details?.name || '';
  const primoNome = nomeCompleto.split(' ')[0] || '';

  try {
    const risposta = await fetch('https://api.brevo.com/v3/events', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_name: 'ordine_pagato',
        identifiers: { email_id: email },
        // Attributi sul contatto: usabili come merge tag nei modelli email
        // Brevo (es. {{ contact.ORDINE_RIEPILOGO }}) — devono esistere come
        // attributi personalizzati sul pannello Brevo prima di poterli
        // usare in un modello (vedi SETUP.md).
        contact_properties: {
          FIRSTNAME: primoNome,
          ORDINE_RIEPILOGO: formattaRiepilogo(righe),
          ORDINE_TOTALE: formatEuro(session.amount_total || 0),
          ORDINE_ID: session.id,
          // Usato dal modello email 2 per scegliere il testo giusto
          // (manuale, Parte 3): "si" solo se almeno un articolo ha le
          // iniziali, mai un valore inventato.
          ORDINE_HA_INIZIALI: righe.some((r) => r.i) ? 'si' : 'no',
        },
      }),
    });

    if (!risposta.ok) {
      const testoErrore = await risposta.text();
      // 500: segnale a Stripe di ritentare — Brevo potrebbe essere
      // temporaneamente irraggiungibile, non è detto sia un errore permanente.
      return new Response(`Brevo ha rifiutato l'evento (${risposta.status}): ${testoErrore}`, { status: 500 });
    }
  } catch (err) {
    return new Response(`Errore di rete verso Brevo: ${err.message}`, { status: 500 });
  }

  return new Response('ok', { status: 200 });
}
