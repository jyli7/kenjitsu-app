'use strict';

const view = document.getElementById('view');
const toastEl = document.getElementById('toast');
const ROUND_COPY = [
  ['Explain it simply', 'No hiding behind jargon. Buzzwords you don’t unpack get flagged.'],
  ['What if it changes?', 'We turn one knob — an assumption, a constraint — and ask what breaks.'],
  ['Find the flaw', 'A plausible argument with one bad step. Point to it and say why.'],
  ['New case', 'Apply the idea to a situation the material never mentioned.'],
  ['Rematch', 'A fresh problem aimed at whatever tripped you up. Win it to pass.'],
];
// Grading stages, in the order the examiner writes its verdict (the server streams which one it's on).
const STAGES = [
  ['reading', 'Read', 'Reading your answer against a private answer key'],
  ['score', 'Score', 'Deciding a strict 0–10 score'],
  ['feedback', 'Feedback', 'Writing what was right and what wasn’t'],
  ['jargon', 'Jargon', 'Flagging terms you leaned on without unpacking'],
  ['missed', 'Gaps', 'Listing what a strong answer had that yours didn’t'],
  ['pushback', 'Pushback', 'Deciding whether to press you on a weak spot'],
  ['model_answer', 'Answer', 'Writing a strong answer for you to compare'],
];
const STAGE_OF = {verdict: 'score', concept: 'pushback'};
// Why each round can take a moment to write.
const WRITING = {
  perturb: 'Choosing the one assumption whose change best tests whether you understand the mechanism.',
  flaw: 'Building a plausible step-by-step argument and hiding exactly one subtle error in it.',
  apply: 'Inventing a scenario the material never mentions, where this idea decides the answer.',
  retest: 'Reviewing every earlier round to aim the rematch at your weakest point.',
};
const OPENING = [
  [0, 'Reading your topic and notes'],
  [1200, 'Choosing the core idea to test you on'],
  [2600, 'Writing your first question'],
  [7000, 'Almost there: checking the question is fair and unambiguous'],
];
let modules = null;
let blueprints = [];
let creatorSeed = null; // Pending topic/notes when jumping from Home into the Creator Studio.
let category = 'All';
let session = null;
let focus = 0;
let showResults = false;
let busy = false;
let selectedStep = null;
let draft = '';
let tick = null;
let questionShownAt = 0;
let creating = null; // Session creation in flight while its first question is already shown.
let revealing = false;
let waitingFor = null; // The unrevealed round whose readiness is being long-polled.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

function inline(s) {
  return s.replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
}

// Minimal, escape-first markdown: paragraphs, line breaks, lists, code, bold, italics.
function md(source) {
  return esc(source).split(/\n{2,}/).map((block) => {
    const lines = block.split('\n');
    if (lines.every((l) => /^\s*([-*]|\d+[.)])\s+/.test(l))) {
      const tag = /^\s*\d/.test(lines[0]) ? 'ol' : 'ul';
      return `<${tag}>${lines.map((l) => `<li>${inline(l.replace(/^\s*([-*]|\d+[.)])\s+/, ''))}</li>`).join('')}</${tag}>`;
    }
    return `<p>${inline(lines.join('<br>'))}</p>`;
  }).join('');
}

function highlight(answer, terms) {
  let html = esc(answer);
  for (const term of terms || []) {
    const t = esc(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (t) html = html.replace(new RegExp(t, 'i'), (m) => `<mark class="jargon" title="Explain this concretely">${m}</mark>`);
  }
  return html;
}

const band = (score, max = 10) => (score / max >= 0.7 ? 'good' : score / max >= 0.5 ? 'mid' : 'low');

function clock(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function longTime(ms) {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { toastEl.hidden = true; }, 5000);
}

async function api(path, body) {
  const options = body === undefined ? {} : {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)};
  const response = await fetch(path, {credentials: 'same-origin', ...options});
  let data = null;
  try { data = await response.json(); } catch { /* Non-JSON error page. */ }
  if (!response.ok) {
    const detail = data && data.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.');
  }
  return data;
}

function setNav(name) {
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === name));
}

// --- Home ---

async function renderHome() {
  setNav('home');
  document.title = 'Kenjitsu — don’t just read it, fight it';
  const [loaded, mine] = await Promise.all([
    api('/api/modules').catch((e) => { toast(e.message); return {modules: modules || [], blueprints: []}; }),
    api('/api/subjects').catch(() => ({subjects: []}))]);
  if (loaded) {
    modules = loaded.modules || [];
    blueprints = loaded.blueprints || [];
  }
  const subjects = mine.subjects;
  const allItems = [...blueprints, ...modules];
  const cats = ['All', ...new Set(allItems.map((m) => m.category))];
  view.innerHTML = `
  <section class="hero">
    <div>
      <p class="eyebrow">The art of <span class="seal-text">knowledge-fighting</span></p>
      <h1>You read it.<br><em>Now fight it.</em></h1>
      <p class="lede">Kenjitsu grills you on what you want to learn and remember. Hard questions,
        changed constraints and planted flaws — with Socratic stepping stones when you get stuck
        and strict grading with no flattery.</p>
    </div>
    <blockquote class="halmos">“Don’t just read it; fight it! Ask your own questions, look for your own examples, discover your own proofs. Is the hypothesis necessary? Is the converse true?”<cite>— Paul Halmos</cite></blockquote>
  </section>
  <section class="arena unified-arena" aria-label="Pick a fight">
    <form class="arena-top-form" id="custom">
      <label class="big" for="topic">Type anything you want to fight — or explore the Atlas below</label>
      <div class="topic-row">
        <div class="topic-input-wrap">
          <input id="topic" maxlength="300" autocomplete="off" placeholder="Backpropagation · Raft consensus · chapter 4 of Sapiens · Black–Scholes">
          <div class="kj-results" id="home-topic-results"></div>
        </div>
        <button class="btn" type="button" id="open-creator" title="Choose difficulty, add your teaching taste, and preview/edit every round">Customize fight ✎</button>
        <button class="btn primary" type="submit">Quick fight <span aria-hidden="true">→</span></button>
      </div>
      <details class="notes-toggle">
        <summary>Add your notes, syllabus or chapter outline</summary>
        <textarea id="notes" maxlength="24000" placeholder="Paste your lecture notes, a syllabus, a paper's key sections, your highlights…"></textarea>
        <div class="notes-meta"><span>Used to write and grade your questions — or click “Customize fight” above to inspect and edit every round first.</span>
          <span><label>Load a .txt or .md file<input type="file" id="file" accept=".txt,.md,.markdown,text/plain"></label> · <span id="count">0</span> / 24,000</span></div>
      </details>
    </form>
    <div class="arena-or-divider"><span>Or explore the Knowledge Atlas</span></div>
    <div id="home-atlas"></div>
  </section>
  ${subjects.length ? `<section class="resume" aria-labelledby="resume"><div class="section-head"><div><p class="eyebrow">Your subjects</p><h2 id="resume">Pick up where you left off</h2></div><a class="btn ghost" href="#/me">All of them →</a></div>
    <div class="subject-grid">${subjects.slice(0, 3).map(subjectCard).join('')}</div></section>` : ''}
  ${blueprints.length ? `<section aria-labelledby="mods">
    <div class="section-head">
      <div><p class="eyebrow">Community &amp; Creator Fights</p><h2 id="mods">Custom-built fights</h2></div>
      <div class="section-head-right">
        <div class="chips" role="group" aria-label="Category">${cats.map((c) => `<button type="button" data-cat="${esc(c)}" aria-pressed="${c === category}">${esc(c)}</button>`).join('')}</div>
        <a class="btn small primary" href="#/create">+ Create a fight</a>
      </div>
    </div>
    <div class="grid" id="grid"></div>
  </section>` : ''}
  <ol class="strip" aria-label="The five rounds">
    ${ROUND_COPY.map(([t, d], i) => `<li><span class="n">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}
  </ol>
  <section class="diff">
    <div><h3>Not flashcards</h3><p>Flashcards check that you can recall a fact. Kenjitsu checks whether the idea still works for you when the situation changes.</p></div>
    <div><h3>Socratic when stuck, strict when graded</h3><p>Ask to break a round down and the examiner walks you through smaller stepping-stone questions — then makes you prove it unassisted in the Rematch.</p></div>
    <div><h3>Human taste on top of AI</h3><p>Fork any fight, rewrite weak questions, tune the rubric, and share your version with other challengers.</p></div>
  </section>`;
  if (blueprints.length) renderGrid();
  const homeAtlasHost = document.getElementById('home-atlas');
  if (homeAtlasHost && window.mountKenjitsuAtlas) {
    window.mountKenjitsuAtlas(homeAtlasHost, {
      embedded: true,
      externalInput: document.getElementById('topic'),
      externalResults: document.getElementById('home-topic-results'),
      onStartFight: (node, button) => launchAtlasNode(node, button),
    });
  }
  view.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => {
    category = b.dataset.cat;
    view.querySelectorAll('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', x === b));
    renderGrid();
  }));
  const notes = document.getElementById('notes');
  const count = document.getElementById('count');
  notes.addEventListener('input', () => { count.textContent = notes.value.length.toLocaleString(); });
  document.getElementById('file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 400_000) { toast('That file is too large. Paste the key sections instead.'); return; }
    notes.value = (await file.text()).slice(0, 24000);
    notes.dispatchEvent(new Event('input'));
  });
  document.getElementById('open-creator').addEventListener('click', () => {
    const topic = document.getElementById('topic').value.trim();
    creatorSeed = {topic, notes: notes.value};
    location.hash = '#/create';
  });
  document.getElementById('custom').addEventListener('submit', async (e) => {
    e.preventDefault();
    const topic = document.getElementById('topic').value.trim();
    if (topic.length < 3 && notes.value.trim().length < 40) {
      toast('Tell us what to grill you on, or paste your notes.');
      return;
    }
    const form = e.target;
    const button = form.querySelector('button[type=submit]');
    button.disabled = true;
    form.insertAdjacentHTML('beforeend', `<div class="opening" id="opening">
      <div class="blade"></div><p><span id="opening-line">${OPENING[0][1]}</span>… <span class="live-time" id="opening-time">0.0s</span></p>
      <small>A strict examiner is writing your first question. The rest of the session is prepared in the background while you answer it. Usually about 5 seconds.</small></div>`);
    const started = performance.now();
    const timer = setInterval(() => {
      const ms = performance.now() - started;
      const line = document.getElementById('opening-line');
      if (!line) { clearInterval(timer); return; }
      line.textContent = OPENING.filter(([at]) => ms >= at).pop()[1];
      document.getElementById('opening-time').textContent = `${(ms / 1000).toFixed(1)}s`;
    }, 100);
    await begin({topic, notes: notes.value}, () => {
      clearInterval(timer);
      document.getElementById('opening')?.remove();
      button.disabled = false;
    });
  });
}

function renderGrid() {
  const grid = document.getElementById('grid');
  const allItems = [...blueprints, ...modules];
  const shown = allItems.filter((m) => category === 'All' || m.category === category);
  grid.innerHTML = shown.map((m) => {
    const isBp = Boolean(m.blueprint);
    const badge = isBp ? `<span class="cat">${esc(m.category)} · ${esc(m.level || 'Core')}</span>` : `<span class="cat">${esc(m.category)}</span>`;
    const votes = isBp && (m.upvotes || m.downvotes) ? ` · 👍 ${m.upvotes}` : '';
    const statsText = m.attempts
      ? `<span><b>${m.attempts}</b> ${m.attempts === 1 ? 'challenger' : 'challengers'} · <b>${Math.round(100 * m.passed / m.attempts)}%</b> passed${votes}</span>`
      : `<span>Be the first challenger${votes}</span>`;
    return `
    <div class="card" data-card-id="${esc(m.id)}" data-is-bp="${isBp}">
      <div class="card-top-row">${badge}<a class="card-fork" href="#/create?fork=${encodeURIComponent(m.id)}" title="Fork or edit this fight's questions and rubric">Fork / Edit ✎</a></div>
      <h3>${esc(m.title)}</h3>
      <span class="src">${esc(m.source)}${isBp && m.total_rounds ? ` · ${m.total_rounds} rounds` : ''}</span>
      <p>${esc(m.blurb)}</p>
      <span class="stats">${statsText}<span class="go">Challenge →</span></span>
    </div>`;
  }).join('') || '<p class="muted">No fights in this category yet.</p>';
  grid.querySelectorAll('[data-card-id]').forEach((card) => card.addEventListener('click', (e) => {
    if (e.target.closest('.card-fork')) return;
    const id = card.dataset.cardId;
    if (card.dataset.isBp === 'true') {
      const bp = blueprints.find((x) => x.id === id);
      if (bp) beginBlueprint(bp);
    } else {
      const m = modules.find((x) => x.id === id);
      if (m) beginModule(m);
    }
  }));
}

async function begin(body, onError) {
  try {
    const created = await api('/api/sessions', body);
    session = created;
    focus = 0;
    showResults = false;
    location.hash = `#/s/${created.id}`;
  } catch (e) {
    toast(e.message);
    if (onError) onError();
  }
}

