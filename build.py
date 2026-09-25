"""비바샘 샘크리에이티브 연수 기획안 — ON AIR 슬라이드 덱 빌드.

data/<id>.json + engine.css + engine.js  ->  <id>.html  (단일 파일, 저장소 루트 = GitHub Pages)

사용법:  python build.py
"""
import json
import shutil
from html import escape as _e
from pathlib import Path

ROOT = Path(__file__).parent
CSS = (ROOT / "engine.css").read_text(encoding="utf-8")
JS = (ROOT / "engine.js").read_text(encoding="utf-8")
DIST = ROOT  # 깃허브 페이지 루트에서 바로 서빙


def e(s):
    return _e(str(s), quote=True)


def mmss(m):
    return f"{m:02d}:00"


def slide(cls, ep, title, plan, body, notes=""):
    nt = f'<aside class="nt" hidden>{e(notes)}</aside>' if notes else ""
    return (f'<section class="slide {cls}" data-ep="{e(ep)}" data-title="{e(title)}" data-plan="{e(plan)}">'
            f"{body}{nt}</section>\n")


def head(eyebrow, title, lead=None, mb=None):
    st = f' style="margin-bottom:{mb}px"' if mb else ""
    l = f'<p class="s-lead">{e(lead)}</p>' if lead else ""
    return f'<div class="head"{st}><span class="eyebrow">{e(eyebrow)}</span><h2 class="s-title">{e(title)}</h2>{l}</div>'


