# SETUP — stato dei servizi collegati e cosa resta da fare

Aggiornato il 22/09/2026 (`RESOCONTO_AUDIT_SERVIZI_2026-09-22.md`, `D-025`).
Questo file descriveva Netlify come piattaforma di hosting: da `D-016`/`D-017`
(01/09/2026) il sito gira su **Cloudflare Pages**, non più su Netlify — le
sezioni sotto sono state riscritte di conseguenza. Quello che resta vero in
tutti i casi: i gesti che richiedono un account nuovo o una verifica via
email sono cose che solo un umano del team può fare — nessuna sessione AI
può farlo al posto vostro.

---

## B1 — Hosting: Cloudflare Pages — **FATTO**

Il sito gira su Cloudflare Pages dal 01/09/2026 (`D-016`/`D-017`). Dominio
`barbipelletteria.it` collegato, TLS attivo, deploy automatico a ogni push
su `main`. Nessuna azione necessaria.

Verifica rapida che sia sempre così: `https://barbipelletteria.it/` deve
rispondere (qualunque comando `curl` o browser va bene).

---

## B2 — Stripe, modalità TEST — **FATTO, verificato dal vivo**

Le chiavi di test sono già configurate su Cloudflare Pages e funzionano —
verificato il 22/09/2026 con una richiesta diagnostica reale contro
`/api/create-checkout-session` (nessun pagamento vero creato). Nessuna
azione necessaria finché si resta in modalità test.

Per referenza, se in futuro servisse rigenerare le chiavi:

1. **dashboard.stripe.com** → verifica in alto a destra che **"Test mode"**
   sia attivo.
