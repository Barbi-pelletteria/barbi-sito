#!/usr/bin/env node
// Controllo unico pre-lancio (D-031 punto 3).
//
//   npm run verifica-prelancio             → controlla il sito costruito in dist/
//                                            (servito in locale su una porta libera)
//   npm run verifica-prelancio -- --live   → controlla https://barbipelletteria.it
//
// Sei controlli, ognuno OK o KO; exit code 1 se c'è almeno un KO:
//   1. nessuna stringa vietata nel testo visibile delle pagine;
//   2. nessun overflow orizzontale a 390 px (Chrome di sistema via
//      playwright-core: niente browser scaricati);
//   3. tutte le immagini e tutti i link interni rispondono 200 — i prodotti
//      in bozza devono rispondere 404 finché non sono pubblicati;
//   4. sitemap, robots.txt, title e description unici, canonical presente;
//   5. scheda prodotto: riga Pelle, prezzo, tasto; a vendita spenta il
//      checkout non parte (nessun "Aggiungi al carrello" da nessuna parte);
//   6. noindex presente finché è attivo (solo segnalato, mai tolto).
// Non modifica nulla: legge e riferisce.

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { prodottiPubblicati, bozze, VENDITA_ATTIVA } from '../src/data/prodotti.js';

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const live = process.argv.includes('--live');
const SITO_LIVE = 'https://barbipelletteria.it';
const dist = path.join(radice, 'dist');

// Termini che non devono comparire nel testo visibile (D-029 Parte 3,
// D-030, D-031): claim non dimostrabili, falsi o vietati dal QG, e i nomi
// di chi lavora al progetto (sul sito parla solo il laboratorio).
const TERMINI_VIETATI = [
  'Made in Italy', '100% italiana', 'cucito a mano', 'cuciti a mano', 'interamente in pelle',
  'marchio registrato', 'un solo artigiano', 'superiore a chiunque', 'più venduti', 'riapertura', 'riapre',
];
const NOMI_TEAM = ['Domenico', 'Jacopo', 'Claude', 'QG', 'Founder'];

// Pagine da misurare a 390 px (punto 2) — le schede prodotto si aggiungono dal catalogo.
const PAGINE_MOBILE = ['/', '/portafogli/', '/carrello/', '/faq/', '/contatti/', '/spedizioni-e-resi/'];
// Pagine fuori sitemap (transazionali), controllate comunque per testi e meta.
const PAGINE_EXTRA = ['/carrello/', '/checkout/', '/conferma-ordine/', '/grazie/', '/newsletter-confermata/'];

const esiti = [];
function esito(numero, titolo, ok, dettagli = []) {
  esiti.push({ numero, titolo, ok, dettagli });
  console.log(`${ok ? 'OK' : 'KO'}  ${numero}. ${titolo}`);
  for (const d of dettagli) console.log(`      ${d}`);
}

// ── Server locale per dist/ (solo senza --live) ─────────────────────────
const TIPI = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
function avviaServer() {
  return new Promise((risolvi) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let file = path.join(dist, p);
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file = file + '.html';
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.existsSync(path.join(dist, '404.html')) ? fs.readFileSync(path.join(dist, '404.html')) : 'Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': TIPI[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(fs.readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => risolvi(server));
  });
}

// ── Utilità ──────────────────────────────────────────────────────────────
async function prendi(url, metodo = 'GET') {
  const controllo = new AbortController();
  const timer = setTimeout(() => controllo.abort(), 20000);
  try {
    const r = await fetch(url, { method: metodo, redirect: 'manual', signal: controllo.signal, headers: { 'User-Agent': 'verifica-prelancio (barbi-sito)' } });
    const tipo = r.headers.get('content-type') || '';
    // Corpo letto solo per le risposte testuali (html, xml, txt, css, js):
    // immagini e font si controllano dallo stato HTTP.
    const testuale = /text|xml|json|javascript/i.test(tipo) || /\.(xml|txt|html|css|js)$/i.test(new URL(url).pathname);
    const testo = metodo === 'GET' && testuale ? await r.text() : '';
    return { stato: r.status, testo, tipo };
  } catch (e) {
    return { stato: 0, testo: '', errore: e.message };
  } finally {
    clearTimeout(timer);
  }
}
function testoVisibile(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, ' ');
}
const attr = (html, re) => (html.match(re) || [])[1] || '';

