/**
 * Placeholder daily BTC "risk" scores (0–1) aligned to btc-usd-daily.json dates.
 * NOT official Into the Cryptoverse scores — drawdown from rolling peak maps to
 * ~0.1 (deep drawdown / lower risk) through ~0.65 (near peak / higher risk).
 * Replace data/btc-risk-daily.json with real scores using the same schema when available.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pricesPath = path.join(__dirname, '../data/btc-usd-daily.json');
const outPath = path.join(__dirname, '../data/btc-risk-daily.json');

const rows = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
let peak = 0;
const out = [];

for (const row of rows) {
  const price = row.close;
  if (price > peak) peak = price;
  const drawdown = peak > 0 ? (peak - price) / peak : 0;
  const risk = 0.1 + (1 - drawdown) * 0.55;
  out.push({ date: row.date, risk: Math.round(Math.min(0.65, Math.max(0.1, risk)) * 1000) / 1000 });
}

fs.writeFileSync(outPath, JSON.stringify(out));
console.log(`Wrote ${out.length} risk rows → ${outPath}`);
