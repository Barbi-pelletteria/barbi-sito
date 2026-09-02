import { defineConfig } from 'astro/config';

// Dominio vero (PACCHETTO_DEPLOY_2026-08-30, punto 5): barbipelletteria.it
// è già registrato. Finché il collegamento Netlify → dominio non è fatto
// (serve il pannello Netlify + il registrar, mani umane), il sito resta
// raggiungibile sul sottodominio *.netlify.app assegnato al progetto — questo
// valore serve solo a generare URL assoluti corretti (canonical, sitemap),
// non blocca il deploy.
export default defineConfig({
  site: 'https://barbipelletteria.it',
  output: 'static',
});
