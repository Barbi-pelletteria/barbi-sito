// Test anti-sovravendita sulla variante colore+pelle (D-030 § 1.3.5 e
// Parte 5 punto 4) e del blocco di pubblicazione (Parte 4). Prima di
// D-030 non esistevano test nel repository: questi coprono il conto
// "pezzi ancora aggiungibili" usato da scheda prodotto, card e carrello,
// e la validazione che ferma la build.
//
// Si lanciano con `npm test` (node --test, nessuna dipendenza in più).
import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// cart.js vive in localStorage del browser: qui un finto window con un
// localStorage in memoria basta, il modulo non usa altro del DOM.
before(() => {
  const memoria = new Map();
  const w = new EventTarget();
  w.localStorage = {
    getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
    setItem: (k, v) => memoria.set(k, String(v)),
    removeItem: (k) => memoria.delete(k),
  };
  globalThis.window = w;
});

const cart = await import('../src/scripts/cart.js');
const catalogo = await import('../src/data/prodotti.js');
const { pelli } = await import('../src/data/pelli.js');

beforeEach(() => cart.clearCart());

// Prodotto di prova completo (tutti i dati che il blocco controlla).
function prodottoDiProva(extra = {}) {
  return {
    slug: 'prova', nome: 'Prova', categoria: 'portafogli', pubblicato: true,
    misure: { chiuso: '10 × 8 cm', aperto: '20 × 8 cm' }, peso: '45 g',
    colori: [{ slug: 'blu', nome: 'Blu' }],
    varianti: [{ colore: 'blu', pelle: 'capra-vegetale', stock: 1 }],
    ...extra,
  };
}

test('due pelli dello stesso modello e colore sono righe separate del carrello', () => {
  cart.addToCart({ slug: 'sottile', colore: 'blu', pelle: 'capra-vegetale', iniziali: '', quantita: 1 });
  cart.addToCart({ slug: 'sottile', colore: 'blu', pelle: 'vitello-liscio', iniziali: '', quantita: 1 });
  cart.addToCart({ slug: 'sottile', colore: 'blu', pelle: 'capra-vegetale', iniziali: '', quantita: 2 });
  const righe = cart.getCart();
  assert.equal(righe.length, 2);
  assert.notEqual(
    cart.lineKey('sottile', 'blu', 'capra-vegetale', ''),
    cart.lineKey('sottile', 'blu', 'vitello-liscio', '')
  );
  assert.equal(righe.find((r) => r.pelle === 'capra-vegetale').quantita, 3);
});

test('i pezzi nel carrello si contano per variante colore+pelle, non per solo colore', () => {
  cart.addToCart({ slug: 'sottile', colore: 'blu', pelle: 'capra-vegetale', iniziali: '', quantita: 2 });
  cart.addToCart({ slug: 'sottile', colore: 'blu', pelle: 'capra-vegetale', iniziali: 'AB', quantita: 1 });
  cart.addToCart({ slug: 'sottile', colore: 'blu', pelle: 'vitello-liscio', iniziali: '', quantita: 1 });
  // Con e senza iniziali attingono allo stesso magazzino della variante.
  assert.equal(cart.getQuantitaVariante('sottile', 'blu', 'capra-vegetale'), 3);
  assert.equal(cart.getQuantitaVariante('sottile', 'blu', 'vitello-liscio'), 1);
  assert.equal(cart.getQuantitaVariante('sottile', 'bordeaux', 'capra-vegetale'), 0);
});

test('il residuo di una variante scende con il carrello e non va sotto zero', () => {
  const sottile = catalogo.getProdottoBySlug('sottile');
  const stock = catalogo.stockVariante(sottile, 'blu', 'capra-vegetale');
  assert.ok(stock > 0, 'il Sottile blu in capra deve avere stock reale');
  cart.addToCart({ slug: 'sottile', colore: 'blu', pelle: 'capra-vegetale', iniziali: '', quantita: stock });
  assert.equal(catalogo.residuoVariante(sottile, 'blu', 'capra-vegetale', cart.getQuantitaVariante), 0);
  cart.addToCart({ slug: 'sottile', colore: 'blu', pelle: 'capra-vegetale', iniziali: 'CD', quantita: 1 });
  assert.equal(catalogo.residuoVariante(sottile, 'blu', 'capra-vegetale', cart.getQuantitaVariante), 0);
  // Una variante inesistente (pelle mai usata su quel colore) non ha stock.
  assert.equal(catalogo.stockVariante(sottile, 'blu', 'vitello-liscio'), 0);
});

