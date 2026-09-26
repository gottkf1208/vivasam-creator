// 미리캔버스 보충: 인쇄 패널 없는 상태에서 카드뉴스·포스터·다운로드 형식·공유·동영상 템플릿·요소 검색·업로드·페이지 추가.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire('C:/Users/dumok/dev/ai-concept-theater/package.json');
const { chromium } = require('playwright');
const OUT = path.resolve('C:/Users/dumok/dev/vivasam-creator-deck/lesson/shots-mc3');
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const first = e => String(e && e.message || e).split(/\r?\n/)[0];
const shot = async (page, n) => { await page.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n); };
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ko-KR' });
const page = await ctx.newPage();
page.on('dialog', d => d.dismiss().catch(() => {}));
async function openEditor() {
  await page.goto('https://www.miricanvas.com/design', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(7000); await page.keyboard.press('Escape'); await sleep(1200);
  if (await page.locator('[data-f^="DimWrapper"]').count()) { try { await page.locator('[data-f^="DimWrapper"] button').first().click({ timeout: 3000 }); await sleep(1000); } catch (e) {} }
}
async function searchApply(term, tag, pick = 0) {
  await page.mouse.click(35, 105); await sleep(2000);
  for (let k = 0; k < 2; k++) { if (await page.getByText('비슷한 템플릿', { exact: true }).count()) { await page.mouse.click(383, 95); await sleep(1200); } }
  const ts = page.locator('input[placeholder*="템플릿 검색"]').first();
  await ts.click({ timeout: 10000 }); await ts.fill(''); await ts.fill(term); await ts.press('Enter'); await sleep(6000);
  await shot(page, `${tag}-search`);
  const imgs = page.locator('[data-f*="Template"] img, [class*="Template"] img');
  try { await imgs.nth(pick).click({ timeout: 8000 }); await sleep(4000); await shot(page, `${tag}-preview`); } catch (e) { log('img fail', first(e)); }
  const b = page.getByRole('button', { name: '이 템플릿으로 덮어쓰기' }).first();
  if (await b.count()) { try { await b.click({ timeout: 4000 }); await sleep(6000); await shot(page, `${tag}-applied`); } catch (e) { log('apply fail', first(e)); } }
}
try {
  await openEditor();
  await searchApply('학교 카드뉴스', 'c4-cardnews');
  // 페이지 추가(+)
  await page.mouse.click(1186, 794); await sleep(2500); await shot(page, 'c4-page-added');
  // 다운로드 패널
  const dl = page.getByRole('button', { name: /^다운로드/ }).first();
  if (await dl.count()) { try { await dl.click({ timeout: 5000 }); await sleep(3000); await shot(page, 'c4-download'); const pdf = page.getByText('PDF', { exact: true }).first(); if (await pdf.count()) { await pdf.click({ timeout: 3000 }); await sleep(2000); await shot(page, 'c4-download-pdf'); } await page.keyboard.press('Escape'); await sleep(800); } catch (e) { log('dl fail', first(e)); } }
  // 공유
  const sh = page.getByRole('button', { name: /^공유/ }).first();
  if (await sh.count()) { try { await sh.click({ timeout: 5000 }); await sleep(3000); await shot(page, 'c5-share'); await page.keyboard.press('Escape'); await sleep(800); } catch (e) { log('share fail', first(e)); } }
  await searchApply('모둠 발표 포스터', 'c5-poster');
  // 요소 탭 검색
  const el = page.getByRole('button', { name: '요소', exact: true }).first();
  if (await el.count()) { try { await el.click({ timeout: 4000 }); await sleep(3000); const es = page.locator('input[placeholder*="요소"]').first(); if (await es.count()) { await es.fill('지구'); await es.press('Enter'); await sleep(4000); } await shot(page, 'c5-elements-search'); } catch (e) { log('el fail', first(e)); } }
  // 업로드 탭
  const up = page.getByRole('button', { name: '업로드', exact: true }).first();
  if (await up.count()) { try { await up.click({ timeout: 4000 }); await sleep(3000); await shot(page, 'c6-upload'); } catch (e) {} }
  // AI 도구 → 바로 시작하기
  const ai = page.getByRole('button', { name: 'AI 도구', exact: true }).first();
  if (await ai.count()) { try { await ai.click({ timeout: 4000 }); await sleep(3000); await shot(page, 'c6-ai-tools'); const go = page.getByText('바로 시작하기', { exact: true }).first(); if (await go.count()) { await go.click({ timeout: 4000 }); await sleep(4000); await shot(page, 'c6-ai-start'); await page.keyboard.press('Escape'); await sleep(800); } const bg = page.getByText('배경 만들기', { exact: true }).first(); if (await bg.count()) { await ai.click({ timeout: 4000 }); await sleep(2000); await bg.click({ timeout: 4000 }); await sleep(4000); await shot(page, 'c6-ai-bg'); await page.keyboard.press('Escape'); await sleep(800); } } catch (e) { log('ai fail', first(e)); } }
  // 동영상 탭
  const vt = page.getByRole('button', { name: '동영상', exact: true }).first();
  if (await vt.count()) { try { await vt.click({ timeout: 4000 }); await sleep(4000); await shot(page, 'c6-video-tab'); } catch (e) {} }
  // 크기 메뉴 → 동영상 탭
  const sizeBtn = page.locator('button').filter({ hasText: /\d+\s*×\s*\d+\s*(px|mm)/ }).first();
  if (await sizeBtn.count()) { try { await sizeBtn.click({ timeout: 4000 }); await sleep(2000); const tab = page.getByText('동영상', { exact: true }).nth(1); if (await tab.count()) { await tab.click({ timeout: 3000 }); await sleep(2000); } await shot(page, 'c6-size-video'); await page.keyboard.press('Escape'); await sleep(800); } catch (e) { log('size fail', first(e)); } }
  await searchApply('영상 인트로', 'c6-video');
} catch (e) { log('ERROR', first(e)); await shot(page, 'zz-error'); }
finally { await browser.close(); }