2. **Developers → API keys** → **Secret key** (`sk_test_...`, "Reveal test
   key").
3. Su Cloudflare Pages: progetto `barbi-sito` → **Settings → Environment
   variables** → `STRIPE_SECRET_KEY` = la nuova chiave → **Save** (poi serve
   un nuovo deploy perché la modifica si applichi, le variabili d'ambiente
   non sono retroattive sui deploy già fatti).

**Passaggio a Stripe Live**: non si esegue mai di impulso — segue solo
`D-014` (`PACCHETTO_GO_LIVE...`), un ordine scritto apposta perché è il
passaggio in cui un errore costa denaro vero.

---

## B4 — Google Analytics 4 — **FATTO, verificato dal vivo**

`PUBLIC_GA_MEASUREMENT_ID` è configurato su Cloudflare Pages e il tag
carica correttamente sul sito live (verificato il 22/09/2026). Nessuna
azione necessaria.

Se il banner del consenso cookie non compare in un browser: è normale, non
un guasto — significa che quel browser ha già una scelta salvata da una
visita precedente (`localStorage`, chiave `barbi_cookie_consent_v1`). Per
rivederlo: cancellare i dati del sito da quel browser, o aprire una
finestra anonima.

---

## B5 — Dominio — **FATTO**

`barbipelletteria.it` è registrato e collegato, non è più un passo futuro.
Registrazione su Domenico come persona fisica (`D-012`), DNS gestito da
Cloudflare, dominio ancora ad Aruba (`D-016`).

---

## B6 — Brevo: invio email dei moduli contatto/reso/su misura — **FATTO, verificato dal vivo**

`D-025` (22/09/2026): i 4 moduli del sito (`/contatti/` — due moduli,
`/diritto-di-recesso/`, `/prodotto-personalizzato/`) sono passati da un
meccanismo Netlify ormai inerte su Cloudflare a una funzione dedicata
(`functions/api/invia-modulo.js`) che spedisce l'email via **Brevo**. Account
creato, mittente `moduli@barbipelletteria.it` verificato con dominio
autenticato (SPF/DKIM/DMARC — vedi B6bis), `BREVO_API_KEY` configurata su
Cloudflare Pages. Invio reale testato su tutti e 4 i moduli, confermato
arrivo in posta in arrivo (non spam) dopo l'autenticazione del dominio.
Nessuna azione necessaria.

Per referenza, se in futuro servisse rigenerare la chiave: **Developers →
API Keys** su Brevo → **Genera una nuova chiave** → su Cloudflare Pages:
progetto `barbi-sito` → **Settings → Environment variables** →
`BREVO_API_KEY` → **Save** → nuovo deploy perché si applichi (le variabili
d'ambiente non sono retroattive).

## B6bis — Dominio autenticato su Brevo (SPF/DKIM/DMARC) — **FATTO**

Stesso giorno di B6: dominio `barbipelletteria.it` autenticato su Brevo
(Mittenti, dominio, IP → Domini → Aggiungi dominio → Manuale → record
copiati e incollati su Cloudflare DNS). 4 record aggiunti: 1 TXT di verifica
(`@`), 2 CNAME DKIM (`brevo1._domainkey`, `brevo2._domainkey` — **proxy
status "DNS only", non "Proxied"**, altrimenti Brevo non verifica), 1 TXT
DMARC (`_dmarc`). Propagazione quasi istantanea su Cloudflare. Mittente
`moduli@barbipelletteria.it` aggiunto sotto "Mittenti" e verificato subito
(l'autenticazione del dominio da sola non basta, serve anche registrare
l'indirizzo specifico lì).

## B7 — Brevo: newsletter (footer + banner) — **FATTO, verificato dal vivo**

`D-026` (22/09/2026, chiude F-33): l'iscrizione newsletter passa da un
modulo finto (`onsubmit="return false"`) a un'iscrizione reale alla lista
Brevo **"Newsletter sito" (ID #3)**, via
`functions/api/iscrivi-newsletter.js` — endpoint **diverso** da quello dei
moduli di contatto (B6): qui si usa l'API Contacts di Brevo
(`doubleOptinConfirmation`), non l'API email.

**Double opt-in obbligatorio** (vincolo GDPR non negoziabile, D-026):
l'iscritto riceve prima un'email con un link di conferma — entra in lista
solo cliccandolo, non subito dopo aver lasciato l'indirizzo. Gestito
interamente da Brevo (nessun token o database costruito per questo, coerente
con "niente database" già scelto per il resto del sito): serve un modello
email dedicato.

**Modello di conferma creato**: Brevo → Transazionale → Email → Modelli →
Crea modello → Email → Crea da zero → Editor semplice. Mittente
`moduli@barbipelletteria.it` (stesso di B6bis), contiene un link con
destinazione `{{ params.DOIurl }}` (tag esatto richiesto dall'API di
Brevo per i flussi di iscrizione esterni — **diverso** dal tag `{{
doubleoptin }}` usato invece per i moduli creati direttamente dentro
Brevo). **Modello ID #1**, stato "Attiva".

Dopo la conferma, Brevo reindirizza a `/newsletter-confermata/` (pagina
dedicata del sito).

Per referenza, se in futuro servisse ricreare lista o modello: gli ID sono
hardcoded in `functions/api/iscrivi-newsletter.js`
(`LISTA_NEWSLETTER_ID`, `TEMPLATE_CONFERMA_ID`) — non variabili
d'ambiente, non sono segreti, solo identificativi numerici da aggiornare lì
se cambiano.

---

## Verifica finale end-to-end (chiude B3 punto 5 + B4)

Con Stripe e GA4 collegati, un solo giro convalida tutto:

1. Apri `https://barbipelletteria.it/`.
2. Vai su una pagina prodotto → in GA4, **Rapporti → Realtime**, deve
   comparire `view_item`.
3. Clicca "Aggiungi al carrello" → deve comparire `add_to_cart`.
4. Vai al carrello → "Vai al pagamento" → nella pagina checkout deve
   comparire `begin_checkout`, poi clicca "Procedi al pagamento".
5. Nella pagina Stripe che si apre: carta **4242 4242 4242 4242**,
   qualunque data futura, qualunque CVC, qualunque CAP.
6. Deve arrivare alla pagina "Grazie, ordine ricevuto" e in GA4 Realtime
   deve comparire `purchase`.

Se tutti e 5 gli eventi (`page_view` automatico + questi 4) si accendono
durante questo percorso, questo punto è FATTO per intero — segnalalo al QG
così può registrarlo in `STATO.md`.

Se qualcosa si ferma, annota **a che passo esatto** e il messaggio di
errore: nel checkout c'è già un messaggio a schermo che distingue "manca la
chiave Stripe" da altri problemi. Nota: questo percorso richiede
`VENDITA_ATTIVA = true` per essere eseguibile per intero — con il flag a
`false` (stato attuale) i passi 3-6 non sono raggiungibili dall'interfaccia,
è un test da eseguire quando si accende la vendita (`D-014`), non prima.
