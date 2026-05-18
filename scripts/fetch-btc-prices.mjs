#!/usr/bin/env node
/**
 * Fetch daily BTC/USDT close prices from Binance and write data/btc-usd-daily.json
 * Usage: node scripts/fetch-btc-prices.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'data', 'btc-usd-daily.json');
const START = new Date('2020-01-01T00:00:00Z').getTime();
const END = Date.now();
const LIMIT = 1000;

async function fetchKlines(startTime) {
    const url = new URL('https://api.binance.com/api/v3/klines');
    url.searchParams.set('symbol', 'BTCUSDT');
    url.searchParams.set('interval', '1d');
    url.searchParams.set('startTime', String(startTime));
    url.searchParams.set('limit', String(LIMIT));
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Binance API ${res.status}: ${await res.text()}`);
    return res.json();
}

const byDate = new Map();
let cursor = START;

while (cursor < END) {
    const batch = await fetchKlines(cursor);
    if (!batch.length) break;
    for (const k of batch) {
        const openTime = k[0];
        const close = parseFloat(k[4]);
        const d = new Date(openTime);
        const date = d.toISOString().slice(0, 10);
        byDate.set(date, close);
    }
    const lastOpen = batch[batch.length - 1][0];
    cursor = lastOpen + 86400000;
    if (batch.length < LIMIT) break;
    await new Promise((r) => setTimeout(r, 200));
}

const rows = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, close]) => ({ date, close }));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(rows));
console.log(`Wrote ${rows.length} days to ${OUT}`);
