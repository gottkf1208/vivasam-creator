// 웹 브루(vrew.ai/ko/try) 데모 프로젝트를 열어 단계별 화면을 lesson/shots-vrew/에 저장한다. 로그인 없음.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire('C:/Users/dumok/dev/ai-concept-theater/package.json');
const { chromium } = require('playwright');
const OUT = path.resolve('C:/Users/dumok/dev/vivasam-creator-deck/lesson/shots-vrew');
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const first = e => String(e && e.message || e).split(/\r?\n/)[0];
const shot = async (page, n) => { await page.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n); };
const texts = async (page, sel = 'button, [role=button], [role=menuitem], [role=tab]') => page.evaluate(s => [...document.querySelectorAll(s)].map(b => (b.textContent || '').replace(/\s+/g, ' ').trim()).filter(t => t && t.length < 40), sel);
const clickText = async (page, t, exact = true) => {
  const loc = page.getByText(t, { exact }).first();
  if (!(await loc.count())) { log('no text', t); return false; }
  try { await loc.click({ timeout: 6000 }); await sleep(2500); return true; } catch (e) { log('click fail', t, first(e)); return false; }
};
async function closePopups(page) {
  for (let k = 0; k < 3; k++) {
    const closes = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('button, [role=button], svg, span, div')) {
        const r = el.getBoundingClientRect(); const t = (el.textContent || '').trim();
        const cls = el.className ? String(el.className) : '';
        if (r.width > 8 && r.width < 40 && r.height > 8 && r.height < 40 && (t === '×' || t === '✕' || t === 'X' || (el.getAttribute('aria-label') || '').includes('닫') || /close|Close/.test(cls))) out.push([Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]);
      }
      return out;
    });
    log('close candidates', JSON.stringify(closes.slice(0, 10)));
    if (!closes.length) break;
    for (const [x, y] of closes.slice(0, 4)) { await page.mouse.click(x, y); await sleep(600); }
  }
  for (const t of ['확인', '나중에 하기']) { const b = page.getByText(t, { exact: true }).first(); if (await b.count()) { try { await b.click({ timeout: 2000 }); await sleep(500); } catch (e) {} } }
  await page.mouse.click(1405, 199); await sleep(400); await page.mouse.click(1066, 441); await sleep(600);
  await page.keyboard.press('Escape'); await sleep(600);
}

const browser = await chromium.launch({ headless: true, args: ['--lang=ko-KR'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ko-KR', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36' });
const page = await ctx.newPage();
page.on('dialog', d => d.dismiss().catch(() => {}));
try {
  await page.goto('https://vrew.ai/ko/try/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(12000);
  await closePopups(page);
  await shot(page, 'v01-start');

  // 데모 프로젝트 열기
  const demo = page.getByText('데모 프로젝트 열기', { exact: false }).first();
  if (await demo.count()) { await demo.click({ timeout: 8000 }); log('demo clicked'); }
  await sleep(15000);
  await closePopups(page);
  await shot(page, 'v03-demo-editor');
  const cands = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 30 || r.height < 12 || r.y < 80) continue;
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
      if (own.length > 3 && own.length < 60) out.push([el.tagName, own.slice(0, 40), Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]);
    }
    return out.slice(0, 60);
  });
  log('text cands', JSON.stringify(cands).slice(0, 1200));

  // 상단 탭 순회
  for (const [t, n] of [['편집', 'v04-tab-edit'], ['자막', 'v05-tab-subtitle'], ['서식', 'v06-tab-format'], ['삽입', 'v07-tab-insert'], ['AI 목소리', 'v08-tab-aivoice'], ['템플릿', 'v09-tab-template'], ['효과', 'v10-tab-effect'], ['홈', 'v11-tab-home']]) {
    if (await clickText(page, t)) { await shot(page, n); }
  }
  // 편집 탭 '무음 구간 줄이기'
  if (await clickText(page, '편집')) {
    const sil = page.getByText('무음 구간', { exact: false }).first();
    if (await sil.count()) { try { await sil.click({ timeout: 5000 }); await sleep(2500); await shot(page, 'v17-silence'); await page.keyboard.press('Escape'); await sleep(800); } catch (e) { log('silence fail', first(e)); } }
  }
  // 자막 더블클릭 → 편집
  await clickText(page, '홈');
  await page.mouse.dblclick(820, 700); await sleep(1500); await shot(page, 'v18-subtitle-edit'); await page.keyboard.press('Escape'); await sleep(600);
  // 새로 만들기 모달 + 텍스트로 비디오 만들기
  await page.mouse.click(44, 75); await sleep(3000); await shot(page, 'v19-new-modal');
  const t2v = page.getByText('텍스트로 비디오 만들기', { exact: false }).first();
  if (await t2v.count()) { try { await t2v.click({ timeout: 5000 }); await sleep(4000); await shot(page, 'v20-text2video'); log('t2v', JSON.stringify((await texts(page, 'button, [role=button], span, h2, h3, label')).slice(0, 60))); } catch (e) { log('t2v fail', first(e)); } }
  await page.keyboard.press('Escape'); await sleep(800); await page.keyboard.press('Escape'); await sleep(800);
  // 파일 메뉴 · 내보내기
  if (await clickText(page, '파일')) { await shot(page, 'v12-menu-file'); }
  const ex = page.getByText('영상으로 내보내기', { exact: false }).first();
  if (await ex.count()) { try { await ex.click({ timeout: 5000 }); await sleep(3000); await shot(page, 'v13-export'); log('export', JSON.stringify((await texts(page, 'button, [role=menuitem], li, span, h1,h2,h3')).slice(0, 60))); await page.keyboard.press('Escape'); await sleep(800); } catch (e) { log('export fail', first(e)); } }
  // 클립 선택
  const clip = cands.find(c => c[2] > 380 && c[1].length > 6);
  if (clip) { await page.mouse.click(clip[2] + clip[4] / 2, clip[3] + clip[5] / 2); await sleep(1500); await shot(page, 'v14-clip-selected'); }
} catch (e) { log('ERROR', first(e)); await shot(page, 'zz-error'); }
finally { await browser.close(); }
