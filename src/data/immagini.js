// Percorsi delle foto vere, quando ci sono. Finché una voce è null, il
// prodotto mostra il segnaposto disegnato al suo posto (src/components/FotoSegnaposto.astro).
// Sostituire il segnaposto con lo scatto vero è una riga sola per prodotto e colore.
export const immaginiProdotto = {
  sottile: { blu: null, bordeaux: null, marrone: null },
  completo: { blu: null, bordeaux: null, marrone: null },
};

export function immagineProdotto(slug, colore) {
  return immaginiProdotto[slug]?.[colore] || null;
}
