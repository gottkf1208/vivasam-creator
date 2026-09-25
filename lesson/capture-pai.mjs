// 피지컬 AI 1차시용 화면 캡처: 마이크로비트 메이크코드, 엔트리, 티처블 머신, 교구 소개 페이지. 로그인 없음.
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
  try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }); await sleep(wait); if (name) await shot(page, name); return true; }
  catch (e) { log('goto fail', url, first(e)); return false; }
}
async function clickTextSafe(t, exact = true, wait = 2500) {
  const loc = page.getByText(t, { exact }).first();
  if (!(await loc.count())) { log('no text', t); return false; }
  try { await loc.click({ timeout: 6000 }); await sleep(wait); return true; } catch (e) { log('click fail', t, first(e)); return false; }
}
try {
  // 1) 메이크코드: 새 프로젝트 → 편집기
  await tryGoto('https://makecode.microbit.org/?lang=ko', 15000, 'p01-makecode-home');
  await page.mouse.click(204, 570); await sleep(3000); await shot(page, 'p02-makecode-newdialog');
  const go = page.getByRole('button', { name: /만들기|생성|Create/ }).first();
  if (await go.count()) { try { await go.click({ timeout: 5000 }); } catch (e) { log('create fail', first(e)); } }
  else { await page.keyboard.press('Enter'); }
  await sleep(15000); await shot(page, 'p03-makecode-editor');
  for (const [t, n] of [['입력', 'p04-makecode-input'], ['기본', 'p05-makecode-basic']]) { if (await clickTextSafe(t, true, 2500)) await shot(page, n); }
  // 2) 엔트리 작업실: 튜토리얼 닫고 인공지능·하드웨어
  await tryGoto('https://playentry.org/ws', 20000, null);
  await page.mouse.click(410, 650); await sleep(1200);
  await page.keyboard.press('Escape'); await sleep(800);
  await shot(page, 'p06-entry-ws');
  await page.mouse.click(509, 745); await sleep(3000); await shot(page, 'p07-entry-ai');
  await page.keyboard.press('Escape'); await sleep(800);
  await page.mouse.click(509, 850); await sleep(3000); await shot(page, 'p08-entry-hw');
  await page.keyboard.press('Escape'); await sleep(800);
  // 3) 티처블 머신 이미지 프로젝트 (쿠키 확인 후)
  await tryGoto('https://teachablemachine.withgoogle.com/train/image', 25000, null);
  await clickTextSafe('OK, got it', true, 1500);
  await sleep(3000); await shot(page, 'p09-tm-image');
  // 4) 교구 소개 페이지
  await tryGoto('https://microbit.org/ko/get-started/what-is-the-microbit/', 12000, 'p10-microbit-what');
  await tryGoto('https://education.lego.com/ko-kr/products/lego-education-spike-prime-set/45678/', 15000, null);
  await clickTextSafe('필수 요소', true, 2500); await shot(page, 'p11-spike-prime');
  await tryGoto('https://robomation.net/', 12000, null);
  await page.mouse.wheel(0, 800); await sleep(2500); await shot(page, 'p12-hamster');
} catch (e) { log('ERROR', first(e)); await shot(page, 'zz-error'); }
finally { await browser.close(); }
