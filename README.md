# Barbi Pelletteria — sito

Sito e-commerce su misura (Astro + Netlify + Stripe), costruito secondo `DECISIONI.md` D-005.

**Nessun contenuto reale è ancora presente.** Ogni testo rivolto al cliente (nomi, prezzi,
descrizioni, pagine legali) mostra il segnaposto esatto
`[DA COMPLETARE — dati mancanti, vedi blocco 4 DOMANDE_APERTURA.md]` finché non arrivano
i dati veri dai blocchi 4-7 dell'interrogatorio a Stefano/Jacopo. Non modificare quel testo
a intuito: si sostituisce solo con dati veri, in `src/data/prodotti.js` e nelle pagine legali.

## Cosa c'è

- Home, 3 pagine categoria (portafogli / borse / portachiavi), 1 pagina prodotto
  (template, un solo prodotto placeholder), carrello, checkout collegato a Stripe
  (modalità test), pagina di conferma ordine, 4 pagine legali vuote con solo il titolo.
- Tracciamento GA4 con i 5 eventi del funnel (`page_view`, `view_item`, `add_to_cart`,
  `begin_checkout`, `purchase`).
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
