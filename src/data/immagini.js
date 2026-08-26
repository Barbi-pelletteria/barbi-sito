// Percorsi delle foto vere, quando ci sono. Finché una voce è null, il
// prodotto mostra il segnaposto disegnato al suo posto (src/components/FotoSegnaposto.astro).
// Sostituire il segnaposto con lo scatto vero è una riga sola per prodotto e colore.
export const immaginiProdotto = {
  sottile: { blu: null, bordeaux: null, marrone: null },
  completo: { blu: null, bordeaux: null, marrone: null },
};

// Colore mostrato per primo su ogni scheda. È una scelta di vetrina, non di
// magazzino: serve solo perché le due schede affiancate non partano dallo
// stesso colore (come nell'anteprima approvata). Se il colore indicato è
// esaurito, il componente ripiega sul primo disponibile.
export const coloreVetrina = {
  sottile: 'blu',
  completo: 'marrone',
};

export function immagineProdotto(slug, colore) {
  return immaginiProdotto[slug]?.[colore] || null;
}
