#!/usr/bin/env node
// Ottimizza le foto prodotto per il web: lato lungo max 1600px, WebP con
// fallback JPG, ogni file sotto 250KB. Legge da FOTO_SITO (fuori dal
// repository, percorso passato come argomento), scrive in public/prodotti/.
//
// Uso:
//   node scripts/ottimizza-foto-prodotto.mjs "<percorso a FOTO_SITO>"
//
// Convenzione di nomi (dichiarata in RESOCONTO_FOTO_PRODOTTO_2026-09-02.md,
// standard per le foto future — 06-con-carta e le macro della grana):
//   sorgente:  FOTO_SITO/portafoglio_<modello>_<colore>/NN-nome.{jpg,png}
//   pubblicato: public/prodotti/<modello>-<colore>/NN-nome.{webp,jpg}
// Stesso numero/nome del file sorgente, solo il separatore fra modello e
// colore cambia da _ a - (convenzione URL, non guscio a caso: è già lo
// stile di tutte le altre cartelle di public/).
//
// sharp è una devDependency (node_modules), usata solo qui: gli output
// (.webp/.jpg già pronti) sono ciò che finisce nel repository e in
// produzione, non sharp stesso — nessuna dipendenza in più a runtime.

import sharp from 'sharp';
import { readdirSync, statSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, basename, extname } from 'path';

const LATO_LUNGO_MAX = 1600;
const PESO_MAX_BYTE = 250 * 1024;

const sorgente = process.argv[2];
if (!sorgente || !existsSync(sorgente)) {
  console.error('Uso: node scripts/ottimizza-foto-prodotto.mjs "<percorso a FOTO_SITO>"');
  process.exit(1);
}

const destBase = new URL('../public/prodotti/', import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1');

// Riduce la qualità finché il file non sta sotto la soglia, senza scendere
// sotto una qualità minima ragionevole (se anche a quel punto sfora, si
// segnala — non si nasconde silenziosamente un file fuori peso).
async function codificaSottoPeso(pipeline, formato, tentativi) {
  let ultimo = null;
  for (const qualita of tentativi) {
    const buf = formato === 'webp'
      ? await pipeline.clone().webp({ quality: qualita }).toBuffer()
      : await pipeline.clone().jpeg({ quality: qualita, mozjpeg: true }).toBuffer();
    ultimo = { buf, qualita };
    if (buf.length <= PESO_MAX_BYTE) return ultimo;
  }
  return ultimo; // il più compresso tentato, anche se ancora sopra soglia
}

async function processaFile(percorsoSorgente, cartellaDest, nomeFile) {
  const img = sharp(percorsoSorgente);
  const meta = await img.metadata();
  const latoLungo = Math.max(meta.width, meta.height);
  const scala = latoLungo > LATO_LUNGO_MAX ? LATO_LUNGO_MAX / latoLungo : 1;
  const larghezzaFinale = Math.round(meta.width * scala);
  const altezzaFinale = Math.round(meta.height * scala);

  const ridimensionata = scala < 1
    ? sharp(percorsoSorgente).resize(larghezzaFinale, altezzaFinale)
    : sharp(percorsoSorgente);

  const tentativiQualita = [82, 75, 68, 60, 52, 45, 38, 30];

  const webp = await codificaSottoPeso(ridimensionata, 'webp', tentativiQualita);
  const jpg = await codificaSottoPeso(ridimensionata, 'jpg', tentativiQualita);

  mkdirSync(cartellaDest, { recursive: true });
  const pathWebp = join(cartellaDest, `${nomeFile}.webp`);
  const pathJpg = join(cartellaDest, `${nomeFile}.jpg`);
  await sharp(webp.buf).toFile(pathWebp);
  await sharp(jpg.buf).toFile(pathJpg);

  return {
    file: nomeFile,
    width: larghezzaFinale,
    height: altezzaFinale,
    webpKB: +(webp.buf.length / 1024).toFixed(1),
    webpQualita: webp.qualita,
    jpgKB: +(jpg.buf.length / 1024).toFixed(1),
    jpgQualita: jpg.qualita,
    sottoSoglia: webp.buf.length <= PESO_MAX_BYTE && jpg.buf.length <= PESO_MAX_BYTE,
  };
}

const cartelle = readdirSync(sorgente).filter((f) => f.startsWith('portafoglio_') && statSync(join(sorgente, f)).isDirectory());
const risultati = [];

for (const cartella of cartelle) {
  const m = cartella.match(/^portafoglio_(\w+)_(\w+)$/);
  if (!m) continue;
  const [, modello, colore] = m;
  const cartellaDest = join(destBase, `${modello}-${colore}`);
  const files = readdirSync(join(sorgente, cartella)).filter((f) => /\.(jpe?g|png)$/i.test(f));
  for (const file of files.sort()) {
    const nomeFile = basename(file, extname(file));
    const r = await processaFile(join(sorgente, cartella, file), cartellaDest, nomeFile);
    risultati.push({ modello, colore, ...r });
    console.log(
      `${modello}-${colore}/${nomeFile}: ${r.width}x${r.height} — webp ${r.webpKB}KB (q${r.webpQualita}), jpg ${r.jpgKB}KB (q${r.jpgQualita})${r.sottoSoglia ? '' : '  ⚠ SOPRA 250KB'}`
    );
  }
}

const fuoriSoglia = risultati.filter((r) => !r.sottoSoglia);
console.log(`\n${risultati.length} file processati, ${fuoriSoglia.length} sopra la soglia di 250KB.`);
if (fuoriSoglia.length) {
  console.log('Fuori soglia:', fuoriSoglia.map((r) => `${r.modello}-${r.colore}/${r.file}`).join(', '));
}

// Manifest {modello: {colore: [{id, width, height}, ...]}} — letto da
// src/data/immagini.js. Generato qui, non scritto a mano: rilanciare questo
// script è l'unico modo corretto di aggiornarlo (es. quando arriva
// 06-con-carta).
const manifest = {};
for (const r of risultati) {
  manifest[r.modello] ??= {};
  manifest[r.modello][r.colore] ??= [];
  manifest[r.modello][r.colore].push({ id: r.file, width: r.width, height: r.height });
}
const manifestPath = new URL('../src/data/foto-manifest.json', import.meta.url);
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nManifest scritto in src/data/foto-manifest.json (${risultati.length} voci).`);