async function pool(elementi, limite, fn) {
  const risultati = [];
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limite, elementi.length) }, async () => {
    while (i < elementi.length) { const k = i++; risultati[k] = await fn(elementi[k]); }
  }));
  return risultati;
}

// ── Avvio ────────────────────────────────────────────────────────────────
let server = null;
let base;
if (live) {
  base = SITO_LIVE;
} else {
  if (!fs.existsSync(path.join(dist, 'index.html'))) { console.error('dist/ non trovato: prima `npm run build`.'); process.exit(1); }
  server = await avviaServer();
  base = `http://127.0.0.1:${server.address().port}`;
}
console.log(`Verifica pre-lancio su ${live ? SITO_LIVE : 'dist/ (locale)'} — vendita ${VENDITA_ATTIVA ? 'ACCESA' : 'spenta'} nel catalogo, ${prodottiPubblicati.length} prodotti pubblicati, ${bozze.length} in bozza\n`);

// Elenco pagine: sitemap + extra.
const sitemapIndex = await prendi(`${base}/sitemap-index.xml`);
const sitemap0 = await prendi(`${base}/sitemap-0.xml`);
const daSitemap = [...sitemap0.testo.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const pagine = [...new Set([...daSitemap, ...PAGINE_EXTRA])];
const html = {};
await pool(pagine, 6, async (p) => { html[p] = await prendi(base + p); });
const pagineLette = pagine.filter((p) => html[p].stato === 200);

// 1. Termini vietati.
{
  const trovati = [];
  for (const p of pagineLette) {
    const t = testoVisibile(html[p].testo);
    for (const termine of TERMINI_VIETATI) if (t.toLowerCase().includes(termine.toLowerCase())) trovati.push(`${p}: "${termine}"`);
    for (const nome of NOMI_TEAM) if (new RegExp(`\\b${nome}\\b`).test(t)) trovati.push(`${p}: nome del team "${nome}"`);
  }
  esito(1, `Termini vietati nel testo visibile (${pagineLette.length} pagine)`, trovati.length === 0, trovati.length ? trovati : ['nessuna occorrenza']);
}

// 2. Overflow orizzontale a 390 px.
{
  const dettagli = [];
  let ok = true;
  const daMisurare = [...PAGINE_MOBILE, ...prodottiPubblicati.map((p) => `/prodotto/${p.slug}/`)];
  try {
    const { chromium } = await import('playwright-core');
    const candidati = [
      process.env.CHROME_PATH,
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    ].filter(Boolean);
    const eseguibile = candidati.find((c) => fs.existsSync(c));
    const browser = await chromium.launch(eseguibile ? { executablePath: eseguibile } : { channel: 'chrome' });
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    for (const p of daMisurare) {
      await page.goto(base + p, { waitUntil: 'networkidle', timeout: 45000 });
      const m = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, vista: window.innerWidth }));
      if (m.scroll > m.vista) { ok = false; dettagli.push(`${p}: scrollWidth ${m.scroll} > ${m.vista}`); }
    }
    await browser.close();
    if (ok) dettagli.push(`${daMisurare.length} pagine, scrollWidth ≤ 390 su tutte`);
  } catch (e) {
    ok = false;
    dettagli.push(`controllo non eseguibile: ${e.message.split('\n')[0]} (serve Chrome installato, oppure CHROME_PATH)`);
  }
  esito(2, 'Nessun overflow orizzontale a 390 px', ok, dettagli);
}