def build(d):
    S = d["sessions"]
    n_s = len(S)
    per = [sum(g["min"] for g in s["segments"]) for s in S]
    total = sum(per)
    meta = dict(d["meta"])
    out = []

    # ---------- 1. 타이틀 ----------
    ep_list = "".join(f"<span>{s['n']}. {e(s['title'])}</span>" for s in S)
    body = f"""
  <div class="t-left">
    <span class="eyebrow">{e(d['eyebrow'])}</span>
    <h1>{d['titleHtml']}</h1>
    <p class="t-sub">{e(d['tagline'])}</p>
    <div class="t-meta"><span class="b">{e(meta['연수 유형'])}</span><span>{e(meta['총 러닝타임'])}</span><span>{e(meta['강사'])}</span></div>
    <p class="hint">→ 키나 스페이스로 넘겨요 · N 발표자 대본(차시별 오프닝 멘트) · M 목차 · E 편집 · B 배경음악 · F 전체화면</p>
  </div>
  <div class="vr-id" style="flex:.95">
    <span class="tag">6차시 편성 · {total}분</span>
    <h3>{e(d['tool']['name'])}</h3>
    <p>{e(d['tool']['note'])}</p>
    <div class="ep-list">{ep_list}</div>
  </div>"""
    out.append(slide("title-slide", "OPENING", "오프닝", "기획안 표지", body, d["notes"]["title"]))

    # ---------- 2. 편성표 ----------
    btns = "".join(
        f'<button type="button" style="flex:{per[i]}"{" class=\"key\"" if i == d.get("keySession", 4) - 1 else ""} data-go="EP.0{i+1}"><b>{i+1}차시 · {per[i]}분</b><strong>{e(s["title"])}</strong></button>'
        for i, s in enumerate(S))
    acc = 0
    axis = []
    for i in range(n_s + 1):
        pos = acc / total * 100
        style = "left:0;transform:none" if i == 0 else ("left:auto;right:0;transform:none" if i == n_s else f"left:{pos:.1f}%")
        axis.append(f'<span style="{style}">{acc}분</span>')
        if i < n_s:
            acc += per[i]
    after = d["after"]
    after_html = "".join(f'<div class="card"><span class="t">{e(a[0])}</span><h4>{e(a[1])}</h4><p>{e(a[2])}</p></div>' for a in after)
    body = head("편성표 · 6차시", d["agendaTitle"]) + f"""
  <div class="body">
    <div class="tl40">{btns}</div>
    <div class="tl-axis">{''.join(axis)}</div>
    <div class="after">{after_html}</div>
  </div>"""
    out.append(slide("", "OPENING", "편성표", "6차시 구성", body, d["notes"]["agenda"]))

    # ---------- 3. 기획 의도 ----------
    cards = "".join(f'<div class="card"><h4>{e(t)}</h4><p>{e(p)}</p></div>' for t, p in zip(d["whyTitles"], d["intent"]["why"]))
    body = head("기획 의도 · 왜 지금, 왜 이 도구인가", d["intent"]["concept"], mb=28) + f'<div class="body"><div class="row c3">{cards}</div></div>'
    out.append(slide("soft", "OPENING", "기획 의도", "", body, d["notes"]["why"]))

    # ---------- 4. 대상 · 산출물 ----------
    tk = "".join(f"<li>{e(t)}</li>" for t in d["intent"]["takeaways"])
    body = head("연수 대상 · 산출물", d["targetTitle"], mb=28) + f"""
  <div class="body"><div class="row c2">
    <div class="card"><h4>이런 선생님을 위해</h4><p style="font-size:21px;line-height:1.65">{e(d['intent']['target'])}</p>
      <div class="callout" style="margin-top:22px;font-size:19px"><b>도구</b> · {e(d['tool']['name'])}<br><span style="font-size:16px;color:var(--t2)">{e(d['tool']['url'])}</span></div></div>
    <div class="card"><h4>연수를 마치면 손에 남는 것</h4><ol class="vsteps" style="margin-top:14px">{tk}</ol></div>
  </div></div>"""
    out.append(slide("", "OPENING", "대상 · 산출물", "", body, d["notes"]["target"]))

    # ---------- 5. 과정 소개 ----------
    goals = "".join(f"<li>{e(g)}</li>" for g in d["goals"])
    feats = "".join(f"<li>{e(f)}</li>" for f in d["features"])
    body = head("과정 소개 · 비바샘 과정소개 양식", "학습 목표 4 · 과정 특징 4", mb=24) + f"""
  <div class="body"><div class="goals">
    <div class="card"><h4>학습 목표</h4><ol>{goals}</ol></div>
    <div class="card"><h4>과정 특징</h4><ul>{feats}</ul></div>
  </div></div>"""
    out.append(slide("soft", "OPENING", "과정 소개", "", body, d["notes"]["intro"]))

    # ---------- 6~11. 차시 ----------
    for i, s in enumerate(S):
        ep = f"EP.0{i+1}"
        t = 0
        cue, segs = [], []
        for g in s["segments"]:
            hot = ' class="hot"' if g["t"].startswith("따라") else ""
            cue.append(f'<div style="flex:{g["min"]}"{hot}><b>{mmss(t)} · {g["min"]}분</b><span>{e(g["t"])}</span></div>')
            segs.append(f'<li><b>{mmss(t)}</b><span><strong>{e(g["t"])}</strong> · {e(g["desc"])}</span></li>')
            t += g["min"]
        outs = "".join(f"<li>{e(o)}</li>" for o in s["outputs"])
        prep = "".join(f"<li>{e(o)}</li>" for o in s["prep"])
        pills = "".join(f'<span class="pill p-info">{e(m)}</span>' for m in s["mode"])
        body = head(f"{ep} · {s['n']}차시 · {per[i]}분", s["title"], s["sub"], mb=14) + f"""
  <div class="body">
    <div class="cue">{''.join(cue)}</div>
    <div class="sess">
      <div class="card"><h4>세그먼트</h4><ol class="segs">{''.join(segs)}</ol></div>
      <div class="card"><h4>오프닝 멘트 (초안)</h4><div class="opening-q" style="margin-top:0"><b>🎙</b>{e(s['opening'])}</div></div>
      <div class="card"><h4>수강 후 산출물</h4><ul>{outs}</ul><h4 style="margin-top:14px">준비물</h4><ul>{prep}</ul><div class="pills" style="margin-top:12px">{pills}</div><p class="memo"><b>촬영 메모</b> · {e(s['note'])}</p></div>
    </div>
  </div>"""
        notes = s["opening"] + "\n\n[촬영 메모] " + s["note"]
        out.append(slide("soft" if i % 2 else "", ep, f"{s['n']}차시 · {s['title']}", f"{per[i]}분", body, notes))

    # ---------- 12. 교실 장면 ----------
    sc = "".join(f'<div class="card"><span class="pill p-info">{e(c["grade"])}</span><h4 style="margin-top:14px">{e(c["title"])}</h4><p>{e(c["scene"])}</p></div>' for c in d["classroom"])
    body = head("교실 장면 · 연수 수강 후", d["classroomTitle"], mb=28) + f'<div class="body"><div class="row c3">{sc}</div></div>'
    out.append(slide("soft", "WRAP", "교실 장면", "", body, d["notes"]["classroom"]))

    # ---------- 13. 이수 · 제작 일정 ----------
    ratio = "".join(f'<div><span style="text-align:left;color:var(--t1)">{e(r[0])}</span><i><b style="--w:{r[1]}%"></b></i><span>{r[1]}%</span></div>' for r in d["evaluation"]["ratio"])
    sched = "".join(f'<li><span><b>{e(s["phase"])}</b> · <span style="color:var(--blue);font-weight:800">{e(s["when"])}</span><small>{e(s["what"])}</small></span></li>' for s in d["schedule"])
    body = head("이수 기준 · 제작 일정", "비바샘 샘크리에이티브 연수 기준 그대로", mb=24) + f"""
  <div class="body"><div class="row c2">
    <div class="card"><h4>평가 비율</h4><div class="ratio">{ratio}</div><p class="foot" style="font-size:16.5px;margin-top:20px">{e(d['evaluation']['note'])}</p></div>
    <div class="card"><h4>제작 일정 (예시 · 조정 가능)</h4><ol class="vsteps" style="margin-top:14px">{sched}</ol></div>
  </div></div>"""
    out.append(slide("", "WRAP", "이수 · 제작 일정", "", body, d["notes"]["eval"]))

    # ---------- 14. 차별점 ----------
    rows = "".join(f"<tr><td style='width:42%'>{e(r[0])}</td><td>{e(r[1])}</td></tr>" for r in d["diff"])
    rel = "".join(f'<span class="chip">{e(r)}</span>' for r in d["related"])
    body = head("차별점 · 기존 과정과 어떻게 다른가", d["diffTitle"], mb=22) + f"""
  <div class="body">
    <div class="tcard"><table class="tt"><thead><tr><th>기존 · 유사 과정</th><th>이 연수</th></tr></thead><tbody>{rows}</tbody></table></div>
    <p class="foot" style="margin-top:18px;color:#8FA0B5">연계 추천 과정(비바샘 내)</p><div class="chips" style="margin-top:8px">{rel}</div>
  </div>"""
    out.append(slide("dark", "WRAP", "차별점 · 연계", "", body, d["notes"]["diff"]))

    # ---------- 15. 강사 · 근거 ----------
    ins = d["instructor"]
    src = "".join(f"<li>{s}</li>" for s in d["sources"])
    body = head("강사 · 형식 근거", "누가, 무엇을 근거로 만드는가", mb=28) + f"""
  <div class="body"><div class="row c2">
    <div class="card"><div class="inst"><div class="av">{e(ins['initial'])}</div><div><h4>{e(ins['name'])}</h4><div class="role">{e(ins['role'])}</div><p>{e(ins['bio'])}</p></div></div></div>
    <div class="card src-grid" style="display:block"><h4>형식 근거 · 미정 항목</h4><ul style="margin-top:12px">{src}</ul></div>
  </div></div>"""
    out.append(slide("soft", "WRAP", "강사 · 근거", "", body, d["notes"]["inst"]))

    # ---------- 16. 클로징 ----------
    th = "".join(f"<span>{e(t)}</span>" for t in d["closing"]["tags"])
    body = f"""
  <div class="shade"></div>
  <div class="cl-in"><h2>{d['closing']['h2']}</h2><p>{e(d['closing']['p'])}</p><div class="thanks">{th}</div></div>"""
    out.append(slide("dark closing", "WRAP", "클로징", "", body, d["notes"]["closing"]))

    slides_html = "".join(out)
    ticker = json.dumps(d["ticker"], ensure_ascii=False)
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(d['pageTitle'])}</title>
<meta name="description" content="비바샘 샘크리에이티브 연수 기획안 · ON AIR 슬라이드">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<style>
{CSS}
</style>
</head>
<body data-deck="{e(d['id'])}">
<script id="deckEdits" type="application/json" data-deck>{{"v":1,"t":{{}},"n":{{}},"u":""}}</script>
<script id="deckTicker" type="application/json" data-deck>{ticker}</script>

