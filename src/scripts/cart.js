// Carrello lato client, senza backend: vive in localStorage del browser.
// Struttura salvata: [{ slug, colore, pelle, iniziali, quantita }, ...]
// Ogni riga è identificata da slug + colore + pelle + iniziali (D-030): lo
// stesso modello in due colori, in due pelli, o con/senza iniziali, sono
// righe distinte. La pelle è parte dell'identità del pezzo: senza, Stefano
// non saprebbe quale portafoglio spedire.
// Nota: questo NON è "browser storage in un artifact di conversazione" —
// è codice di un sito vero (Cloudflare Pages), il pattern è quello standard
// per un carrello su sito statico senza backend proprio.
//
// Chiave v3 (prima v2): le righe salvate prima di D-030 non avevano la
// pelle e non vengono lette. A vendita mai aperta non esistono carrelli
// veri da conservare, e una riga senza pelle non saprebbe cosa ordinare.

const CHIAVE = 'barbi_cart_v3';

// Chiave univoca di una riga. Le iniziali sono normalizzate (maiuscolo, senza spazi).
export function lineKey(slug, colore, pelle, iniziali) {
  return `${slug}|${colore}|${pelle || ''}|${(iniziali || '').trim().toUpperCase()}`;
}

function keyRiga(r) {
  return lineKey(r.slug, r.colore, r.pelle, r.iniziali);
}

export function getCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CHIAVE);
    const cart = raw ? JSON.parse(raw) : [];
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function salva(cart) {
  window.localStorage.setItem(CHIAVE, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('barbi:cart-changed', { detail: { cart } }));
}

// Pezzi già nel carrello per una variante modello+colore+pelle (a
// prescindere dalle iniziali): serve per non superare lo stock disponibile
// di quella variante (anti-sovravendita, D-030 § 1.3.5).
export function getQuantitaVariante(slug, colore, pelle) {
  return getCart()
    .filter((r) => r.slug === slug && r.colore === colore && (r.pelle || '') === (pelle || ''))
    .reduce((tot, r) => tot + r.quantita, 0);
}

export function addToCart({ slug, colore, pelle, iniziali = '', quantita = 1 }) {
  const cart = getCart();
  const iniz = (iniziali || '').trim().toUpperCase();
  const pelleId = pelle || '';
  const key = lineKey(slug, colore, pelleId, iniz);
  const riga = cart.find((r) => keyRiga(r) === key);
  if (riga) {
    riga.quantita += quantita;
  } else {
    cart.push({ slug, colore, pelle: pelleId, iniziali: iniz, quantita });
  }
  salva(cart);
  return cart;
}

export function updateQuantita(key, quantita) {
  let cart = getCart();
  if (quantita <= 0) {
    cart = cart.filter((r) => keyRiga(r) !== key);
  } else {
    const riga = cart.find((r) => keyRiga(r) === key);
    if (riga) riga.quantita = quantita;
  }
  salva(cart);
  return cart;
}

export function removeFromCart(key) {
  const cart = getCart().filter((r) => keyRiga(r) !== key);
  salva(cart);
  return cart;
}

export function clearCart() {
  salva([]);
}

export function getCartCount() {
  return getCart().reduce((tot, r) => tot + r.quantita, 0);
}
