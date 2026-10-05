// Cloudflare Pages Function: crea una Stripe Checkout Session in modalità
// TEST e restituisce l'URL a cui reindirizzare il browser del cliente.
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

    // Nome leggibile nel dashboard/app Stripe di Stefano:
    // "{Modello} — {Colore} — {Pelle}" (D-030 § 1.3.4), le iniziali fra
    // parentesi se presenti. Da questo testo, e dai metadata sotto, Stefano
    // capisce quale pezzo preparare — pelle compresa.
    const line_items = items.map((it) => {
      const nome = it.nome || it.slug;
      const conColore = [nome, it.colore, it.pelle].filter(Boolean).join(' — ');
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

    // Riepilogo compatto per le email post-acquisto (D-028 punto 2,
    // webhook-stripe.js): il webhook non ha altro modo di sapere
    // cosa è stato comprato — i line_items di Stripe contengono solo il
    // testo leggibile già costruito sopra, non i campi separati
    // (colore/iniziali) di cui l'email ha bisogno per un riepilogo
    // proprio. Chiavi corte per restare ben dentro al limite di 500
    // caratteri per valore di metadata imposto da Stripe.
    const riepilogoOrdine = items.map((it) => ({
      n: it.nome || it.slug,
      c: it.colore || '',
      l: it.pelle || '',
      i: it.iniziali || '',
      p: unitAmount(it),
      q: it.quantita,
    }));

    // D-030 § 1.3.4: modello, colore, pelle e iniziali anche come metadata
    // leggibili nella Dashboard. Con più articoli i valori sono separati da
    // " | ", nello stesso ordine delle righe (limite Stripe: 500 caratteri
    // per valore).
    const perArticolo = (f) => items.map(f).join(' | ').slice(0, 500);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Solo 'card', di proposito. In Stripe Checkout Apple Pay e Google Pay
      // viaggiano dentro 'card': compaiono da soli, sopra il modulo carta,
      // quando il dispositivo li supporta (Safari/iPhone con una carta in
      // Wallet; Chrome con un account Google e una carta salvata) e la
      // configurazione dei metodi di pagamento di Stripe li ha accesi.
      // Verificato il 05/10/2026 (D-029 Parte 5): in modalità TEST Apple Pay
      // era già acceso e Google Pay è stato acceso via API; la configurazione
      // LIVE è un oggetto separato e si rivede al go-live (D-014).
      // automatic_payment_methods non si usa: aprirebbe anche Klarna, PayPal,
      // bonifico e altri metodi mai decisi (la casella 'Salva le mie
      // informazioni' di Link compare comunque: fa parte del modulo carta).
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
      metadata: {
        consenso_marketing: consensoMarketing ? 'si' : 'no',
        riepilogo_ordine: JSON.stringify(riepilogoOrdine),
        modello: perArticolo((it) => it.nome || it.slug),
        colore: perArticolo((it) => it.colore || ''),
        pelle: perArticolo((it) => it.pelle || ''),
        iniziali: perArticolo((it) => it.iniziali || ''),
      },
      // Gli stessi quattro campi anche sul pagamento (PaymentIntent): nella
      // Dashboard di Stripe la pagina del pagamento mostra i metadata del
      // PaymentIntent, non quelli della sessione — è lì che Stefano legge
      // cosa spedire. Provato in sandbox (D-030 Parte 5.3).
      payment_intent_data: {
        metadata: {
          modello: perArticolo((it) => it.nome || it.slug),
          colore: perArticolo((it) => it.colore || ''),
          pelle: perArticolo((it) => it.pelle || ''),
          iniziali: perArticolo((it) => it.iniziali || ''),
        },
      },
      success_url: `${origin}/conferma-ordine?session_id={CHECKOUT_SESSION_ID}&value=${(totaleCentesimi / 100).toFixed(2)}&currency=EUR`,
      cancel_url: `${origin}/carrello`,
    });

    return jsonResponse({ url: session.url }, 200);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
