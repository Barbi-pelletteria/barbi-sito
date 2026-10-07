#!/usr/bin/env node
// Pubblica l'Essenziale con un comando (D-031 punto 2).
//
// Legge src/data/dati-essenziale.json (compilato dal QG con i dati di
// Stefano), controlla che OGNI campo sia presente e che la conferma scritta
// di Stefano abbia una data; se manca qualcosa si ferma PRIMA di scrivere
// (exit code 1, elenco dei campi mancanti). Se è tutto completo:
//   1. scrive la pelle in src/data/pelli.js (voce "grana-da-confermare",
//      confermata: true);
//   2. scrive misure, peso, fodera, lavorazione, iniziali, stock e
//      pubblicato: true nell'Essenziale in src/data/prodotti.js;
//   3. lancia `npm run build` (che ripete il blocco di pubblicazione di
//      D-030): se la build fallisce, rimette i due file com'erano.
// Nessuna scrittura parziale: i controlli vengono prima di tutto, e i due
// file vengono scritti solo dopo che TUTTE le sostituzioni sono riuscite.
//
// Uso:
//   node scripts/pubblica-essenziale.mjs                  → controlla, scrive, costruisce
//   node scripts/pubblica-essenziale.mjs --solo-controllo → solo i controlli, nessuna scrittura
//   node scripts/pubblica-essenziale.mjs --file <altro.json>  (per prove, mai dati finti nel repo)
// Dopo: git add, commit, push — il deploy è il push su main.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const soloControllo = argv.includes('--solo-controllo');
const indiceFile = argv.indexOf('--file');
const fileDati = indiceFile >= 0 && argv[indiceFile + 1] ? path.resolve(argv[indiceFile + 1]) : path.join(radice, 'src/data/dati-essenziale.json');
const filePelli = path.join(radice, 'src/data/pelli.js');
const fileProdotti = path.join(radice, 'src/data/prodotti.js');

function fermati(messaggio) {
  console.error(`\n✖ ${messaggio}\n`);
  process.exit(1);
}

// ── 1. Lettura e controlli ──────────────────────────────────────────────
if (!fs.existsSync(fileDati)) fermati(`File dati non trovato: ${fileDati}`);
let dati;
try {
  dati = JSON.parse(fs.readFileSync(fileDati, 'utf8'));
} catch (e) {
  fermati(`Il file ${path.relative(radice, fileDati)} non è un JSON valido: ${e.message}`);
}

const mancanti = [];
const testo = (valore, nome) => {
  if (typeof valore !== 'string' || valore.trim() === '') mancanti.push(nome);
};
const booleano = (valore, nome) => {
  if (typeof valore !== 'boolean') mancanti.push(`${nome} (true/false)`);
};

const pelle = dati.pelle || {};
testo(pelle.nome, 'pelle.nome');
testo(pelle.specie, 'pelle.specie');
testo(pelle.concia, 'pelle.concia');
testo(pelle.finitura, 'pelle.finitura');
testo(pelle.spessore, 'pelle.spessore');
testo(pelle.descrizione, 'pelle.descrizione');
const cura = pelle.cura || {};
testo(cura.intro, 'pelle.cura.intro');
if (!Array.isArray(cura.punti) || cura.punti.length === 0 || cura.punti.some((p) => typeof p !== 'string' || p.trim() === '')) {
  mancanti.push('pelle.cura.punti (almeno una riga, nessuna vuota)');
}
testo(cura.chiusura, 'pelle.cura.chiusura');
const misure = dati.misure || {};
testo(misure.chiuso, 'misure.chiuso');
testo(misure.aperto, 'misure.aperto');
testo(dati.peso, 'peso');
if (!Number.isInteger(dati.stock) || dati.stock < 0) mancanti.push('stock (numero intero, pezzi disponibili)');
booleano(dati.iniziali, 'iniziali');
booleano(dati.bordi_tinti_a_mano, 'bordi_tinti_a_mano');
testo(dati.fodera, 'fodera');
if (typeof dati.confermato_da_stefano !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dati.confermato_da_stefano)) {
  mancanti.push('confermato_da_stefano (data della conferma scritta, AAAA-MM-GG)');
}