test('lo stock di un colore è la somma delle sue varianti; le pelli disponibili sono quelle con stock', () => {
  const p = prodottoDiProva({
    varianti: [
      { colore: 'blu', pelle: 'capra-vegetale', stock: 2 },
      { colore: 'blu', pelle: 'vitello-liscio', stock: 3 },
      { colore: 'blu', pelle: 'senza-dato', stock: null },
    ],
  });
  assert.equal(catalogo.stockColore(p, 'blu'), 5);
  assert.deepEqual(catalogo.pelliColore(p, 'blu'), ['capra-vegetale', 'vitello-liscio']);
  assert.equal(catalogo.pelleIniziale(p, 'blu'), 'capra-vegetale');
});

test('il catalogo reale passa la validazione e i pubblicati hanno tutti pubblicato: true', () => {
  assert.doesNotThrow(() => catalogo.validaCatalogo(catalogo.prodotti, pelli));
  assert.ok(catalogo.prodottiPubblicati.length >= 2);
  assert.ok(catalogo.prodottiPubblicati.every((p) => p.pubblicato === true));
  assert.ok(catalogo.bozze.every((p) => p.pubblicato !== true));
});

test('una bozza non è fra i pubblicati ma resta raggiungibile per slug', () => {
  const bozza = prodottoDiProva({ slug: 'bozza', pubblicato: false, varianti: [{ colore: 'blu', pelle: 'grana-da-confermare', stock: null }] });
  const lista = [...catalogo.prodotti, bozza];
  assert.doesNotThrow(() => catalogo.validaCatalogo(lista, pelli));
  assert.ok(!lista.filter((p) => p.pubblicato === true).some((p) => p.slug === 'bozza'));
});

test('la deroga datiInArrivo lascia pubblicare con i campi vuoti, ma solo con una pelle che esiste nel catalogo', () => {
  const vuoto = prodottoDiProva({ misure: { chiuso: '', aperto: '' }, peso: '', varianti: [{ colore: 'blu', pelle: 'grana-da-confermare', stock: null }] });
  assert.throws(() => catalogo.validaCatalogo([vuoto], pelli));
  assert.doesNotThrow(() => catalogo.validaCatalogo([{ ...vuoto, datiInArrivo: true }], pelli));
  assert.throws(
    () => catalogo.validaCatalogo([{ ...vuoto, datiInArrivo: true, varianti: [{ colore: 'blu', pelle: 'inventata', stock: null }] }], pelli),
    /non esiste nel catalogo pelli/
  );
});

test('la validazione blocca un prodotto pubblicato con pelle non confermata o dati mancanti', () => {
  // Pelle non confermata → blocco, con il nome della pelle.
  assert.throws(
    () => catalogo.validaCatalogo([prodottoDiProva({ varianti: [{ colore: 'blu', pelle: 'grana-da-confermare', stock: 1 }] })], pelli),
    /grana-da-confermare.*non confermata/
  );
  // Pelle inesistente → blocco.
  assert.throws(
    () => catalogo.validaCatalogo([prodottoDiProva({ varianti: [{ colore: 'blu', pelle: 'inventata', stock: 1 }] })], pelli),
    /non esiste nel catalogo pelli/
  );
  // Pelle confermata ma misure, peso e stock vuoti → blocco, con i campi nominati.
  assert.throws(
    () => catalogo.validaCatalogo([prodottoDiProva({ misure: { chiuso: '', aperto: '' }, peso: '', varianti: [{ colore: 'blu', pelle: 'capra-vegetale', stock: null }] })], pelli),
    /campi vuoti: misure, peso, stock/
  );
  // Dati completi → passa. Non pubblicato → mai bloccato, anche vuoto.
  assert.doesNotThrow(() => catalogo.validaCatalogo([prodottoDiProva()], pelli));
  assert.doesNotThrow(() => catalogo.validaCatalogo([prodottoDiProva({ pubblicato: false, peso: '', varianti: [] })], pelli));
});
