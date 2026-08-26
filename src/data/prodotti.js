// ─────────────────────────────────────────────────────────────────────────
// Interruttore VENDITA ATTIVA (punto 4C del pacchetto catalogo).
//   false → i pulsanti "Aggiungi al carrello" diventano "Disponibile a breve"
//           con un link che scrive a stefano-barbi@libero.it. Carrello e
//           checkout restano raggiungibili ma non pubblicizzati.
//   true  → il sito vende normalmente.
// Il sito va online per essere visitato PRIMA del via libera fiscale: si passa
// alla vendita cambiando solo questo valore.
// ─────────────────────────────────────────────────────────────────────────
export const VENDITA_ATTIVA = false;

// Email di contatto pubblica del laboratorio.
export const EMAIL_CONTATTO = 'stefano-barbi@libero.it';

// Sovrapprezzo per l'incisione delle iniziali (in centesimi). +10,00 €.
export const INIZIALI_CENTESIMI = 1000;

// Una sola categoria: "Portafogli". Con due prodotti le altre non servono.
export const categorie = [
  { slug: 'portafogli', nome: 'Portafogli' },
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

// Avviso legale accanto alla casella delle iniziali (testo verbatim).
export const avvisoIniziali =
  'Le iniziali rendono il portafoglio unico: per questo un pezzo personalizzato non può essere restituito.';

// I DUE prodotti reali. Stock per singolo colore (punto 4A).
export const prodotti = [
  {
    slug: 'sottile',
    categoria: 'portafogli',
    nome: 'Sottile',
    occhiello: 'Portafoglio da 8 carte',
    // Riga singola mostrata sulla scheda in home (testo verbatim dall'anteprima).
    sommario: 'Mezzo centimetro di spessore. Sta nella tasca interna di una giacca senza deformarla.',
    prezzoCentesimi: 4900,
    immagine: '/prodotti/placeholder.svg',
    descrizione: [
      'Otto tasche per le carte, lo spazio per i documenti e per le banconote, e nient’altro. Chiuso è alto 8,5 cm e spesso poco più di mezzo centimetro: sta nella tasca interna di una giacca senza deformarla, e in quella dei pantaloni senza farsi sentire.',
      'Stefano lo descrive così: «un portafoglio ridimensionato per lo stile di vita odierno». Meno contante, più carte, meno ingombro.',
      'La pelle è di capra conciata al vegetale, spessore 1,2-1,3 mm, con i bordi tinti a mano uno per uno. La fodera è in poliestere.',
    ],
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
    occhiello: 'Portafoglio con portamonete',
    // Riga singola mostrata sulla scheda in home (testo verbatim dall'anteprima).
    sommario: 'Il classico di tutti i giorni. Non lascia fuori niente, spiccioli compresi.',
    prezzoCentesimi: 5500,
    immagine: '/prodotti/placeholder.svg',
    descrizione: [
      'Cinque tasche per le carte, lo spazio per documenti e banconote, e il portamonete. È il portafoglio classico: quello che serve quando in tasca finisce di tutto, spiccioli compresi.',
      'Stefano lo chiama «il classico per l’uso di tutti i giorni». Un millimetro più spesso del Sottile, cinque grammi in più, e in cambio non lascia fuori niente.',
      'La pelle è di capra conciata al vegetale, spessore 1,2-1,3 mm, con i bordi tinti a mano uno per uno. La fodera è in poliestere.',
    ],
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
