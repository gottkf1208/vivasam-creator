(function(){
'use strict';
window.__deckPristine = document.documentElement.cloneNode(true);
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const stage = $('#stage');
const slides = $$('#stage > .slide');
const N = slides.length;
let cur = 0, scrollMode = false;

/* ---------- BGM (synthesized in the browser) ---------- */
const BGM = (function(){
  let ctx = null, master = null, verbIn = null, noise = null, timer = null, nextT = 0, step = 0, on = false;
  const bpm = 84, s16 = 60 / bpm / 4;
  const CH = [[48,52,55,59,64],[45,48,52,55,60],[50,53,57,60,65],[43,47,50,53,59]];
  const f = m => 440 * Math.pow(2, (m - 69) / 12);
  function init(){
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    const len = ctx.sampleRate * 2.4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++){ const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
    const verb = ctx.createConvolver(); verb.buffer = buf; verbIn = ctx.createGain(); verbIn.gain.value = .32; verbIn.connect(verb); verb.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }
  function env(g, t, a, peak, dur){ g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function tone(type, freq, t, dur, peak, a, cutoff, wet){
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = freq; lp.type = 'lowpass'; lp.frequency.value = cutoff;
    o.connect(lp); lp.connect(g); g.connect(master); if (wet) g.connect(verbIn);
    env(g, t, a, peak, dur); o.start(t); o.stop(t + dur + .05);
  }
  function hit(t, type){
    if (type === 'kick'){ const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + .14); o.connect(g); g.connect(master); env(g, t, .004, .34, .32); o.start(t); o.stop(t + .4); return; }
    const s = ctx.createBufferSource(), g = ctx.createGain(), bp = ctx.createBiquadFilter(); s.buffer = noise;
    if (type === 'snare'){ bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = .7; s.connect(bp); bp.connect(g); g.connect(master); g.connect(verbIn); env(g, t, .003, .09, .2); }
    else { bp.type = 'highpass'; bp.frequency.value = 7500; s.connect(bp); bp.connect(g); g.connect(master); env(g, t, .002, type === 'hat2' ? .018 : .03, .05); }
    s.start(t); s.stop(t + .25);
  }
  function sched(st, t){
    const bar = Math.floor(st / 16) % 4, p = st % 16, ch = CH[bar];
    if (p === 0) ch.slice(1).forEach(n => { tone('triangle', f(n), t, s16 * 16, .028, .5, 1300, true); tone('sine', f(n) * 1.003, t, s16 * 16, .018, .6, 900, false); });
    if (p % 2 === 0){ const pat = [1,2,3,4,3,2,4,3]; tone('sine', f(ch[pat[p / 2]] + 12), t, .7, .045, .006, 3000, true); }
    if (p === 0 || p === 8 || p === 11) tone('sine', f(ch[0] - 12), t, s16 * (p === 11 ? 3 : 6), .12, .01, 400, false);
    if (p === 0 || p === 8) hit(t, 'kick'); if (p === 10) hit(t, 'kick');
    if (p === 4 || p === 12) hit(t, 'snare');
    if (p % 2 === 0) hit(t + (p % 4 === 2 ? s16 * .18 : 0), p % 4 === 2 ? 'hat2' : 'hat');
  }
  function loop(){ while (nextT < ctx.currentTime + .15){ sched(step, nextT); nextT += s16; step++; } }
  return {
    toggle(){
      if (!ctx && !init()) return false;
      on = !on;
      if (on){ ctx.resume(); nextT = ctx.currentTime + .08; step = 0; timer = setInterval(loop, 25); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(.42, ctx.currentTime, .6); }
      else { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, .25); const tt = timer; setTimeout(() => { clearInterval(tt); if (!on) ctx.suspend(); }, 900); }
      return on;
    }
  };
})();
const bBgm = $('#bBgm');
function toggleBgm(){ const s = BGM.toggle(); bBgm.setAttribute('aria-pressed', String(!!s)); bBgm.classList.toggle('bgm-on', !!s); }
bBgm.addEventListener('click', toggleBgm);

/* ---------- navigation ---------- */
const epTag = $('#epTag'), counter = $('#counter'), prog = $('#progress'), dockPg = $('#dockPg'), tkEp = $('#tkEp');
function steps(s){ return $$('[data-step]', s).sort((a, b) => a.dataset.step - b.dataset.step); }
function setupSteps(s, showAll){
  const st = steps(s);
  if (!st.length) return;
  s.classList.add('stepping');
  st.forEach(e => e.classList.toggle('shown', !!showAll));
}
function go(i, opts){
  i = Math.max(0, Math.min(N - 1, i));
  if (scrollMode){ slides[i].scrollIntoView({behavior:'smooth', block:'start'}); cur = i; updateChrome(); return; }
  const prev = slides[cur];
  if (prev && prev !== slides[i]){ prev.classList.remove('on'); prev.classList.toggle('prev', i > cur); }
  const back = opts && opts.back;
  cur = i;
  const s = slides[cur];
  s.classList.remove('prev');
  setupSteps(s, back);
  s.classList.add('on');
  updateChrome();
}
function updateChrome(){
  const s = slides[cur];
  epTag.textContent = s.dataset.ep; counter.textContent = `${cur + 1} / ${N}`; dockPg.textContent = `${cur + 1} / ${N}`;
  prog.style.width = ((cur + 1) / N * 100) + '%'; tkEp.textContent = s.dataset.title;
  stage.classList.toggle('is-dark', s.classList.contains('dark'));
  try { history.replaceState(null, '', '#s' + (cur + 1)); } catch(e){}
  renderNotes(); markToc();
}
function next(){
  const s = slides[cur], hidden = steps(s).filter(e => !e.classList.contains('shown'));
  if (!scrollMode && hidden.length){ hidden[0].classList.add('shown'); return; }
  if (cur < N - 1) go(cur + 1);
}
function prev(){ if (cur > 0) go(cur - 1, {back:true}); }
$('#bNext').addEventListener('click', next);
$('#bPrev').addEventListener('click', prev);
$$('[data-go]').forEach(b => b.addEventListener('click', () => document.body.classList.contains('editing') || go(slides.findIndex(s => s.dataset.ep === b.dataset.go))));

/* ---------- toc ---------- */
const toc = $('#toc');
function buildToc(){
  const groups = [];
  slides.forEach((s, i) => { const g = groups.find(x => x.ep === s.dataset.ep); const item = {i, t:s.dataset.title}; if (g) g.items.push(item); else groups.push({ep:s.dataset.ep, items:[item]}); });
  $('#tocGrid').innerHTML = groups.map(g => `<div class="toc-ep"><h4>${esc(g.ep)}</h4>${g.items.map(it => `<button type="button" data-i="${it.i}"><span>${it.i + 1}</span>${esc(it.t)}</button>`).join('')}</div>`).join('');
}
function markToc(){ $$('#tocGrid button').forEach(b => b.classList.toggle('cur', +b.dataset.i === cur)); }
buildToc();
$('#tocGrid').addEventListener('click', e => { const b = e.target.closest('button'); if (b){ toc.hidden = true; go(+b.dataset.i); } });
const openToc = () => { toc.hidden = !toc.hidden; markToc(); };
$('#bToc').addEventListener('click', openToc);
$('#tocClose').addEventListener('click', () => { toc.hidden = true; });
toc.addEventListener('click', e => { if (e.target === toc) toc.hidden = true; });

/* ---------- notes ---------- */
const notes = $('#notes'), bNote = $('#bNote'), t0 = Date.now();
function renderNotes(){
  const s = slides[cur], n = $('.nt', s);
  $('#nTitle').textContent = `${cur + 1}. ${s.dataset.title}`; $('#nPlan').textContent = s.dataset.plan ? '계획 ' + s.dataset.plan : '';
  $('#nBody').textContent = n ? n.textContent.trim() : '';
  $('#nNext').textContent = slides[cur + 1] ? '다음 장면 · ' + slides[cur + 1].dataset.title : '마지막 장면이에요';
}
function toggleNotes(){ notes.hidden = !notes.hidden; bNote.setAttribute('aria-pressed', String(!notes.hidden)); renderNotes(); }
bNote.addEventListener('click', toggleNotes);
setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); $('#nTimer').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }, 1000);

