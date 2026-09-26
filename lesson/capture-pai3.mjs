// 피지컬 AI 2~6차시용 캡처: 엔트리(AI 모델 학습·하드웨어 연결·데이터분석), 메이크코드(소리·논리·라디오·고급), 스파이크 앱, 자체 제작 화면(지도안·루브릭·대시보드).
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire('C:/Users/dumok/dev/ai-concept-theater/package.json');
const { chromium } = require('playwright');
const OUT = path.resolve('C:/Users/dumok/dev/vivasam-creator-deck/lesson/shots-pai3');
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
const clickText = async (t, exact = true, wait = 2500) => { const loc = page.getByText(t, { exact }).first(); if (!(await loc.count())) { log('no text', t); return false; } try { await loc.click({ timeout: 6000 }); await sleep(wait); return true; } catch (e) { log('click fail', t, first(e)); return false; } };
try {
  // 엔트리
  await tryGoto('https://playentry.org/ws', 20000);
  await page.mouse.click(410, 650); await sleep(1000); await page.keyboard.press('Escape'); await sleep(600);
  await page.mouse.click(509, 745); await sleep(2500);
  await page.mouse.click(633, 208); await sleep(4000); await shot(page, 'e01-ai-model-dialog');
  await page.keyboard.press('Escape'); await sleep(800);
  await page.mouse.click(633, 152); await sleep(4000); await shot(page, 'e02-ai-block-dialog');
  await page.keyboard.press('Escape'); await sleep(800);
  await page.mouse.click(509, 850); await sleep(2500);
  await page.mouse.click(633, 468); await sleep(5000); await shot(page, 'e03-hw-browser-connect');
  await page.keyboard.press('Escape'); await sleep(800);
  await page.mouse.click(509, 690); await sleep(2500); await shot(page, 'e04-data-analysis');
  await page.mouse.click(509, 415); await sleep(2000); await shot(page, 'e05-sound');
  await page.mouse.click(509, 470); await sleep(2000); await shot(page, 'e06-judge');
  // 메이크코드
  await tryGoto('https://makecode.microbit.org/?lang=ko', 15000);
  await page.mouse.click(204, 570); await sleep(3000);
  const go = page.getByRole('button', { name: /만들기|생성|Create/ }).first();
  if (await go.count()) { try { await go.click({ timeout: 5000 }); } catch (e) {} } else { await page.keyboard.press('Enter'); }
  await sleep(15000); await page.mouse.click(847, 412); await sleep(1000); await page.keyboard.press('Escape'); await sleep(600);
  const search = page.locator('input[placeholder*="검색"]').first();
  if (await search.count()) { try { await search.click({ timeout: 4000 }); await search.fill('소리'); await sleep(3000); await shot(page, 'm01-search-sound'); await search.fill('빛'); await sleep(3000); await shot(page, 'm02-search-light'); await search.fill(''); await sleep(800); } catch (e) { log('search fail', first(e)); } }
  await page.mouse.click(505, 364); await sleep(2500); await shot(page, 'm03-logic');
  await page.keyboard.press('Escape'); await sleep(500);
  await page.mouse.click(505, 284); await sleep(2500); await shot(page, 'm04-radio');
  await page.keyboard.press('Escape'); await sleep(500);
  await page.mouse.click(505, 534); await sleep(2500); await shot(page, 'm05-advanced');
  await page.keyboard.press('Escape'); await sleep(500);
  await page.mouse.click(505, 484); await sleep(3000); await shot(page, 'm06-extensions');
  await page.keyboard.press('Escape'); await sleep(500);
  // 시뮬레이터 재생 버튼
  await page.mouse.click(119, 447); await sleep(2500); await shot(page, 'm07-sim');
  // 스파이크 앱 · 마이크로비트 소개
  await tryGoto('https://spike.legoeducation.com/', 15000); await shot(page, 's01-spike-app');
  await tryGoto('https://microbit.org/ko/get-started/user-guide/features-in-depth/', 12000); await clickText('Allow all cookies', true, 1500); await shot(page, 's02-microbit-features');
  await tryGoto('https://robomation.net/', 12000); await page.mouse.wheel(0, 1700); await sleep(2500); await shot(page, 's03-hamster-products');
  // 자체 제작 화면
  const own = 'file:///C:/Users/dumok/dev/vivasam-creator-deck/lesson/tools/own/';
  for (const f of ['dashboard', 'plan', 'rubric', 'noise-log']) { await tryGoto(own + f + '.html', 2500); await shot(page, 'o-' + f); }
} catch (e) { log('ERROR', first(e)); await shot(page, 'zz-error'); }
finally { await browser.close(); }
