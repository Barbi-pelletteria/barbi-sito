// ─────────────────────────────────────────────────────────────────────────
// Interruttore VENDITA ATTIVA (punto 4C del pacchetto catalogo).
//   false → niente "Aggiungi al carrello": sulla scheda c'è il campo
//           "Avvisami quando è disponibile" (D-029), in vetrina solo
//           "Scopri il…". Carrello e checkout restano raggiungibili ma non
//           pubblicizzati.
//   true  → il sito vende normalmente.
// Il sito va online per essere visitato PRIMA del via libera fiscale: si passa
// alla vendita cambiando solo questo valore.
// ─────────────────────────────────────────────────────────────────────────
export const VENDITA_ATTIVA = false;

import { pelli, getPelle } from './pelli.js';

// Email di contatto pubblica del laboratorio.
export const EMAIL_CONTATTO = 'info.barbipelletteria@gmail.com';

// Sovrapprezzo per l'incisione delle iniziali (in centesimi). +10,00 €.
export const INIZIALI_CENTESIMI = 1000;

// Macro della pelle vera per ogni colore, usata sugli swatch al posto
// della tinta piatta (PACCHETTO_INTERFACCIA_2026-08-30 punto 1, foto
// arrivate il 02/09/2026 — PACCHETTO_MACRO_PELLE_2026-08-30). Unica fonte
// per colore (non per prodotto: lo stesso blu è lo stesso blu su Sottile
// e Completo). Versione piccola (160px, pensata per un cerchio da 44px
// anche a devicePixelRatio alto) — la versione grande, per la galleria
// prodotto e "Come nasce un portafoglio", sta in macro-pelle-manifest.json
// (vedi immagini.js). Generate da scripts/ottimizza-macro-pelle.mjs, non
// scritte a mano: rilanciare quello script per aggiornarle.
// Sono macro della CAPRA conciata al vegetale: per un colore che su quel
// prodotto è in un'altra pelle lo swatch torna alla tinta piatta
// (swatchColore, sotto) — non si mostra la grana di una pelle diversa.
export const MACRO_PELLE = {
  blu: '/pelle/blu-swatch.webp',
  bordeaux: '/pelle/bordeaux-swatch.webp',
  marrone: '/pelle/marrone-swatch.webp',
};

// Tre categorie. Portachiavi e borse sono reali (il racconto lo dice già:
// "arriveranno gli altri pezzi che Stefano porta già in fiera — borse,
// portachiavi") ma non ancora in laboratorio pronti per il sito: restano
// vuote finché non arrivano pezzi veri, mai riempite a intuito (STATO.md,
// divieto 3).
// genere: serve al testo generato per categorie vuote ("...pronti"/"...pronte"
// in CategoriaTemplate.astro) — un'unica frase condivisa fra le tre categorie
// non può accordarsi da sola al genere del nome (bug reale trovato: "borse
// arriveranno... pronti", femminile col participio maschile).
export const categorie = [
  { slug: 'portafogli', nome: 'Portafogli', genere: 'm' },
  { slug: 'portachiavi', nome: 'Portachiavi', genere: 'm' },
  { slug: 'borse', nome: 'Borse', genere: 'f' },
];

// Il blocco "Come si cura" (testo verbatim, invariato) oggi vive nel
// catalogo pelli: ogni pelle ha il suo (pelli.js, campo `cura`), la scheda
// prodotto mostra quello della pelle scelta.

// Riquadro iniziali sulla scheda prodotto (D-029 § 4.3, testo del QG).
export const avvisoIniziali =
  'Impresse sulla pelle prima della spedizione. Rendono il portafoglio solo tuo: per questo un pezzo personalizzato non può essere reso.';

// Casella di consenso dei moduli newsletter/avvisami (D-029 § 4.11): un
// testo solo, usato dal footer, dal banner e dalla scheda prodotto.
export const CONSENSO_NEWSLETTER =
  'Accetto di ricevere email da Barbi Pelletteria su novità e nuovi modelli. Posso annullare l’iscrizione in qualsiasi momento.';

