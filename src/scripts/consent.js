// Consenso preventivo ai cookie (punto 4B del pacchetto).
// GA4 NON parte al caricamento della pagina: si carica solo dopo che il
// visitatore ha premuto "Accetta". La scelta si ricorda per le visite
// successive. "Rifiuta" non carica nulla.

export const CONSENT_KEY = 'barbi_cookie_consent_v1';

export function getConsent() {
  try {
    return window.localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function setConsent(valore) {
  try {
    window.localStorage.setItem(CONSENT_KEY, valore);
  } catch {
    /* localStorage non disponibile: la scelta vale solo per questa pagina */
  }
}

let caricato = false;

// Inietta gtag.js e inizializza GA4. Chiamata SOLO dopo il consenso.
export function loadAnalytics(gaId) {
  if (caricato || !gaId || typeof document === 'undefined') return;
  caricato = true;

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', gaId);
}
