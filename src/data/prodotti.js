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

// Blocco "Come si cura", identico su entrambe le schede (testo verbatim).
export const curaProdotto = {
  titolo: 'Come si cura',
  intro:
    'La pelle è conciata e tinta naturalmente, senza protezioni chimiche. È un materiale vivo: si segna, cambia tono e con l’uso diventa suo. Per farlo invecchiare bene:',
  punti: [
    'tienilo lontano dall’acqua — pioggia, schizzi, umidità',
    'evita creme, oli, unguenti e il contatto con il cibo',
    'non lasciarlo al sole né vicino a fonti di calore',
    'attenzione al contatto prolungato con indumenti di colore molto diverso: il colore può trasferirsi in entrambe le direzioni',
  ],
  chiusura: 'Conservalo in un luogo asciutto, al riparo dalla luce diretta.',
};

// Riquadro iniziali sulla scheda prodotto (D-029 § 4.3, testo del QG).
export const avvisoIniziali =
  'Impresse sulla pelle prima della spedizione. Rendono il portafoglio solo tuo: per questo un pezzo personalizzato non può essere reso.';

// Casella di consenso dei moduli newsletter/avvisami (D-029 § 4.11): un
// testo solo, usato dal footer, dal banner e dalla scheda prodotto.
export const CONSENSO_NEWSLETTER =
  'Accetto di ricevere email da Barbi Pelletteria su novità e nuovi modelli. Posso annullare l’iscrizione in qualsiasi momento.';

// I DUE prodotti reali. Stock per singolo colore (punto 4A).
export const prodotti = [
  // Tutti i testi qui sotto (occhielli, sommario, fraseBreve, puntiForza,
  // descrizione, rimando, metaDescription) sono quelli definitivi del QG,
  // D-029 § 4.1/4.3/4.4/4.14 — non riscritti. Apostrofi tipografici come
  // nel resto del sito (uniformati il 26/08).
  {
    slug: 'sottile',
    categoria: 'portafogli',
    nome: 'Sottile',
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
    rimando: { slug: 'completo', testo: 'Ti serve anche il portamonete? Scopri il Completo →' },
    metaDescription: 'Sottile: portafoglio slim da 8 carte, 0,55 cm, in pelle di capra conciata al vegetale con bordi tinti a mano. 49 €, spedizione inclusa.',
    specifiche: [
      ['Pelle', 'capra conciata al vegetale, spessore 1,2-1,3 mm'],
      ['Fodera', 'poliestere'],
      ['Chiuso', '10,9 × 8,5 cm'],
      ['Aperto', '21 × 8,5 cm'],
      ['Spessore', '0,55 cm'],
      ['Peso', '50 g'],
      ['Capienza', '8 tasche carte, scomparto banconote, tasca documenti (nessun portamonete)'],
      ['Lavorazione', 'cuciture a macchina, bordi tinti a mano'],
    ],
    colori: [
      { slug: 'blu', nome: 'Blu', stock: 4 },
      { slug: 'bordeaux', nome: 'Bordeaux', stock: 5 },
      { slug: 'marrone', nome: 'Marrone', stock: 4 },
    ],
  },
  {
    slug: 'completo',
    categoria: 'portafogli',
    nome: 'Completo',
    occhiello: 'Portafoglio classico · con portamonete',
    occhielloCard: '5 carte · portamonete',
    scopri: 'Scopri il Completo',
    sommario: 'Il portafoglio classico, senza ingombro: carte, banconote, documenti e monete in 0,65 cm.',
    fraseBreve: 'Carte, banconote, documenti e monete in 0,65 cm. Il classico di ogni giorno, senza ingombro.',
    prezzoCentesimi: 5500,
    tascheCarte: 5,
    portamonete: true,
    puntiForza: [
      { icona: 'portamonete', titolo: 'Portamonete con patta', testo: 'Chiuso da un bottone: le monete restano al loro posto.' },
      { icona: 'spessore', titolo: '0,65 cm di spessore', testo: 'Solo un millimetro in più del Sottile, e non lascia fuori niente.' },
      { icona: 'pelle', titolo: 'Pelle conciata al vegetale', testo: 'Capra, spessore 1,2-1,3 mm. Senza protezioni chimiche: con l’uso cambia tono e diventa tuo.' },
      { icona: 'bordi', titolo: 'Bordi tinti a mano', testo: 'Uno per uno, a pennello. Il dettaglio che distingue un portafoglio fatto con cura.' },
    ],
    descrizione: [
      'Stefano lo chiama «il classico per l’uso di tutti i giorni». Cinque tasche per le carte, scomparto banconote, tasca documenti e portamonete. Chiuso misura 10,9 × 8,5 cm e pesa 55 grammi.',
    ],
    rimando: { slug: 'sottile', testo: 'Preferisci qualcosa di ancora più sottile? Scopri il Sottile →' },
    metaDescription: 'Completo: portafoglio con portamonete e 5 carte, 0,65 cm, in pelle di capra conciata al vegetale con bordi tinti a mano. 55 €, spedizione inclusa.',
    specifiche: [
      ['Pelle', 'capra conciata al vegetale, spessore 1,2-1,3 mm'],
      ['Fodera', 'poliestere'],
      ['Chiuso', '10,9 × 8,5 cm'],
      ['Aperto', '21 × 8,5 cm'],
      ['Spessore', '0,65 cm'],
      ['Peso', '55 g'],
      ['Capienza', '5 tasche carte, scomparto banconote, tasca documenti, portamonete'],
      ['Lavorazione', 'cuciture a macchina, bordi tinti a mano'],
    ],
    colori: [
      { slug: 'blu', nome: 'Blu', stock: 4 },
      { slug: 'bordeaux', nome: 'Bordeaux', stock: 3 },
      { slug: 'marrone', nome: 'Marrone', stock: 4 },
    ],
  },
];

export function getProdottoBySlug(slug) {
  return prodotti.find((p) => p.slug === slug);
}

export function getProdottiByCategoria(categoriaSlug) {
  return prodotti.filter((p) => p.categoria === categoriaSlug);
}

export function getColore(prodotto, coloreSlug) {
  if (!prodotto) return undefined;
  return prodotto.colori.find((c) => c.slug === coloreSlug);
}

// Formatta un importo in centesimi come prezzo italiano, es. 4900 → "49,00 €".
export function formatEuro(centesimi) {
  return (centesimi / 100).toFixed(2).replace('.', ',') + ' €';
}

// Prezzo "da vetrina" (D-029 § 2.7): "49 €" senza decimali quando
// l'importo è intero — convenzione dell'alta pelletteria. Carrello,
// checkout e riepilogo restano su formatEuro (formato completo). Se un
// giorno un prezzo non fosse tondo, ricade sul formato completo invece di
// troncare i centesimi.
export function formatEuroBreve(centesimi) {
  return centesimi % 100 === 0 ? `${centesimi / 100} €` : formatEuro(centesimi);
}