// ─────────────────────────────────────────────────────────────────────────
// Anteprima delle bozze (D-030 Parte 4). Un prodotto con `pubblicato:
// false` non esiste per il sito pubblico (niente pagina → 404, niente
// collezione, home, sitemap, filtri, dati strutturati). In locale si
// controlla con:   MOSTRA_BOZZE=true npm run build
// Letta da process.env (build e test in Node) o da import.meta.env (Astro);
// nel browser nessuna delle due esiste → sempre false.
// ─────────────────────────────────────────────────────────────────────────
const ambiente = (typeof process !== 'undefined' && process.env) || {};
export const MOSTRA_BOZZE =
  ambiente.MOSTRA_BOZZE === 'true' || import.meta.env?.MOSTRA_BOZZE === 'true';

// I prodotti reali. Da D-030 ogni pezzo vendibile è identificato da
// modello + colore + PELLE: `colori` elenca i colori (slug + nome), le
// `varianti` {colore, pelle, stock, foto?} dicono quali pelli esistono
// per ogni colore e quanti pezzi ci sono. Lo stock vive SOLO sulla
// variante (anti-sovravendita per colore+pelle, non più per solo colore).
// `foto` è facoltativa: se manca si usano le foto del colore.
//
// I campi di scheda (fodera, misure, spessore, peso, capienza,
// lavorazione) sono separati: la tabella "Dettagli e misure" si costruisce
// da qui (specificheProdotto) e salta le righe vuote — mai "n.d." o
// trattini. Vuoto = dato non ancora arrivato da Stefano, non inventato.
export const prodotti = [
  // Tutti i testi qui sotto (occhielli, sommario, fraseBreve, puntiForza,
  // descrizione, rimandi, metaDescription) sono quelli definitivi del QG,
  // D-029 § 4.1/4.3/4.4/4.14 — non riscritti. Apostrofi tipografici come
  // nel resto del sito (uniformati il 26/08).
  {
    slug: 'sottile',
    categoria: 'portafogli',
    nome: 'Sottile',
    pubblicato: true,
    // Eyebrow della scheda prodotto (§ 4.3) e della card in vetrina (§ 4.1).
    occhiello: 'Portafoglio slim · 8 carte',
    occhielloCard: '8 carte · 0,55 cm',
    scopri: 'Scopri il Sottile',
    // Testo della card (home e collezione, § 4.1).
    sommario: 'Mezzo centimetro di pelle che scompare nella tasca interna della giacca. Per chi ha lasciato il contante alle spalle.',
    // Frase breve sopra il pulsante della scheda (§ 4.3).
    fraseBreve: 'Otto carte, banconote e documenti in 0,55 cm. Scivola nella tasca interna della giacca senza lasciare traccia.',
    prezzoCentesimi: 4900,
    tascheCarte: 8,
    portamonete: false,
    inizialiDisponibili: true,
    // Punti di forza (§ 4.3): icona + titolo + riga. L'icona è solo un
    // segno lineare scelto per tema, vedi ICONE in prodotto/[slug].astro.
    puntiForza: [
      { icona: 'spessore', titolo: '0,55 cm di spessore', testo: 'Pensato per la tasca interna della giacca e dei pantaloni: non deforma, non si sente.' },
      { icona: 'pelle', titolo: 'Pelle conciata al vegetale', testo: 'Capra, spessore 1,2-1,3 mm. Senza protezioni chimiche: con l’uso cambia tono e diventa tuo.' },
      { icona: 'bordi', titolo: 'Bordi tinti a mano', testo: 'Uno per uno, a pennello. Il dettaglio che distingue un portafoglio fatto con cura.' },
      { icona: 'tasche', titolo: '8 tasche per le carte', testo: 'Più scomparto banconote e tasca documenti. L’essenziale, niente di superfluo.' },
    ],
    descrizione: [
      '«Un portafoglio ridimensionato per lo stile di vita odierno»: così lo descrive Stefano. Meno contante, più carte, nessun ingombro. Chiuso misura 10,9 × 8,5 cm e pesa 50 grammi.',
    ],
    rimandi: [{ slug: 'completo', testo: 'Ti serve anche il portamonete? Scopri il Completo →' }],
    metaDescription: 'Sottile: portafoglio slim da 8 carte, 0,55 cm, in pelle di capra conciata al vegetale con bordi tinti a mano. 49 €, spedizione inclusa.',
    fodera: 'poliestere',
    misure: { chiuso: '10,9 × 8,5 cm', aperto: '21 × 8,5 cm' },
    spessore: '0,55 cm',
    peso: '50 g',
    capienza: '8 tasche carte, scomparto banconote, tasca documenti (nessun portamonete)',
    lavorazione: 'cuciture a macchina, bordi tinti a mano',
    colori: [
      { slug: 'blu', nome: 'Blu' },
      { slug: 'bordeaux', nome: 'Bordeaux' },
      { slug: 'marrone', nome: 'Marrone' },
    ],
    // Stock invariato rispetto a prima di D-030, solo spostato sulla
    // variante (tutte in capra conciata al vegetale).
    varianti: [
      { colore: 'blu', pelle: 'capra-vegetale', stock: 4 },
      { colore: 'bordeaux', pelle: 'capra-vegetale', stock: 5 },
      { colore: 'marrone', pelle: 'capra-vegetale', stock: 4 },
    ],
  },
  {
    slug: 'completo',
    categoria: 'portafogli',
    nome: 'Completo',
    pubblicato: true,
    occhiello: 'Portafoglio classico · con portamonete',
    occhielloCard: '5 carte · portamonete',
    scopri: 'Scopri il Completo',
    sommario: 'Il portafoglio classico, senza ingombro: carte, banconote, documenti e monete in 0,65 cm.',
    fraseBreve: 'Carte, banconote, documenti e monete in 0,65 cm. Il classico di ogni giorno, senza ingombro.',
    prezzoCentesimi: 5500,
    tascheCarte: 5,
    portamonete: true,
    inizialiDisponibili: true,
    puntiForza: [
      { icona: 'portamonete', titolo: 'Portamonete con patta', testo: 'Chiuso da un bottone: le monete restano al loro posto.' },
      { icona: 'spessore', titolo: '0,65 cm di spessore', testo: 'Solo un millimetro in più del Sottile, e non lascia fuori niente.' },
      { icona: 'pelle', titolo: 'Pelle conciata al vegetale', testo: 'Capra, spessore 1,2-1,3 mm. Senza protezioni chimiche: con l’uso cambia tono e diventa tuo.' },
      { icona: 'bordi', titolo: 'Bordi tinti a mano', testo: 'Uno per uno, a pennello. Il dettaglio che distingue un portafoglio fatto con cura.' },
    ],
    descrizione: [
      'Stefano lo chiama «il classico per l’uso di tutti i giorni». Cinque tasche per le carte, scomparto banconote, tasca documenti e portamonete. Chiuso misura 10,9 × 8,5 cm e pesa 55 grammi.',
    ],
    rimandi: [{ slug: 'sottile', testo: 'Preferisci qualcosa di ancora più sottile? Scopri il Sottile →' }],
    metaDescription: 'Completo: portafoglio con portamonete e 5 carte, 0,65 cm, in pelle di capra conciata al vegetale con bordi tinti a mano. 55 €, spedizione inclusa.',
    fodera: 'poliestere',
    misure: { chiuso: '10,9 × 8,5 cm', aperto: '21 × 8,5 cm' },
    spessore: '0,65 cm',
    peso: '55 g',
    capienza: '5 tasche carte, scomparto banconote, tasca documenti, portamonete',
    lavorazione: 'cuciture a macchina, bordi tinti a mano',
    colori: [
      { slug: 'blu', nome: 'Blu' },
      { slug: 'bordeaux', nome: 'Bordeaux' },
      { slug: 'marrone', nome: 'Marrone' },
    ],
    varianti: [
      { colore: 'blu', pelle: 'capra-vegetale', stock: 4 },
      { colore: 'bordeaux', pelle: 'capra-vegetale', stock: 3 },
      { colore: 'marrone', pelle: 'capra-vegetale', stock: 4 },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  // Essenziale (D-030 Parte 2). Pelle ancora da confermare, misure/peso/
  // stock/fodera vuoti: arrivano da Stefano via QG (dati-essenziale.json +
  // scripts/pubblica-essenziale.mjs). Testi § 2.3/2.4 (QG), prezzo deciso
  // dal QG (D-030), spessore dichiarato dal Founder, capienza contata
  // sulle foto.
  //
  // PUBBLICATO IN ANTICIPO il 07/10/2026 su richiesta diretta di Domenico
  // ("devi aggiungere anche il portafoglio nuovo e fai deploy"), in deroga
  // a D-030 Parte 4 / D-031. Il flag datiInArrivo qui sotto dice al blocco
  // di pubblicazione di lasciar passare QUESTO prodotto con i campi vuoti:
  // le righe senza dato non si mostrano (niente riga pelle, misure, peso,
  // cura, iniziali), nulla è inventato, e a vendita spenta non si compra.
  // Lo script di pubblicazione toglie il flag quando scrive i dati veri.
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'essenziale',
    categoria: 'portafogli',
    nome: 'Essenziale',
    pubblicato: true,
    datiInArrivo: true,
    occhiello: 'Portafoglio con fermasoldi · 6 carte',
    occhielloCard: '6 carte · fermasoldi',
    scopri: 'Scopri l’Essenziale',
    sommario: 'Sei carte e un fermasoldi in metallo. Niente di più, niente di superfluo.',
    fraseBreve: 'Sei carte e un fermasoldi in metallo, in 0,55 cm. Per chi porta le banconote piegate e nient’altro.',
    prezzoCentesimi: 5500,
    tascheCarte: 6,
    portamonete: false,
    fermasoldi: true,
    // Disattivate finché Stefano non conferma che su questo modello le
    // iniziali si possono imprimere.
    inizialiDisponibili: false,
    puntiForza: [
      { icona: 'fermasoldi', titolo: 'Fermasoldi in metallo', testo: 'Tiene le banconote ferme e piatte, senza bisogno di uno scomparto in più.' },
      { icona: 'spessore', titolo: '0,55 cm di spessore', testo: 'Lo stesso del Sottile: sparisce nella tasca interna della giacca.' },
      { icona: 'pelle', titolo: 'Due superfici', testo: 'Esterno a grana impressa, interno liscio: due tocchi diversi nello stesso pezzo.' },
      { icona: 'tasche', titolo: '6 tasche per le carte', testo: 'Tre per lato, più due scomparti piatti per documenti e ricevute.' },
    ],
    descrizione: [
      'Il portafoglio di chi ha scelto l’essenziale: sei carte, due scomparti piatti e un fermasoldi in metallo che tiene le banconote al loro posto. Chiuso è sottile quanto il Sottile, e il marchio Barbi è impresso a secco sul fronte.',
    ],
    rimandi: [
      { slug: 'sottile', testo: 'Preferisci lo scomparto per le banconote? Scopri il Sottile →' },
      { slug: 'completo', testo: 'Ti serve il portamonete? Scopri il Completo →' },
    ],
    metaDescription: 'Essenziale: portafoglio con fermasoldi in metallo e 6 carte, 0,55 cm, in pelle bordeaux a grana. 55 €, spedizione inclusa.',
    // Vuoti = da Stefano (l'interno sembra in pelle, ma non si scrive
    // finché non lo conferma: divieto 16).
    fodera: '',
    misure: { chiuso: '', aperto: '' },
    spessore: '0,55 cm',
    peso: '',
    capienza: '6 tasche carte, 2 scomparti piatti, fermasoldi in metallo',
    lavorazione: '',
    colori: [{ slug: 'bordeaux', nome: 'Bordeaux' }],
    varianti: [{ colore: 'bordeaux', pelle: 'grana-da-confermare', stock: null }],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Blocco di pubblicazione (D-030 Parte 4). Gira a ogni build (questo
// modulo è importato da tutte le pagine): se un prodotto con
// `pubblicato: true` usa una pelle non confermata, o ha vuoti misure,
// peso o stock, la build si ferma qui con il messaggio sotto. Nel browser
// (window definito) non gira: il controllo è già passato in build.
// ─────────────────────────────────────────────────────────────────────────
export function validaCatalogo(lista = prodotti, catalogoPelli = pelli) {
  const errori = [];
  for (const p of lista) {
    if (p.pubblicato !== true) continue;
    const varianti = p.varianti || [];
    if (p.datiInArrivo === true) {
      // Deroga esplicita, scritta sul prodotto (oggi: Essenziale, richiesta
      // di Domenico del 07/10/2026): si pubblica con i campi vuoti. Resta
      // obbligatorio che la pelle esista nel catalogo pelli.
      for (const v of varianti) {
        if (!catalogoPelli.find((x) => x.id === v.pelle)) errori.push(`${p.nome} (${v.colore}): la pelle "${v.pelle}" non esiste nel catalogo pelli`);
      }
      continue;
    }
    if (varianti.length === 0) errori.push(`${p.nome}: nessuna variante (colore + pelle + stock)`);
    for (const v of varianti) {
      const pelle = catalogoPelli.find((x) => x.id === v.pelle);
      if (!pelle) errori.push(`${p.nome} (${v.colore}): la pelle "${v.pelle}" non esiste nel catalogo pelli`);
      else if (!pelle.confermata) errori.push(`${p.nome} (${v.colore}): usa la pelle "${v.pelle}" non confermata`);
    }
    const mancanti = [];
    if (!p.misure?.chiuso || !p.misure?.aperto) mancanti.push('misure');
    if (!p.peso) mancanti.push('peso');
    if (varianti.some((v) => !Number.isInteger(v.stock) || v.stock < 0)) mancanti.push('stock');
    if (mancanti.length) errori.push(`${p.nome}: campi vuoti: ${mancanti.join(', ')}`);
  }
  if (errori.length) {
    throw new Error(
      'BLOCCO DI PUBBLICAZIONE (D-030 Parte 4): un prodotto con `pubblicato: true` non ha i dati per andare online.\n' +
        errori.map((e) => `  - ${e}`).join('\n') +
        '\nRimetti `pubblicato: false` oppure completa i dati (arrivano da Stefano, via QG) in src/data/prodotti.js e src/data/pelli.js.'
    );
  }
  return true;
}
if (typeof window === 'undefined') validaCatalogo(prodotti, pelli);

// Pubblicati = online. Visibili = pubblicati + bozze solo in anteprima
// locale (MOSTRA_BOZZE). getProdottoBySlug resta su tutti: serve al
// carrello (righe salvate nel browser) e all'anteprima.
export const prodottiPubblicati = prodotti.filter((p) => p.pubblicato === true);
export const bozze = prodotti.filter((p) => p.pubblicato !== true);
export const prodottiVisibili = prodotti.filter((p) => p.pubblicato === true || MOSTRA_BOZZE);

// D-030 Parte 3/4: i testi che parlano di tre modelli (home, collezione,
// FAQ, "Come nasce", fascia numeri, un punto di forza del Sottile) si
// attivano da soli quando il terzo prodotto è pubblicato. Letto dal numero
// di prodotti pubblicati, non da un interruttore a mano: finché
// l'Essenziale è in bozza restano i testi D-029 a due modelli.
export const TRE_MODELLI = prodottiPubblicati.length >= 3;

// Punto di forza "8 tasche per le carte" del Sottile: seconda riga nella
// versione a tre modelli (D-030 Parte 3, QG); fino ad allora quella D-029.
{
  const tasche = prodotti.find((p) => p.slug === 'sottile')?.puntiForza.find((f) => f.titolo === '8 tasche per le carte');
  if (tasche && TRE_MODELLI) tasche.testo = 'Più scomparto banconote e tasca documenti. Tutto quello che serve, niente di superfluo.';
}

export function getProdottoBySlug(slug) {
  return prodotti.find((p) => p.slug === slug);
}

export function getProdottiByCategoria(categoriaSlug) {
  return prodottiVisibili.filter((p) => p.categoria === categoriaSlug);
}

export function getColore(prodotto, coloreSlug) {
  if (!prodotto) return undefined;
  return prodotto.colori.find((c) => c.slug === coloreSlug);
}

// ── Varianti (colore + pelle) ────────────────────────────────────────────
export function getVarianti(prodotto, coloreSlug) {
  const tutte = prodotto?.varianti || [];
  return coloreSlug ? tutte.filter((v) => v.colore === coloreSlug) : tutte;
}

export function getVariante(prodotto, coloreSlug, pelleId) {
  return getVarianti(prodotto, coloreSlug).find((v) => v.pelle === pelleId);
}

// Stock di una variante: 0 se la variante non esiste o lo stock non è
// ancora un numero (bozza).
export function stockVariante(prodotto, coloreSlug, pelleId) {
  const v = getVariante(prodotto, coloreSlug, pelleId);
  return v && Number.isInteger(v.stock) && v.stock > 0 ? v.stock : 0;
}

export function stockColore(prodotto, coloreSlug) {
  return getVarianti(prodotto, coloreSlug).reduce((t, v) => t + stockVariante(prodotto, v.colore, v.pelle), 0);
}

export function stockTotale(prodotto) {
  return getVarianti(prodotto).reduce((t, v) => t + stockVariante(prodotto, v.colore, v.pelle), 0);
}

// Pelli con almeno un pezzo per un colore, nell'ordine delle varianti.
export function pelliColore(prodotto, coloreSlug) {
  return [...new Set(
    getVarianti(prodotto, coloreSlug)
      .filter((v) => stockVariante(prodotto, v.colore, v.pelle) > 0)
      .map((v) => v.pelle)
  )];
}

// Pelle mostrata per prima per un colore: la prima con stock, altrimenti
// la prima variante di quel colore (es. bozza senza stock).
export function pelleIniziale(prodotto, coloreSlug) {
  return pelliColore(prodotto, coloreSlug)[0] || getVarianti(prodotto, coloreSlug)[0]?.pelle || null;
}

// Tutte le pelli usate da un prodotto (anche senza stock), senza doppioni.
export function pelliProdotto(prodotto) {
  return [...new Set(getVarianti(prodotto).map((v) => v.pelle))];
}

// Pelle della variante principale (la prima): dati strutturati `material`
// e riga pelle della card.
export function pelleVariantePrincipale(prodotto) {
  return getPelle(getVarianti(prodotto)[0]?.pelle) || null;
}

// Pezzi ancora aggiungibili per una variante: stock meno quelli già nel
// carrello (la funzione di conteggio viene da cart.js, passata qui per non
// legare i dati al browser).
export function residuoVariante(prodotto, coloreSlug, pelleId, quantitaNelCarrello) {
  return Math.max(0, stockVariante(prodotto, coloreSlug, pelleId) - quantitaNelCarrello(prodotto.slug, coloreSlug, pelleId));
}

// Swatch di un colore: la macro della capra se su quel prodotto il colore
// è in capra conciata al vegetale, altrimenti nessuna immagine (resta la
// tinta piatta del CSS). Mai la grana di una pelle diversa.
export function swatchColore(prodotto, coloreSlug) {
  return pelleIniziale(prodotto, coloreSlug) === 'capra-vegetale' ? MACRO_PELLE[coloreSlug] : undefined;
}

// Riga "Pelle" della tabella dettagli: nome della pelle (iniziale
// minuscola) più lo spessore se noto — es. "capra conciata al vegetale,
// spessore 1,2-1,3 mm", lo stesso testo di prima di D-030. Vuota se la
// pelle non ha ancora un nome (bozza).
export function rigaPelle(pelle) {
  if (!pelle?.nome) return '';
  return pelle.nome.charAt(0).toLowerCase() + pelle.nome.slice(1) + (pelle.spessore ? `, spessore ${pelle.spessore}` : '');
}

// Tabella "Dettagli e misure": righe nell'ordine del pacchetto, saltando
// quelle senza dato. La riga Pelle viene dal catalogo pelli, per la pelle
// scelta.
export function specificheProdotto(prodotto, pelleId) {
  const pelle = getPelle(pelleId || pelleIniziale(prodotto, prodotto.colori[0]?.slug));
  return [
    ['Pelle', rigaPelle(pelle)],
    ['Fodera', prodotto.fodera],
    ['Chiuso', prodotto.misure?.chiuso],
    ['Aperto', prodotto.misure?.aperto],
    ['Spessore', prodotto.spessore],
    ['Peso', prodotto.peso],
    ['Capienza', prodotto.capienza],
    ['Lavorazione', prodotto.lavorazione],
  ].filter(([, valore]) => valore && String(valore).trim() !== '');
}

// Formatta un importo in centesimi come prezzo italiano, es. 4900 → "49,00 €".
export function formatEuro(centesimi) {
  return (centesimi / 100).toFixed(2).replace('.', ',') + ' €';
}

// Prezzo "da vetrina" (D-029 § 2.7): "49 €" senza decimali quando
// l'importo è intero — convenzione dell'alta pelletteria. Carrello,
// checkout e riepilogo restano su formatEuro (formato completo). Se un
// giorno un prezzo non fosse tondo, ricade sul formato completo invece di
// troncare i centesimi.
export function formatEuroBreve(centesimi) {
  return centesimi % 100 === 0 ? `${centesimi / 100} €` : formatEuro(centesimi);
}
