/* 쌤크리에이터 연수 플레이어 — 한 차시 = courses/{course}/s{n}.js 가 window.LESSON 을 정의한다.
   play.html?c=miricanvas&s=2 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const q = new URLSearchParams(location.search);
  const cid = q.get('c') || 'miricanvas', sn = Math.max(1, Math.min(6, +q.get('s') || 1));
  const COURSE = (window.COURSES || {})[cid];
  if (!COURSE) { document.body.innerHTML = '<p style="padding:40px">과정을 찾을 수 없어요.</p>'; return; }

  /* ---------- 진도 저장 ---------- */
  const PKEY = 'vc-progress-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(PKEY) || '{}'); } catch (e) { return {}; } };
  const save = p => { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} };
  const prog = load(); prog[cid] = prog[cid] || {}; prog[cid][sn] = prog[cid][sn] || { seen: [], quiz: 0, quizN: 0, check: [], done: false };
  const P = prog[cid][sn];
  window.VC = { prog, save, cid, sn };

  /* ---------- 데이터 파일 로드 ---------- */
  const sc = document.createElement('script');
  sc.src = `courses/${cid}/s${sn}.js?v=${Date.now() % 1e6}`;
  sc.onload = init;
  sc.onerror = () => { $('#stage').innerHTML = '<div class="talk"><div class="bubble" style="left:200px;top:300px;width:1000px">이 차시는 아직 준비 중이에요.</div></div>'; $('#cap').innerHTML = '<span>준비 중</span>'; };
  document.head.appendChild(sc);

  function init() {
    const L = window.LESSON;
    const IMG = `courses/${cid}/img/`;
    const SEGS = L.segs, STEPS = L.steps, N = STEPS.length;
    P.N = N;
    document.title = `${COURSE.short} ${sn}차시 · ${L.title}`;
    /* 헤더 */
    $('#brandCourse').textContent = `${COURSE.short} 6차시`;
    $('#brandLink').href = `course.html?c=${cid}`;
    $('#eyebrow').innerHTML = `<b>${sn}차시 · ${L.minutes || 25}분</b> ${esc(L.title)}`;
    $('#h1').innerHTML = L.h1;
    $('#sub').textContent = L.sub;
    $('#chips').innerHTML = [['세그먼트', SEGS.length + '개'], ['장면', N + '개'], ['산출물', L.outputs], ['준비물', L.prep]].map(c => `<span class="chip">${esc(c[0])} <b>${esc(c[1])}</b></span>`).join('');
    $('#sessNav').innerHTML = COURSE.sessions.map((t, i) => { const k = i + 1, d = prog[cid][k] && prog[cid][k].done; return `<a href="play.html?c=${cid}&s=${k}" class="${k === sn ? 'cur' : ''} ${d ? 'done' : ''}">${k}차시 ${esc(t)}</a>`; }).join('');

    const stage = $('#stage'), wrap = $('#stageWrap'), cap = $('#cap'), progBar = $('#prog');
    let cur = -1, playing = false, t0 = 0, raf = null, elapsed = 0, timers = [];
    function layout() { const s = wrap.clientWidth / 1440; stage.style.transform = `scale(${s})`; }
    window.addEventListener('resize', layout); layout();
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
    const CURSOR = '<svg viewBox="0 0 24 24"><path d="M4 3l7 17 2.5-7.5L21 10z" fill="#fff" stroke="#1B1F24" stroke-width="1.6" stroke-linejoin="round"/></svg>';

    function render(i) {
      const s = STEPS[i];
      clearTimers();
      stage.innerHTML = '';
      const seg = SEGS.find(x => x.id === s.seg) || SEGS[0];
      const no = document.createElement('div'); no.className = 'step-no'; no.innerHTML = `<b>${esc(seg.name)}</b> ${i + 1} / ${N}`;
      if (s.type === 'shot') {
        const sh = document.createElement('div'); sh.className = 'shot';
        sh.innerHTML = `<img src="${IMG}${s.img}.webp" alt="">`;
        let x = 0, y = 0, w = 0, h = 0;
        if (s.hl) {
          [x, y, w, h] = s.hl;
          const hl = document.createElement('div'); hl.className = 'hl' + (s.below ? ' below' : '') + (s.right ? ' right' : '') + (s.aqua ? ' aqua' : '');
          hl.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
          hl.innerHTML = `<span class="tag">${esc(s.tag || '')}</span>`;
          sh.appendChild(hl);
          requestAnimationFrame(() => hl.classList.add('on'));
        }
        /* 시연 커서: cursor:[x,y] (없으면 강조 상자 중앙) · click · type */
        if (s.cursor || s.click || s.typeText) {
          const cx = s.cursor ? s.cursor[0] : x + w / 2, cy = s.cursor ? s.cursor[1] : y + h / 2;
          const c = document.createElement('div'); c.className = 'cursor'; c.innerHTML = CURSOR;
          c.style.left = (cx - 300) + 'px'; c.style.top = (cy + 200) + 'px';
          sh.appendChild(c);
          later(() => { c.style.left = cx + 'px'; c.style.top = cy + 'px'; }, 250);
          if (s.click !== false) later(() => c.classList.add('click'), 1500);
          if (s.typeText) {
            const tp = document.createElement('div'); tp.className = 'typing'; tp.style.left = (cx + 30) + 'px'; tp.style.top = (cy + 40) + 'px'; tp.textContent = '';
            sh.appendChild(tp);
            const txt = s.typeText; let k = 0;
            later(function tick() { tp.textContent = txt.slice(0, ++k); if (k < txt.length) later(tick, 90); }, 2100);
          }
        }
        stage.append(sh, no);
        const z = s.zoom || 1;
        if (z > 1 && s.hl) {
          const cx = x + w / 2, cy = y + h / 2;
          let tx = 720 - cx * z, ty = 450 - cy * z;
          tx = Math.min(0, Math.max(1440 - 1440 * z, tx)); ty = Math.min(0, Math.max(900 - 900 * z, ty));
          later(() => { sh.style.transform = `translate(${tx}px,${ty}px) scale(${z})`; }, 60);
        }
      } else if (s.type === 'talk') {
        const t = document.createElement('div'); t.className = 'talk';
        t.innerHTML = `<div class="q"><img src="char/${s.pose || 'base'}.webp" alt=""></div><div class="bubble" style="left:470px;top:200px;width:840px">${s.bubble}</div>`;
        stage.append(t, no);
      } else if (s.type === 'cards') {
        const t = document.createElement('div'); t.className = 'talk';
        const n = s.cards.length; const cols = n === 4 ? 2 : n;
        t.innerHTML = `<div class="q" style="width:300px;left:40px"><img src="char/${s.pose || 'point'}.webp" alt=""></div><div class="bigline" style="left:420px;top:90px;width:960px">${esc(s.title)}</div><div class="cards" style="left:420px;top:210px;width:960px;grid-template-columns:repeat(${cols},1fr)">${s.cards.map(c => `<div class="cardx ${c[0] === 'O' ? 'aqua' : (c[0] === 'X' || c[0] === '!') ? 'orange' : ''}"><div class="k">${esc(c[0])}</div><h4>${esc(c[1])}</h4><p>${esc(c[2])}</p></div>`).join('')}</div>`;
        stage.append(t, no);
        $$('.cardx', t).forEach((c, k) => later(() => c.classList.add('on'), 300 + k * 700));
      } else if (s.type === 'flow') {
        const t = document.createElement('div'); t.className = 'talk';
        t.innerHTML = `<div class="q" style="width:300px;left:40px"><img src="char/${s.pose || 'point'}.webp" alt=""></div><div class="bigline" style="left:420px;top:110px;width:960px">${esc(s.title)}</div><div class="flow" style="left:420px;top:300px;width:960px">${s.flow.map((f, k) => `${k ? '<span class="ar">→</span>' : ''}<div class="fb ${f[3] || ''}"><div class="k">${esc(f[1])}</div><h4>${esc(f[0])}</h4><p>${esc(f[2])}</p></div>`).join('')}</div>`;
        stage.append(t, no);
        $$('.fb', t).forEach((c, k) => later(() => c.classList.add('on'), 300 + k * 800));
      } else if (s.type === 'mission') {
        const t = document.createElement('div'); t.className = 'mission';
        t.innerHTML = `<div class="in"><div class="k">${esc(s.k || '실습 미션')}</div><h2>${esc(s.title)}</h2><ol>${s.items.map((it, k) => `<li><b>${k + 1}</b><span>${it}</span></li>`).join('')}</ol></div><div class="q"><img src="char/${s.pose || 'point'}.webp" alt=""></div>${s.stamp ? `<div class="stamp">${esc(s.stamp)}</div>` : ''}`;
        stage.append(t, no);
        $$('li', t).forEach((c, k) => later(() => c.classList.add('on'), 400 + k * 600));
        if (s.stamp) later(() => $('.stamp', t).classList.add('on'), 400 + s.items.length * 600 + 300);
      }
      cap.innerHTML = '<span>' + s.cap + '</span>';
      $('#pg').textContent = `${i + 1} / ${N}`;
      $('#sideTitle').textContent = s.side.t;
      $('#sideDo').innerHTML = s.side.do.map(d => `<li>${d}</li>`).join('');
      $('#sideWhy').innerHTML = s.side.why;
      $$('#segList button').forEach(b => b.setAttribute('aria-current', String(b.dataset.seg === s.seg)));
      if (voiceOn) speak(cap.textContent);
      P.seen[i] = true; saveProgress();
      try { history.replaceState(null, '', `?c=${cid}&s=${sn}#s${i + 1}`); } catch (e) {}
    }
    function go(i) { i = Math.max(0, Math.min(N - 1, i)); cur = i; elapsed = 0; render(i); progBar.style.width = '0%'; if (playing) t0 = performance.now(); }
    function tick(now) {
      if (!playing) return;
      const s = STEPS[cur]; elapsed = (now - t0) / 1000;
      progBar.style.width = Math.min(100, elapsed / s.dur * 100) + '%';
      if (elapsed >= s.dur) { if (cur < N - 1) go(cur + 1); else { stop(); progBar.style.width = '100%'; return; } }
      raf = requestAnimationFrame(tick);
    }
    function play() { if (playing) return; playing = true; t0 = performance.now() - elapsed * 1000; $('#bPlay span').textContent = '멈춤'; raf = requestAnimationFrame(tick); }
    function stop() { playing = false; cancelAnimationFrame(raf); $('#bPlay span').textContent = '재생'; }
    $('#bPlay').addEventListener('click', () => playing ? stop() : play());
    $('#bNext').addEventListener('click', () => go(cur + 1));
    $('#bPrev').addEventListener('click', () => go(cur - 1));
    $('#segList').innerHTML = SEGS.map((s, k) => `<button type="button" data-seg="${s.id}"><b>${k + 1}</b>${esc(s.name)} · ${s.min}분</button>`).join('');
    $$('#segList button').forEach(b => b.addEventListener('click', () => go(STEPS.findIndex(s => s.seg === b.dataset.seg))));

    /* 음성 */
    let voiceOn = false, voice = null;
    const ttsOk = 'speechSynthesis' in window;
    function pickVoice() { const vs = speechSynthesis.getVoices(); return vs.find(v => /ko[-_]KR/i.test(v.lang) && /Google|Microsoft|Yuna|Heami|SunHi/i.test(v.name)) || vs.find(v => /ko/i.test(v.lang)) || null; }
    if (ttsOk) { voice = pickVoice(); speechSynthesis.addEventListener?.('voiceschanged', () => { voice = pickVoice(); }); }
    function speak(txt) { if (!ttsOk || !voiceOn) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = 'ko-KR'; u.rate = 1.05; if (voice) u.voice = voice; speechSynthesis.speak(u); }
    function toggleVoice() { if (!ttsOk) { toast('이 브라우저는 음성 합성을 지원하지 않아요.'); return; } voiceOn = !voiceOn; $('#bVoice').setAttribute('aria-pressed', String(voiceOn)); if (voiceOn) speak(cap.textContent); else speechSynthesis.cancel(); }
    $('#bVoice').addEventListener('click', toggleVoice);

    /* 강사 대본 */
    const notes = $('#notes');
    function openNotes() { const seg = SEGS.find(x => x.id === STEPS[cur].seg); $('#nTitle').textContent = `${seg.name} · 강사 대본`; $('#nPlan').textContent = `계획 ${seg.min}분 · 장면 ${cur + 1}/${N}`; $('#nBody').textContent = seg.script; notes.hidden = false; }
    $('#bNotes').addEventListener('click', () => notes.hidden ? openNotes() : (notes.hidden = true));
    $('#nClose').addEventListener('click', () => { notes.hidden = true; });
    notes.addEventListener('click', e => { if (e.target === notes) notes.hidden = true; });
    let toastT = null;
    function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2800); }
    document.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;
      const k = e.key;
      if (k === 'Escape') { notes.hidden = true; return; }
      if (k === ' ' && tag !== 'button') { e.preventDefault(); playing ? stop() : play(); return; }
      if (k === 'ArrowRight') { e.preventDefault(); go(cur + 1); return; }
      if (k === 'ArrowLeft') { e.preventDefault(); go(cur - 1); return; }
      if (k === 'Home') { go(0); return; }
      if (/^[1-5]$/.test(k) && SEGS[+k - 1]) { go(STEPS.findIndex(s => s.seg === SEGS[+k - 1].id)); return; }
      const l = k.toLowerCase();
      if (l === 'v' || l === 'ㅍ') toggleVoice();
      else if (l === 'n' || l === 'ㅜ') notes.hidden ? openNotes() : (notes.hidden = true);
    });

    /* 만져 보기 (퀴즈) */
    const Q = L.quiz;
    $('#quizH2').textContent = Q.title; $('#quizSub').textContent = Q.sub || '';
    (function () {
      let i = 0, score = 0, done = [];
      const qEl = $('#simQ'), a = $('#simA'), opts = $('#simOpts'), dots = $('#simDots'), scEl = $('#simScore');
      const OPTS = Q.opts || ['O 돼요', 'X 안 돼요'];
      opts.classList.toggle('two', OPTS.length === 2);
      a.textContent = Q.intro || '';
      function draw() {
        dots.innerHTML = Q.items.map((_, k) => `<i class="${done[k] === true ? 'r' : done[k] === false ? 'w' : k === i ? 'c' : ''}"></i>`).join('');
        scEl.textContent = `${score} / ${Q.items.length}`;
        if (i >= Q.items.length) { qEl.innerHTML = `<small>끝</small>${score}개 맞혔어요. ${score >= Math.ceil(Q.items.length * 0.75) ? (Q.passMsg || '통과예요.') : (Q.failMsg || '오른쪽 정리를 보고 처음부터 해 보세요.')}`; opts.innerHTML = ''; P.quiz = score; P.quizN = Q.items.length; saveProgress(); return; }
        qEl.innerHTML = `<small>문항 ${i + 1} / ${Q.items.length}</small>${esc(Q.items[i][0])}`;
        opts.innerHTML = OPTS.map((o, k) => `<button type="button" data-k="${k}">${esc(o)}</button>`).join('');
        $$('button', opts).forEach(b => b.addEventListener('click', () => answer(b)));
      }
      function answer(b) {
        const [, ans, why] = Q.items[i];
        const ansIdx = typeof ans === 'boolean' ? (ans ? 0 : 1) : OPTS.indexOf(ans);
        const right = +b.dataset.k === ansIdx;
        done[i] = right; if (right) score++;
        $$('button', opts).forEach(x => { x.disabled = true; if (+x.dataset.k === ansIdx) x.classList.add('ok'); });
        if (!right) b.classList.add('no');
        a.className = 'sim-ans ' + (right ? 'right' : 'wrong'); a.innerHTML = `<b>${right ? '맞아요' : '아쉬워요'} · 정답은 ${esc(OPTS[ansIdx])}</b><br>${esc(why)}`;
        setTimeout(() => { i++; draw(); }, 1800);
      }
      $('#simReset').addEventListener('click', () => { i = 0; score = 0; done = []; a.className = 'sim-ans'; a.textContent = Q.intro || ''; draw(); });
      draw();
    })();
    $('#refTitle').textContent = Q.refTitle || '한 장으로 정리';
    $('#ref').innerHTML = Q.ref.map(r => `<div class="${r[0]}"><b>${esc(r[1])}</b><span>${r[2]}</span></div>`).join('');

    /* 이렇게 말해요 · 체크 · 과제 · 출처 */
    $('#say').innerHTML = L.say.map(s => `<article><img src="char/${s[0]}.webp" alt=""><div><div class="to">${esc(s[1])}</div><p>${s[2]}</p></div></article>`).join('');
    $('#ck').innerHTML = L.check.map((c, k) => `<label><input type="checkbox" data-k="${k}"><span>${c[0]}${c[1] ? `<small>${esc(c[1])}</small>` : ''}</span></label>`).join('');
    const boxes = $$('#ck input');
    boxes.forEach((b, k) => { b.checked = !!P.check[k]; b.addEventListener('change', () => { P.check[k] = b.checked; updCheck(); }); });
    function updCheck() { const n = boxes.filter(b => b.checked).length; $('#ckDone').textContent = n === boxes.length ? `${boxes.length}개 모두 완료.` : n ? `${n} / ${boxes.length} 완료` : ''; saveProgress(); }
    updCheck();
    $('#hw').innerHTML = `<h3>과제 · 다음 차시 전까지</h3><h4>${esc(L.homework.title)}</h4><ul>${L.homework.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    $('#next').innerHTML = sn < 6 ? `<h3>다음 차시 예고</h3><h4>${sn + 1}차시 · ${esc(COURSE.sessions[sn])}</h4><ul>${(L.next || []).map(i => `<li>${i}</li>`).join('')}</ul>` : `<h3>과정 마무리</h3><h4>6차시가 끝났어요</h4><ul>${(L.next || ['과정 홈에서 이수증을 확인해요.']).map(i => `<li>${i}</li>`).join('')}</ul>`;
    $('#src').innerHTML = L.sources.map(s => `<li>${s}</li>`).join('');
    $('#footer').textContent = `비바샘 샘크리에이티브 연수 기획 · ${COURSE.name} ${sn}차시 · 경기 AI융합교육연구회 Q.U.O.K.A · 두목쿼카 · 캐릭터는 연구회 스티커, 화면은 실제 캡처`;

    /* 진도·이수 */
    function ratio() { return Math.round(P.seen.filter(Boolean).length / N * 100); }
    function saveProgress() {
      const r = ratio(); const qOk = P.quizN ? P.quiz >= Math.ceil(P.quizN * 0.75) : false;
      P.done = r >= 90 && qOk;
      save(prog);
      $('#pmSeen').textContent = r + '%'; $('#pmSeenBar').style.width = r + '%'; $('#pmSeenBar').className = r >= 90 ? 'ok' : '';
      $('#pmQuiz').textContent = P.quizN ? `${P.quiz} / ${P.quizN}` : '아직'; $('#pmQuizBar').style.width = (P.quizN ? P.quiz / P.quizN * 100 : 0) + '%'; $('#pmQuizBar').className = qOk ? 'ok' : '';
      const pill = $('#progPill'); pill.classList.toggle('done', P.done); $('#pillTxt').textContent = P.done ? '이수 완료' : `진도 ${r}%`; $('#pillBar').style.width = r + '%';
      $('#finish').hidden = !P.done;
      $$('#sessNav a').forEach((a, k) => a.classList.toggle('done', !!(prog[cid][k + 1] && prog[cid][k + 1].done)));
    }
    $('#finishNext').href = sn < 6 ? `play.html?c=${cid}&s=${sn + 1}` : `course.html?c=${cid}`;
    $('#finishNext').textContent = sn < 6 ? `${sn + 1}차시로 이어서` : '과정 홈 · 이수증';
    $('#finishHome').href = `course.html?c=${cid}`;
    $('#chipN').textContent = N;
    const m = /^#s(\d+)$/.exec(location.hash || '');
    go(m ? +m[1] - 1 : 0);
    saveProgress();
  }
})();