if (mancanti.length) {
  console.error('\n✖ L’Essenziale NON si può pubblicare: mancano questi dati in ' + path.relative(radice, fileDati) + ':');
  for (const m of mancanti) console.error('   - ' + m);
  console.error('\nCompilare con i dati di Stefano (mai inventati) e rilanciare. Nessun file è stato modificato.\n');
  process.exit(1);
}
if (dati.stock === 0) console.warn('⚠ stock = 0: l’Essenziale verrà pubblicato come esaurito.');
console.log('✔ Dati completi, conferma scritta di Stefano del ' + dati.confermato_da_stefano + '.');
if (soloControllo) {
  console.log('Solo controllo: nessun file scritto.');
  process.exit(0);
}

// ── 2. Preparazione delle sostituzioni (tutte in memoria, nessun file toccato) ──
// Stringa JavaScript con apici singoli; gli apostrofi fra lettere diventano
// tipografici (’), come nel resto dei testi del sito.
const js = (s) => "'" + s.trim().replace(/(\p{L})'(\p{L})/gu, '$1’$2').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ') + "'";

const pelliOriginale = fs.readFileSync(filePelli, 'utf8');
const prodottiOriginale = fs.readFileSync(fileProdotti, 'utf8');

function sostituisciUnaVolta(sorgente, cerca, nuovo, descrizione) {
  const prima = sorgente.indexOf(cerca);
  if (prima < 0) fermati(`Non trovo nel file il punto da aggiornare: ${descrizione}. Nessun file è stato modificato.`);
  if (sorgente.indexOf(cerca, prima + 1) >= 0) fermati(`Punto da aggiornare ambiguo (più di una occorrenza): ${descrizione}. Nessun file è stato modificato.`);
  return sorgente.slice(0, prima) + nuovo + sorgente.slice(prima + cerca.length);
}

// pelli.js — la voce "grana-da-confermare" per intero, da id a confermata.
const inizioPelle = pelliOriginale.indexOf("id: 'grana-da-confermare',");
const finePelle = pelliOriginale.indexOf('confermata: false,', inizioPelle);
if (inizioPelle < 0 || finePelle < 0) fermati('Non trovo la voce "grana-da-confermare" in src/data/pelli.js. Nessun file è stato modificato.');
const bloccoPelleNuovo = [
  "id: 'grana-da-confermare',",
  `    nome: ${js(pelle.nome)},`,
  `    specie: ${js(pelle.specie)},`,
  `    finitura: ${js(pelle.finitura)},`,
  `    concia: ${js(pelle.concia)},`,
  `    spessore: ${js(pelle.spessore)},`,
  `    descrizione: ${js(pelle.descrizione)},`,
  `    // Confermata per iscritto da Stefano il ${dati.confermato_da_stefano} (dati-essenziale.json).`,
  '    cura: {',
  "      titolo: 'Come si cura',",
  `      intro: ${js(cura.intro)},`,
  '      punti: [',
  ...cura.punti.map((p) => `        ${js(p)},`),
  '      ],',
  `      chiusura: ${js(cura.chiusura)},`,
  '    },',
  '    confermata: true,',
].join('\n');
const pelliNuovo = pelliOriginale.slice(0, inizioPelle) + bloccoPelleNuovo + pelliOriginale.slice(finePelle + 'confermata: false,'.length);

