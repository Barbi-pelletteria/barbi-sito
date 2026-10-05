// Foto prodotto reali (PACCHETTO_FOTO_PRODOTTO_2026-09-02).
//
// Convenzione di percorsi — dichiarata qui, standard per le foto future
// (06-con-carta, le macro della grana):
//   public/prodotti/<modello>-<colore>/NN-nome.{webp,jpg}
// Stesso nome del file sorgente in FOTO_SITO (dove NN-nome è l'ordine di
// galleria), solo "_" fra modello e colore diventa "-" nel percorso
// pubblico. Le foto 01/02/04/05 sono le stesse foto per Sottile e
// Completo dello stesso colore (identici all'esterno, unica differenza è
// il portamonete) — file duplicati in cartelle separate per prodotto, non
// un'unica fonte con lookup condizionale nel codice. Vedi LEGGIMI.md in
// FOTO_SITO e RESOCONTO_FOTO_PRODOTTO_2026-09-02.md.
//
// Larghezza/altezza reali e l'elenco file presenti per prodotto+colore
// vengono da foto-manifest.json, generato da
// scripts/ottimizza-foto-prodotto.mjs — non scritti a mano. Rilanciare
// quello script (mai modificare il manifest direttamente) è l'unico modo
// corretto di aggiungere una foto, incluso il futuro 06-con-carta.
//
// D-030: le foto si cercano per variante. Una variante {colore, pelle,
// foto?} con `foto` punta a una cartella propria (chiave del manifest al
// posto del colore); senza, si usano le foto del colore. La macro della
// pelle in coda alla galleria è della capra conciata al vegetale: si
// aggiunge solo quando la pelle scelta è quella.
import manifest from './foto-manifest.json';
import macroPelle from './macro-pelle-manifest.json';
import { getVariante, pelleIniziale } from './prodotti.js';

// Didascalie vere per tipo di scatto — mai "portafoglio" da solo, sempre
// cosa si vede + modello + colore (per screen reader e Google Immagini).
// Verificate guardando gli scatti veri, non dedotte dal solo nome del
// file: "02-aperto" mostra le tasche carte e lo scomparto documenti/
// banconote (il portamonete resta chiuso lì, è "03" a mostrarlo aperto).
const DIDASCALIE = {
  '01-chiuso': (nome, colore) => `Portafoglio ${nome} in pelle ${colore}, chiuso`,
  '02-aperto': (nome, colore) =>
    `Portafoglio ${nome} in pelle ${colore}, aperto, con le tasche per le carte e lo scomparto per documenti e banconote`,
  '03-portamonete': (nome, colore) =>
    `Portafoglio ${nome} in pelle ${colore}, portamonete aperto con il bottone a vista`,
  '04-dettaglio-tasche': (nome, colore) =>
    `Dettaglio delle tasche per le carte del portafoglio ${nome} in pelle ${colore}`,
  '05-dettaglio-bordo': (nome, colore) =>
    `Dettaglio del bordo tinto a mano del portafoglio ${nome} in pelle ${colore}`,
};

// Didascalie specifiche per prodotto, quando gli scatti mostrano altro
// rispetto allo schema comune (testi alt scritti dal QG per quel modello).
// Essenziale: D-030 § 2.2 — "03" è il fermasoldi, non un portamonete.
const DIDASCALIE_PRODOTTO = {
  essenziale: {
    '01-chiuso': 'Portafoglio Essenziale in pelle bordeaux a grana, chiuso, con fermasoldi in metallo',
    '02-aperto': 'Portafoglio Essenziale aperto: sei tasche per le carte e fermasoldi centrale',
    '03-fermasoldi': 'Dettaglio del fermasoldi in metallo del portafoglio Essenziale',
    '05-dettaglio-bordo': 'Dettaglio dell’angolo del portafoglio Essenziale: grana della pelle e cucitura',
  },
};

function didascalia(prodotto, colore, id) {
  const propria = DIDASCALIE_PRODOTTO[prodotto.slug]?.[id];
  if (propria) return propria;
  const generica = DIDASCALIE[id] || DIDASCALIE['01-chiuso'];
  return generica(prodotto.nome, colore.nome.toLowerCase());
}

// Galleria completa, in ordine, per un prodotto+colore(+pelle): gli scatti
// numerati (01-05, presto anche 06-con-carta) più, in coda, la macro della
// pelle di quel colore come immagine di dettaglio del materiale (richiesta
// diretta del Founder, PACCHETTO_MACRO_PELLE) — condivisa fra Sottile e
// Completo dello stesso colore, non duplicata per prodotto come i file
// numerati: non è una foto DI un prodotto specifico, è la pelle in sé.
// Senza pelleId si prende la pelle iniziale del colore (prodotti.js).
export function galleriaProdotto(prodotto, colore, pelleId) {
  const pelle = pelleId || pelleIniziale(prodotto, colore.slug);
  const variante = getVariante(prodotto, colore.slug, pelle);
  const chiave = variante?.foto || colore.slug;
  const file = manifest[prodotto.slug]?.[chiave] || [];
  const base = `/prodotti/${prodotto.slug}-${chiave}`;
  const scatti = file.map((f) => ({
    id: f.id,
    webp: `${base}/${f.id}.webp`,
    jpg: `${base}/${f.id}.jpg`,
    width: f.width,
    height: f.height,
    alt: didascalia(prodotto, colore, f.id),
  }));
  const macro = macroPelle[colore.slug];
  if (macro && pelle === 'capra-vegetale') {
    scatti.push({
      id: 'macro-pelle',
      webp: macro.macroWebp,
      jpg: macro.macroJpg,
      width: macro.width,
      height: macro.height,
      alt: `Macrofotografia della pelle ${colore.nome.toLowerCase()} conciata al vegetale, dettaglio della grana`,
    });
  }
  return scatti;
}

// La stessa macro, presa da sola — usata da ComeNasce.astro (sezione "La
// pelle" in home) e da qualunque altro punto del sito ne parli senza
// essere legato a un prodotto+colore specifico.
export function macroProdotto(coloreSlug) {
  const m = macroPelle[coloreSlug];
  if (!m) return null;
  return { webp: m.macroWebp, jpg: m.macroJpg, width: m.width, height: m.height };
}

// Copertina (01-chiuso, sempre primo in galleria per costruzione del
// manifest): anteprima del selettore colore su ProductCard.astro. Non un
// campo separato — la stessa fonte della galleria, un solo posto dove le
// foto di un colore possono disallinearsi.
export function copertinaProdotto(prodotto, colore, pelleId) {
  return galleriaProdotto(prodotto, colore, pelleId)[0] || null;
}

// Colore mostrato per primo su ogni scheda. È una scelta di vetrina, non di
// magazzino: serve solo perché le schede affiancate non partano dallo
// stesso colore (come nell'anteprima approvata). Se il colore indicato è
// esaurito, il componente ripiega sul primo disponibile.
export const coloreVetrina = {
  sottile: 'blu',
  completo: 'marrone',
  essenziale: 'bordeaux',
};
