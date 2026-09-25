// 피지컬 AI 1차시용 화면 캡처: 마이크로비트 메이크코드, 엔트리, 티처블 머신(이미지 프로젝트). 로그인 없음.
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
async function tryGoto(url, wait, name) {
  try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }); await sleep(wait); await shot(page, name); return true; }
  catch (e) { log('goto fail', url, first(e)); return false; }
}
try {
  // 1) 마이크로비트 메이크코드 홈 + 새 프로젝트
  await tryGoto('https://makecode.microbit.org/?lang=ko', 15000, 'p01-makecode-home');
  const np = page.getByText('새 프로젝트', { exact: false }).first();
  if (await np.count()) { try { await np.click({ timeout: 8000 }); await sleep(3000); await shot(page, 'p02-makecode-newdialog'); const go = page.getByRole('button', { name: /만들기|Create/ }).first(); if (await go.count()) { await go.click({ timeout: 5000 }); await sleep(12000); await shot(page, 'p03-makecode-editor'); } } catch (e) { log('makecode new fail', first(e)); } }
  // 입력 카테고리 열기
  for (const [t, n] of [['입력', 'p04-makecode-input'], ['기본', 'p05-makecode-basic']]) {
    const c = page.getByText(t, { exact: true }).first();
    if (await c.count()) { try { await c.click({ timeout: 5000 }); await sleep(2500); await shot(page, n); } catch (e) { log('cat fail', t, first(e)); } }
  }
  // 2) 엔트리 작업실
  await tryGoto('https://playentry.org/ws', 20000, 'p06-entry-ws');
  const ai = page.getByText('인공지능', { exact: true }).first();
  if (await ai.count()) { try { await ai.click({ timeout: 6000 }); await sleep(3000); await shot(page, 'p07-entry-ai'); } catch (e) { log('entry ai fail', first(e)); } }
  const hw = page.getByText('하드웨어', { exact: true }).first();
  if (await hw.count()) { try { await hw.click({ timeout: 6000 }); await sleep(3000); await shot(page, 'p08-entry-hw'); await page.keyboard.press('Escape'); await sleep(800); } catch (e) { log('entry hw fail', first(e)); } }
  // 3) 티처블 머신 이미지 프로젝트
  await tryGoto('https://teachablemachine.withgoogle.com/train/image', 15000, 'p09-tm-image');
  // 4) 마이크로비트 소개 · 레고 스파이크 · 햄스터 (제품 페이지)
  await tryGoto('https://microbit.org/ko/get-started/what-is-the-microbit/', 12000, 'p10-microbit-what');
  await tryGoto('https://education.lego.com/ko-kr/products/lego-education-spike-prime-set/45678/', 15000, 'p11-spike-prime');
  await tryGoto('https://robomation.net/', 12000, 'p12-hamster');
} catch (e) { log('ERROR', first(e)); await shot(page, 'zz-error'); }
finally { await browser.close(); }