<div id="stage">
<div class="chrome-top" aria-hidden="true">
  <span class="onair"><i></i>ON AIR</span>
  <span class="prog-name">{e(d['progName'])}</span>
  <span class="ep-tag" id="epTag">OPENING</span>
  <span class="sp"></span>
  <span class="clock" id="clock">00:00</span>
  <span class="counter" id="counter">1 / 1</span>
</div>

{slides_html}
<div class="progress" id="progress"></div>
<div class="chrome-bot" aria-hidden="true">
  <span class="tk-label">LIVE</span>
  <div class="tk-win"><div class="tk-run" id="tkRun"></div></div>
  <span class="tk-ep" id="tkEp"></span>
</div>
</div>

<nav class="dock" id="dock" aria-label="발표 조작">
  <button type="button" id="bPrev" aria-label="이전"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>
  <span class="pg" id="dockPg">1 / 1</span>
  <button type="button" id="bNext" aria-label="다음"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></button>
  <span class="sep"></span>
  <button type="button" id="bToc" aria-label="목차"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg><span class="lbl">목차</span></button>
  <button type="button" id="bNote" aria-pressed="false" aria-label="발표자 대본"><svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg><span class="lbl">대본</span></button>
  <button type="button" id="bEdit" aria-pressed="false" aria-label="편집 모드"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg><span class="lbl">편집</span></button>
  <button type="button" id="bBgm" aria-pressed="false" aria-label="배경음악"><span class="eq"><i></i><i></i><i></i></span><span class="lbl">BGM</span></button>
  <button type="button" id="bFs" aria-label="전체화면"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg><span class="lbl">전체화면</span></button>
