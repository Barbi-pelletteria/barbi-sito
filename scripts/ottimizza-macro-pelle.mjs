#!/usr/bin/env node
// Ottimizza le macro della pelle vera (PACCHETTO_MACRO_PELLE_2026-08-30):
// una versione piccola per gli swatch (cerchio 44px, retina-friendly) e una
// grande per la galleria prodotto / sezione "Come nasce". Stesse regole di
// scripts/ottimizza-foto-prodotto.mjs (max 1600px lato lungo, sotto 250KB),
// applicate qui separatamente perché sorgente e destinazione hanno una
// struttura diversa (per colore soltanto, non per modello+colore).
//
// Uso:
//   node scripts/ottimizza-macro-pelle.mjs "<percorso a FOTO_SITO/MACRO_PELLE>"

import sharp from 'sharp';
import { readdirSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

const PESO_MAX_BYTE = 250 * 1024;
// Swatch: cerchio da 44px CSS. A devicePixelRatio 3 (iPhone) servono 132px
// reali — 160px lascia un margine senza sprecare byte per un pallino.
const SWATCH_LATO = 160;
const GRANDE_LATO_MAX = 1600;

const sorgente = process.argv[2];
if (!sorgente || !existsSync(sorgente)) {
  console.error('Uso: node scripts/ottimizza-macro-pelle.mjs "<percorso a FOTO_SITO/MACRO_PELLE>"');
  process.exit(1);
}

const destBase = new URL('../public/pelle/', import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1');
mkdirSync(destBase, { recursive: true });

async function codificaSottoPeso(pipeline, formato, tentativi) {
  let ultimo = null;
  for (const qualita of tentativi) {
    const buf = formato === 'webp'
      ? await pipeline.clone().webp({ quality: qualita }).toBuffer()
      : await pipeline.clone().jpeg({ quality: qualita, mozjpeg: true }).toBuffer();
    ultimo = { buf, qualita };
    if (buf.length <= PESO_MAX_BYTE) return ultimo;
  }
  return ultimo;
}

const file = readdirSync(sorgente).filter((f) => /^pelle-(blu|bordeaux|marrone)\.jpe?g$/i.test(f));
const manifest = {};

for (const f of file.sort()) {
  const colore = f.match(/^pelle-(\w+)\./)[1];
  const p = join(sorgente, f);
  const meta = await sharp(p).metadata();

  // Swatch: quadrato SWATCH_LATO x SWATCH_LATO, ritaglio centrale (le macro
  // arrivano già quadrate 1200x1200, ma il resize + cover resta corretto
  // anche se un domani non lo fossero).
  const swatch = await sharp(p).resize(SWATCH_LATO, SWATCH_LATO, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();
  await sharp(swatch).toFile(join(destBase, `${colore}-swatch.webp`));

  // Grande: lato lungo max 1600px (qui già 1200, quindi invariato), stesse
  // regole di peso della galleria prodotto.
  const latoLungo = Math.max(meta.width, meta.height);
  const scala = latoLungo > GRANDE_LATO_MAX ? GRANDE_LATO_MAX / latoLungo : 1;
  const w = Math.round(meta.width * scala);
  const h = Math.round(meta.height * scala);
  const ridimensionata = scala < 1 ? sharp(p).resize(w, h) : sharp(p);
  const tentativi = [82, 75, 68, 60, 52, 45, 38, 30];
  const webpGrande = await codificaSottoPeso(ridimensionata, 'webp', tentativi);
  const jpgGrande = await codificaSottoPeso(ridimensionata, 'jpg', tentativi);
  await sharp(webpGrande.buf).toFile(join(destBase, `${colore}-macro.webp`));
  await sharp(jpgGrande.buf).toFile(join(destBase, `${colore}-macro.jpg`));

  manifest[colore] = {
    swatch: `/pelle/${colore}-swatch.webp`,
    macroWebp: `/pelle/${colore}-macro.webp`,
    macroJpg: `/pelle/${colore}-macro.jpg`,
    width: w,
    height: h,
  };

  console.log(
    `${colore}: swatch ${(swatch.length / 1024).toFixed(1)}KB — macro ${w}x${h}, webp ${(webpGrande.buf.length / 1024).toFixed(1)}KB (q${webpGrande.qualita}), jpg ${(jpgGrande.buf.length / 1024).toFixed(1)}KB (q${jpgGrande.qualita})`
  );
}

const manifestPath = new URL('../src/data/macro-pelle-manifest.json', import.meta.url);
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nManifest scritto in src/data/macro-pelle-manifest.json (${Object.keys(manifest).length} colori).`);
