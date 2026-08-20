// Wrapper minimo su gtag.js. Se GA4 non è ancora configurato (manca il
// Measurement ID, B4 non ancora fatto) gli eventi non falliscono: vengono
// solo ignorati in silenzio, così il resto del sito funziona comunque.
export function trackEvent(nome, parametri = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', nome, parametri);
  }
}
