# Barbi Pelletteria — sito

Sito e-commerce su misura (Astro + Cloudflare Pages + Stripe), costruito secondo `DECISIONI.md` D-005. Migrato da Netlify a Cloudflare Pages il 01/09/2026 (`D-016`/`D-017`).

**Contenuti reali inseriti** (catalogo, testi, pagine legali) dal pacchetto
`PACCHETTO_SETUP_TECNICO` / catalogo 2026-08-25. Il catalogo ha due prodotti
(Sottile, Completo) con stock per colore. L'unico segnaposto rimasto di proposito è la
dicitura fiscale del regime forfettario in `termini-e-condizioni.astro`, in attesa della
formula del commercialista.

## Cosa c'è

- Home, 1 pagina categoria (portafogli), pagine prodotto (Sottile / Completo), carrello,
  checkout collegato a Stripe (modalità test), conferma ordine, pagine legali compilate,
  Chi siamo, Contatti.
- Interruttore `VENDITA_ATTIVA` in `src/data/prodotti.js`: a `false` i pulsanti "Aggiungi
  al carrello" diventano "Disponibile a breve"; a `true` il sito vende.
- Stock per singolo colore: un colore a zero è mostrato esaurito e non aggiungibile.
- GA4 con consenso preventivo: non parte finché il visitatore non accetta il banner cookie.
- Carrello lato client in localStorage — nessun backend, nessun database: coerente con
  un sito statico su Cloudflare Pages.
- Moduli contatto/reso/richiesta su misura e newsletter collegati a Brevo (`D-025`,
  `D-026`): funzioni Cloudflare Pages dedicate, non un servizio di terze parti
  incorporato nel form.

**Stato dei servizi collegati (hosting, Stripe, GA4, Brevo) e cosa resta da fare: vedi
`SETUP.md`.**

## Sviluppo locale

```
npm install
npm run dev
```

Apre su `http://localhost:4321`. Il bottone "Procedi al pagamento" e i moduli
contatto/reso/su misura/newsletter danno un errore controllato finché non girano anche
le funzioni Cloudflare Pages (serve Wrangler, vedi sotto) — è normale, non è un bug.

Per testare anche le funzioni (pagamenti, moduli, newsletter) in locale serve Wrangler
(CLI di Cloudflare — non richiede un progetto Cloudflare già creato per girare in
locale, si scarica al volo):

```
npm run build
cp .env.example .dev.vars   # poi incolla le chiavi di test vere in .dev.vars
npx wrangler pages dev dist
```

## Build di produzione

```
npm run build
```

Genera `dist/` (non versionata in Git: la rigenera Cloudflare Pages a ogni deploy).

## Struttura

- `src/pages/` — le pagine, routing a file (una cartella o file = una URL)
- `src/data/prodotti.js` — **l'unico file da toccare per aggiungere o modificare prodotti**
  (nome, categoria, descrizione, immagine); il prezzo reale va lì appena esiste
- `src/layouts/Layout.astro` — header, footer, script GA4 condivisi da tutte le pagine
- `src/scripts/cart.js` — logica carrello (localStorage)
- `functions/api/create-checkout-session.js` — crea la sessione di pagamento Stripe;
  la chiave segreta vive solo qui, mai nel codice lato client
- `functions/api/invia-modulo.js` — moduli contatto/reso/su misura, via Brevo (`D-025`)
- `functions/api/iscrivi-newsletter.js` — iscrizione newsletter con double opt-in, via
  Brevo (`D-026`)
- `SETUP.md` — stato di ogni servizio collegato (hosting, Stripe, GA4, Brevo) e istruzioni
  per ricollegarli se servisse

## Regole del progetto valide anche qui

Vedi `METODO_DI_LAVORO.md` e `STATO.md` nella cartella principale del progetto
(`BARBI PELLETTERIA 2`). In breve: niente prezzo o testo pubblico inventato; questo sito
non va linkato pubblicamente né annunciato finché non lo decide il QG con Founder.
