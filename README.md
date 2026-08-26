# Barbi Pelletteria — sito

Sito e-commerce su misura (Astro + Netlify + Stripe), costruito secondo `DECISIONI.md` D-005.

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
  un sito statico su Netlify.

**Per collegare Netlify, Stripe e Google Analytics: vedi `SETUP.md`.** Sono i 3 passi
(B1, B2, B4 del pacchetto) che solo un umano del team può fare — servono un'email vera
e la verifica in casella di posta.

## Sviluppo locale

```
npm install
npm run dev
```

Apre su `http://localhost:4321`. Il bottone "Procedi al pagamento" darà un errore
controllato finché non gira anche la funzione Stripe (serve `netlify dev`, vedi sotto) —
è normale, non è un bug.

Per testare anche il pagamento in locale serve la Netlify CLI:

```
npm install -g netlify-cli
cp .env.example .env   # poi incolla le chiavi di test vere in .env
netlify dev
```

## Build di produzione

```
npm run build
```

Genera `dist/` (non versionata in Git: la rigenera Netlify a ogni deploy).

## Struttura

- `src/pages/` — le pagine, routing a file (una cartella o file = una URL)
- `src/data/prodotti.js` — **l'unico file da toccare per aggiungere o modificare prodotti**
  (nome, categoria, descrizione, immagine); il prezzo reale va lì appena esiste
- `src/layouts/Layout.astro` — header, footer, script GA4 condivisi da tutte le pagine
- `src/scripts/cart.js` — logica carrello (localStorage)
- `netlify/functions/create-checkout-session.js` — crea la sessione di pagamento Stripe;
  la chiave segreta vive solo qui, mai nel codice lato client
- `SETUP.md` — istruzioni passo-passo per B1 (Netlify) / B2 (Stripe test) / B4 (GA4)

## Regole del progetto valide anche qui

Vedi `METODO_DI_LAVORO.md` e `STATO.md` nella cartella principale del progetto
(`BARBI PELLETTERIA 2`). In breve: niente prezzo o testo pubblico inventato; questo sito
non va linkato pubblicamente né annunciato finché non lo decide il QG con Founder.
