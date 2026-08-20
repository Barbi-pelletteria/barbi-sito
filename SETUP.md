# SETUP — collegare Netlify, Stripe (test) e GA4

Il codice è già pronto e collaudato in locale. Questi sono i 3 gesti che solo un umano del
team può fare (serve un'email vera e cliccare un link di verifica che arriva in una casella
di posta — nessuna sessione AI può farlo al posto vostro). Circa 5 minuti a testa.

**Usa la stessa email del team per tutti e 3**, così restano facili da ritrovare. Qualunque
email va bene: questo passo non decide la proprietà definitiva degli account (quella
resta una domanda aperta, `APERTE.md` N-02) — per ora sono account di test/gratuiti,
serve solo farli esistere.

---

## B1 — Netlify (hosting, piano Free)

1. Vai su **netlify.com** → "Sign up" → registrati con l'email del team scelta (va bene
   anche via Google/GitHub).
2. Non serve nessuna carta di credito: il piano Free è quello attivo di default.
3. Per il deploy automatico serve un repository Git. Se questo progetto non è già su
   GitHub:
   - crea un repository vuoto su **github.com/new** (es. `barbi-pelletteria-sito`, privato)
   - nel terminale, dentro questa cartella:
     ```
     git remote add origin <URL del repository appena creato>
     git branch -M main
     git push -u origin main
     ```
4. Su Netlify: **"Add new site" → "Import an existing project"** → collega GitHub →
   seleziona il repository. Netlify legge da solo `netlify.toml` (comando di build
   `npm run build`, cartella pubblicata `dist`) — non serve configurare nulla a mano.
5. A deploy finito, annota l'URL assegnato (tipo `nome-a-caso.netlify.app`).

**FATTO QUANDO:** l'URL Netlify è raggiungibile da browser e mostra il sito (anche senza
le chiavi Stripe/GA4 — quelle servono solo per i passi successivi).

---

## B2 — Stripe, modalità TEST

1. Vai su **dashboard.stripe.com/register** → registrati con la stessa email usata sopra.
2. In alto a destra controlla che **"Test mode"** sia attivo (di norma lo è già per un
   account nuovo). Non inserire dati bancari, non cliccare su "Activate payments"/account live.
3. Vai su **Developers → API keys** e copia:
   - **Publishable key** (`pk_test_...`)
   - **Secret key** (`sk_test_...` — clicca "Reveal test key" per vederla)
4. Salvale in un posto sicuro e ritrovabile dal team (es. password manager condiviso).
   **Non incollarle in chiaro in chat, in un resoconto, o committarle su Git.**

**FATTO QUANDO:** hai le due chiavi di test salvate. Servono al passo successivo.

---

## Collegare le chiavi Stripe a Netlify

1. Sul sito del progetto in Netlify: **Site configuration → Environment variables → Add a variable**.
2. Aggiungi (obbligatoria solo la prima: il sito usa Stripe Checkout ospitato da Stripe,
   che non ha bisogno della publishable key lato client):
   - `STRIPE_SECRET_KEY` = la Secret key di test (`sk_test_...`) — **obbligatoria**
   - `PUBLIC_STRIPE_PUBLISHABLE_KEY` = la Publishable key di test — utile da avere pronta,
     non ancora usata dal codice
3. **Deploys → Trigger deploy → Clear cache and deploy site** (le variabili d'ambiente si
   applicano solo dopo un nuovo deploy, non retroattivamente).

---

## B4 — Google Analytics 4

1. Vai su **analytics.google.com** con l'account Google del team.
2. **Amministrazione → Crea proprietà** → nome "Barbi Pelletteria", fuso orario Italia,
   valuta EUR.
3. Nel flusso di dati scegli **Web**, inserisci l'URL Netlify del sito (dal passo B1).
4. Copia l'**ID misurazione** (formato `G-XXXXXXXXXX`).
5. Su Netlify: **Environment variables** → aggiungi `PUBLIC_GA_MEASUREMENT_ID` = quel valore.
6. **Trigger deploy** di nuovo.

**FATTO QUANDO:** la variabile è impostata e il sito è stato ridistribuito dopo averla aggiunta.

---

## Verifica finale end-to-end (chiude B3 punto 5 + B4)

Con Netlify, Stripe e GA4 collegati, un solo giro convalida tutto:

1. Apri l'URL Netlify del sito.
2. Vai su una pagina prodotto (es. `/prodotto/prodotto-placeholder/`) → in GA4,
   **Rapporti → Realtime**, deve comparire `view_item`.
3. Clicca "Aggiungi al carrello" → deve comparire `add_to_cart`.
4. Vai al carrello → "Vai al pagamento" → nella pagina checkout deve comparire
   `begin_checkout`, poi clicca "Procedi al pagamento".
5. Nella pagina Stripe che si apre: carta **4242 4242 4242 4242**, qualunque data
   futura, qualunque CVC, qualunque CAP.
6. Deve arrivare alla pagina "Grazie, ordine ricevuto" e in GA4 Realtime deve comparire
   `purchase`.

Se tutti e 5 gli eventi (`page_view` automatico + questi 4) si accendono durante questo
percorso, B3 e B4 sono FATTO per intero — segnalalo al QG così può registrarlo in `STATO.md`.

Se qualcosa si ferma, annota **a che passo esatto** e il messaggio di errore: nel checkout
c'è già un messaggio a schermo che distingue "manca la chiave Stripe" da altri problemi.

---

## Dominio (B5) — promemoria

Non si acquista nulla ora (`APERTE.md` N-04, budget non ancora noto). Il resoconto
principale ha già la disponibilità verificata. Quando il budget esiste, si punta da
Netlify: **Domain management → Add a domain**.