/* ---------- fullscreen ---------- */
function toggleFs(){
  try {
    if (!document.fullscreenElement){ const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => {}); }
    else if (document.exitFullscreen) document.exitFullscreen();
  } catch(e){}
}
$('#bFs').addEventListener('click', toggleFs);

/* ---------- keyboard / swipe / dock idle ---------- */
document.addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const tg = e.target;
  if (tg && (tg.isContentEditable || (/^(input|textarea|select)$/i.test(tg.tagName) && tg.type !== 'checkbox'))){ if (e.key === 'Escape' && tg.blur) tg.blur(); return; }
  const tag = (e.target.tagName || '').toLowerCase();
  const k = e.key;
  if (k === 'Escape'){ toc.hidden = true; if (!notes.hidden) toggleNotes(); return; }
  if (k === 'ArrowRight' || k === 'PageDown'){ e.preventDefault(); next(); return; }
  if (k === 'ArrowLeft' || k === 'PageUp'){ e.preventDefault(); prev(); return; }
  if (k === ' ' && !['button','input','label','select','textarea'].includes(tag)){ e.preventDefault(); next(); return; }
  if (k === 'Home'){ e.preventDefault(); go(0); return; }
  if (k === 'End'){ e.preventDefault(); go(N - 1); return; }
  if (/^[1-9]$/.test(k)){ const idx = slides.findIndex(s => s.dataset.ep === 'EP.0' + k); if (idx >= 0) go(idx); return; }
  if (k === '0'){ go(0); return; }
  const l = k.toLowerCase();
  if (l === 'm' || l === 'ㅡ') openToc();
  else if (l === 'n' || l === 'ㅜ') toggleNotes();
  else if (l === 'b' || l === 'ㅠ') toggleBgm();
  else if (l === 'f' || l === 'ㄹ') toggleFs();
});
let tx = null, ty = null;
stage.addEventListener('touchstart', e => { if (scrollMode || document.body.classList.contains('editing')) { tx = null; return; } tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, {passive:true});
stage.addEventListener('touchend', e => {
  if (scrollMode || tx === null) return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3){ dx < 0 ? next() : prev(); }
}, {passive:true});
const dock = $('#dock'); let idleT = null;
function wake(){ dock.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => { if (toc.hidden && notes.hidden && !scrollMode && !document.body.classList.contains('editing')) dock.classList.add('idle'); }, 2600); }
['mousemove','touchstart','keydown'].forEach(ev => document.addEventListener(ev, wake, {passive:true}));
dock.addEventListener('mouseenter', () => clearTimeout(idleT));
wake();

