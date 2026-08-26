// Carrello lato client, senza backend: vive in localStorage del browser.
// Struttura salvata: [{ slug, colore, iniziali, quantita }, ...]
// Ogni riga è identificata da slug + colore + iniziali: lo stesso modello in
// due colori (o con/senza iniziali) sono due righe distinte.
// Nota: questo NON è "browser storage in un artifact di conversazione" —
// è codice di un sito vero che gira su Netlify, il pattern è quello standard
// per un carrello su sito statico senza backend proprio.

const CHIAVE = 'barbi_cart_v2';

// Chiave univoca di una riga. Le iniziali sono normalizzate (maiuscolo, senza spazi).
export function lineKey(slug, colore, iniziali) {
  return `${slug}|${colore}|${(iniziali || '').trim().toUpperCase()}`;
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

// Pezzi già nel carrello per una combinazione modello+colore (a prescindere
// dalle iniziali): serve per non superare lo stock disponibile di quel colore.
export function getQuantitaColore(slug, colore) {
  return getCart()
    .filter((r) => r.slug === slug && r.colore === colore)
    .reduce((tot, r) => tot + r.quantita, 0);
}

export function addToCart({ slug, colore, iniziali = '', quantita = 1 }) {
  const cart = getCart();
  const iniz = (iniziali || '').trim().toUpperCase();
  const key = lineKey(slug, colore, iniz);
  const riga = cart.find((r) => lineKey(r.slug, r.colore, r.iniziali) === key);
  if (riga) {
    riga.quantita += quantita;
  } else {
    cart.push({ slug, colore, iniziali: iniz, quantita });
  }
  salva(cart);
  return cart;
}

export function updateQuantita(key, quantita) {
  let cart = getCart();
  if (quantita <= 0) {
    cart = cart.filter((r) => lineKey(r.slug, r.colore, r.iniziali) !== key);
  } else {
    const riga = cart.find((r) => lineKey(r.slug, r.colore, r.iniziali) === key);
    if (riga) riga.quantita = quantita;
  }
  salva(cart);
  return cart;
}

export function removeFromCart(key) {
  const cart = getCart().filter((r) => lineKey(r.slug, r.colore, r.iniziali) !== key);
  salva(cart);
  return cart;
}

export function clearCart() {
  salva([]);
}

export function getCartCount() {
  return getCart().reduce((tot, r) => tot + r.quantita, 0);
}