// 3. Immagini e link interni.
{
  const dettagli = [];
  const risorse = new Set();
  const host = new URL(base).host;
  const hostLive = new URL(SITO_LIVE).host;
  for (const p of pagineLette) {
    const h = html[p].testo;
    const aggiungi = (u) => {
      if (!u || u.startsWith('#') || u.startsWith('mailto:') || u.startsWith('tel:') || u.startsWith('data:')) return;
      let percorso;
      if (u.startsWith('/')) percorso = u;
      else if (u.startsWith('http')) { const url = new URL(u); if (url.host !== host && url.host !== hostLive) return; percorso = url.pathname; }
      else return;
      // /cdn-cgi/ è di Cloudflare (es. la protezione degli indirizzi email
      // riscrive i mailto): non è una risorsa del sito, il browser la decodifica.
      if (percorso.startsWith('/cdn-cgi/')) return;
      risorse.add(percorso.split('#')[0]);
    };
    for (const m of h.matchAll(/\b(?:href|src|content)="([^"]+)"/g)) aggiungi(m[1]);
    for (const m of h.matchAll(/\bsrcset="([^"]*)"/g)) m[1].split(',').forEach((s) => aggiungi(s.trim().split(/\s+/)[0]));
  }
  const bozzeUrl = bozze.map((p) => `/prodotto/${p.slug}/`);
  const elenco = [...risorse].filter((r) => !bozzeUrl.includes(r));
  const esitiRisorse = await pool(elenco, 8, async (r) => ({ r, stato: (await prendi(base + r, r.endsWith('/') || r.endsWith('.html') ? 'GET' : 'HEAD')).stato }));
  const rotti = esitiRisorse.filter((x) => x.stato !== 200);
  // HEAD può non essere gradito ovunque: riprova in GET prima di dichiarare rotto.
  for (const x of rotti) { const r = await prendi(base + x.r, 'GET'); x.stato = r.stato; }
  const rottiVeri = rotti.filter((x) => x.stato !== 200);
  for (const x of rottiVeri) dettagli.push(`${x.r} → ${x.stato || 'nessuna risposta'}`);
  let ok = rottiVeri.length === 0;
  for (const u of bozzeUrl) {
    const r = await prendi(base + u);
    const atteso = 404;
    if (r.stato !== atteso) { ok = false; dettagli.push(`${u} (bozza) → ${r.stato}, atteso ${atteso}`); }
    else dettagli.push(`${u} (bozza, non pubblicata) → 404 come atteso`);
  }
  if (rottiVeri.length === 0) dettagli.unshift(`${elenco.length} risorse interne (link, immagini, css, js) rispondono 200`);
  esito(3, 'Immagini e link interni', ok, dettagli);
}

// 4. Sitemap, robots.txt, title/description unici, canonical.
{
  const dettagli = [];
  let ok = true;
  if (sitemapIndex.stato !== 200 || sitemap0.stato !== 200 || daSitemap.length === 0) { ok = false; dettagli.push(`sitemap: index ${sitemapIndex.stato}, sitemap-0 ${sitemap0.stato}, ${daSitemap.length} voci`); }
  else dettagli.push(`sitemap: ${daSitemap.length} pagine`);
  const robots = await prendi(`${base}/robots.txt`);
  if (robots.stato !== 200 || !/user-agent/i.test(robots.testo)) { ok = false; dettagli.push(`robots.txt → ${robots.stato}`); }
  else dettagli.push(`robots.txt presente${/sitemap:/i.test(robots.testo) ? ', con la sitemap' : ''}`);
  const titoli = new Map(), descrizioni = new Map();
  for (const p of pagineLette) {
    const h = html[p].testo;
    const titolo = attr(h, /<title>([^<]*)<\/title>/i).trim();
    const descr = attr(h, /<meta name="description" content="([^"]*)"/i).trim();
    const canonical = attr(h, /<link rel="canonical" href="([^"]*)"/i);
    if (!titolo) { ok = false; dettagli.push(`${p}: senza <title>`); }
    if (!descr) { ok = false; dettagli.push(`${p}: senza meta description`); }
    if (!canonical) { ok = false; dettagli.push(`${p}: senza canonical`); }
    else if (new URL(canonical).pathname !== p) { ok = false; dettagli.push(`${p}: canonical ${canonical} non corrisponde`); }
    titoli.set(titolo, [...(titoli.get(titolo) || []), p]);
    descrizioni.set(descr, [...(descrizioni.get(descr) || []), p]);
  }
  for (const [t, ps] of titoli) if (ps.length > 1) { ok = false; dettagli.push(`title duplicato "${t}": ${ps.join(', ')}`); }
  for (const [d, ps] of descrizioni) if (ps.length > 1) { ok = false; dettagli.push(`description duplicata (${ps.join(', ')}): "${d.slice(0, 60)}…"`); }
  if (ok) dettagli.push(`title e description unici su ${pagineLette.length} pagine, canonical presente ovunque`);
  esito(4, 'Sitemap, robots.txt, title/description unici, canonical', ok, dettagli);
}