function beginBlueprint(bp) {
  session = {id: null, module: `bp:${bp.id}`, blueprint_id: bp.id, title: bp.title, source: bp.source,
    level: bp.level, status: 'active', thinking_ms: 0, total_rounds: bp.total_rounds || ROUND_COPY.length,
    pass_score: 70, result: null,
    rounds: [{kind: 'explain', label: 'Explain it simply', score: null, done: false, revealed: true, exhibit: null,
      turns: [{question: bp.opener, answer: null, step: null, grade: null}]}]};
  focus = 0;
  showResults = false;
  draft = '';
  selectedStep = null;
  questionShownAt = Date.now();
  history.pushState(null, '', '#/s/new');
  setNav('');
  document.title = `${bp.title} — Kenjitsu`;
  window.scrollTo(0, 0);
  paintSession();
  const pending = session;
  creating = api('/api/sessions', {blueprint: bp.id}).then((created) => {
    if (session === pending) {
      session = created;
      if (location.hash === '#/s/new') history.replaceState(null, '', `#/s/${created.id}`);
      paintSession();
    }
  }).catch((e) => {
    toast(e.message);
    if (session === pending) location.hash = '#/';
    throw e;
  }).finally(() => { creating = null; });
}

// The opener is the same for everyone, so show it at once and create the session meanwhile.
function beginModule(m) {
  session = {id: null, module: m.id, title: m.title, source: m.source, status: 'active',
    thinking_ms: 0, total_rounds: ROUND_COPY.length, pass_score: 70, result: null,
    rounds: [{kind: 'explain', score: null, done: false, revealed: true, exhibit: null,
      turns: [{question: m.opener, answer: null, step: null, grade: null}]}]};
  focus = 0;
  showResults = false;
  draft = '';
  selectedStep = null;
  questionShownAt = Date.now();
  history.pushState(null, '', '#/s/new');
  setNav('');
  document.title = `${m.title} — Kenjitsu`;
  window.scrollTo(0, 0);
  paintSession();
  const pending = session;
  creating = api('/api/sessions', {module: m.id}).then((created) => {
    if (session === pending) {
      // Adopt the real session without repainting, so typing isn't interrupted.
      session = created;
      if (location.hash === '#/s/new') history.replaceState(null, '', `#/s/${created.id}`);
    }
  }).catch((e) => {
    toast(e.message);
    if (session === pending) location.hash = '#/';
    throw e;
  }).finally(() => { creating = null; });
}

// --- Subjects: progress across fights ---

const beltHtml = (belt) => `<span class="belt belt-${esc(belt.toLowerCase())}"><i aria-hidden="true"></i>${esc(belt)} belt</span>`;

function trackHtml(sub) {
  const cells = sub.focuses
    ? sub.focuses.map((f) => [f.passed ? 'passed' : f.attempts ? 'tried' : '', `${f.title}${f.best !== null ? ` · best ${f.best}` : ''}`])
    : Array.from({length: sub.total}, (_, i) => [i < sub.passed ? 'passed' : '', '']);
  return `<ol class="focus-track" aria-label="${sub.passed} of ${sub.total} focuses passed">${cells.map(([cls, title]) => `<li class="${cls}" title="${esc(title)}"></li>`).join('')}</ol>`;
}

function masteryHtml(sub) {
  return `<div class="mastery"><div class="mastery-top">${beltHtml(sub.belt)}
    <span><b>${sub.passed}</b> of ${sub.total} focuses passed</span><span class="muted">Mastery ${sub.xp}%</span></div>${trackHtml(sub)}</div>`;
}

function subjectCard(sub) {
  return `<a class="subject-card" href="#/subject/${esc(sub.id)}"><span class="cat">${esc(sub.module ? 'Module' : 'Your topic')}</span>
    <b>${esc(sub.title)}</b>${trackHtml(sub)}
    <span class="subject-meta">${beltHtml(sub.belt)}<span>${sub.passed}/${sub.total} · ${sub.fights} ${sub.fights === 1 ? 'fight' : 'fights'}</span></span></a>`;
}

function focusTitle(sub, id) {
  return (sub.focuses.find((f) => f.id === id) || {title: id}).title;
}

function nextHtml(sub) {
  if (!sub.next.length) return '<p class="empty-note">Every focus passed. Black belt. Try a related fight below, or refight any focus to sharpen your best score.</p>';
  return `<div class="next-cards">${sub.next.map((n, i) => {
    const kicker = n.variant === 'gaps' ? 'Fight your gaps' : n.variant === 'again' ? 'Try this focus again' : (n.focus === 'core' ? 'The core idea' : 'Next focus');
    return `<button type="button" class="next-card${i === 0 ? ' lead' : ''}" data-subject="${esc(sub.id)}" data-start-focus="${esc(n.focus)}" data-gaps="${n.variant === 'gaps'}">
      <span class="kicker">${kicker}</span><b>${esc(focusTitle(sub, n.focus))}</b><p>${esc(n.reason)}</p>
      <span class="go">${n.ready ? '<span class="ready-dot" title="First question already written"></span>Ready · ' : ''}Fight →</span></button>`;
  }).join('')}</div>`;
}

function relatedHtml(sub) {
  if (!sub.related.length) return '';
  return `<div class="related">${sub.related.map((r) => `<button type="button" class="related-item" data-related-module="${esc(r.module || '')}" data-related-topic="${esc(r.topic)}">
    <b>${esc(r.topic)}</b><span>${esc(r.why)}</span><span class="go">${r.module ? 'Module' : 'New subject'} →</span></button>`).join('')}</div>`;
}

async function fetchSubject(id, after) {
  return api(`/api/subjects/${encodeURIComponent(id)}${after ? `?after=${encodeURIComponent(after)}` : ''}`);
}

// Poll while the subject plan (or a prewritten opener) is still being written.
function pollSubject(id, after, paint, isCurrent, onError) {
  let tries = 0;
  const step = async () => {
    if (!isCurrent()) return;
    let sub;
    try { sub = await fetchSubject(id, after); } catch (e) {
      if (!tries && onError) onError(e);
      return;
    }
    if (!isCurrent()) return;
    paint(sub);
    const pending = !sub.planned || sub.next.some((n) => !n.ready);
    if (pending && ++tries < 20) setTimeout(step, sub.planned ? 3000 : 1500);
  };
  step();
}

