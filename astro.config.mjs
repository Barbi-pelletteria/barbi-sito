import { defineConfig } from 'astro/config';

// Dominio vero (PACCHETTO_DEPLOY_2026-08-30, punto 5): barbipelletteria.it
// è già registrato. Finché il collegamento Netlify → dominio non è fatto
// (serve il pannello Netlify + il registrar, mani umane), il sito resta
// raggiungibile sul sottodominio *.netlify.app assegnato al progetto — questo
// valore serve solo a generare URL assoluti corretti (canonical, sitemap),
// non blocca il deploy.
// DIAGNOSTICA TEMPORANEA (da togliere dopo aver letto il log del prossimo
// deploy Cloudflare — vedi RESOCONTO_BANNER_GA4_2026-09-02.md): stampa se
// PUBLIC_GA_MEASUREMENT_ID è nell'ambiente Node grezzo, PRIMA che Vite/Astro
// tocchino qualunque cosa. Se questo log manca o dice "NON DEFINITA" nel
// build log di Cloudflare, la variabile non arriva proprio al processo di
// build — non è un problema di import.meta.env, è a monte. Nessun valore
// stampato, solo presenza e lunghezza.
const gaEnvGrezza = process.env.PUBLIC_GA_MEASUREMENT_ID;
console.log(
  '[DIAG astro.config.mjs] process.env.PUBLIC_GA_MEASUREMENT_ID:',
  gaEnvGrezza === undefined ? 'NON DEFINITA' : `definita, lunghezza ${gaEnvGrezza.length}`
);
console.log(
  '[DIAG astro.config.mjs] chiavi PUBLIC_* viste da process.env:',
  Object.keys(process.env).filter((k) => k.startsWith('PUBLIC_')).join(', ') || '(nessuna)'
);

export default defineConfig({
  site: 'https://barbipelletteria.it',
  output: 'static',
});
