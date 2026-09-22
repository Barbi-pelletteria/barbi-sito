import { defineConfig } from 'astro/config';

// Dominio vero (PACCHETTO_DEPLOY_2026-08-30, punto 5): barbipelletteria.it
// è registrato e collegato (Cloudflare Pages, D-016/D-017) — questo valore
// serve a generare URL assoluti corretti (canonical, sitemap).
export default defineConfig({
  site: 'https://barbipelletteria.it',
  output: 'static',
});
