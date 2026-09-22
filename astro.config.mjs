import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio vero (PACCHETTO_DEPLOY_2026-08-30, punto 5): barbipelletteria.it
// è registrato e collegato (Cloudflare Pages, D-016/D-017) — questo valore
// serve a generare URL assoluti corretti (canonical, sitemap).
export default defineConfig({
  site: 'https://barbipelletteria.it',
  output: 'static',
  // D-028 punto 4: sitemap.xml pronta per quando si toglie il noindex
  // (ancora attivo, invariato qui) — Google la trova comunque solo se il
  // sito è indicizzabile, ma non c'è motivo di aspettare quel giorno per
  // generarla: l'integrazione ufficiale scansiona da sola tutte le route
  // statiche a ogni build, nessuna lista da tenere aggiornata a mano.
  // Escluse le pagine transazionali/di servizio (carrello, checkout,
  // conferma ordine, grazie, conferma newsletter): senza contenuto
  // autonomo da far trovare, non appartengono a un sitemap pensato per
  // la ricerca — anche una volta tolto il noindex.
  integrations: [
    sitemap({
      filter: (pagina) =>
        !['/carrello/', '/checkout/', '/conferma-ordine/', '/grazie/', '/newsletter-confermata/']
          .some((esclusa) => pagina.endsWith(esclusa)),
    }),
  ],
});