// prodotti.js — solo dentro il blocco dell'Essenziale.
const inizioEss = prodottiOriginale.indexOf("slug: 'essenziale',");
if (inizioEss < 0) fermati("Non trovo il prodotto 'essenziale' in src/data/prodotti.js. Nessun file è stato modificato.");
const fineEss = prodottiOriginale.indexOf('\n];', inizioEss);
let blocco = prodottiOriginale.slice(inizioEss, fineEss);
// pubblicato: false → true. Se è già true (pubblicazione anticipata del
// 07/10/2026, richiesta di Domenico) resta così, e il flag `datiInArrivo`
// che la rendeva possibile se ne va: da qui i dati sono quelli veri.
if (blocco.includes('pubblicato: false,')) blocco = sostituisciUnaVolta(blocco, 'pubblicato: false,', 'pubblicato: true,', 'pubblicato');
blocco = blocco.replace(/\r?\n[ \t]*datiInArrivo: true,/, '');
blocco = sostituisciUnaVolta(blocco, 'inizialiDisponibili: false,', `inizialiDisponibili: ${dati.iniziali},`, 'inizialiDisponibili');
blocco = sostituisciUnaVolta(blocco, "fodera: '',", `fodera: ${js(dati.fodera)},`, 'fodera');
blocco = sostituisciUnaVolta(blocco, "misure: { chiuso: '', aperto: '' },", `misure: { chiuso: ${js(misure.chiuso)}, aperto: ${js(misure.aperto)} },`, 'misure');
blocco = sostituisciUnaVolta(blocco, "peso: '',", `peso: ${js(dati.peso)},`, 'peso');
blocco = sostituisciUnaVolta(blocco, "lavorazione: '',", `lavorazione: ${dati.bordi_tinti_a_mano ? "'bordi tinti a mano'" : "''"},`, 'lavorazione');
blocco = sostituisciUnaVolta(
  blocco,
  "varianti: [{ colore: 'bordeaux', pelle: 'grana-da-confermare', stock: null }],",
  `varianti: [{ colore: 'bordeaux', pelle: 'grana-da-confermare', stock: ${dati.stock} }],`,
  'stock della variante'
);
const prodottiNuovo = prodottiOriginale.slice(0, inizioEss) + blocco + prodottiOriginale.slice(fineEss);

// ── 3. Scrittura (solo ora) e build con ripristino automatico ──────────────
fs.writeFileSync(filePelli, pelliNuovo);
fs.writeFileSync(fileProdotti, prodottiNuovo);
console.log('✔ Scritti src/data/pelli.js e src/data/prodotti.js (pubblicato: true).');
console.log('… Build in corso (npm run build)');
// Astro lanciato direttamente con il Node corrente (niente shell, niente
// npm.cmd): è lo stesso `astro build` di `npm run build`.
const build = spawnSync(process.execPath, [path.join(radice, 'node_modules/astro/bin/astro.mjs'), 'build'], { cwd: radice, encoding: 'utf8' });
if (build.status !== 0) {
  fs.writeFileSync(filePelli, pelliOriginale);
  fs.writeFileSync(fileProdotti, prodottiOriginale);
  console.error((build.stdout || '') + (build.stderr || ''));
  fermati('La build è fallita: i due file sono stati rimessi com’erano. L’Essenziale resta in bozza.');
}

// ── 4. Riepilogo ──────────────────────────────────────────────────────────
const pagina = path.join(radice, 'dist/prodotto/essenziale/index.html');
console.log('\n✔ Build riuscita. Riepilogo:');
console.log(`   Pelle: ${pelle.nome} (${pelle.specie}, concia ${pelle.concia}, ${pelle.finitura}, ${pelle.spessore})`);
console.log(`   Misure: chiuso ${misure.chiuso} · aperto ${misure.aperto} · peso ${dati.peso} · fodera ${dati.fodera}`);
console.log(`   Stock: ${dati.stock} · iniziali: ${dati.iniziali ? 'sì' : 'no'} · bordi tinti a mano: ${dati.bordi_tinti_a_mano ? 'sì' : 'no'}`);
console.log(`   Pagina generata: ${fs.existsSync(pagina) ? 'dist/prodotto/essenziale/index.html' : 'NON TROVATA (controllare)'}`);
console.log('   I testi a tre modelli (D-030 Parte 3) sono attivi da soli.');
console.log('\nProssimo passo: git add src/data && git commit && git push (il deploy è il push su main), poi npm run verifica-prelancio -- --live.\n');
