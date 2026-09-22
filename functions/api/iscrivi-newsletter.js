// Cloudflare Pages Function: iscrizione alla newsletter (footer e banner,
// stesso modulo riusato in due punti della pagina) tramite l'API Contacts
// di Brevo — non un invio email come invia-modulo.js, ma un'iscrizione a
// lista (D-026, chiude F-33).
//
// Double opt-in obbligatorio (vincolo GDPR non negoziabile, D-026): non si
// aggiunge il contatto subito. Si usa l'endpoint nativo
// doubleOptinConfirmation di Brevo, che manda una mail di conferma con un
// link firmato da Brevo stesso — il contatto entra in lista solo quando
// quel link viene cliccato. Nessun token o stato da gestire qui: lo fa
// Brevo, coerente con "niente database" già stabilito per il resto del sito.
//
// Risponde sempre con status 200 e un JSON {ok, errore?}, mai con un codice
// di errore HTTP: stessa ragione già trovata per invia-modulo.js (Cloudflare
// sostituisce le risposte 5xx dei Worker con una pagina generica propria).
// Il modulo è intercettato via fetch da Layout.astro, non naviga a una
// pagina a sé come i moduli di invia-modulo.js.

// Solo per il messaggio d'errore mostrato all'utente: il mittente vero
// dell'email di conferma è quello impostato dentro il modello Brevo
// (moduli@barbipelletteria.it, stesso indirizzo di invia-modulo.js) — questa
// chiamata API non lo specifica, non serve duplicarlo qui.
const EMAIL_CONTATTO = 'info.barbipelletteria@gmail.com';

// Lista "Newsletter sito" (#3) e modello email di conferma (#1), creati su
// Brevo il 22/09/2026. Non sono segreti, solo identificativi numerici: se
// cambiano, si aggiornano qui, stesso trattamento di EMAIL_MITTENTE sopra.
const LISTA_NEWSLETTER_ID = 3;
const TEMPLATE_CONFERMA_ID = 1;

const CAMPO_HONEYPOT = 'nl-azienda';

const rispostaJson = (corpo) =>
  new Response(JSON.stringify(corpo), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export async function onRequestPost({ request, env }) {
  const origin = new URL(request.url).origin;

  let dati;
  try {
    dati = await request.formData();
  } catch {
    return rispostaJson({ ok: false, errore: 'Modulo non leggibile.' });
  }

  // Honeypot: stesso principio di invia-modulo.js — se il campo trappola è
  // compilato, si finge successo senza iscrivere nessuno.
  if (dati.get(CAMPO_HONEYPOT)) {
    return rispostaJson({ ok: true });
  }

  const email = dati.get('email');
  if (!email) {
    return rispostaJson({ ok: false, errore: 'Manca l\'indirizzo email.' });
  }

  // Consenso: il checkbox required blocca già l'invio lato browser, questo
  // è un controllo in più lato server, non l'unico — vincolo GDPR non
  // negoziabile (D-026), non ci si affida solo al client.
  if (!dati.get('consenso')) {
    return rispostaJson({ ok: false, errore: 'Serve il consenso per iscriverti.' });
  }

  const apiKey = env.BREVO_API_KEY;
  if (!apiKey) {
    return rispostaJson({
      ok: false,
      errore: 'Servizio non ancora configurato (manca BREVO_API_KEY).',
    });
  }

  try {
    const risposta = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        includeListIds: [LISTA_NEWSLETTER_ID],
        templateId: TEMPLATE_CONFERMA_ID,
        redirectionUrl: `${origin}/newsletter-confermata/`,
      }),
    });

    if (!risposta.ok) {
      const testoErrore = await risposta.text();
      return rispostaJson({
        ok: false,
        errore: `Brevo ha rifiutato l'iscrizione (${risposta.status}). Scrivi a ${EMAIL_CONTATTO} se il problema continua.`,
      });
    }
  } catch (err) {
    return rispostaJson({
      ok: false,
      errore: `Errore di rete verso Brevo: ${err.message}`,
    });
  }

  return rispostaJson({ ok: true });
}