// 5. Scheda prodotto e stato della vendita.
{
  const dettagli = [];
  let ok = true;
  for (const prodotto of prodottiPubblicati) {
    const p = `/prodotto/${prodotto.slug}/`;
    const h = html[p]?.testo || '';
    if (!h) { ok = false; dettagli.push(`${p}: pagina non letta`); continue; }
    const pelle = attr(h, /id="pelle-nome"[^>]*>([^<]*)</).trim();
    const prezzo = /class="[^"]*pdp-prezzo[^"]*"[^>]*>[^<]*€/.test(h);
    const aggiungi = /id="btn-aggiungi"/.test(h);
    const avvisami = /id="btn-avvisami"/.test(h);
    if (!pelle) { ok = false; dettagli.push(`${p}: riga Pelle assente o vuota`); }
    if (!prezzo) { ok = false; dettagli.push(`${p}: prezzo non trovato`); }
    if (VENDITA_ATTIVA ? !aggiungi : !avvisami) { ok = false; dettagli.push(`${p}: tasto atteso ${VENDITA_ATTIVA ? '"Aggiungi al carrello"' : '"Avvisami quando è disponibile"'} non trovato`); }
    if (!VENDITA_ATTIVA && aggiungi) { ok = false; dettagli.push(`${p}: "Aggiungi al carrello" presente a vendita spenta`); }
    if (ok) dettagli.push(`${p}: Pelle "${pelle}", prezzo, ${VENDITA_ATTIVA ? 'Aggiungi al carrello' : 'Avvisami (vendita spenta)'}`);
  }
  if (!VENDITA_ATTIVA) {
    const conAcquisto = pagineLette.filter((p) => /class="[^"]*\bv-aggiungi\b|id="form-acquisto"/.test(html[p].testo));
    if (conAcquisto.length) { ok = false; dettagli.push(`a vendita spenta il checkout non deve partire, ma c'è un acquisto su: ${conAcquisto.join(', ')}`); }
    else dettagli.push('vendita spenta: nessun "Aggiungi al carrello" su nessuna pagina, il checkout non parte');
  }
  esito(5, 'Scheda prodotto: riga Pelle, prezzo, tasto; checkout coerente con VENDITA_ATTIVA', ok, dettagli);
}

// 6. noindex.
{
  const senza = pagineLette.filter((p) => !/<meta name="robots" content="noindex/i.test(html[p].testo));
  const con = pagineLette.length - senza.length;
  if (con === pagineLette.length) esito(6, 'noindex', true, [`ATTIVO su tutte le ${con} pagine: ricordarsi di toglierlo al via libera fiscale (src/layouts/Layout.astro)`]);
  else if (con === 0) esito(6, 'noindex', true, ['non presente su nessuna pagina: il sito è indicizzabile (deve essere una scelta presa, D-014/via libera fiscale)']);
  else esito(6, 'noindex', false, [`presente su ${con} pagine e assente su ${senza.length}: ${senza.join(', ')}`]);
}

if (server) server.close();
const ko = esiti.filter((e) => !e.ok).length;
console.log(`\nEsito: ${esiti.length - ko} OK, ${ko} KO${ko ? ' — correggere prima del lancio' : ''}.`);
process.exit(ko ? 1 : 0);
