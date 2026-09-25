// 피지컬 AI 1차시 보충 캡처: 메이크코드(안내창 닫고 입력 카테고리), 마이크로비트 홈, 레고 에듀케이션 홈, 티처블 머신 홈.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire('C:/Users/dumok/dev/ai-concept-theater/package.json');
const { chromium } = require('playwright');
const OUT = path.resolve('C:/Users/dumok/dev/vivasam-creator-deck/lesson/shots-pai');
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const first = e => String(e && e.message || e).split(/\r?\n/)[0];
const shot = async (page, n) => { await page.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n); };
const browser = await chromium.launch({ headless: true, args: ['--lang=ko-KR'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ko-KR', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36' });
const page = await ctx.newPage();
page.on('dialog', d => d.dismiss().catch(() => {}));
async function tryGoto(url, wait) { try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }); await sleep(wait); return true; } catch (e) { log('goto fail', url, first(e)); return false; } }
async function clickTextSafe(t, exact = true, wait = 2000) { const loc = page.getByText(t, { exact }).first(); if (!(await loc.count())) return false; try { await loc.click({ timeout: 5000 }); await sleep(wait); return true; } catch (e) { return false; } }
try {
  await tryGoto('https://makecode.microbit.org/?lang=ko', 15000);
  await page.mouse.click(204, 570); await sleep(3000);
  const go = page.getByRole('button', { name: /만들기|생성|Create/ }).first();
  if (await go.count()) { try { await go.click({ timeout: 5000 }); } catch (e) {} } else { await page.keyboard.press('Enter'); }
  await sleep(15000);
  await page.mouse.click(847, 412); await sleep(1200); await page.keyboard.press('Escape'); await sleep(800);
  await shot(page, 'p03-makecode-editor');
  await page.mouse.click(505, 164); await sleep(2500); await shot(page, 'p04-makecode-input');
  await page.keyboard.press('Escape'); await sleep(600);
  await page.mouse.click(505, 244); await sleep(2500); await shot(page, 'p05-makecode-led');
  await tryGoto('https://microbit.org/ko/', 12000); await clickTextSafe('Allow all cookies', true, 1500); await shot(page, 'p10-microbit-home');
  await tryGoto('https://education.lego.com/ko-kr/', 15000); await clickTextSafe('필수 요소', true, 2500); await shot(page, 'p11-lego-home');
  await tryGoto('https://teachablemachine.withgoogle.com/', 15000); await clickTextSafe('OK, got it', true, 1500); await shot(page, 'p13-tm-home');
  await page.mouse.wheel(0, 900); await sleep(2000); await shot(page, 'p14-tm-home2');
} catch (e) { log('ERROR', first(e)); await shot(page, 'zz-error'); }
finally { await browser.close(); }
