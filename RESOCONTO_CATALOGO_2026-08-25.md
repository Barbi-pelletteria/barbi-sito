# Resoconto catalogo — 25/08/2026

Sessione esecutiva sul sito Astro esistente (`barbi-sito`). Riempiti dati e testi
reali, aggiunte le tre funzioni tecniche mancanti, fatta la pulizia. Nessun deploy
eseguito (come da vincolo: il deploy lo fa una persona).

---

## FATTO

### Catalogo e dati (`src/data/prodotti.js`)
- Sostituito il prodotto segnaposto con i **due prodotti reali**: `sottile` (49,00 €)
  e `completo` (55,00 €), con tutti i dati verbatim (pelle, fodera, dimensioni, peso,
  capienza, lavorazione).
- **Stock per singolo colore** (punto 4A): Sottile → blu 4 · bordeaux 5 · marrone 4;
  Completo → blu 4 · bordeaux 3 · marrone 4.
- Sostituito `prezzoTestCentesimi` (segnaposto 1,00 €) con i prezzi reali in centesimi:
  4900 e 5500. Il campo è stato rinominato `prezzoCentesimi` (non è più un valore di
  collaudo) e aggiornato ovunque (checkout + funzione Stripe).
- Aggiunto `INIZIALI_CENTESIMI = 1000` (+10,00 €), `EMAIL_CONTATTO`, `formatEuro()`,
  `getColore()`.

### Testi verbatim (punto 2)
- **Home** (`src/pages/index.astro`): H1, sottotitolo, pulsante, striscia a 4 voci,
  sezione "Perché sono diversi" (3 blocchi), sezione "Stefano" — tutti verbatim.
- **Schede prodotto** (`src/pages/prodotto/[slug].astro`): descrizioni a 3 paragrafi
  verbatim per Sottile e Completo, blocco "Come si cura" verbatim su entrambe,
  tabella caratteristiche.
- **Avviso iniziali** verbatim mostrato **accanto alla casella delle iniziali**, dentro
  il form d'acquisto (prima dell'ordine), non solo nei resi.
- Nuove pagine **Chi siamo** (testo "Stefano" verbatim) e **Contatti** (email + indirizzo).

### Pagine legali (punto 3)
- **Informazioni legali + Pagamenti e prezzi + Garanzia** → `termini-e-condizioni.astro`.
  Inserito **verbatim** il segnaposto fiscale `[DA CONFERMARE COL COMMERCIALISTA DI
  STEFANO — dicitura fiscale del regime forfettario]`. Nessun "IVA inclusa", nessuno
  scorporo IVA.
- **Spedizioni e consegne** → `spedizioni-e-resi.astro` (verbatim).
- **Diritto di recesso e resi** → `diritto-di-recesso.astro` (verbatim) + **modulo di
  recesso raggiungibile in un clic** (pulsante che apre un'email precompilata),
  obbligatorio dal 19/06/2026.
- **Privacy e cookie** → `privacy.astro`: uso di GA4, consenso preventivo, pulsante
  "Rivedi la scelta sui cookie" per revocare.
- **NON** pubblicati PEC né link ODR (verificato: zero occorrenze).

### Le tre cose tecniche (punto 4)
- **A) Stock per colore**: selettore colore nella scheda prodotto; un colore a 0 è
  mostrato "Esaurito" e non selezionabile; la quantità aggiungibile è limitata allo
  stock residuo (stock − già nel carrello), condiviso tra righe con e senza iniziali.
- **B) Banner cookie con consenso preventivo** (`src/scripts/consent.js` + banner in
  `Layout.astro`): GA4 **non** viene caricato al load; parte solo dopo "Accetta".
  "Accetta" e "Rifiuta" hanno lo **stesso peso visivo** (stessa classe `.pulsante`).
  La scelta è ricordata in `localStorage`.
- **C) Interruttore `VENDITA_ATTIVA`** (in `src/data/prodotti.js`), **valore iniziale
  `false`**: i pulsanti "Aggiungi al carrello" diventano "Disponibile a breve" con link
  `mailto:stefano-barbi@libero.it`. Carrello e checkout restano raggiungibili ma non
  pubblicizzati. Passaggio a vendita = cambiare un solo valore in `true`.

### Pulizia (punto 6)
- Cancellate le pagine categoria **Borse** e **Portachiavi** (`src/pages/borse/`,
  `src/pages/portachiavi/`). Resta la sola categoria **Portafogli**.
- Menu ridotto a: **Portafogli · Chi siamo · Contatti**; pagine legali nel footer.
- Rimossi tutti i segnaposto della versione precedente (`PLACEHOLDER` / "DA COMPLETARE").
- Corretti i claim "dal 1992" nel footer e nella description: ora riferiti sempre a
  **Stefano persona** ("Stefano Barbi lavora la pelle dal 1992").
- `README.md` aggiornato per riflettere il nuovo stato (rimossa la vecchia stringa
  segnaposto).