</nav>

<div class="notes" id="notes" hidden>
  <div class="n-hd"><span id="nTitle"></span><span><span class="n-plan" id="nPlan"></span> · 경과 <span class="n-timer" id="nTimer">00:00</span></span></div>
  <div class="n-body" id="nBody"></div>
  <div class="n-next" id="nNext"></div>
</div>

<div class="toc" id="toc" hidden>
  <div class="toc-box" role="dialog" aria-label="목차">
    <div class="toc-hd"><h3>편성표 · 전체 장면</h3><button type="button" class="toc-close" id="tocClose">닫기</button></div>
    <div class="toc-grid" id="tocGrid"></div>
    <div class="keys"><span><kbd>←</kbd><kbd>→</kbd>이전·다음</span><span><kbd>Space</kbd>다음</span><span><kbd>Home</kbd><kbd>End</kbd>처음·끝</span><span><kbd>1</kbd>~<kbd>6</kbd>차시 이동</span><span><kbd>M</kbd>목차</span><span><kbd>N</kbd>대본</span><span><kbd>E</kbd>편집</span><span><kbd>B</kbd>배경음악</span><span><kbd>F</kbd>전체화면</span></div>
  </div>
</div>

<div class="editbar" id="editbar" hidden>
  <span>편집 모드</span><span class="eb-st" id="ebSt">변경 없음</span>
  <button type="button" class="pri" id="ebSave">저장</button>
  <button type="button" id="ebFile">HTML 파일로 받기</button>
  <button type="button" id="ebRevert">마지막 저장으로</button>
  <button type="button" id="ebReset">원본으로</button>
  <button type="button" id="ebDone">편집 끝내기</button>
</div>

<div class="modal" id="ghModal" hidden>
  <div class="modal-box" role="dialog" aria-label="깃허브에 저장">
    <h3>깃허브에 저장</h3>
    <p>수정 내용을 저장소의 <b>{e(d['id'])}.edits.json</b> 파일에 저장해요. 1~2분 뒤 새로고침하면 이 주소로 보는 모든 사람에게 반영돼요.</p>
    <label class="f" for="ghRepo">저장소</label>
    <input type="text" id="ghRepo" placeholder="사용자명/저장소" autocomplete="off">
    <label class="f" for="ghToken">GitHub 토큰</label>
    <input type="password" id="ghToken" autocomplete="off" placeholder="github_pat_로 시작하는 토큰">
    <ol>
      <li>GitHub → Settings → Developer settings → Fine-grained token을 만들어요</li>
      <li><b>Repository access</b>에서 이 저장소를 고르고, <b>Contents · Read and write</b> 권한을 줘요</li>
    </ol>
    <label class="ck"><input type="checkbox" id="ghRemember"> 이 브라우저에 토큰 기억하기</label>
    <p class="msg" id="ghMsg"></p>
    <div class="acts"><button type="button" class="gh" id="ghCancel">닫기</button><button type="button" class="pri" id="ghGo">저장하기</button></div>
  </div>
</div>
<div class="toast" id="toast" hidden></div>

<script data-deck>
{JS}
</script>
</body>
</html>
"""


built = []
for path in sorted((ROOT / "data").glob("*.json")):
    d = json.loads(path.read_text(encoding="utf-8"))
    out = DIST / f"{d['id']}.html"
    out.write_text(build(d), encoding="utf-8")
    built.append(out.name)
print("built:", ", ".join(built), "->", DIST)
