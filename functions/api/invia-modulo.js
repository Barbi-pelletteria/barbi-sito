// Cloudflare Pages Function: riceve i 4 moduli del sito (avvisami, contatto,
// recesso, su-misura) e spedisce il contenuto via email con l'API
// transazionale di Brevo. Un solo endpoint condiviso, distinto per modulo
// tramite il campo nascosto "form-name" già presente in ogni form — prima
// lo leggeva Netlify, ora lo legge questa funzione (D-025, chiude N-20).
// La chiave vive SOLO nelle variabili d'ambiente del progetto Cloudflare
// Pages, mai nel codice — stesso trattamento di STRIPE_SECRET_KEY in
// create-checkout-session.js.

// Duplicato qui invece di importato da src/data/prodotti.js: le Functions di
// Cloudflare hanno una pipeline di build separata da quella di Astro,
// importare da src/ non è un percorso testato.
const EMAIL_DESTINATARIO = 'info.barbipelletteria@gmail.com';

// Mittente sul dominio autenticato (SPF/DKIM/DMARC verificati su Brevo il
// 22/09/2026) invece del Gmail: migliora la recapitabilità, non richiede una
// casella reale — nessuno deve mai scrivere qui, "rispondi" nell'email va
// sempre al cliente (vedi replyTo sotto), mai a questo indirizzo.
const EMAIL_MITTENTE = 'moduli@barbipelletteria.it';

const paginaErrore = (messaggio) =>
  new Response(
    `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<title>Invio non riuscito</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<style>
  body { font-family: Georgia, 'Times New Roman', serif; background: #FBF6EC; color: #211B17; max-width: 560px; margin: 100px auto; padding: 0 20px; text-align: center; }
  a { color: #96793D; }
  .pulsante { display: inline-block; margin-top: 24px; padding: 13px 26px; background: #C6A15B; color: #211B17; text-decoration: none; border-radius: 4px; font-weight: 600; }
</style>
</head>
<body>
  <h1>Il messaggio non è partito</h1>
  <p>${messaggio}</p>
  <p>Scrivi direttamente a <a href="mailto:${EMAIL_DESTINATARIO}">${EMAIL_DESTINATARIO}</a> — arriva comunque.</p>
  <p><a class="pulsante" href="/">Torna alla home</a></p>
</body>
</html>`,
    // Status 200, non un codice d'errore: Cloudflare intercetta le risposte
    // 5xx dei Worker e le sostituisce con una propria pagina generica
    // ("error code: 502"), cancellando questo messaggio — verificato dal
    // vivo il 22/09/2026. 200 garantisce che il browser mostri davvero
    // questo contenuto, non quello di Cloudflare.
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );

// Testo dell'email per ciascun modulo: stessi nomi di campo dei rispettivi
// file .astro (contatti.astro, diritto-di-recesso.astro,
// prodotto-personalizzato.astro).
const MODULI = {
  avvisami: {
    oggetto: () => 'Barbi Pelletteria — avviso riapertura richiesto',
    corpo: (d) => `Email da avvisare alla riapertura vendita:\n${d.get('email') || ''}`,
  },
  contatto: {
    oggetto: (d) => `Barbi Pelletteria — messaggio da ${d.get('nome') || 'sito'}`,
    corpo: (d) =>
      `Nome: ${d.get('nome') || ''}\n` +
      `Email: ${d.get('email') || ''}\n\n` +
      `Messaggio:\n${d.get('messaggio') || ''}`,
  },
  recesso: {
    oggetto: (d) => `Barbi Pelletteria — richiesta di recesso, ${d.get('nome') || ''}`,
    corpo: (d) =>
      `Prodotto: ${d.get('prodotto') || ''}\n` +
      `Data ordine: ${d.get('data_ordine') || '(non indicata)'}\n` +
      `Data ricezione: ${d.get('data_ricezione') || '(non indicata)'}\n` +
      `Nome e cognome: ${d.get('nome') || ''}\n` +
      `Indirizzo: ${d.get('indirizzo') || ''}\n` +
      `Email: ${d.get('email') || ''}`,
  },
  'su-misura': {
    oggetto: (d) => `Barbi Pelletteria — richiesta su misura da ${d.get('nome') || 'sito'}`,
    corpo: (d) =>
      `Cosa vorrebbe: ${d.get('cosa') || ''}\n` +
      `Nome: ${d.get('nome') || ''}\n` +
      `Email: ${d.get('email') || ''}\n` +
      `Dettagli: ${d.get('dettagli') || '(nessuno)'}`,
  },
};

const CAMPI_HONEYPOT = ['av-azienda', 'ct-azienda', 'pp-azienda'];

export async function onRequestPost({ request, env }) {
  const origin = new URL(request.url).origin;

  let dati;
  try {
    dati = await request.formData();
  } catch {
    return paginaErrore('Il modulo non è arrivato in un formato leggibile.');
  }

  const nomeModulo = dati.get('form-name');
  const modulo = MODULI[nomeModulo];
  if (!modulo) {
    return paginaErrore('Modulo non riconosciuto.');
  }

  // Honeypot: se un campo pensato per restare vuoto è compilato, è quasi
  // certamente un bot — si finge successo (redirect a /grazie/) senza
  // spedire nulla, per non rivelare al bot di essere stato scoperto. Stesso
  // comportamento che aveva Netlify Forms.
  const honeypotCompilato = CAMPI_HONEYPOT.some((campo) => dati.get(campo));
  if (honeypotCompilato) {
    return Response.redirect(`${origin}/grazie/`, 302);
  }

  const emailMittente = dati.get('email');
  if (!emailMittente) {
    return paginaErrore("Manca l'indirizzo email nel modulo.");
  }

  const apiKey = env.BREVO_API_KEY;
  if (!apiKey) {
    return paginaErrore(
      'Il servizio di invio non è ancora configurato (manca BREVO_API_KEY su Cloudflare Pages).'
    );
  }

  try {
    const risposta = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Sito Barbi Pelletteria', email: EMAIL_MITTENTE },
        to: [{ email: EMAIL_DESTINATARIO, name: 'Stefano Barbi' }],
        replyTo: { email: emailMittente },
        subject: modulo.oggetto(dati),
        textContent: modulo.corpo(dati),
      }),
    });

    if (!risposta.ok) {
      const testoErrore = await risposta.text();
      return paginaErrore(`Brevo ha rifiutato l'invio (${risposta.status}): ${testoErrore}`);
    }
  } catch (err) {
    return paginaErrore(`Errore di rete verso Brevo: ${err.message}`);
  }

  return Response.redirect(`${origin}/grazie/`, 302);
}