/* ---------- ticker & clock ---------- */
let TK = [];
try { TK = JSON.parse($('#deckTicker').textContent || '[]'); } catch(e){}
const tkHTML = TK.map(t => `<span><b>${esc(t[0])}</b>${esc(t[1])}</span>`).join('');
$('#tkRun').innerHTML = tkHTML + tkHTML;
function clock(){ const d = new Date(); $('#clock').textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
clock(); setInterval(clock, 15000);

/* ---------- layout: stage scaling / scroll mode ---------- */
function layout(){
  const vw = window.innerWidth, vh = window.innerHeight;
  const want = vw < 760 && vh > vw;
  if (want !== scrollMode){
    scrollMode = want;
    document.body.classList.toggle('scroll', scrollMode);
    if (scrollMode){ slides.forEach(s => { s.classList.add('on'); s.classList.remove('prev'); setupSteps(s, true); }); }
    else { slides.forEach((s, i) => { if (i !== cur){ s.classList.remove('on'); } s.style.transform = ''; s.style.marginBottom = ''; }); go(cur); }
  }
  if (scrollMode){
    const w = stage.clientWidth - 24, sc = w / 1600;
    slides.forEach(s => { s.style.transform = `scale(${sc})`; s.style.marginBottom = `${900 * sc - 900 + 12}px`; });
  } else {
    const sc = Math.min(vw / 1600, vh / 900);
    const x = (vw - 1600 * sc) / 2, y = (vh - 900 * sc) / 2;
    stage.style.transform = `translate(${x}px, ${y}px) scale(${sc})`;
  }
}
window.addEventListener('resize', layout);

/* ---------- edit mode ---------- */
const Edit = (function(){
  const body = document.body;
  const SKIP = '.nt,svg,canvas,video,button:not(.ag)';
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const ED = [], byKey = new Map(), noteOrig = new Map();
  slides.forEach((s, si) => {
    let k = 0;
    const walk = el => {
      for (const c of Array.from(el.children)){
        if (c.matches(SKIP)) continue;
        if (Array.from(c.childNodes).some(n => n.nodeType === 3 && n.textContent.trim())){
          const key = si + ':' + (k++), orig = c.innerHTML, x = {key, el:c, orig, h:hash(orig)};
          c.dataset.ed = key; ED.push(x); byKey.set(key, x);
        } else walk(c);
      }
    };
    walk(s);
    const nt = $('.nt', s); if (nt) noteOrig.set(si, nt.textContent);
  });

  const inArtifact = !!(window.claude && typeof window.claude.use === 'function');
  const onGitHub = /\.github\.io$/i.test(location.hostname);
  const isFile = location.protocol === 'file:';
  const DECK = (document.body.dataset.deck || 'deck');
  const DRAFT = DECK + '-draft', GH = DECK + '-gh';
  const blank = () => ({v:1, t:{}, n:{}, u:''});
  let saved = blank(), state = blank(), editing = false, artifactNS = null, draftT = null;
  const bEdit = $('#bEdit'), bar = $('#editbar'), st = $('#ebSt');
  const toastEl = $('#toast'); let toastT = null;
  function toast(t){ toastEl.textContent = t; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 3600); }
  const clone = o => JSON.parse(JSON.stringify(o));
  function norm(o){ const r = blank(); if (o && typeof o === 'object'){ if (o.t && typeof o.t === 'object') r.t = o.t; if (o.n && typeof o.n === 'object') r.n = o.n; if (typeof o.u === 'string') r.u = o.u; } return r; }

  function apply(){
    ED.forEach(x => { const e = state.t[x.key]; const html = (e && e.h === x.h && typeof e.html === 'string') ? e.html : x.orig; if (x.el.innerHTML !== html) x.el.innerHTML = html; });
    slides.forEach((s, i) => { const nt = $('.nt', s); if (nt) nt.textContent = typeof state.n[i] === 'string' ? state.n[i] : noteOrig.get(i); });
    renderNotes(); count();
  }
  function count(){
    const n = Object.keys(state.t).length + Object.keys(state.n).length;
    const unsaved = JSON.stringify(state.t) !== JSON.stringify(saved.t) || JSON.stringify(state.n) !== JSON.stringify(saved.n);
    st.textContent = (n ? `수정 ${n}곳` : '수정 없음') + (unsaved ? ' · 저장 안 됨' : ' · 저장됨');
    return unsaved;
  }
  function dirty(){
    count();
    clearTimeout(draftT);
    draftT = setTimeout(() => { try { localStorage.setItem(DRAFT, JSON.stringify({base:saved.u, state})); } catch(e){} }, 400);
  }
  function clearDraft(){ try { localStorage.removeItem(DRAFT); } catch(e){} }
  const editsFile = () => DECK + '.edits.json';

  async function load(){
    let src = null;
    if (!isFile){
      try { const r = await fetch(editsFile(), {cache:'no-store'}); if (r.ok) src = await r.json(); } catch(e){}
    }
    if (!src){ try { src = JSON.parse($('#deckEdits').textContent || '{}'); } catch(e){} }
    saved = norm(src); state = clone(saved);
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT) || 'null');
      if (d && d.base === saved.u && d.state){ const ds = norm(d.state); if (JSON.stringify(ds.t) !== JSON.stringify(saved.t) || JSON.stringify(ds.n) !== JSON.stringify(saved.n)){ state = ds; toast('저장하지 않은 수정 내용을 불러왔어요. 편집 모드에서 저장해 주세요.'); } }
      else if (d) clearDraft();
    } catch(e){}
    apply();
  }

  function setEditing(on){
    editing = on;
    body.classList.toggle('editing', on);
    ED.forEach(x => { if (on){ x.el.setAttribute('contenteditable', 'true'); x.el.spellcheck = false; } else x.el.removeAttribute('contenteditable'); });
    const nb = $('#nBody'); if (on) nb.setAttribute('contenteditable', 'true'); else nb.removeAttribute('contenteditable');
    bar.hidden = !on; bEdit.setAttribute('aria-pressed', String(on));
    if (!on && document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (on) toast('글자를 눌러 바로 고쳐요. N키로 연 발표자 대본도 고칠 수 있어요.');
  }
  bEdit.addEventListener('click', () => setEditing(!editing));
  $('#ebDone').addEventListener('click', () => setEditing(false));
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (editing && t && t.isContentEditable && e.key === 'Enter'){ e.preventDefault(); document.execCommand('insertLineBreak'); return; }
    if (e.altKey || e.ctrlKey || e.metaKey || (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)))) return;
    if ((e.key === 'e' || e.key === 'E' || e.key === 'ㄷ') && !bEdit.hidden) setEditing(!editing);
  });
  document.addEventListener('input', e => {
    if (!editing) return;
    const el = e.target.closest && e.target.closest('[data-ed]');
    if (el){ const x = byKey.get(el.dataset.ed); if (!x) return; if (el.innerHTML === x.orig) delete state.t[x.key]; else state.t[x.key] = {h:x.h, html:el.innerHTML}; dirty(); return; }
    if (e.target.id === 'nBody'){ const i = cur, txt = e.target.innerText.replace(/\n{3,}/g, '\n\n'); const nt = $('.nt', slides[i]); if (nt) nt.textContent = txt; if (txt.trim() === (noteOrig.get(i) || '').trim()) delete state.n[i]; else state.n[i] = txt; dirty(); }
  });
  document.addEventListener('paste', e => {
    if (!editing || !(e.target.closest && (e.target.closest('[data-ed]') || e.target.closest('#nBody')))) return;
    e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
  });
  document.addEventListener('click', e => { if (editing && e.target.closest && e.target.closest('[data-ed] a')) e.preventDefault(); }, true);

  function payload(){ return Object.assign(clone(state), {v:1, u:new Date().toISOString()}); }
  function afterSave(p){ saved = norm(p); state = clone(saved); clearDraft(); count(); }

  function twice(btn, label, fn){
    let armed = false, t = null;
    btn.addEventListener('click', () => {
      if (!armed){ armed = true; btn.textContent = '한 번 더 누르면 실행'; btn.classList.add('warn'); t = setTimeout(() => { armed = false; btn.textContent = label; btn.classList.remove('warn'); }, 3000); return; }
      clearTimeout(t); armed = false; btn.textContent = label; btn.classList.remove('warn'); fn();
    });
  }
  twice($('#ebRevert'), '마지막 저장으로', () => { state = clone(saved); apply(); clearDraft(); toast('마지막으로 저장한 상태로 돌렸어요.'); });
  twice($('#ebReset'), '원본으로', () => { state = blank(); state.u = saved.u; apply(); dirty(); toast('원본 글로 돌렸어요. 저장해야 모두에게 반영돼요.'); });

  async function saveArtifact(){
    const p = payload();
    try { const files = {}; files[editsFile()] = {content: JSON.stringify(p, null, 1), contentType: 'application/json'}; await artifactNS.publish(files); afterSave(p); toast('저장했어요. 이 발표를 여는 모든 사람에게 반영돼요.'); }
    catch(err){
      const c = err && err.code;
      if (c === 'conflict') toast('다른 곳에서 먼저 저장해 새 버전으로 다시 열려요.');
      else if (['not_writer','not_granted','consent_required','not_declared','capability_disabled','capability_removed'].includes(c)){ toast('이 화면에서는 저장할 수 없어요. 수정 내용은 이 브라우저에만 남아 있어요.'); $('#ebSave').hidden = true; }
      else if (c === 'rate_limited') toast('잠시 뒤에 다시 저장해 주세요.');
      else toast('저장하지 못했어요. 잠시 뒤 다시 눌러 주세요.');
    }
  }

  const ghModal = $('#ghModal'), ghMsg = $('#ghMsg');
  const ghMsgSet = (t, err) => { ghMsg.textContent = t; ghMsg.classList.toggle('err', !!err); };
  function repoGuess(){
    const owner = location.hostname.split('.')[0], seg = location.pathname.split('/').filter(Boolean)[0];
    return owner + '/' + (seg && !/\.html?$/i.test(seg) ? seg : owner + '.github.io');
  }
  function editsPath(){
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length && /\.html?$/i.test(parts[parts.length - 1])) parts.pop();
    const repoSeg = repoGuess().split('/')[1];
    if (parts[0] === repoSeg) parts.shift();
    return parts.concat(editsFile()).join('/');
  }
  function openGh(){
    let s = null; try { s = JSON.parse(localStorage.getItem(GH) || 'null'); } catch(e){}
    $('#ghRepo').value = (s && s.repo) || repoGuess();
    $('#ghToken').value = (s && s.token) || '';
    $('#ghRemember').checked = !!(s && s.token);
    ghMsgSet(''); ghModal.hidden = false;
  }
  $('#ghCancel').addEventListener('click', () => { ghModal.hidden = true; });
  ghModal.addEventListener('click', e => { if (e.target === ghModal) ghModal.hidden = true; });
  $('#ghGo').addEventListener('click', async () => {
    const repo = $('#ghRepo').value.trim(), token = $('#ghToken').value.trim();
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return ghMsgSet('저장소는 "사용자명/저장소" 형식으로 적어 주세요.', true);
    if (!token) return ghMsgSet('토큰을 넣어 주세요.', true);
    const H = {'Authorization':'Bearer ' + token, 'Accept':'application/vnd.github+json'};
    const api = `https://api.github.com/repos/${repo}/contents/${editsPath()}`;
    ghMsgSet('저장하는 중이에요…');
    try {
      const curR = await fetch(api, {headers:H, cache:'no-store'});
      if (curR.status === 401) throw new Error('토큰이 올바르지 않아요. 다시 확인해 주세요.');
      const info = curR.ok ? await curR.json() : null;
      const p = payload();
      const bytes = new TextEncoder().encode(JSON.stringify(p, null, 1));
      let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
      const res = await fetch(api, {method:'PUT', headers:Object.assign({'Content-Type':'application/json'}, H), body:JSON.stringify({message:'기획안 수정 (웹 편집)', content:btoa(bin), sha: info && info.sha ? info.sha : undefined})});
      if (!res.ok){ const j = await res.json().catch(() => ({})); throw new Error(res.status === 403 || res.status === 404 ? `이 토큰으로는 ${repo}에 저장할 수 없어요. 토큰의 Repository access와 Contents(Read and write) 권한을 확인해 주세요.` : res.status === 409 ? '다른 곳에서 먼저 저장했어요. 새로고침한 뒤 다시 저장해 주세요.' : (j.message || '저장하지 못했어요.')); }
      try { localStorage.setItem(GH, JSON.stringify({repo, token: $('#ghRemember').checked ? token : ''})); } catch(e){}
      afterSave(p);
      ghMsgSet('저장했어요. 1~2분 뒤 새로고침하면 모두에게 반영돼요.');
      setTimeout(() => { ghModal.hidden = true; }, 1800);
    } catch(err){ ghMsgSet(err.message || '저장하지 못했어요.', true); }
  });

  function downloadHtml(){
    const c = window.__deckPristine.cloneNode(true);
    c.querySelectorAll('script:not([data-deck])').forEach(s => s.remove());
    const p = payload();
    c.querySelector('#deckEdits').textContent = JSON.stringify(p).replace(/</g, '\\u003c');
    const blob = new Blob(['<!doctype html>\n' + c.outerHTML], {type:'text/html'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = decodeURIComponent(location.pathname.split('/').pop() || '') || 'index.html';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    if (isFile) afterSave(p);
    toast(isFile ? '수정본을 받았어요. 원래 파일과 바꿔 쓰면 수정 내용이 그대로 남아요.' : '수정본 HTML 파일을 받았어요.');
  }

  function setup(){
    const save = $('#ebSave'), file = $('#ebFile');
    if (artifactNS){ save.textContent = '저장'; file.hidden = true; save.onclick = saveArtifact; }
    else if (onGitHub){ save.textContent = '깃허브에 저장'; file.hidden = false; save.onclick = openGh; }
    else { save.textContent = 'HTML 파일로 저장'; file.hidden = true; save.onclick = downloadHtml; }
    file.onclick = downloadHtml;
  }
  if (inArtifact){
    bEdit.hidden = true;
    window.claude.use('artifact').then(ns => { if (ns){ artifactNS = ns; bEdit.hidden = false; setup(); } }).catch(() => {});
  } else setup();
  window.addEventListener('beforeunload', e => { if (editing && count()){ e.preventDefault(); e.returnValue = ''; } });
  load();
  return {toggle: () => setEditing(!editing)};
})();

window.__deck = {cur: () => cur, slides, refreshNotes: renderNotes, isScroll: () => scrollMode};
/* ---------- start ---------- */
const m = /^#s(\d+)$/.exec(location.hash || '');
cur = m ? Math.max(0, Math.min(N - 1, +m[1] - 1)) : 0;
layout();
if (!scrollMode) go(cur); else updateChrome();
window.addEventListener('hashchange', () => { const h = /^#s(\d+)$/.exec(location.hash || ''); if (h && +h[1] - 1 !== cur) go(+h[1] - 1); });
})();
