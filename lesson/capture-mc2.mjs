// 미리캔버스 2~6차시용 캡처: 템플릿 검색·적용(PPT·상장·카드뉴스·포스터·영상), 페이지 추가, 크기 변경, 다운로드 형식, 상단 메뉴, AI 도구.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire('C:/Users/dumok/dev/ai-concept-theater/package.json');
const { chromium } = require('playwright');
const OUT = path.resolve('C:/Users/dumok/dev/vivasam-creator-deck/lesson/shots-mc2');
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const first = e => String(e && e.message || e).split(/\r?\n/)[0];
const shot = async (page, n) => { await page.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n); };
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ko-KR', deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('dialog', d => d.dismiss().catch(() => {}));
const clickText = async (t, exact = true, wait = 2500) => { const loc = page.getByText(t, { exact }).first(); if (!(await loc.count())) { log('no text', t); return false; } try { await loc.click({ timeout: 6000 }); await sleep(wait); return true; } catch (e) { log('click fail', t, first(e)); return false; } };
async function applyTemplate(term, tag) {
  await page.keyboard.press('Escape'); await sleep(500);
  const tplTab = page.getByRole('button', { name: '템플릿', exact: true }).first(); if (await tplTab.count()) { try { await tplTab.click({ timeout: 4000 }); await sleep(2000); } catch (e) {} }
  const bk = page.getByRole('button', { name: /뒤로|이전/ }).first(); if (await bk.count()) { try { await bk.click({ timeout: 1500 }); await sleep(800); } catch (e) {} }
  for (let k = 0; k < 2; k++) { if (await page.getByText('비슷한 템플릿', { exact: true }).count()) { await page.mouse.click(383, 95); await sleep(1200); } }
  await page.mouse.click(35, 105); await sleep(2000);
  const tsearch = page.locator('input[placeholder*="템플릿 검색"]').first();
  await tsearch.click({ timeout: 10000 }); await tsearch.fill(''); await tsearch.fill(term); await tsearch.press('Enter'); await sleep(6000);
  await shot(page, `${tag}-search`);
  const imgs = page.locator('[data-f*="Template"] img, [class*="Template"] img');
  log(term, 'imgs', await imgs.count());
  try { await imgs.first().click({ timeout: 8000 }); await sleep(4000); await shot(page, `${tag}-preview`); } catch (e) { log('img fail', first(e)); }
  const b = page.getByRole('button', { name: '이 템플릿으로 덮어쓰기' }).first();
  if (await b.count()) { try { await b.click({ timeout: 4000 }); await sleep(6000); await shot(page, `${tag}-applied`); } catch (e) { log('apply fail', first(e)); } }
  // 뒤로(비슷한 템플릿 닫기)
  const back = page.locator('[data-f*="Back"], button[aria-label*="뒤로"]').first();
  if (await back.count()) { try { await back.click({ timeout: 2000 }); await sleep(1000); } catch (e) {} }
}
async function safeApply(term, tag) { try { await applyTemplate(term, tag); } catch (e) { log('applyTemplate fail', term, first(e)); await shot(page, tag + '-fail'); } }
try {
  await page.goto('https://www.miricanvas.com/design', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(7000);
  await page.keyboard.press('Escape'); await sleep(1200);
  if (await page.locator('[data-f^="DimWrapper"]').count()) { try { await page.locator('[data-f^="DimWrapper"] button').first().click({ timeout: 3000 }); await sleep(1000); } catch (e) {} }

  // 2차시: 수업 PPT
  await safeApply('수업 PPT', 's2-ppt');
  // 페이지 추가
  if (await clickText('페이지 추가', false, 3000)) await shot(page, 's2-page-added');
  // 상단 크기 버튼(px 표시) 클릭
  const sizeBtn = page.locator('button').filter({ hasText: /\d+\s*×\s*\d+\s*px/ }).first();
  if (await sizeBtn.count()) { try { await sizeBtn.click({ timeout: 4000 }); await sleep(2500); await shot(page, 's3-size-menu'); await page.keyboard.press('Escape'); await sleep(800); } catch (e) { log('size fail', first(e)); } }
  // 상단 ... 메뉴
  await page.mouse.click(1408, 32); await sleep(2000); await shot(page, 's2-more-menu'); await page.keyboard.press('Escape'); await sleep(800);
  // 하단 애니메이션
  if (await clickText('애니메이션', true, 2500)) { await shot(page, 's2-animation'); await page.keyboard.press('Escape'); await sleep(800); await page.mouse.click(35, 105); await sleep(1500); }

  // 3차시: 상장
  await safeApply('상장', 's3-award');
  await safeApply('학급 규칙', 's3-rules');
  // 인쇄물/상품 제작 버튼
  const printBtn = page.getByRole('button', { name: /인쇄물|명함 제작|제작/ }).first();
  if (await printBtn.count()) { try { await printBtn.click({ timeout: 4000 }); await sleep(4000); await shot(page, 's3-print'); await page.keyboard.press('Escape'); await sleep(800); if (!page.url().includes('/design')) { await page.goBack(); await sleep(5000); } } catch (e) { log('print fail', first(e)); } }

  // 4차시: 카드뉴스
  await safeApply('카드뉴스 안내', 's4-cardnews');
  // 다운로드 패널 + 파일 형식 열기
  const dl = page.getByRole('button', { name: /^다운로드/ }).first();
  if (await dl.count()) { try { await dl.click({ timeout: 5000 }); await sleep(3000); await shot(page, 's4-download'); const fmt = page.getByText('PNG', { exact: true }).first(); if (await fmt.count()) { await fmt.click({ timeout: 3000 }); await sleep(2000); await shot(page, 's4-download-formats'); } await page.keyboard.press('Escape'); await sleep(800); await page.keyboard.press('Escape'); await sleep(500); } catch (e) { log('dl fail', first(e)); } }

  // 5차시: 모둠 포스터
  await safeApply('환경 포스터', 's5-poster');
  // 공유 버튼
  const sh = page.getByRole('button', { name: /^공유/ }).first();
  if (await sh.count()) { try { await sh.click({ timeout: 5000 }); await sleep(3000); await shot(page, 's5-share'); await page.keyboard.press('Escape'); await sleep(800); } catch (e) { log('share fail', first(e)); } }

  // 6차시: AI 도구 · 영상 템플릿 · 배경
  for (const [t, n] of [['AI 도구', 's6-ai-tools'], ['배경', 's6-bg'], ['사진', 's6-photo'], ['요소', 's6-elements']]) { const tab = page.getByRole('button', { name: t, exact: true }).first(); if (await tab.count()) { try { await tab.click({ timeout: 5000 }); await sleep(4000); await shot(page, n); } catch (e) { log('tab fail', t, first(e)); } } }
  const tplTab = page.getByRole('button', { name: '템플릿', exact: true }).first(); if (await tplTab.count()) { try { await tplTab.click({ timeout: 4000 }); await sleep(2500); } catch (e) {} }
  await safeApply('수업 인트로 영상', 's6-video');
} catch (e) { log('ERROR', first(e)); await shot(page, 'zz-error'); }
finally { await browser.close(); }