async function startFight(button, body) {
  if (button.disabled) return;
  button.disabled = true;
  const original = button.innerHTML;
  // Prewritten fights start at once; otherwise say what's happening.
  const slow = setTimeout(() => {
    button.classList.add('starting');
    button.insertAdjacentHTML('beforeend', '<span class="starting-note"><span class="blade"></span>Writing your first question…</span>');
  }, 350);
  try {
    session = await api('/api/sessions', body);
    focus = 0;
    showResults = false;
    draft = '';
    selectedStep = null;
    questionShownAt = Date.now();
    location.hash = `#/s/${session.id}`;
  } catch (e) {
    toast(e.message);
    button.innerHTML = original;
    button.classList.remove('starting');
    button.disabled = false;
  } finally {
    clearTimeout(slow);
  }
}

// One handler for every "start a fight" control, wherever it's rendered.
view.addEventListener('click', async (e) => {
  const target = e.target.closest('[data-start-focus], [data-related-topic]');
  if (!target) return;
  if (target.dataset.startFocus) {
    startFight(target, {subject: target.dataset.subject, focus: target.dataset.startFocus,
      gaps: target.dataset.gaps === 'true'});
    return;
  }
  const moduleId = target.dataset.relatedModule;
  if (moduleId) {
    if (!modules) modules = (await api('/api/modules')).modules;
    const m = modules.find((x) => x.id === moduleId);
    if (m) { beginModule(m); return; }
  }
  startFight(target, {topic: target.dataset.relatedTopic});
});

function whatsNextHtml(sub) {
  const promo = sub.promotion ? `<div class="promotion">${beltHtml(sub.promotion.belt)}<div><b>Belt earned.</b> You cleared “${esc(focusTitle(sub, sub.promotion.focus))}”: ${esc(sub.promotion.from)} → ${esc(sub.promotion.belt)}.</div></div>` : '';
  const body = sub.planned
    ? `<h3>Up next</h3>${nextHtml(sub)}${sub.related.length ? `<h3>Related fights</h3>${relatedHtml(sub)}` : ''}`
    : '<div class="planning"><div class="blade"></div><p>Planning the five focuses of this subject: its sub-mechanisms, tradeoffs, edge cases and confusions…</p></div>';
  return `<div class="next-head"><div><p class="eyebrow">Keep fighting</p><h2>${esc(sub.title)}</h2></div>
    <a class="btn ghost" href="#/subject/${esc(sub.id)}">Subject map →</a></div>${promo}${masteryHtml(sub)}${body}`;
}

async function renderSubject(id) {
  setNav('me');
  view.innerHTML = '<p class="loading">Loading subject…</p>';
  const route = location.hash;
  const date = (iso) => new Date(iso).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
  const paint = (sub) => {
    document.title = `${sub.title} — Kenjitsu`;
    const map = sub.focuses.map((f, i) => {
      const status = f.passed ? 'Passed' : f.attempts ? 'Not yet' : 'New';
      return `<li class="${f.passed ? 'passed' : f.attempts ? 'tried' : ''}">
        <span class="n">${i ? `Focus ${i}` : 'Core'} · ${'●'.repeat(f.level || 1)}<span class="dim">${'●'.repeat(3 - (f.level || 1))}</span></span>
        <b>${esc(f.title)}</b><p>${esc(f.angle)}</p>
        <div class="meta"><span class="pill ${f.passed ? 'pass' : f.attempts ? 'fail' : 'open'}">${status}</span>${f.best !== null ? `<span>best ${f.best}</span>` : ''}${f.attempts ? `<span>${f.attempts} ${f.attempts === 1 ? 'fight' : 'fights'}</span>` : ''}</div>
        <div class="focus-actions">${f.attempts && !f.passed ? `<button type="button" class="btn small" data-subject="${esc(sub.id)}" data-start-focus="${esc(f.id)}" data-gaps="true">Fight your gaps</button>` : ''}
          <button type="button" class="btn small ${f.attempts ? 'ghost' : 'primary'}" data-subject="${esc(sub.id)}" data-start-focus="${esc(f.id)}">${f.attempts ? 'Fight again' : 'Fight'}</button></div></li>`;
    }).join('');
    view.innerHTML = `
    <div class="record-head"><p class="eyebrow"><a href="#/me">Your record</a> / Subject</p><h1>${esc(sub.title)}</h1>${sub.source ? `<p>${esc(sub.source)}</p>` : ''}</div>
    ${masteryHtml(sub)}
    ${sub.planned ? `<div class="section-head"><h2>Up next</h2></div>${nextHtml(sub)}` : ''}
    <div class="section-head"><h2>Focus map</h2><span class="muted">Pass a focus to earn the next belt.</span></div>
    <ol class="focus-map">${map}${sub.planned ? '' : '<li class="planning-card"><div class="blade"></div><p>Planning the other five focuses…</p></li>'}</ol>
    ${sub.related.length ? `<div class="section-head"><h2>Related fights</h2></div>${relatedHtml(sub)}` : ''}
    <div class="section-head"><h2>Fights</h2></div>
    <table><thead><tr><th>Date</th><th>Focus</th><th>Result</th><th>Score</th><th>Thinking</th></tr></thead><tbody>
    ${sub.history.map((h) => `<tr><td class="num">${date(h.started_at)}</td><td><a href="#/s/${esc(h.id)}">${esc(h.focus_title)}</a>${h.variant === 'gaps' ? ' <span class="muted">· gaps</span>' : ''}</td>
      <td>${h.status === 'done' ? `<span class="pill ${h.passed ? 'pass' : 'fail'}">${h.passed ? 'Passed' : 'Not yet'}</span>` : '<span class="pill open">In progress</span>'}</td>
      <td class="num">${h.status === 'done' ? h.score : '—'}</td><td class="num">${h.status === 'done' ? longTime(h.thinking_ms) : '—'}</td></tr>`).join('')}
    </tbody></table>`;
  };
  pollSubject(id, null, paint, () => location.hash === route, (e) => {
    view.innerHTML = `<div class="gate"><h2>Subject not found</h2><p>${esc(e.message)} Subjects belong to the browser that started them.</p><a class="btn primary" href="#/">Back to modules</a></div>`;
  });
}

// --- Session ---

function currentTurn(s) {
  const r = s.rounds[s.rounds.length - 1];
  return r.turns.length ? r.turns[r.turns.length - 1] : null;
}

function thinkingNow() {
  if (!session) return 0;
  const live = session.status === 'active' && focus === session.rounds.length - 1
    && session.rounds[focus].revealed && !busy && currentTurn(session) && !currentTurn(session).grade;
  return session.thinking_ms + (live && questionShownAt ? Date.now() - questionShownAt : 0);
}

function startClock() {
  clearInterval(tick);
  tick = setInterval(() => {
    const el = document.getElementById('clock');
    if (el) el.textContent = clock(thinkingNow());
    else clearInterval(tick);
  }, 500);
}

async function renderSession(id) {
  setNav('');
  if (!session || session.id !== id) {
    view.innerHTML = '<p class="loading">Loading your session…</p>';
    try {
      session = await api(`/api/sessions/${encodeURIComponent(id)}`);
    } catch (e) {
      view.innerHTML = `<div class="gate"><h2>Session not found</h2><p>${esc(e.message)} Sessions are tied to the browser that started them.</p><a class="btn primary" href="#/">Back to modules</a></div>`;
      return;
    }
    focus = session.rounds.length - 1;
    const last = session.rounds[focus];
    // Resume on a finished round's feedback rather than skipping straight past it.
    if (session.status === 'done') showResults = true;
    else if (!last.revealed && focus > 0) focus -= 1;
    questionShownAt = Date.now();
    selectedStep = null;
    draft = '';
  }
  document.title = `${session.title} — Kenjitsu`;
  paintSession();
}

function fightLabel(s) {
  const f = s.focus || {id: 'core', title: 'The core idea', variant: 'first'};
  if (f.variant === 'gaps') return `Gaps rematch: ${f.title}`;
  return f.id === 'core' ? 'The core idea' : `Focus: ${f.title}`;
}

function roundLabel(s, i) {
  const r = s.rounds[i];
  if (r && r.label) return r.label;
  return (ROUND_COPY[i] && ROUND_COPY[i][0]) || `Round ${i + 1}`;
}

function roundDesc(s, i) {
  return (ROUND_COPY[i] && ROUND_COPY[i][1]) || 'Answer concretely with the underlying mechanism, not just labels.';
}

function forkTargetId(s) {
  return s.blueprint_id || (s.module && s.module !== 'custom' ? s.module : s.id);
}

function paintSession() {
  const s = session;
  const total = s.total_rounds || ROUND_COPY.length;
  const doneRounds = s.rounds.filter((r) => r.done);
  const scored = doneRounds.length ? Math.round(doneRounds.reduce((a, r) => a + r.score, 0) * (10 / total)) : 0;
  const forkId = forkTargetId(s);
  view.innerHTML = `
  <div class="bar">
    <div><p class="eyebrow">${s.subject ? `<a href="#/subject/${esc(s.subject)}">Subject map</a>` : 'Module'} · <span class="seal-text">${esc(fightLabel(s))}</span>${s.level ? ` · <span>${esc(s.level)}</span>` : ''}</p><h1>${esc(s.title)}</h1>${s.source ? `<div class="src">${esc(s.source)}</div>` : ''}</div>
    <div class="clock">
      ${forkId ? `<a class="btn small ghost" href="#/create?fork=${encodeURIComponent(forkId)}" title="Open this fight in the Creator Studio to inspect or edit its questions and rubrics">Fork / Edit fight ✎</a>` : ''}
      <div><span>Thinking time</span><b id="clock">${clock(thinkingNow())}</b></div>
      <div><span>Score</span><b>${scored}<small class="muted">/100</small></b></div>
    </div>
  </div>
  <ol class="ladder" style="grid-template-columns:repeat(${total},minmax(0,1fr))">${Array.from({length: total}, (_, i) => {
    const r = s.rounds[i];
    const cls = r && r.done ? `done ${band(r.score)}` : '';
    const current = !showResults && i === focus ? 'current' : '';
    const label = roundLabel(s, i);
    const inner = `<span class="n">ROUND ${i + 1}</span><span class="l">${esc(label)}</span><span class="s">${r && r.done ? `${r.score}/10` : i === s.rounds.length - 1 && s.status === 'active' ? 'live' : '—'}</span>`;
    return `<li class="${cls} ${current}">${r && r.done ? `<button type="button" data-focus="${i}" aria-label="Review round ${i + 1}">${inner}</button>` : inner}</li>`;
  }).join('')}</ol>
  <div id="stage"></div>`;
  view.querySelectorAll('[data-focus]').forEach((b) => b.addEventListener('click', () => {
    focus = Number(b.dataset.focus);
    showResults = false;
    paintSession();
  }));
  const stage = document.getElementById('stage');
  if (showResults && s.result) stage.innerHTML = resultsHtml(s);
  else stage.innerHTML = roundHtml(s, focus);
  wireStage();
  startClock();
}

