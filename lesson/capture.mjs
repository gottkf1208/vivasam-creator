// 미리캔버스 편집 화면을 Playwright로 열어 단계별 스크린샷을 lesson/shots/에 저장한다.
// 실행: node lesson/capture.mjs  (ai-concept-theater의 node_modules/playwright를 빌려 씀)
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire('C:/Users/dumok/dev/ai-concept-theater/package.json');
const { chromium } = require('playwright');

const OUT = path.resolve('C:/Users/dumok/dev/vivasam-creator-deck/lesson/shots');
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const shot = async (page, name) => { await page.screenshot({ path: path.join(OUT, name + '.png') }); log('shot', name); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dump = async (page, label) => {
  const info = await page.evaluate(() => {
    const fs = [...document.querySelectorAll('[data-f]')].map(e => e.getAttribute('data-f').replace(/-[0-9a-f]{4}$/, ''));
    const uniq = [...new Set(fs)];
    return { dataF: uniq.slice(0, 200) };
  });
  log(label, JSON.stringify(info));
};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ko-KR', deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('dialog', d => d.dismiss().catch(() => {}));

try {
  await page.goto('https://www.miricanvas.com/design', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(7000);
  await shot(page, 's01-design-modal');

  // 모달 닫기 (Escape → 실패 시 X 버튼)
  await page.keyboard.press('Escape'); await sleep(1500);
  if (await page.locator('[data-f^="DimWrapper"]').count()) {
    const x = page.locator('[data-f^="DimWrapper"] button').first();
    try { await x.click({ timeout: 3000 }); } catch (e) { log('x fail', e.message); }
    await sleep(1500);
  }
  await shot(page, 's02-editor-empty');
  await dump(page, 'editor');

  // 왼쪽 템플릿 패널 검색: '이름표'
  const tsearch = page.locator('input[placeholder*="템플릿 검색"]').first();
  await tsearch.click({ timeout: 10000 });
  await tsearch.fill('이름표');
  await tsearch.press('Enter');
  await sleep(6000);
  await shot(page, 's03-template-search');
  await dump(page, 'search');

  // 검색 결과 첫 썸네일 클릭
  const imgs = page.locator('[data-f^="TemplateItem"] img, [data-f*="Template"] img, [class*="Template"] img');
  log('template imgs', await imgs.count());
  const firstImg = imgs.first();
  try { await firstImg.click({ timeout: 8000 }); await sleep(5000); await shot(page, 's04-template-clicked'); }
  catch (e) { log('img click fail', e.message); }
  const btnsA = await page.evaluate(() => [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(Boolean).slice(0, 60));
  log('buttons after click:', JSON.stringify(btnsA));
  for (const t of ['이 템플릿으로 덮어쓰기', '이 템플릿 사용하기', '템플릿 사용하기', '이 페이지에 적용', '적용', '전체 적용', '사용하기']) {
    const b = page.getByRole('button', { name: t }).first();
    if (await b.count()) { try { await b.click({ timeout: 3000 }); await sleep(5000); await shot(page, 's05-template-applied'); log('applied via', t); break; } catch (e) {} }
  }
  await dump(page, 'applied');

  // 캔버스 텍스트 요소 찾기
  const cands = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.x < 430 || r.y < 70 || r.width < 20 || r.height < 12 || r.width > 900) continue;
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
      if (own.length > 0 && own.length < 40) out.push([el.tagName, el.getAttribute('data-f') || el.className.toString().slice(0, 40), own.slice(0, 30), Math.round(r.x), Math.round(r.y), Math.round(r.width)]);
    }
    return out.slice(0, 40);
  });
  log('canvas text candidates', JSON.stringify(cands));
  const pick = cands.find(c => c[0] === 'SPAN' && c[2] === '김비즈') || cands.find(c => c[0] === 'SPAN' && c[1] === '' && c[2].length >= 2);
  let targetPoint = pick ? { x: pick[3] + pick[5] / 2, y: pick[4] + 45 } : null;
  log('target point', JSON.stringify(targetPoint));
  if (targetPoint) {
    try {
      await page.mouse.click(targetPoint.x, targetPoint.y); await sleep(1000);
      await shot(page, 's06-text-selected');
      await page.mouse.dblclick(targetPoint.x, targetPoint.y); await sleep(1000);
      await page.keyboard.press('Control+A'); await page.keyboard.type('김햇살', { delay: 70 }); await sleep(1500);
      await shot(page, 's07-text-edited');
      await page.keyboard.press('Escape'); await sleep(600);
      // 텍스트를 다시 한 번 클릭해 선택 상태로: 왼쪽 패널에 글꼴 설정이 보임
      await page.mouse.click(targetPoint.x, targetPoint.y); await sleep(1200);
      const lp = await page.evaluate(() => [...document.querySelectorAll('button, [role=button], div')].filter(b => { const r = b.getBoundingClientRect(); return r.x > 70 && r.x < 420 && r.y > 60 && r.y < 500 && r.width > 100 && r.height < 60; }).map(b => (b.textContent || '').trim().slice(0, 40)).filter(t => t && t.length < 40).slice(0, 40));
      log('left panel texts', JSON.stringify(lp));
      const fontBtn2 = page.locator('button, [role=button]').filter({ hasText: /체$|Sans|고딕|명조|손글씨|Pretendard|나눔|배달|Noto|Gothic|Serif|폰트|글꼴/ }).first();
      if (await fontBtn2.count()) { try { await fontBtn2.click({ timeout: 4000 }); await sleep(2500); await shot(page, 's08-font-list'); await page.keyboard.press('Escape'); await sleep(600); } catch (e) { log('font fail', e.message); } }
      await page.keyboard.press('Escape'); await sleep(400);
      await page.mouse.click(1400, 500); await sleep(800);
    } catch (e) { log('text edit fail', e.message); }
  }
  // 왼쪽 탭들
  for (const [t, n] of [['요소', 's09-panel-elements'], ['텍스트', 's10-panel-text'], ['AI 도구', 's11-panel-ai'], ['업로드', 's12-panel-upload']]) {
    const tab = page.getByRole('button', { name: t, exact: true }).first();
    if (await tab.count()) { try { await tab.click({ timeout: 5000 }); await sleep(4000); await shot(page, n); } catch (e) { log('tab fail', t, e.message); } }
  }

  // 다운로드 패널
  const dl = page.getByRole('button', { name: /^다운로드/ }).first();
  if (await dl.count()) { try { await dl.click({ timeout: 5000 }); await sleep(3500); await shot(page, 's13-download'); await page.keyboard.press('Escape'); await sleep(800); } catch (e) { log('dl fail', e.message); } }

  // 공유 패널
  const sh = page.getByRole('button', { name: /^공유/ }).first();
  if (await sh.count()) { try { await sh.click({ timeout: 5000 }); await sleep(3500); await shot(page, 's14-share'); await page.keyboard.press('Escape'); await sleep(800); } catch (e) { log('share fail', e.message); } }

  // 로그인 화면 (입력 없음)
  const login = page.getByRole('button', { name: /로그인/ }).first();
  if (await login.count()) { try { await login.click({ timeout: 5000 }); await sleep(5000); await shot(page, 's15-login'); } catch (e) { log('login fail', e.message); } }
} catch (e) {
  log('ERROR', e.message);
  await shot(page, 'zz-error');
} finally {
  await browser.close();
}
