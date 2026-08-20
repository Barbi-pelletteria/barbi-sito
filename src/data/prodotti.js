// Segnaposto ESATTO da usare ovunque manchi un dato reale (nome, prezzo, descrizione).
// Non modificare questo testo: deve restare identico in tutto il sito.
// Fonte della regola: PACCHETTO_SETUP_TECNICO_2026-08-20.md, sezione B3.
export const PLACEHOLDER = '[DA COMPLETARE — dati mancanti, vedi blocco 4 DOMANDE_APERTURA.md]';

// Le 3 categorie del catalogo (STATO.md: "portafogli, borse, portachiavi fatti a mano").
export const categorie = [
  { slug: 'portafogli', nome: 'Portafogli' },
  { slug: 'borse', nome: 'Borse' },
  { slug: 'portachiavi', nome: 'Portachiavi' },
];

// UN SOLO prodotto placeholder, come richiesto dal pacchetto ("template, un solo
// prodotto placeholder"). Aggiungere prodotti veri qui dentro appena arrivano
// i dati di blocco 4 — è l'unico file da toccare per farlo.
export const prodotti = [
  {
    slug: 'prodotto-placeholder',
    categoria: 'portafogli',
    nome: PLACEHOLDER,
    descrizione: PLACEHOLDER,
    immagine: '/prodotti/placeholder.svg',

    // ATTENZIONE — uso tecnico, non un prezzo reale:
    // Stripe richiede un importo numerico per creare una Checkout Session,
    // anche in modalità test. Questo valore NON compare mai in nessuna pagina
    // rivolta al cliente (lì c'è sempre e solo PLACEHOLDER) — serve solo al
    // collaudo tecnico del pagamento con la carta di test 4242 4242 4242 4242.
    // Sostituire con il prezzo vero (P-04 / domanda 4.1) appena esiste, e a
    // quel punto anche "prezzo" sopra smette di essere il segnaposto.
    prezzoTestCentesimi: 100,
  },
];

export function getProdottoBySlug(slug) {
  return prodotti.find((p) => p.slug === slug);
}

export function getProdottiByCategoria(categoriaSlug) {
  return prodotti.filter((p) => p.categoria === categoriaSlug);
}