function gradeHtml(g) {
  const missed = g.missed && g.missed.length
    ? `<span class="lab">What a strong answer had</span><ul>${g.missed.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : '';
  const jargon = g.jargon && g.jargon.length
    ? `<span class="lab">Unexplained jargon</span><div class="jargon-chips">${g.jargon.map((j) => `<span>${esc(j)}</span>`).join('')}</div>` : '';
  return `<div class="grade"><div class="score ${band(g.score)}">${g.score}<small>${esc(g.verdict)}</small></div>
    <div><p class="fb">${esc(g.feedback)}</p>${missed}${jargon}</div></div>`;
}

function exhibitHtml(r, interactive) {
  if (!r.exhibit) return '';
  const steps = r.exhibit.steps.map((step, i) => {
    const n = i + 1;
    if (interactive) {
      return `<li><button type="button" data-step="${n}" aria-pressed="${selectedStep === n}"><span class="num">${n}</span><span>${inline(esc(step))}</span></button></li>`;
    }
    const picked = r.turns[0] && r.turns[0].step === n;
    const flaw = r.done && r.flaw_step === n;
    const note = flaw ? `<span class="note">The flaw${picked ? ' — you found it' : ''}</span>` : picked ? '<span class="note" style="color:var(--muted)">Your pick</span>' : '';
    return `<li><div class="step ${flaw ? 'flaw' : ''} ${picked ? 'picked' : ''}"><span class="num">${n}</span><span>${inline(esc(step))}${note}</span></div></li>`;
  }).join('');
  return `${r.exhibit.title ? `<p class="exhibit-title">${esc(r.exhibit.title)}</p>` : ''}<ol class="exhibit">${steps}</ol>`;
}

function coachingHtml(r, open) {
  const c = r.coaching;
  if (!c) return '';
  const stepsHtml = (c.steps || []).map((st, idx) => {
    const isCurrent = open && !c.ready_for_main && idx === c.steps.length - 1 && !st.answer;
    return `<div class="coach-step">
      <div class="coach-q"><span class="coach-badge">Stepping stone ${idx + 1}</span> ${md(st.question)}</div>
      ${st.answer ? `<div class="mine"><span class="who">Your stepping-stone reply</span>${esc(st.answer)}</div>` : ''}
      ${st.feedback ? `<div class="coach-fb">${esc(st.feedback)}</div>` : ''}
      ${isCurrent ? `<form class="coach-form" id="coaching-form">
        <input id="coaching-input" maxlength="1200" autocomplete="off" placeholder="Answer this smaller question in 1–2 sentences…">
        <button class="btn small primary" type="submit">Check step →</button>
      </form>` : ''}
    </div>`;
  }).join('');
  const readyBanner = c.ready_for_main && open
    ? `<div class="coach-ready"><b>Pieces locked in.</b> Now put them together in your own words to answer the main round question below. <span class="muted">(Assisted rounds cap at 7/10 and are retested unassisted in the Rematch.)</span></div>`
    : '';
  return `<div class="coaching-box" id="coaching-box">
    <div class="coaching-head"><span class="seal-text">↳ Socratic Breakdown</span> · <b>${esc(c.concept || 'Core Intuition')}</b></div>
    <p class="coaching-intuition">${esc(c.intuition)}</p>
    ${stepsHtml}
    ${readyBanner}
  </div>`;
}

function roundHtml(s, i) {
  const r = s.rounds[i];
  const rLabel = roundLabel(s, i);
  const head = `<p class="eyebrow">Round ${i + 1} of ${s.total_rounds} · <span class="seal-text">${esc(rLabel)}</span>${r.assisted ? ' · <span class="muted">Assisted (max 7/10)</span>' : ''}</p>`;
  if (!r.revealed && revealing) {
    return `<div class="panel gate">${head}<h2>Writing round ${i + 1}…</h2>
      <p>${esc(WRITING[r.kind] || 'Writing your next question.')}</p><div class="blade" style="margin:0 auto"></div>
      <p class="muted" style="font-size:12.5px;margin-top:16px">Your clock is paused until the question appears.</p></div>`;
  }
  if (!r.revealed) {
    return `<div class="panel gate">${head}<h2>${esc(rLabel)}</h2><p>${esc(roundDesc(s, i))}</p>
      <button class="btn primary" type="button" id="reveal">Show the question <span aria-hidden="true">→</span></button>
      <p class="muted" style="font-size:12.5px;margin-top:14px">The clock runs only while a question is on screen and waiting for you.</p></div>`;
  }
  const open = s.status === 'active' && i === s.rounds.length - 1 && !r.done;
  const turns = r.turns.map((t, k) => {
    const interactive = open && k === 0 && !t.grade && r.kind === 'flaw';
    return `<div class="turn">${k > 0 ? '<span class="pushback-tag">↳ Pushback</span>' : ''}
      <div class="q">${md(t.question)}</div>${k === 0 ? exhibitHtml(r, interactive) : ''}
      ${t.grade ? `<div class="mine"><span class="who">Your answer${t.step && k === 0 ? ` · picked step ${t.step}` : ''}</span>${t.answer ? highlight(t.answer, t.grade.jargon) : '<em>Skipped</em>'}</div>${gradeHtml(t.grade)}` : ''}
    </div>`;
  }).join('');
  const coachBlock = coachingHtml(r, open);
  let tail = '';
  if (open) {
    const flawFirst = r.kind === 'flaw' && r.turns.length === 1;
    const canBreakdown = !r.coaching;
    tail = `<form class="answer-form" id="answer">
      <label class="eyebrow" for="answer-text">${flawFirst ? 'Pick the flawed step above, then explain' : (r.coaching ? 'Your synthesis for the main question' : 'Your answer')}</label>
      <textarea id="answer-text" maxlength="4000" placeholder="${flawFirst ? 'Step N is wrong because… The correct reasoning is…' : 'Be concrete. Say why, not just what. “That would mean…”'}">${esc(draft)}</textarea>
      <div class="form-foot"><span class="hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> to submit</span>
        <span class="actions">
          ${canBreakdown ? '<button class="btn" type="button" id="breakdown-btn" title="Get a 2-sentence intuition and a small stepping-stone question instead of guessing">Break this down (Teach me)</button>' : ''}
          <button class="btn ghost" type="button" id="skip">Skip (0/10)</button>
          <button class="btn primary" type="submit">Submit answer</button>
        </span></div>
    </form>`;
  } else if (r.done) {
    const last = r.turns[r.turns.length - 1].grade;
    const model = last && last.model_answer ? `<div class="model"><span class="lab">A strong answer</span>${md(last.model_answer)}</div>` : '';
    const targets = r.targets ? `<p class="muted" style="font-size:12.5px;margin:14px 0 0">This rematch targeted: ${esc(r.targets)}</p>` : '';
    const capped = r.assisted && last && last.score > r.score
      ? `<span class="muted">Scored ${last.score}, capped at 7 after Socratic breakdown.</span>`
      : (r.turns.length > 1 && last && last.score > r.score ? `<span class="muted">Scored ${last.score}, capped at 8 after pushback.</span>` : '<span></span>');
    let next = '';
    const upcoming = s.rounds[i + 1];
    const writing = upcoming && !upcoming.revealed && !upcoming.ready
      ? '<span class="writing-badge" title="Being written in the background">writing…</span>' : '';
    if (upcoming) next = `<button class="btn primary" type="button" id="next">${upcoming.revealed ? `Back to round ${i + 2}` : `Continue to round ${i + 2}`}${writing} <span aria-hidden="true">→</span></button>`;
    else if (s.status === 'done') next = '<button class="btn primary" type="button" id="results">See your result <span aria-hidden="true">→</span></button>';
    tail = `${model}${targets}<div class="next-row">${capped}${next}</div>`;
  }
  return `<div class="panel" id="round">${head}${turns}${coachBlock}${tail}</div>`;
}

function resultsHtml(s) {
  const res = s.result;
  let standing;
  if (s.module === 'custom') standing = '<b>—</b><p>One-off topics aren’t ranked. Save as a Fight Blueprint to rank challengers.</p>';
  else if (res.percentile === null) standing = `<b>—</b><p>Ranking unlocks once 5 challengers finish this fight (${res.others} so far).</p>`;
  else standing = `<b>${res.percentile}<small>th</small></b><p>Ahead of ${res.percentile}% of ${res.others} other ${res.others === 1 ? 'attempt' : 'attempts'}, on score, then time.</p>`;
  const bars = s.rounds.map((r, i) => `<li><span>${esc(roundLabel(s, i))}${r.assisted ? ' *' : ''}</span><span class="track"><span class="fill ${band(r.score)}" style="display:block;width:${r.score * 10}%"></span></span><b>${r.score}/10</b></li>`).join('');
  const gaps = res.gaps.length ? `<h3>What to go back to</h3><ul class="gaps">${res.gaps.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>` : '<h3>Nothing obvious to go back to</h3><p class="muted">Every round scored 7 or more.</p>';
  const ranked = s.module !== 'custom';
  const again = ranked ? '<button class="btn" type="button" id="again">Fight it again (ranked)</button>' : '';
  const forkId = forkTargetId(s);
  const vote = s.user_vote || 0;
  return `<div class="panel result">
    <div class="stamp-wrap">
      <div class="stamp ${res.passed ? 'pass' : 'fail'}">${res.passed ? 'Passed' : 'Not yet'}</div>
      <div class="big-score">${res.score}<small>/100</small></div>
      <div class="facts"><div class="fact"><span>Thinking time</span><b>${longTime(res.thinking_ms)}</b><p>Only while questions waited on you.</p></div><div class="fact"><span>Percentile</span>${standing}</div></div>
    </div>
    <div>
      <h3>Round by round</h3><ol class="bars">${bars}</ol>
      ${gaps}
      <p class="rule">To pass: ${s.pass_score}+ overall and win the rematch (6+), proof that you fixed what tripped you up.</p>
      <div class="taste-bar">
        <span>How was this fight’s taste &amp; question quality?</span>
        <div class="taste-actions">
          <button type="button" class="btn small ${vote === 1 ? 'primary' : ''}" data-rate-vote="1">👍 Sharp &amp; fair</button>
          <button type="button" class="btn small ${vote === -1 ? 'primary' : ''}" data-rate-vote="-1">👎 Confusing / unfair</button>
          ${forkId ? `<a class="btn small ghost" href="#/create?fork=${encodeURIComponent(forkId)}">Fork &amp; improve questions ✎</a>` : ''}
        </div>
      </div>
      <div class="result-actions">${again}<a class="btn" href="#/me">Your record</a><a class="btn ghost" href="#/">All modules</a></div>
    </div></div>
    ${s.subject ? '<section class="panel whats-next" id="whats-next"><div class="planning"><div class="blade"></div><p>Loading what’s next…</p></div></section>' : ''}`;
}

async function requestBreakdown(replyText = '') {
  if (busy) return;
  if (creating) {
    try { await creating; } catch { return; }
  }
  busy = true;
  const btn = document.getElementById('breakdown-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Breaking this down…'; }
  const cBtn = document.querySelector('#coaching-form button');
  if (cBtn) { cBtn.disabled = true; cBtn.textContent = 'Checking…'; }
  try {
    session = await api(`/api/sessions/${encodeURIComponent(session.id)}/breakdown`, {answer: replyText});
    questionShownAt = Date.now();
    paintSession();
    document.getElementById('coaching-box')?.scrollIntoView({behavior: 'smooth', block: 'center'});
  } catch (e) {
    toast(e.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Break this down (Teach me)'; }
    if (cBtn) { cBtn.disabled = false; cBtn.textContent = 'Check step →'; }
  } finally {
    busy = false;
  }
}

function wireStage() {
  const reveal = document.getElementById('reveal');
  if (reveal) reveal.addEventListener('click', revealRound);
  const next = document.getElementById('next');
  if (next) next.addEventListener('click', () => {
    if (session.rounds[focus + 1].revealed) {
      focus += 1;
      paintSession();
      window.scrollTo({top: 0, behavior: 'smooth'});
    } else {
      revealRound();
    }
  });
  watchUpcoming();
  const whatsNext = document.getElementById('whats-next');
  if (whatsNext && !whatsNext.dataset.loaded) {
    whatsNext.dataset.loaded = '1';
    const s = session;
    pollSubject(s.subject, s.id, (sub) => {
      const el = document.getElementById('whats-next');
      if (el) el.innerHTML = whatsNextHtml(sub);
    }, () => session === s && showResults && document.getElementById('whats-next'));
  }
  const results = document.getElementById('results');
  if (results) results.addEventListener('click', () => { showResults = true; paintSession(); });
  const again = document.getElementById('again');
  if (again) again.addEventListener('click', () => {
    if (session.blueprint_id) {
      const bp = blueprints.find((x) => x.id === session.blueprint_id);
      if (bp) { beginBlueprint(bp); return; }
      again.disabled = true;
      begin({blueprint: session.blueprint_id}, () => { again.disabled = false; });
      return;
    }
    const m = modules && modules.find((x) => x.id === session.module);
    if (m) { beginModule(m); return; }
    again.disabled = true;
    begin({module: session.module}, () => { again.disabled = false; });
  });
  view.querySelectorAll('[data-rate-vote]').forEach((b) => b.addEventListener('click', async () => {
    const vote = Number(b.dataset.rateVote);
    try {
      await api(`/api/sessions/${encodeURIComponent(session.id)}/rate`, {vote});
      session.user_vote = vote;
      toast(vote > 0 ? 'Marked as sharp & fair.' : 'Feedback recorded — consider forking this fight to improve it!');
      paintSession();
    } catch (e) { toast(e.message); }
  }));
  view.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    selectedStep = Number(b.dataset.step);
    view.querySelectorAll('[data-step]').forEach((x) => x.setAttribute('aria-pressed', Number(x.dataset.step) === selectedStep));
    document.getElementById('answer-text').focus();
  }));
  const breakdownBtn = document.getElementById('breakdown-btn');
  if (breakdownBtn) breakdownBtn.addEventListener('click', () => requestBreakdown(''));
  const coachingForm = document.getElementById('coaching-form');
  if (coachingForm) {
    const cInput = document.getElementById('coaching-input');
    if (cInput) cInput.focus({preventScroll: true});
    coachingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = cInput.value.trim();
      if (!val) { toast('Write a brief answer to the stepping-stone question.'); return; }
      requestBreakdown(val);
    });
  }
  const form = document.getElementById('answer');
  if (!form) return;
  const area = document.getElementById('answer-text');
  area.addEventListener('input', () => { draft = area.value; });
  area.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); form.requestSubmit(); }
  });
  if (!('ontouchstart' in window) && !coachingForm) area.focus({preventScroll: true});
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const answer = area.value.trim();
    const r = session.rounds[session.rounds.length - 1];
    if (!answer) { toast('Write an answer, or click “Break this down (Teach me)” if you are stuck.'); return; }
    // If the Challenger types a short cry for help ("help", "i don't know", "i don't understand") and hasn't used breakdown yet, offer stepping-stone coaching!
    if (!r.coaching && answer.length < 110 && /\b(help|i don'?t know|idk|don'?t understand|confused|no idea|teach me|hand[- ]?wavy)\b/i.test(answer)) {
      if (confirm('Want to break this round down with a quick intuition and a smaller stepping-stone question first instead of taking a 0?')) {
        requestBreakdown('');
        return;
      }
    }
    if (r.kind === 'flaw' && r.turns.length === 1 && !selectedStep) { toast('Pick the step you think is flawed.'); return; }
    submit(answer);
  });
  document.getElementById('skip').addEventListener('click', () => {
    if (confirm('Skip this question for 0/10, or click Cancel and press “Break this down (Teach me)” to work through it step by step?')) submit('');
  });
}

function stageIndex(stage) {
  const key = STAGE_OF[stage] || stage;
  return Math.max(0, STAGES.findIndex(([k]) => k === key));
}

function livePanel(answer, step) {
  return `<div class="mine"><span class="who">Your answer${step ? ` · picked step ${step}` : ''}</span>${answer ? esc(answer) : '<em>Skipped</em>'}</div>
  <div class="live" id="live" aria-live="polite">
    <div class="live-top"><span class="pulse" aria-hidden="true"></span><b id="live-label">${STAGES[0][2]}</b><span class="live-time" id="live-time">0.0s</span></div>
    <ol class="live-stages">${STAGES.map(([k, short], i) => `<li data-stage="${k}" class="${i ? '' : 'active'}">${short}</li>`).join('')}</ol>
    <div class="grade live-grade"><div class="score pending" id="live-score">?<small>scoring</small></div>
      <div><p class="fb" id="live-fb"><span class="caret"></span></p><span class="lab" id="live-words">Waiting for the first words…</span></div></div>
    <p class="live-why">Graded by a strict model that re-reads your answer against a private rubric. It writes specific feedback rather than “great answer”, which takes a few seconds. You’ll see it as it’s written.</p>
  </div>`;
}

function showProgress(p) {
  const at = stageIndex(p.stage);
  document.querySelectorAll('.live-stages li').forEach((li, i) => {
    li.className = i < at ? 'done' : i === at ? 'active' : '';
  });
  document.getElementById('live-label').textContent = STAGES[at][2];
  if (p.score !== undefined) {
    const box = document.getElementById('live-score');
    if (box.classList.contains('pending')) {
      box.className = `score ${band(p.score)} reveal`;
      box.innerHTML = `${p.score}<small>${esc(p.verdict)}</small>`;
    }
  }
  if (p.feedback !== undefined) {
    document.getElementById('live-fb').innerHTML = `${esc(p.feedback)}${at <= stageIndex('feedback') ? '<span class="caret"></span>' : ''}`;
  }
  if (p.chars) document.getElementById('live-words').textContent = `Examiner has written ~${Math.round(p.chars / 6)} words`;
}

async function readEvents(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const {value, done} = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, {stream: true});
    let cut;
    while ((cut = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, cut);
      buffer = buffer.slice(cut + 2);
      const kind = (block.match(/^event: (.*)$/m) || [])[1];
      const data = (block.match(/^data: (.*)$/m) || [])[1];
      if (kind && data) onEvent(kind, JSON.parse(data));
    }
  }
}

async function submit(answer) {
  if (busy) return;
  if (creating) {
    try { await creating; } catch { return; }
  }
  const id = session.id;
  const r = session.rounds[session.rounds.length - 1];
  const step = r.kind === 'flaw' && r.turns.length === 1 ? selectedStep : null;
  const before = session.rounds.length;
  const thinkingBefore = session.thinking_ms;
  session.thinking_ms = thinkingNow(); // Freeze the clock while the examiner works.
  busy = true;
  const form = document.getElementById('answer');
  form.outerHTML = livePanel(answer, step);
  document.getElementById('live').scrollIntoView({behavior: 'smooth', block: 'center'});
  const started = performance.now();
  const timer = setInterval(() => {
    const el = document.getElementById('live-time');
    if (el) el.textContent = `${((performance.now() - started) / 1000).toFixed(1)}s`;
  }, 100);
  let result = null;
  let failure = null;
  try {
    const response = await fetch(`/api/sessions/${id}/answer?stream=1`, {
      method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({answer, step})});
    if (!response.ok) {
      let detail = null;
      try { detail = (await response.json()).detail; } catch { /* Non-JSON error page. */ }
      throw new Error(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.');
    }
    await readEvents(response, (kind, data) => {
      if (kind === 'progress') showProgress(data);
      else if (kind === 'retry') {
        document.getElementById('live-label').textContent = 'The first reply came back garbled. Asking again…';
        document.getElementById('live-fb').innerHTML = '<span class="caret"></span>';
      } else if (kind === 'done') result = data.session;
      else if (kind === 'error') failure = data.detail;
    });
    if (!result && !failure) {
      // The connection dropped, but grading carries on server-side. Pick up its result.
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const latest = await api(`/api/sessions/${id}`);
      const last = latest.rounds[before - 1];
      if (latest.rounds.length > before || last.done || last.turns.length > r.turns.length) result = latest;
      else failure = 'The connection dropped before your answer was graded. Please send it again.';
    }
  } catch (e) {
    failure = e.message;
  }
  clearInterval(timer);
  busy = false;
  if (result) {
    session = result;
    draft = '';
    selectedStep = null;
    questionShownAt = Date.now(); // A pushback starts its own clock.
    focus = Math.min(before - 1, session.rounds.length - 1);
  } else {
    session.thinking_ms = thinkingBefore;
    toast(failure);
  }
  if (location.hash === `#/s/${id}`) paintSession();
}

// Learn when the upcoming round has been written, without revealing it, to clear its badge.
async function watchUpcoming() {
  const s = session;
  const upcoming = s && s.rounds[s.rounds.length - 1];
  if (!s || !s.id || !upcoming || upcoming.revealed || upcoming.ready || waitingFor === s.id) return;
  waitingFor = s.id;
  try {
    for (let attempt = 0; attempt < 3 && session === s && !upcoming.ready; attempt++) {
      const latest = await api(`/api/sessions/${s.id}/wait`);
      upcoming.ready = latest.rounds[s.rounds.length - 1].ready !== false;
    }
    if (upcoming.ready) document.querySelector('#next .writing-badge')?.remove();
  } catch { /* Purely cosmetic: continuing still works. */ }
  waitingFor = null;
}

async function revealRound() {
  if (busy) return;
  busy = true;
  const i = session.rounds.length - 1;
  // Usually instant: the round was written in the background. Explain any wait.
  const slow = setTimeout(() => {
    revealing = true;
    focus = i;
    paintSession();
  }, 250);
  try {
    session = await api(`/api/sessions/${session.id}/reveal`, {});
    questionShownAt = Date.now();
    focus = i;
    window.scrollTo({top: 0, behavior: 'smooth'});
  } catch (e) {
    toast(e.message);
  } finally {
    clearTimeout(slow);
    revealing = false;
    busy = false;
    paintSession();
  }
}

// --- Record ---

async function renderMe() {
  setNav('me');
  document.title = 'Your record — Kenjitsu';
  view.innerHTML = '<p class="loading">Loading your record…</p>';
  let data;
  try { data = await api('/api/me'); } catch (e) { view.innerHTML = `<p class="loading">${esc(e.message)}</p>`; return; }
  const done = data.history.filter((h) => h.status === 'done');
  const avg = done.length ? Math.round(done.reduce((a, h) => a + h.score, 0) / done.length) : null;
  const time = done.reduce((a, h) => a + (h.thinking_ms || 0), 0);
  const date = (iso) => new Date(iso).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
  view.innerHTML = `
  <div class="record-head"><p class="eyebrow">Private to this browser</p><h1>Your record</h1>
    <p>Marking a book “read” doesn’t mean you remember it. Earning its black belt means you do.</p></div>
  <div class="tiles">
    <div class="tile"><span>Focuses passed</span><b>${data.subjects.reduce((a, x) => a + x.passed, 0)}</b></div>
    <div class="tile"><span>Fights finished</span><b>${done.length}</b></div>
    <div class="tile"><span>Average score</span><b>${avg ?? '—'}</b></div>
    <div class="tile"><span>Time spent thinking</span><b>${done.length ? longTime(time) : '—'}</b></div>
  </div>
  <div class="section-head"><h2>Your subjects</h2><span class="muted">Each focus you pass earns the next belt, White to Black.</span></div>
  ${data.subjects.length ? `<div class="subject-grid">${data.subjects.map(subjectCard).join('')}</div>`
    : '<p class="empty-note">No subjects yet. Fight a module or any topic and it lands here.</p>'}
  <div class="section-head"><h2>History</h2></div>
  ${data.history.length ? `<table><thead><tr><th>Date</th><th>Fight</th><th>Result</th><th>Score</th><th>Thinking</th></tr></thead><tbody>
    ${data.history.map((h) => `<tr><td class="num">${date(h.started_at)}</td><td><a href="#/s/${esc(h.id)}">${esc(h.title)}</a><span class="muted"> · ${esc(h.variant === 'gaps' ? 'gaps' : h.focus_title || 'The core idea')}</span></td>
      <td>${h.status === 'done' ? `<span class="pill ${h.passed ? 'pass' : 'fail'}">${h.passed ? 'Passed' : 'Not yet'}</span>` : '<span class="pill open">In progress</span>'}</td>
      <td class="num">${h.status === 'done' ? `${h.score}` : '—'}</td><td class="num">${h.status === 'done' ? longTime(h.thinking_ms) : '—'}</td></tr>`).join('')}
  </tbody></table>` : '<p class="empty-note">No fights yet. <a href="#/">Pick one</a>.</p>'}`;
}

// --- Atlas ---

async function launchAtlasNode(node, button) {
  if (node.mod) {
    if (!modules) {
      try { modules = (await api('/api/modules')).modules; } catch { modules = []; }
    }
    const m = modules.find((x) => x.id === node.mod);
    if (m) {
      beginModule(m);
      return;
    }
  }
  const notes = node.q ? `Core focus question: ${node.q}${node.s ? ` (Source: ${node.s})` : ''}` : '';
  await startFight(button, {topic: node.t, notes});
}

function renderAtlasPage() {
  setNav('atlas');
  document.title = 'Knowledge Atlas — Kenjitsu';
  view.innerHTML = '<div id="atlas-page-host" class="atlas-page-host"></div>';
  const host = document.getElementById('atlas-page-host');
  if (host && window.mountKenjitsuAtlas) {
    window.mountKenjitsuAtlas(host, {
      embedded: false,
      onStartFight: (node, button) => launchAtlasNode(node, button),
    });
  }
}

// --- Fight Creator & Forking Studio ---

const KIND_OPTIONS = [
  ['explain', 'Explain it simply (Core mechanism)'],
  ['perturb', 'What if it changes? (Turn one knob)'],
  ['flaw', 'Find the flaw (Step-by-step exhibit)'],
  ['apply', 'New case (Transfer scenario)'],
  ['custom', 'Custom angle (Creator-defined)'],
  ['retest', 'Adaptive Rematch (Targets weakest round)'],
];

const LEVEL_OPTIONS = [
  'Intuition / High School',
  'Core / Undergrad',
  'Practitioner / Interview',
  'Advanced / Research',
];

const CAT_OPTIONS = [
  'Interviews',
  'Courses',
  'Exams',
  'AI & ML',
  'Law & Policy',
  'Science',
  'Community',
];

let studio = null;
let auditReport = null;

function defaultStudioState(seed = {}) {
  return {
    id: null,
    parent_id: null,
    title: seed.topic || '',
    category: 'Community',
    source: '',
    level: 'Core / Undergrad',
    blurb: '',
    taste_prompt: '',
    brief: '',
    notes: seed.notes || '',
    published: true,
    rounds: [
      {kind: 'explain', label: 'Explain it simply', prompt: '', rubric: ''},
      {kind: 'perturb', label: 'What if it changes?', prompt: '', rubric: ''},
      {kind: 'flaw', label: 'Find the flaw', prompt: '', rubric: '', exhibit: {title: '', steps: ['', '', '']}, flaw_step: 2},
      {kind: 'apply', label: 'New case', prompt: '', rubric: ''},
      {kind: 'retest', label: 'Rematch', prompt: '', rubric: 'Adaptive rematch targeting the challenger’s weakest round.'},
    ],
  };
}

async function renderCreator(forkId = null, editId = null) {
  setNav('create');
  document.title = 'Create or Fork a Fight — Kenjitsu';
  auditReport = null;
  if (editId) {
    view.innerHTML = '<p class="loading">Loading fight blueprint…</p>';
    try {
      studio = await api(`/api/blueprints/${encodeURIComponent(editId)}`);
    } catch (e) {
      toast(e.message);
      studio = defaultStudioState();
    }
  } else if (forkId) {
    view.innerHTML = '<p class="loading">Forking fight into Creator Studio…</p>';
    try {
      studio = await api(`/api/blueprints/fork/${encodeURIComponent(forkId)}`);
    } catch (e) {
      toast(e.message);
      studio = defaultStudioState();
    }
  } else if (creatorSeed) {
    studio = defaultStudioState(creatorSeed);
    creatorSeed = null;
  } else if (!studio) {
    studio = defaultStudioState();
  }
  paintCreator();
}

function syncStudioFromDom() {
  if (!studio) return;
  const val = (id) => document.getElementById(id)?.value ?? '';
  studio.title = val('st-title').trim();
  studio.category = val('st-category') || 'Community';
  studio.source = val('st-source').trim();
  studio.level = val('st-level') || 'Core / Undergrad';
  studio.blurb = val('st-blurb').trim();
  studio.taste_prompt = val('st-taste').trim();
  studio.brief = val('st-brief').trim();
  studio.notes = val('st-notes');
  view.querySelectorAll('[data-round-idx]').forEach((card) => {
    const idx = Number(card.dataset.roundIdx);
    const r = studio.rounds[idx];
    if (!r) return;
    r.kind = card.querySelector('.r-kind')?.value || r.kind;
    r.label = card.querySelector('.r-label')?.value.trim() || r.label;
    r.prompt = card.querySelector('.r-prompt')?.value ?? r.prompt;
    r.rubric = card.querySelector('.r-rubric')?.value ?? r.rubric;
    if (r.kind === 'flaw') {
      const exTitle = card.querySelector('.r-ex-title')?.value.trim() || '';
      const steps = [...card.querySelectorAll('.r-ex-step')].map((inp) => inp.value.trim());
      r.exhibit = {title: exTitle, steps};
    }
  });
}

function paintCreator() {
  const s = studio;
  const roundsHtml = s.rounds.map((r, i) => {
    const isFlaw = r.kind === 'flaw';
    const isRetest = r.kind === 'retest' && !r.prompt;
    const ex = r.exhibit || {title: '', steps: ['Step 1', 'Step 2', 'Step 3']};
    const flawStep = r.flaw_step || 2;
    const auditNote = auditReport?.round_notes?.find((n) => n.round === i + 1);
    return `
    <div class="studio-round panel" data-round-idx="${i}">
      <div class="studio-round-head">
        <div class="studio-round-title">
          <span class="n">ROUND 0${i + 1}</span>
          <select class="r-kind" data-idx="${i}">
            ${KIND_OPTIONS.map(([k, lab]) => `<option value="${k}" ${r.kind === k ? 'selected' : ''}>${esc(lab)}</option>`).join('')}
          </select>
          <input class="r-label" type="text" maxlength="80" value="${esc(r.label || '')}" placeholder="Round label (e.g. Explain it simply)">
        </div>
        <div class="studio-round-moves">
          ${i > 0 ? `<button type="button" class="btn small ghost" data-move-up="${i}" title="Move round up">↑</button>` : ''}
          ${i < s.rounds.length - 1 ? `<button type="button" class="btn small ghost" data-move-down="${i}" title="Move round down">↓</button>` : ''}
          ${s.rounds.length > 2 ? `<button type="button" class="btn small ghost" data-remove-round="${i}" title="Delete round">✕</button>` : ''}
        </div>
      </div>
      ${auditNote ? `<div class="audit-pill ${auditNote.status === 'warn' ? 'warn' : 'ok'}"><b>${auditNote.status === 'warn' ? '⚠ Needs polish:' : '✓ Sharp:'}</b> ${esc(auditNote.note)}</div>` : ''}
      ${isRetest ? `<p class="muted" style="margin:8px 0 10px;font-size:13.5px">By default, the Rematch round is generated live after Round ${i} to target the specific concept where the challenger scored lowest. You can also write a fixed final question below if you prefer.</p>` : ''}
      <div class="studio-grid-2">
        <div>
          <label class="eyebrow">Question prompt ${isRetest ? '(leave blank for adaptive rematch)' : ''}</label>
          <textarea class="r-prompt" rows="4" placeholder="${isRetest ? 'Leave blank so the examiner targets the challenger’s weakest round automatically, or write a fixed final question…' : 'Write a concrete, unambiguous question that forces causal reasoning…'}">${esc(r.prompt || '')}</textarea>
        </div>
        <div>
          <label class="eyebrow">Grading &amp; Socratic teaching rubric</label>
          <textarea class="r-rubric" rows="4" placeholder="What specific mechanism, numbers, or edge case must a 9–10/10 answer explain?">${esc(r.rubric || '')}</textarea>
        </div>
      </div>
      ${isFlaw ? `
      <div class="studio-exhibit">
        <div class="studio-exhibit-head">
          <label class="eyebrow">Step-by-step exhibit (click a step number to mark it as the planted flaw)</label>
          <input class="r-ex-title" type="text" maxlength="160" value="${esc(ex.title || '')}" placeholder="Exhibit title (e.g. Proposed derivation of the chain rule)">
        </div>
        <ol class="studio-steps">
          ${(ex.steps || ['', '', '']).map((st, sIdx) => {
            const stepNum = sIdx + 1;
            const isFlawed = flawStep === stepNum;
            return `<li class="${isFlawed ? 'flawed' : ''}">
              <button type="button" class="flaw-pick" data-pick-flaw="${i}:${stepNum}" title="Click to mark step ${stepNum} as the flawed step">${stepNum}${isFlawed ? ' · FLAW' : ''}</button>
              <input class="r-ex-step" type="text" value="${esc(st)}" placeholder="Step ${stepNum} reasoning…">
              ${(ex.steps || []).length > 3 ? `<button type="button" class="btn small ghost" data-del-step="${i}:${sIdx}">−</button>` : ''}
            </li>`;
          }).join('')}
        </ol>
        ${(ex.steps || []).length < 7 ? `<button type="button" class="btn small ghost" data-add-step="${i}">+ Add exhibit step</button>` : ''}
      </div>` : ''}
      <div class="studio-regen-bar">
        <input type="text" class="r-instruction" data-regen-input="${i}" placeholder="Tell AI how to rewrite or sharpen this round (e.g. 'Use a 2-layer network with concrete numbers' or 'Focus on vanishing gradients')…">
        <button type="button" class="btn small" data-regen-round="${i}">Rewrite round with AI ↻</button>
      </div>
    </div>`;
  }).join('');

  view.innerHTML = `
  <div class="record-head studio-top">
    <div>
      <p class="eyebrow">Fight Creator Studio ${s.parent_id ? `· <span class="seal-text">Forked from ${esc(s.parent_id)}</span>` : ''}</p>
      <h1>${s.id ? 'Edit Fight Blueprint' : (s.parent_id ? 'Fork &amp; Improve Fight' : 'Design a Fight')}</h1>
      <p>LLMs have knowledge; humans have taste. Steer the teaching angle, generate a full multi-round blueprint, and edit any question or rubric before challengers step in.</p>
    </div>
    <div class="studio-top-actions">
      <button type="button" class="btn" id="st-audit">Check quality (AI Audit)</button>
      <button type="button" class="btn" id="st-save-link">Save &amp; copy link</button>
      <button type="button" class="btn primary" id="st-save-fight">Save &amp; Enter the Ring →</button>
    </div>
  </div>

  ${auditReport ? `<div class="panel audit-banner ${auditReport.overall === 'sharp' ? 'ok' : 'warn'}">
    <b>AI Quality Audit (${auditReport.overall === 'sharp' ? 'Sharp & Ready' : 'Suggestions Found'}):</b> ${esc(auditReport.summary)}
  </div>` : ''}

  <div class="panel studio-meta-panel">
    <div class="studio-grid-3">
      <div>
        <label class="eyebrow" for="st-title">Topic / Fight Title</label>
        <input id="st-title" type="text" maxlength="100" value="${esc(s.title)}" placeholder="e.g. Backpropagation &amp; the Chain Rule">
      </div>
      <div>
        <label class="eyebrow" for="st-level">Difficulty Level (Fractal Depth)</label>
        <select id="st-level">
          ${LEVEL_OPTIONS.map((lv) => `<option value="${esc(lv)}" ${s.level === lv ? 'selected' : ''}>${esc(lv)}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="eyebrow" for="st-category">Category &amp; Source</label>
        <div class="studio-cat-row">
          <select id="st-category">
            ${CAT_OPTIONS.map((c) => `<option value="${esc(c)}" ${s.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
          </select>
          <input id="st-source" type="text" maxlength="80" value="${esc(s.source)}" placeholder="Source (e.g. CS231n / Deep Learning)">
        </div>
      </div>
    </div>
    <div style="margin-top:16px">
      <label class="eyebrow" for="st-taste">Your Creator Taste &amp; Teaching Direction (What should this fight emphasize?)</label>
      <textarea id="st-taste" rows="3" placeholder="Tell the AI what misconceptions challengers always have here, what concrete example or intuition to anchor on, or what custom rounds you want (e.g. 'Force them to trace gradients through a concrete computational graph; don't let them hide behind matrix notation')…">${esc(s.taste_prompt)}</textarea>
    </div>
    <div class="studio-grid-2" style="margin-top:14px">
      <div>
        <label class="eyebrow" for="st-blurb">One-Line Hook (Shown on card)</label>
        <input id="st-blurb" type="text" maxlength="200" value="${esc(s.blurb)}" placeholder="Why gradients vanish, what the chain rule actually routes, and where implementations break.">
      </div>
      <div>
        <label class="eyebrow" for="st-brief">Examiner’s Brief (Core mechanisms &amp; common mistakes)</label>
        <input id="st-brief" type="text" maxlength="3000" value="${esc(s.brief)}" placeholder="Auto-generated when you draft, or write your own key mechanisms…">
      </div>
    </div>
    <details class="notes-toggle" style="margin-top:14px" ${s.notes ? 'open' : ''}>
      <summary>Reference notes, syllabus or paper excerpt (optional)</summary>
      <textarea id="st-notes" maxlength="24000" placeholder="Paste lecture notes, code, or a paper excerpt to ground the blueprint…">${esc(s.notes)}</textarea>
    </details>
    <div class="studio-draft-bar">
      <span class="muted">Generate all rounds at once from your topic, level, and taste prompt — then edit any round below.</span>
      <button type="button" class="btn primary" id="st-draft-all">Generate Full Blueprint with AI ✨</button>
    </div>
  </div>

  <div class="section-head" style="margin-top:36px">
    <div><p class="eyebrow">Round-by-Round Blueprint</p><h2>Customize the Rounds (${s.rounds.length})</h2></div>
    <button type="button" class="btn small" id="st-add-round">+ Add a round</button>
  </div>
  <div id="studio-rounds">${roundsHtml}</div>
  <div class="studio-bottom-bar">
    <button type="button" class="btn" id="st-add-round-bottom">+ Add another round</button>
    <div class="studio-top-actions">
      <button type="button" class="btn" id="st-save-link-2">Save &amp; copy share link</button>
      <button type="button" class="btn primary" id="st-save-fight-2">Save &amp; Enter the Ring →</button>
    </div>
  </div>`;

  wireCreator();
}

function wireCreator() {
  view.querySelectorAll('.r-kind').forEach((sel) => sel.addEventListener('change', () => {
    syncStudioFromDom();
    const idx = Number(sel.dataset.idx);
    const kind = sel.value;
    studio.rounds[idx].kind = kind;
    const defaultLabel = KIND_OPTIONS.find(([k]) => k === kind)?.[1]?.split(' (')[0];
    if (defaultLabel) studio.rounds[idx].label = defaultLabel;
    if (kind === 'flaw' && !studio.rounds[idx].exhibit) {
      studio.rounds[idx].exhibit = {title: 'Proposed argument', steps: ['Step 1', 'Step 2', 'Step 3']};
      studio.rounds[idx].flaw_step = 2;
    }
    paintCreator();
  }));

  view.querySelectorAll('[data-pick-flaw]').forEach((btn) => btn.addEventListener('click', () => {
    syncStudioFromDom();
    const [rIdx, stepNum] = btn.dataset.pickFlaw.split(':').map(Number);
    studio.rounds[rIdx].flaw_step = stepNum;
    paintCreator();
  }));

  view.querySelectorAll('[data-add-step]').forEach((btn) => btn.addEventListener('click', () => {
    syncStudioFromDom();
    const rIdx = Number(btn.dataset.addStep);
    const ex = studio.rounds[rIdx].exhibit || {title: '', steps: []};
    ex.steps.push('');
    studio.rounds[rIdx].exhibit = ex;
    paintCreator();
  }));

  view.querySelectorAll('[data-del-step]').forEach((btn) => btn.addEventListener('click', () => {
    syncStudioFromDom();
    const [rIdx, sIdx] = btn.dataset.delStep.split(':').map(Number);
    const ex = studio.rounds[rIdx].exhibit;
    if (ex && ex.steps.length > 3) {
      ex.steps.splice(sIdx, 1);
      studio.rounds[rIdx].flaw_step = Math.min(studio.rounds[rIdx].flaw_step || 1, ex.steps.length);
      paintCreator();
    }
  }));

  view.querySelectorAll('[data-move-up]').forEach((btn) => btn.addEventListener('click', () => {
    syncStudioFromDom();
    const i = Number(btn.dataset.moveUp);
    [studio.rounds[i - 1], studio.rounds[i]] = [studio.rounds[i], studio.rounds[i - 1]];
    paintCreator();
  }));

  view.querySelectorAll('[data-move-down]').forEach((btn) => btn.addEventListener('click', () => {
    syncStudioFromDom();
    const i = Number(btn.dataset.moveDown);
    [studio.rounds[i + 1], studio.rounds[i]] = [studio.rounds[i], studio.rounds[i + 1]];
    paintCreator();
  }));

  view.querySelectorAll('[data-remove-round]').forEach((btn) => btn.addEventListener('click', () => {
    syncStudioFromDom();
    const i = Number(btn.dataset.removeRound);
    studio.rounds.splice(i, 1);
    paintCreator();
  }));

  const addRound = () => {
    syncStudioFromDom();
    const insertAt = studio.rounds.length && studio.rounds[studio.rounds.length - 1].kind === 'retest'
      ? studio.rounds.length - 1
      : studio.rounds.length;
    studio.rounds.splice(insertAt, 0, {kind: 'custom', label: 'Custom angle', prompt: '', rubric: ''});
    paintCreator();
  };
  document.getElementById('st-add-round')?.addEventListener('click', addRound);
  document.getElementById('st-add-round-bottom')?.addEventListener('click', addRound);

  // Draft full blueprint with AI
  document.getElementById('st-draft-all')?.addEventListener('click', async (e) => {
    syncStudioFromDom();
    if (studio.title.length < 2 && studio.notes.trim().length < 20) {
      toast('Enter a topic/title or paste reference notes first.');
      document.getElementById('st-title')?.focus();
      return;
    }
    const btn = e.currentTarget;
    btn.disabled = true;
    const orig = btn.textContent;
    btn.textContent = 'Drafting all rounds with AI (approx 6–10s)…';
    try {
      const drafted = await api('/api/blueprints/draft', {
        topic: studio.title,
        level: studio.level,
        taste_prompt: studio.taste_prompt,
        notes: studio.notes,
      });
      studio = {...studio, ...drafted, id: studio.id, parent_id: studio.parent_id};
      auditReport = null;
      toast('Blueprint drafted! Inspect or tweak any round below.');
      paintCreator();
    } catch (err) {
      toast(err.message);
      btn.disabled = false;
      btn.textContent = orig;
    }
  });

  // Per-round rewrite with AI
  view.querySelectorAll('[data-regen-round]').forEach((btn) => btn.addEventListener('click', async () => {
    syncStudioFromDom();
    const i = Number(btn.dataset.regenRound);
    const r = studio.rounds[i];
    const instr = view.querySelector(`[data-regen-input="${i}"]`)?.value.trim() || '';
    btn.disabled = true;
    const orig = btn.textContent;
    btn.textContent = 'Rewriting…';
    try {
      const updated = await api('/api/blueprints/regenerate-round', {
        title: studio.title || 'Untitled topic',
        source: studio.source,
        level: studio.level,
        brief: studio.brief,
        taste_prompt: studio.taste_prompt,
        kind: r.kind,
        label: r.label,
        current_prompt: r.prompt,
        instruction: instr,
      });
      studio.rounds[i] = {...r, ...updated};
      toast(`Round ${i + 1} updated.`);
      paintCreator();
    } catch (err) {
      toast(err.message);
      btn.disabled = false;
      btn.textContent = orig;
    }
  }));

  // AI Quality Audit
  document.getElementById('st-audit')?.addEventListener('click', async (e) => {
    syncStudioFromDom();
    const btn = e.currentTarget;
    btn.disabled = true;
    const orig = btn.textContent;
    btn.textContent = 'Auditing questions & rubrics…';
    try {
      auditReport = await api('/api/blueprints/audit', studio);
      paintCreator();
    } catch (err) {
      toast(err.message);
      btn.disabled = false;
      btn.textContent = orig;
    }
  });

  async function saveStudioBlueprint(andFight) {
    syncStudioFromDom();
    if (!studio.title) {
      toast('Give your fight a title first.');
      document.getElementById('st-title')?.focus();
      return;
    }
    const nonEmpty = studio.rounds.filter((r) => r.prompt.trim() || r.kind === 'retest');
    if (nonEmpty.length < 2 || !nonEmpty[0].prompt.trim()) {
      toast('Write a prompt for Round 1 (or click “Generate Full Blueprint with AI ✨” first).');
      return;
    }
    try {
      const method = studio.id ? 'PUT' : 'POST';
      const path = studio.id ? `/api/blueprints/${encodeURIComponent(studio.id)}` : '/api/blueprints';
      const response = await fetch(path, {
        method,
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...studio, rounds: nonEmpty, published: true}),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.detail || 'Could not save blueprint.');
      studio = saved;
      // Refresh cached blueprints list
      modules = null;
      const shareUrl = `${location.origin}${location.pathname}#/f/${saved.id}`;
      if (andFight) {
        beginBlueprint({
          id: saved.id,
          blueprint: true,
          title: saved.title,
          source: saved.source,
          level: saved.level,
          total_rounds: saved.rounds.length,
          opener: saved.rounds[0].prompt,
        });
      } else {
        try { await navigator.clipboard.writeText(shareUrl); toast(`Saved! Share link copied: ${shareUrl}`); }
        catch { toast(`Saved! Share link: #/f/${saved.id}`); }
        paintCreator();
      }
    } catch (err) {
      toast(err.message);
    }
  }

  document.getElementById('st-save-fight')?.addEventListener('click', () => saveStudioBlueprint(true));
  document.getElementById('st-save-fight-2')?.addEventListener('click', () => saveStudioBlueprint(true));
  document.getElementById('st-save-link')?.addEventListener('click', () => saveStudioBlueprint(false));
  document.getElementById('st-save-link-2')?.addEventListener('click', () => saveStudioBlueprint(false));
}

async function renderBlueprintShare(bpId) {
  setNav('');
  view.innerHTML = '<p class="loading">Loading fight…</p>';
  try {
    const bp = await api(`/api/blueprints/${encodeURIComponent(bpId)}`);
    beginBlueprint({
      id: bp.id,
      blueprint: true,
      title: bp.title,
      source: bp.source,
      level: bp.level,
      total_rounds: bp.rounds.length,
      opener: bp.rounds[0]?.prompt || '',
    });
  } catch (e) {
    view.innerHTML = `<div class="gate"><h2>Fight not found</h2><p>${esc(e.message)}</p><a class="btn primary" href="#/">Back to modules</a></div>`;
  }
}

// --- Router ---

function route() {
  clearInterval(tick);
  const hash = location.hash || '#/';
  const match = hash.match(/^#\/s\/([\w-]+)/);
  const fMatch = hash.match(/^#\/f\/([\w-]+)/);
  if (match && match[1] === 'new') {
    // The provisional address of a session still being created.
    if (session && session.id === null) paintSession();
    else location.replace('#/');
  } else if (match) renderSession(match[1]);
  else if (fMatch) renderBlueprintShare(fMatch[1]);
  else if (hash.startsWith('#/create')) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    renderCreator(params.get('fork'), params.get('edit'));
  }
  else if (hash.startsWith('#/atlas')) renderAtlasPage();
  else if (hash.startsWith('#/me')) renderMe();
  else if (hash.match(/^#\/subject\/([\w-]+)/)) renderSubject(hash.match(/^#\/subject\/([\w-]+)/)[1]);
  else { session = null; renderHome(); }
  if (!match) window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
