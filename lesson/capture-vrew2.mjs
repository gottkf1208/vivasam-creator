// 브루 2~6차시용 캡처: 무음 구간 줄이기 창, AI 자막 번역, 서식 테두리, 삽입 배경음악, 화면 비율, 썸네일 생성기, AI 목소리 삽입, 효과.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire('C:/Users/dumok/dev/ai-concept-theater/package.json');
const { chromium } = require('playwright');
const OUT = path.resolve('C:/Users/dumok/dev/vivasam-creator-deck/lesson/shots-vrew2');
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const first = e => String(e && e.message || e).split(/\r?\n/)[0];
const shot = async (page, n) => { await page.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n); };
const browser = await chromium.launch({ headless: true, args: ['--lang=ko-KR'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ko-KR', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36' });
const page = await ctx.newPage();
page.on('dialog', d => d.dismiss().catch(() => {}));
const clickText = async (t, exact = true, wait = 2500) => { const loc = page.getByText(t, { exact }).first(); if (!(await loc.count())) { log('no text', t); return false; } try { await loc.click({ timeout: 6000 }); await sleep(wait); return true; } catch (e) { log('click fail', t, first(e)); return false; } };
async function closeModals() { for (const t of ['확인', '나중에 하기', '닫기']) { const b = page.getByText(t, { exact: true }).first(); if (await b.count()) { try { await b.click({ timeout: 1500 }); await sleep(500); } catch (e) {} } } await page.keyboard.press('Escape'); await sleep(500); }
async function tab(t) { return clickText(t, true, 2200); }
async function toolClick(x, y, name) { await page.mouse.click(x, y); await sleep(3000); await shot(page, name); await closeModals(); await page.keyboard.press('Escape'); await sleep(600); }
try {
  await page.goto('https://vrew.ai/ko/try/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(12000);
  await page.mouse.click(1380, 76); await sleep(500);
  const demo = page.getByText('데모 프로젝트 열기', { exact: false }).first();
  if (await demo.count()) { await demo.click({ timeout: 8000 }); }
  await sleep(15000);
  await page.mouse.click(1405, 199); await sleep(400); await page.mouse.click(1066, 441); await sleep(600); await page.keyboard.press('Escape'); await sleep(600);
  await page.mouse.click(259, 141); await sleep(400);
  await shot(page, 'v20-home-clean');
  // 편집: 무음 구간 줄이기 · 자동 클립 나누기 · 음성 덮어쓰기
  if (await tab('편집')) { await toolClick(1088, 75, 'v21-silence'); await toolClick(783, 75, 'v22-autoclip'); await toolClick(1008, 75, 'v23-voice-overwrite'); }
  // 자막: AI 자막 번역 · 맞춤법 검사 · 자막 파일 불러오기
  if (await tab('자막')) { await toolClick(458, 75, 'v24-ai-translate'); await toolClick(538, 75, 'v25-spellcheck'); await toolClick(44, 75, 'v26-import-text'); }
  // 서식: 테두리 · 배경 · 저장된 서식
  if (await tab('서식')) { await toolClick(760, 75, 'v27-format-border'); await toolClick(847, 75, 'v28-format-bg'); await toolClick(113, 75, 'v29-saved-format'); }
  // 삽입: 배경 음악 · 무료 이미지·비디오 · 녹화 및 녹음 · 캐릭터
  if (await tab('삽입')) { await shot(page, 'v30-insert'); const bgm = page.getByText('배경 음악', { exact: false }).first(); if (await bgm.count()) { try { await bgm.click({ timeout: 4000 }); await sleep(3000); await shot(page, 'v31-bgm'); await closeModals(); } catch (e) { log('bgm fail', first(e)); } } const free = page.getByText('무료 이미지', { exact: false }).first(); if (await free.count()) { try { await free.click({ timeout: 4000 }); await sleep(3000); await shot(page, 'v32-free-media'); await closeModals(); } catch (e) { log('free fail', first(e)); } } const rec = page.getByText('녹화 및 녹음', { exact: false }).first(); if (await rec.count()) { try { await rec.click({ timeout: 4000 }); await sleep(3000); await shot(page, 'v33-record'); await closeModals(); } catch (e) { log('rec fail', first(e)); } } }
  // AI 목소리: 클립 삽입 · AI 자막 더빙
  if (await tab('AI 목소리')) { await toolClick(44, 75, 'v34-aivoice-insert'); await toolClick(188, 75, 'v35-ai-dub'); }
  // 효과 · 템플릿
  if (await tab('효과')) { await shot(page, 'v36-effects'); }
  if (await tab('템플릿')) { await shot(page, 'v37-templates'); }
  // 파일: 화면 비율 · 썸네일 생성기 · 다른 형식으로 내보내기 · 모바일로 전송
  if (await tab('파일')) { await toolClick(368, 75, 'v38-ratio'); await toolClick(752, 75, 'v39-thumbnail'); await toolClick(660, 75, 'v40-export-other'); await toolClick(830, 75, 'v41-mobile'); }
  // 홈: Vrew 에이전트 · 클립 나누기
  if (await tab('홈')) { await toolClick(586, 75, 'v42-agent'); }
} catch (e) { log('ERROR', first(e)); await shot(page, 'zz-error'); }
finally { await browser.close(); }
