// Carrello lato client, senza backend: vive in localStorage del browser.
// Struttura salvata: [{ slug, quantita }, ...]
// Nota: questo NON è "browser storage in un artifact di conversazione" —
// è codice di un sito vero che gira su Netlify, il pattern è quello standard
// per un carrello su sito statico senza backend proprio.

const CHIAVE = 'barbi_cart_v1';

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

export function addToCart(slug, quantita = 1) {
  const cart = getCart();
  const riga = cart.find((r) => r.slug === slug);
  if (riga) {
    riga.quantita += quantita;
  } else {
    cart.push({ slug, quantita });
  }
  salva(cart);
  return cart;
}

export function updateQuantita(slug, quantita) {
  let cart = getCart();
  if (quantita <= 0) {
    cart = cart.filter((r) => r.slug !== slug);
  } else {
    const riga = cart.find((r) => r.slug === slug);
    if (riga) riga.quantita = quantita;
  }
  salva(cart);
  return cart;
}

export function removeFromCart(slug) {
  const cart = getCart().filter((r) => r.slug !== slug);
  salva(cart);
  return cart;
}

export function clearCart() {
  salva([]);
}

export function getCartCount() {
  return getCart().reduce((tot, r) => tot + r.quantita, 0);
}