### Segnaposto foto (punto 1 FOTO)
- Sostituito `public/prodotti/placeholder.svg` con un segnaposto **grigio neutro 4:5,
  senza testo**. Card e immagini prodotto ora usano proporzione 4/5.

---

## ESITO DEI SEI CONTROLLI (punto 7)

1. **`npm run build` senza errori** → ✅ OK. 14 pagine generate.
2. **Ricerca "DA COMPLETARE"** → ✅ **Zero occorrenze** in tutto il progetto.
   ⚠️ Nota: il segnaposto fiscale, inserito verbatim come da punto 3, contiene
   "**DA CONFERMARE**", non "DA COMPLETARE". Vedi DA CHIARIRE.
3. **Frasi vietate (punto 5)** → ✅ **Zero occorrenze** in tutto il progetto
   (verificato: cucito a mano, interamente/tutto in pelle, 100% italiana / Made in
   Italy / pelle italiana, marchio registrato / ®, vitello / vacchetta, IVA inclusa,
   azienda/fondata nel 1992, un solo artigiano/artigiano solitario). Le tre occorrenze
   di "1992" sono tutte nella forma consentita "Stefano Barbi lavora la pelle dal 1992".
4. **Percorso completo con browser automatizzato** → ⚠️ **Parziale**. Nell'ambiente non
   è disponibile alcun browser automatizzato (né Playwright né Puppeteer) e installarli
   avrebbe violato "non installare dipendenze pesanti". Verificato invece:
   - con `VENDITA_ATTIVA=false` la scheda prodotto mostra **"Disponibile a breve"** e
     **nessun** pulsante "Aggiungi al carrello" (controllato sull'HTML generato);
   - il resto del flusso (home → prodotto → carrello → checkout) è generato e le pagine
     esistono tutte;
   - la logica carrello/quantità/prezzi è stata provata con un test in Node sul codice
     reale (`cart.js` + `prodotti.js`). **Da rifare con un browser vero prima del go-live.**
5. **GA4 nessuna richiesta prima del consenso** → ✅ OK. Nell'HTML statico non compare
   alcun `googletagmanager.com/gtag/js`; l'URL è solo dentro il chunk `consent.js`, che
   inietta lo script **dopo** "Accetta". Con Measurement ID non configurato, banner e GA
   non vengono nemmeno renderizzati.
6. **Aggiungere più pezzi dello stock** → ✅ **Impedito**. Test automatico sul codice
   reale (tutti PASS): richiesta di 5 su stock 3 → ne aggiunge 3; ulteriore aggiunta su
   colore esaurito → bloccata; stock condiviso correttamente tra righe con/senza iniziali.

---

## NON FATTO
- Nessun deploy (per vincolo esplicito).
- Nessuna foto reale caricata (non fornite): resta il segnaposto grigio.
- Test end-to-end con browser reale (vedi controllo 4): ambiente senza browser
  automatizzato.

---

## BLOCCATO
- **Nulla di bloccante.** Il sito compila e funziona con i dati forniti.

---

## DA CHIARIRE COL QG
1. **Discrepanza nel pacchetto** tra punto 3 e punto 7.2: il testo da inserire verbatim
   dice "**DA CONFERMARE** COL COMMERCIALISTA…", mentre il controllo 7.2 chiede di cercare
   "**DA COMPLETARE**". Ho seguito la REGOLA D'ORO (verbatim), quindi in pagina c'è
   "DA CONFERMARE" e una ricerca di "DA COMPLETARE" dà zero. Confermare che va bene così.
2. **Test browser reale**: da eseguire su una macchina con browser prima di aprire la
   vendita (percorso completo + verifica rete GA4 in DevTools).
3. **`<meta robots noindex,nofollow>`** in `Layout.astro` è **ancora attivo** (era già
   presente, non toccato). Finché c'è, il sito non verrà indicizzato dai motori. Se il
   sito va online per essere visitato/indicizzato, va rimosso — ma è una decisione,
   non l'ho toccato.
4. Testo "Ambiente di test — nessun pagamento reale" su **checkout** e **conferma
   ordine**: accurato finché si usano chiavi `sk_test_` (la funzione Stripe rifiuta le
   chiavi live). Da rivedere quando si passerà a chiavi reali.

---

## DA CONFERMARE
- **Dicitura fiscale regime forfettario**: segnaposto in `termini-e-condizioni.astro`,
  da sostituire con la formula esatta del commercialista di Stefano.
- **Foto reali** — file da sostituire / aggiungere:
  - `public/prodotti/placeholder.svg` è l'unico segnaposto attuale (4:5 grigio), usato
    da **entrambi** i prodotti.
  - Servono foto reali per **Sottile** e **Completo**. Se si vogliono foto per singolo
    colore (blu / bordeaux / marrone), va esteso il campo `immagine` in
    `src/data/prodotti.js` (oggi c'è una sola immagine per prodotto). Confermare se basta
    una foto per prodotto o ne serve una per colore.
- **Nessun altro dato mancante**: tutti i dati dei prodotti richiesti nel punto 1 erano
  presenti nel pacchetto e sono stati inseriti.
