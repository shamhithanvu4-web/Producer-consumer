(function(){
'use strict';

const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionOK = () => !RM.matches;
const $ = (id) => document.getElementById(id);
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const setText = (el, v) => { const s = String(v); if (el.textContent !== s) el.textContent = s; };
const restart = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

/* ================= icons ================= */
const LOCK_CLOSED = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.6" fill="currentColor"/><path d="M5.3 7V5.2a2.7 2.7 0 0 1 5.4 0V7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const LOCK_OPEN = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.3 7V5.2a2.7 2.7 0 0 1 5.3-.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const ICON = {
  ready:'<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.2 8.3l1.9 1.9 3.8-4.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  busy:'<svg viewBox="0 0 16 16" aria-hidden="true" class="spin"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/><path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  critical: LOCK_CLOSED,
  wait:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2h7M4.5 14h7M5.5 2v1.8c0 1.4 2.5 2.6 2.5 4.2s-2.5 2.8-2.5 4.2V14M10.5 2v1.8c0 1.4-2.5 2.6-2.5 4.2s2.5 2.8 2.5 4.2V14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  lockwait:'<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.3 7V5.2a2.7 2.7 0 0 1 5.4 0V7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="10.5" r="1.1" fill="currentColor"/></svg>',
  stuck:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 1.8h5l3.7 3.7v5l-3.7 3.7h-5l-3.7-3.7v-5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 6l4 4M10 6l-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  hazard:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.2l6 10.6H2z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.5v3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.2" r=".8" fill="currentColor"/></svg>'
};
const SL_ICON = {busy:ICON.busy, ok:ICON.ready, critical:LOCK_CLOSED, wait:ICON.wait, lock:ICON.lockwait, hazard:ICON.hazard};
function setStatus(el, kind, text){
  if (el.dataset.kind !== kind || !el.firstElementChild.firstChild){ el.dataset.kind = kind; el.firstElementChild.innerHTML = SL_ICON[kind] || ''; }
  setText(el.lastElementChild, text);
}

/* ================= shared helpers ================= */
function buildSlots(el, n){
  el.innerHTML = '';
  el.style.setProperty('--n', n);
  el.dataset.n = n;
  for (let i = 0; i < n; i++){
    const d = document.createElement('div'); d.className = 'slot';
    d.append(document.createElement('span'));
    el.append(d);
  }
}
function paintSlot(k, v, pop){
  const filled = v != null;
  k.classList.toggle('filled', filled);
  k.firstChild.textContent = filled ? '#' + v : '';
  if (pop && filled && motionOK()) restart(k, 'pop');
}
function flyToken(host, fromEl, toEl, text, ms){
  if (!motionOK() || !host || !fromEl || !toEl || !host.animate) return;
  const h = host.getBoundingClientRect(), a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
  if (!h.width || !a.width || !b.width) return;
  const tw = 36, th = 26;
  const x0 = a.left - h.left + a.width / 2 - tw / 2, y0 = a.top - h.top + a.height / 2 - th / 2;
  const x1 = b.left - h.left + b.width / 2 - tw / 2, y1 = b.top - h.top + b.height / 2 - th / 2;
  const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 34;
  const tok = document.createElement('span');
  tok.className = 'token'; tok.textContent = text;
  host.append(tok);
  const anim = tok.animate([
    {transform:`translate(${x0}px,${y0}px) scale(.7)`, opacity:0},
    {transform:`translate(${mx}px,${my}px) scale(1.05)`, opacity:1, offset:.5},
    {transform:`translate(${x1}px,${y1}px) scale(.9)`, opacity:.85}
  ], {duration:Math.max(180, ms), easing:'cubic-bezier(.3,.7,.3,1)'});
  anim.onfinish = () => tok.remove();
  anim.oncancel = () => tok.remove();
}

/* ================= 1. backdrop textures ================= */
(function backdrop(){
  const bd = document.querySelector('.backdrop');
  const cv = $('topo'), ctx = cv.getContext('2d');
  const P = new Uint8Array(512);
  (function(){ const p = []; for (let i = 0; i < 256; i++) p.push(i); let s = 20261013;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 255; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
    for (let i = 0; i < 512; i++) P[i] = p[i & 255]; })();
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h, x, y) => { switch (h & 7){ case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y; case 4: return x; case 5: return -x; case 6: return y; default: return -y; } };
  function noise(x, y){
    const fx = Math.floor(x), fy = Math.floor(y);
    const X = fx & 255, Y = fy & 255; x -= fx; y -= fy;
    const u = fade(x), v = fade(y), a = P[X] + Y, b = P[X + 1] + Y;
    const l1 = grad(P[a], x, y) + u * (grad(P[b], x - 1, y) - grad(P[a], x, y));
    const l2 = grad(P[a + 1], x, y - 1) + u * (grad(P[b + 1], x - 1, y - 1) - grad(P[a + 1], x, y - 1));
    return l1 + v * (l2 - l1);
  }
  const SEG = [[],[[3,2]],[[2,1]],[[3,1]],[[0,1]],[[0,1],[3,2]],[[0,2]],[[0,3]],[[0,3]],[[0,2]],[[0,3],[2,1]],[[0,1]],[[3,1]],[[2,1]],[[3,2]],[]];
  let W = 0, H = 0, dpr = 1, f = null, cols = 0, rows = 0, cell = 14;
  function size(){
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = Math.min(window.innerHeight, 1800);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.height = H + 'px';
    draw();
  }
  function draw(){
    cell = W < 700 ? 16 : 14;
    cols = Math.ceil(W / cell) + 1; rows = Math.ceil(H / cell) + 1;
    if (!f || f.length !== cols * rows) f = new Float32Array(cols * rows);
    const off = window.scrollY * 0.22, sc = 1 / 360;
    for (let j = 0; j < rows; j++){
      const y = (j * cell + off) * sc;
      for (let i = 0; i < cols; i++){
        const x = i * cell * sc;
        f[j * cols + i] = noise(x, y) * .62 + noise(x * 2.03 + 11.3, y * 2.03 + 7.1) * .26 + noise(x * 4.1 + 3.7, y * 4.1 + 19.2) * .12;
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    for (let k = 0; k <= 24; k++){
      const l = -0.66 + k * 0.055, major = k % 5 === 0;
      ctx.beginPath();
      for (let j = 0; j < rows - 1; j++){
        for (let i = 0; i < cols - 1; i++){
          const a = f[j * cols + i], b = f[j * cols + i + 1], c = f[(j + 1) * cols + i + 1], d = f[(j + 1) * cols + i];
          const code = (a > l ? 8 : 0) | (b > l ? 4 : 0) | (c > l ? 2 : 0) | (d > l ? 1 : 0);
          if (code === 0 || code === 15) continue;
          const x = i * cell, y = j * cell;
          const segs = SEG[code];
          for (let s = 0; s < segs.length; s++){
            for (let e = 0; e < 2; e++){
              const ed = segs[s][e]; let px, py;
              if (ed === 0){ px = x + cell * (l - a) / (b - a); py = y; }
              else if (ed === 1){ px = x + cell; py = y + cell * (l - b) / (c - b); }
              else if (ed === 2){ px = x + cell * (l - d) / (c - d); py = y + cell; }
              else { px = x; py = y + cell * (l - a) / (d - a); }
              if (e === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
          }
        }
      }
      ctx.strokeStyle = major ? 'rgba(75,83,32,.24)' : 'rgba(75,83,32,.11)';
      ctx.lineWidth = major ? 1.25 : .8;
      ctx.stroke();
    }
  }
  let queued = false;
  function onScroll(){
    if (queued) return; queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const y = window.scrollY;
      bd.style.setProperty('--dots', (-((y * 0.15) % 24)).toFixed(2) + 'px');
      bd.style.setProperty('--mesh', (Math.sin(y / 1500) * 70).toFixed(1) + 'px');
      if (motionOK()) draw();
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });
  let pq = false, mx = 0, my = 0;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !motionOK()) return;
    mx = e.clientX; my = e.clientY;
    if (pq) return; pq = true;
    requestAnimationFrame(() => { pq = false; bd.style.setProperty('--mx', mx + 'px'); bd.style.setProperty('--my', my + 'px'); });
  }, {passive:true});
  size(); onScroll();
})();

/* ================= 2. nav progress + active scene ================= */
(function nav(){
  const bar = $('nav-prog'), sc = $('nav-sc');
  const links = [...document.querySelectorAll('.nav-links a')];
  const order = ['top','story','conflict','rules','simulator','takes','logic'];
  const navMap = {top:null, story:'story', conflict:'conflict', rules:'rules', simulator:'simulator', takes:'simulator', logic:'logic'};
  let q = false;
  const upd = () => { q = false; const h = document.documentElement.scrollHeight - window.innerHeight; const p = h > 0 ? Math.min(1, window.scrollY / h) : 0; bar.style.transform = `scaleX(${p.toFixed(4)})`; };
  window.addEventListener('scroll', () => { if (!q){ q = true; requestAnimationFrame(upd); } }, {passive:true});
  upd();
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const id = e.target.id;
    links.forEach((a) => a.classList.toggle('active', a.dataset.nav === navMap[id]));
    sc.textContent = 'SC ' + String(order.indexOf(id) + 1).padStart(2, '0') + ' / 07';
  }), {rootMargin:'-45% 0px -50% 0px'});
  order.forEach((id) => { const s = $(id); if (s) io.observe(s); });
})();

/* ================= 3. reveal on scroll ================= */
(function reveal(){
  if (!('IntersectionObserver' in window) || !motionOK()) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  }), {rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
})();

/* ================= 4. hero: a buffer you can play with ================= */
(function hero(){
  const reel = $('reel'), el = $('hero-slots'); buildSlots(el, 5);
  const pBtn = $('hero-p'), cBtn = $('hero-c'), capEl = $('reel-cap');
  const tl = $('hero-tl').firstElementChild, tr = $('hero-tr').firstElementChild;
  const H = {buf:[1,2,null,null,null], inI:2, outI:0, next:3, count:2, lastUser:-1e9};
  for (let i = 0; i < 5; i++) paintSlot(el.children[i], H.buf[i], false);
  setStatus(capEl, 'ok', 'Try it: fill the buffer with the producer, or empty it with the consumer.');
  const fly = (p) => { if (motionOK()) restart(p, 'go'); };
  function add(user){
    if (H.count === 5){
      if (user){ restart(pBtn.querySelector('.badge'), 'shake'); restart(el, 'shake'); setStatus(capEl, 'wait', 'Every slot is full (empty = 0). The producer has to wait until the consumer takes an item.'); }
      return;
    }
    const i = H.inI, v = H.next; H.buf[i] = v; H.next = H.next >= 99 ? 1 : H.next + 1; H.inI = (i + 1) % 5; H.count++;
    fly(tl);
    setTimeout(() => paintSlot(el.children[i], H.buf[i] === v ? v : H.buf[i], true), motionOK() ? 420 : 0);
    if (user) setStatus(capEl, H.count === 5 ? 'wait' : 'busy', H.count === 5 ? `Item #${v} added. The buffer is now full, so the next produce will have to wait.` : `Producer added item #${v}. ${H.count} of 5 slots hold items.`);
  }
  function take(user){
    if (H.count === 0){
      if (user){ restart(cBtn.querySelector('.badge'), 'shake'); restart(el, 'shake'); setStatus(capEl, 'wait', 'Nothing to take (full = 0). The consumer has to wait until the producer adds an item.'); }
      return;
    }
    const i = H.outI, v = H.buf[i]; H.buf[i] = null; H.outI = (i + 1) % 5; H.count--;
    paintSlot(el.children[i], null, false); fly(tr);
    if (user) setStatus(capEl, H.count === 0 ? 'wait' : 'busy', H.count === 0 ? `Consumer took item #${v}. The buffer is empty now, so the next consume will have to wait.` : `Consumer took item #${v}. ${H.count} of 5 slots hold items.`);
  }
  pBtn.addEventListener('click', () => { H.lastUser = performance.now(); add(true); });
  cBtn.addEventListener('click', () => { H.lastUser = performance.now(); take(true); });
  setInterval(() => {
    if (document.hidden || !motionOK() || performance.now() - H.lastUser < 9000) return;
    const doAdd = H.count <= 1 ? true : H.count >= 4 ? false : Math.random() < 0.5;
    doAdd ? add(false) : take(false);
  }, 1800);
  reel.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !motionOK()) return;
    const r = reel.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    reel.style.setProperty('--rx', (-y * 5).toFixed(2) + 'deg');
    reel.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
  });
  reel.addEventListener('pointerleave', () => { reel.style.setProperty('--rx', '0deg'); reel.style.setProperty('--ry', '0deg'); });
})();

/* ================= 5. cast cards: tilt and flip ================= */
document.querySelectorAll('.cast-wrap').forEach((wrap) => {
  const tilt = wrap.querySelector('.tilt'), flip = wrap.querySelector('.flip');
  const faces = flip.querySelectorAll('.face');
  const set = (on) => {
    flip.classList.toggle('flipped', on);
    faces[0].inert = on; faces[1].inert = !on;
  };
  set(false);
  flip.addEventListener('click', () => set(!flip.classList.contains('flipped')));
  wrap.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !motionOK()) return;
    const r = wrap.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    tilt.style.transform = `rotateX(${(-y * 9).toFixed(2)}deg) rotateY(${(x * 11).toFixed(2)}deg)`;
  });
  wrap.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
});

/* ================= 6. conflict scenes ================= */
function setupMini(prefix, def){
  const el = {slots:$(prefix + '-slots'), status:$(prefix + '-status'), btn:$(prefix + '-play'), stage:$(prefix + '-stage'), p:$(prefix + '-p'), c:$(prefix + '-c')};
  buildSlots(el.slots, 5);
  let buf = def.start.slice(), timers = [];
  const api = {el, say:(k, t) => setStatus(el.status, k, t), set:(i, v, pop) => { buf[i] = v; paintSlot(el.slots.children[i], v, pop); }};
  const paintAll = () => { for (let i = 0; i < 5; i++) paintSlot(el.slots.children[i], buf[i], false); };
  paintAll(); api.say(def.restKind, def.restText);
  el.btn.addEventListener('click', () => {
    timers.forEach(clearTimeout); timers = [];
    buf = def.start.slice(); paintAll();
    el.btn.disabled = true;
    let end = 0;
    def.steps.forEach((s) => { end = Math.max(end, s.at); timers.push(setTimeout(() => s.run(api), s.at)); });
    timers.push(setTimeout(() => { el.btn.disabled = false; setText(el.btn.querySelector('span'), 'Replay scene'); }, end + 500));
  });
}
setupMini('sa', {
  start:[4,5,6,7,8], restKind:'wait', restText:'Producer: waiting for an empty slot.',
  steps:[
    {at:0,    run:(a) => a.say('busy', 'The producer finishes item #9 and calls wait(empty).')},
    {at:700,  run:(a) => { restart(a.el.p, 'shake'); restart(a.el.slots, 'shake'); a.say('wait', 'empty = 0, so the producer blocks. It waits for an empty slot.'); }},
    {at:2200, run:(a) => { flyToken(a.el.stage, a.el.slots.children[0], a.el.c, '#4', 650); a.set(0, null); a.say('busy', 'The consumer takes item #4 and calls signal(empty).'); }},
    {at:3200, run:(a) => flyToken(a.el.stage, a.el.p, a.el.slots.children[0], '#9', 600)},
    {at:3750, run:(a) => { a.set(0, 9, true); a.say('ok', 'The producer wakes up and adds item #9. The wait was normal, not an error.'); }}
  ]
});
setupMini('sb', {
  start:[null,null,null,null,null], restKind:'wait', restText:'Consumer: waiting for an item.',
  steps:[
    {at:0,    run:(a) => a.say('busy', 'The consumer calls wait(full).')},
    {at:700,  run:(a) => { restart(a.el.c, 'shake'); restart(a.el.slots, 'shake'); a.say('wait', 'full = 0, so the consumer blocks. It waits for an item.'); }},
    {at:2200, run:(a) => flyToken(a.el.stage, a.el.p, a.el.slots.children[0], '#1', 600)},
    {at:2750, run:(a) => { a.set(0, 1, true); a.say('busy', 'The producer adds item #1 and calls signal(full).'); }},
    {at:3700, run:(a) => { flyToken(a.el.stage, a.el.slots.children[0], a.el.c, '#1', 650); a.set(0, null); a.say('ok', 'The consumer wakes up and takes item #1. The wait was normal, not an error.'); }}
  ]
});

(function race(){
  const P_OFF = ['r1 = count', 'r1 = r1 + 1', 'count = r1'], C_OFF = ['r2 = count', 'r2 = r2 − 1', 'count = r2'];
  const P_ON = ['wait(mutex)'].concat(P_OFF, ['signal(mutex)']), C_ON = ['wait(mutex)'].concat(C_OFF, ['signal(mutex)']);
  const SCHED = {
    off:[['p',0],['c',0],['p',1],['c',1],['p',2],['c',2]],
    on:[['p',0],['p',1],['c',0],['p',2],['p',3],['p',4],['c',0],['c',1],['c',2],['c',3],['c',4]]
  };
  const ol = {p:$('race-p-list'), c:$('race-c-list')};
  const statusEl = $('race-status'), shared = $('race-shared'), countEl = $('race-count');
  const btns = {play:$('race-play'), step:$('race-step'), reset:$('race-reset'), off:$('race-off'), on:$('race-on')};
  let mode = 'off', st, timer = null;
  const nameOf = (w) => w === 'p' ? 'producer' : 'consumer';
  function build(){
    for (const w of ['p','c']){
      const rows = mode === 'off' ? (w === 'p' ? P_OFF : C_OFF) : (w === 'p' ? P_ON : C_ON);
      ol[w].innerHTML = '';
      rows.forEach((t) => { const li = document.createElement('li'); li.textContent = t; ol[w].append(li); });
    }
  }
  function paint(){
    setText(countEl, st.count);
    setText($('race-r1'), st.r.p === null ? '–' : st.r.p);
    setText($('race-r2'), st.r.c === null ? '–' : st.r.c);
    setText($('race-lock'), mode === 'off' ? 'mutex: not used' : st.lock ? `mutex: held by ${nameOf(st.lock)}` : 'mutex: unlocked');
  }
  function stop(){ if (timer){ clearInterval(timer); timer = null; } btns.play.disabled = false; }
  function reset(){
    stop();
    st = {i:0, count:3, r:{p:null, c:null}, lock:null, waiting:null};
    build(); paint(); shared.className = 'shared';
    setText(btns.play.querySelector('span'), 'Run the interleaving');
    btns.step.disabled = false;
    setStatus(statusEl, 'busy', mode === 'off'
      ? 'count = 3. The producer will add one and the consumer will remove one, so count should end at 3. Press Run.'
      : 'Same two updates, but each worker must hold mutex while it touches count. Press Run.');
  }
  function stepOnce(){
    const sched = SCHED[mode];
    if (st.i >= sched.length) return false;
    const [w, row] = sched[st.i++];
    const name = cap1(nameOf(w)), other = nameOf(w === 'p' ? 'c' : 'p'), reg = w === 'p' ? 'r1' : 'r2';
    [...ol.p.children, ...ol.c.children].forEach((li) => li.classList.remove('current'));
    const li = ol[w].children[row], text = li.textContent;
    let kind = 'busy', msg = '';
    if (text === 'wait(mutex)'){
      if (st.lock === null){ st.lock = w; li.classList.add('done'); msg = `${name} calls wait(mutex) and gets the lock.`; kind = 'critical'; }
      else if (st.lock === w){ li.classList.remove('waiting'); li.classList.add('done'); msg = `${name} wakes up holding the lock and continues.`; kind = 'critical'; }
      else { st.waiting = w; li.classList.add('waiting'); kind = 'lock'; msg = `${name} calls wait(mutex) and blocks: the ${other} is inside the critical section.`; }
    } else if (text === 'signal(mutex)'){
      if (st.waiting && st.waiting !== w){ st.lock = st.waiting; st.waiting = null; msg = `${name} calls signal(mutex). The lock passes to the waiting ${other}.`; }
      else { st.lock = null; msg = `${name} calls signal(mutex) and leaves the critical section.`; }
      li.classList.add('done');
    } else if (text.endsWith('= count')){
      st.r[w] = st.count; li.classList.add('done');
      msg = `${name} reads count: ${reg} = ${st.count}.`;
      if (mode === 'off' && w === 'c') msg += ' The producer has not written its result back yet.';
    } else if (text.includes('+ 1')){ st.r[w]++; li.classList.add('done'); msg = `${name} computes ${reg} = ${st.r[w]} in its own register.`; }
    else if (text.includes('− 1')){ st.r[w]--; li.classList.add('done'); msg = `${name} computes ${reg} = ${st.r[w]} in its own register.`; }
    else if (text.startsWith('count =')){ st.count = st.r[w]; li.classList.add('done'); restart(countEl, 'bump'); msg = `${name} writes count = ${st.count}.`; }
    li.classList.add('current');
    if (st.i >= sched.length){
      if (st.count === 3){ kind = 'ok'; msg += ' count is 3, exactly right. The lock kept the two updates apart.'; shared.className = 'shared good'; }
      else { kind = 'hazard'; msg += ` count is ${st.count}, but it should be 3. The producer’s update was overwritten and lost.`; shared.className = 'shared bad'; restart(shared, 'shake'); }
      stop(); btns.step.disabled = true;
      setText(btns.play.querySelector('span'), 'Run again');
    }
    paint(); setStatus(statusEl, kind, msg);
    return true;
  }
  btns.play.addEventListener('click', () => {
    if (st.i >= SCHED[mode].length) reset();
    btns.play.disabled = true;
    stepOnce();
    timer = setInterval(() => { if (!stepOnce()) stop(); }, 1000);
  });
  btns.step.addEventListener('click', () => { if (timer) stop(); stepOnce(); });
  btns.reset.addEventListener('click', reset);
  for (const m of ['off','on']){
    btns[m].addEventListener('click', () => {
      mode = m;
      btns.off.setAttribute('aria-pressed', String(m === 'off'));
      btns.on.setAttribute('aria-pressed', String(m === 'on'));
      reset();
    });
  }
  reset();
})();

/* ================= 7. rules playground ================= */
(function playground(){
  const st = {empty:5, full:0, mutex:1, q:[], next:1, cur:null, playing:false};
  const slots = $('pg-slots'); buildSlots(slots, 5);
  const vEl = {empty:$('pg-empty'), full:$('pg-full'), mutex:$('pg-mutex')};
  const cards = {empty:$('pgc-empty'), full:$('pgc-full'), mutex:$('pgc-mutex')};
  const msg = $('pg-msg');
  const lanes = {p:[...$('pg-lane-p').children], c:[...$('pg-lane-c').children]};
  const bP = $('pg-play-p'), bC = $('pg-play-c'), bR = $('pg-reset');
  let timer = null;
  function paint(changed){
    for (const k of ['empty','full','mutex']) setText(vEl[k], st[k]);
    setText($('pg-mutex-sub'), st.mutex ? 'unlocked' : 'locked');
    if (changed){ restart(vEl[changed], 'bump'); restart(cards[changed], 'glow'); }
    [...slots.children].forEach((k, i) => paintSlot(k, st.q[i], false));
  }
  const P_STEPS = [
    () => { st.cur = st.next++; return ['busy', `produce(item): item #${st.cur} is ready.`]; },
    () => { if (st.empty === 0){ st.next--; return ['block', 'wait(empty): empty = 0, so the producer stops here and waits. Play the consumer cycle to free a slot.']; }
            st.empty--; return ['busy', `wait(empty): empty ${st.empty + 1} → ${st.empty}. A slot is reserved.`, 'empty']; },
    () => { st.mutex = 0; return ['critical', 'wait(mutex): mutex 1 → 0. The producer is alone on the stage.', 'mutex']; },
    () => { st.q.push(st.cur); return ['critical', `Add item #${st.cur} to the buffer. ${st.q.length} of 5 slots hold items.`]; },
    () => { st.mutex = 1; return ['busy', 'signal(mutex): mutex 0 → 1. The stage is free again.', 'mutex']; },
    () => { st.full++; return ['ok', `signal(full): full ${st.full - 1} → ${st.full}. One more item is ready for the consumer.`, 'full']; }
  ];
  const C_STEPS = [
    () => { if (st.full === 0) return ['block', 'wait(full): full = 0, so the consumer stops here and waits. Play the producer cycle to add an item.'];
            st.full--; return ['busy', `wait(full): full ${st.full + 1} → ${st.full}. An item is reserved.`, 'full']; },
    () => { st.mutex = 0; return ['critical', 'wait(mutex): mutex 1 → 0. The consumer is alone on the stage.', 'mutex']; },
    () => { st.cur = st.q.shift(); return ['critical', `Remove item #${st.cur} from the buffer. ${st.q.length} of 5 slots hold items.`]; },
    () => { st.mutex = 1; return ['busy', 'signal(mutex): mutex 0 → 1. The stage is free again.', 'mutex']; },
    () => { st.empty++; return ['busy', `signal(empty): empty ${st.empty - 1} → ${st.empty}. One more slot is free for the producer.`, 'empty']; },
    () => ['ok', `consume(item): item #${st.cur} is processed outside the lock. Cycle complete.`]
  ];
  function clearChips(){ lanes.p.concat(lanes.c).forEach((c) => c.classList.remove('active', 'done', 'blocked')); }
  function play(which){
    if (st.playing) return;
    st.playing = true; bP.disabled = bC.disabled = true;
    clearChips();
    const chips = lanes[which], steps = which === 'p' ? P_STEPS : C_STEPS;
    let i = 0;
    const finish = () => { st.playing = false; bP.disabled = bC.disabled = false; timer = null; };
    const tick = () => {
      if (i > 0){ chips[i - 1].classList.remove('active'); chips[i - 1].classList.add('done'); }
      if (i >= steps.length){ finish(); return; }
      const [kind, text, changed] = steps[i]();
      if (kind === 'block'){ chips[i].classList.add('blocked'); restart(chips[i], 'shake'); setStatus(msg, 'wait', text); finish(); return; }
      chips[i].classList.add('active'); setStatus(msg, kind, text); paint(changed); i++;
      timer = setTimeout(tick, 850);
    };
    tick();
  }
  bP.addEventListener('click', () => play('p'));
  bC.addEventListener('click', () => play('c'));
  bR.addEventListener('click', () => {
    if (timer) clearTimeout(timer);
    st.empty = 5; st.full = 0; st.mutex = 1; st.q = []; st.next = 1; st.cur = null; st.playing = false;
    bP.disabled = bC.disabled = false; clearChips(); paint();
    setStatus(msg, 'ok', 'Values reset: empty = 5, full = 0, mutex = 1.');
  });
  paint();
  setStatus(msg, 'ok', 'Press Play cycle on the producer. Then try the consumer, or try the consumer first and see what happens.');
})();

/* ================= 8. simulator ================= */
const STEP = 300;
const BASE = {
  producer: [
    {op:'produce', code:'produce(item)'},
    {op:'wait', sem:'empty', code:'wait(empty)'},
    {op:'wait', sem:'mutex', code:'wait(mutex)'},
    {op:'put', code:'add item to buffer[in]'},
    {op:'signal', sem:'mutex', code:'signal(mutex)'},
    {op:'signal', sem:'full', code:'signal(full)'}
  ],
  consumer: [
    {op:'wait', sem:'full', code:'wait(full)'},
    {op:'wait', sem:'mutex', code:'wait(mutex)'},
    {op:'take', code:'remove item from buffer[out]'},
    {op:'signal', sem:'mutex', code:'signal(mutex)'},
    {op:'signal', sem:'empty', code:'signal(empty)'},
    {op:'consume', code:'consume(item)'}
  ]
};
const SPEEDS = [0.5, 1, 2, 4];
const cfg = {interval:{producer:1200, consumer:1800}, auto:false, paused:false, speed:1, blooper:false, take:null, cap:5};
const PROG = {};
function buildPrograms(){
  const p = BASE.producer.map((l) => Object.assign({}, l));
  if (cfg.blooper){ const a = p[1], b = p[2]; p[1] = Object.assign({}, b, {swapped:true}); p[2] = Object.assign({}, a, {swapped:true}); }
  PROG.producer = p;
  PROG.consumer = BASE.consumer.map((l) => Object.assign({}, l));
}

let S;
const mkWorker = (role) => ({role, pc:-1, nextAt:Infinity, lineStart:0, blocked:null, blockedSince:0, waited:0, item:null, queued:0});
function fresh(){
  const n = cfg.cap;
  return {
    t:0, cap:n, buffer:Array(n).fill(null), inIdx:0, outIdx:0, nextItem:1, consumed:0, deadlock:false, samples:[],
    sems:{empty:{value:n, waiters:[]}, full:{value:0, waiters:[]}, mutex:{value:1, holder:null, waiters:[]}},
    workers:{producer:mkWorker('producer'), consumer:mkWorker('consumer')}
  };
}
const occupied = () => S.buffer.filter((v) => v !== null).length;

/* log */
const logEl = $('log');
const ACTOR = {producer:'PROD', consumer:'CONS', scene:'SCENE'};
function fmtLog(ms){ const s = ms / 1000, m = Math.floor(s / 60), r = s - m * 60; return String(m).padStart(2, '0') + ':' + r.toFixed(1).padStart(4, '0'); }
function log(actor, msg, kind){
  const li = document.createElement('li');
  li.className = 'log-row' + (kind ? ' ' + kind : '');
  const t = document.createElement('span'); t.className = 'log-t'; t.textContent = fmtLog(S.t);
  const a = document.createElement('span'); a.className = 'log-a ' + actor; a.textContent = ACTOR[actor];
  const m = document.createElement('span'); m.className = 'log-m'; m.textContent = msg;
  li.append(t, a, m);
  logEl.prepend(li);
  while (logEl.children.length > 90) logEl.lastElementChild.remove();
}

/* visibility + effects */
let simVisible = false, takesVisible = false, logicVisible = false, fxEnabled = true;
const simEl = $('sim'), simSlots = $('sim-slots'), monSlots = $('m-slots'), ptrs = $('sim-ptrs');
const fxOn = () => fxEnabled && simVisible && motionOK();

/* interpreter */
function dur(line){
  if (line.op === 'produce') return cfg.interval.producer;
  if (line.op === 'consume') return cfg.interval.consumer;
  return STEP;
}
function enterLine(w, pc){
  w.pc = pc;
  const line = PROG[w.role][pc];
  if (line.op === 'produce') w.item = S.nextItem++;
  w.lineStart = S.t;
  w.nextAt = S.t + dur(line);
  if (line.op === 'put' && fxOn()) flyToken(simEl, W.producer.badge, simSlots.children[S.inIdx], '#' + w.item, STEP / cfg.speed);
}
function advance(w){ if (w.pc >= PROG[w.role].length - 1) finishCycle(w); else enterLine(w, w.pc + 1); }
function finishCycle(w){
  if (cfg.auto){ enterLine(w, 0); return; }
  if (w.queued > 0){ w.queued--; enterLine(w, 0); return; }
  w.pc = -1; w.nextAt = Infinity; w.lineStart = S.t;
}
const other = (role) => role === 'producer' ? 'consumer' : 'producer';
function signal(w, name){
  const s = S.sems[name];
  if (name === 'mutex') s.holder = null;
  if (s.waiters.length){
    const r = s.waiters.shift(), o = S.workers[r];
    o.waited += S.t - o.blockedSince; o.blocked = null;
    if (name === 'mutex'){ s.holder = r; log(w.role, `signal(mutex) → lock passes straight to the waiting ${r}`); }
    else log(w.role, `signal(${name}) → wakes the ${r}, ${name === 'full' ? 'item' : 'slot'} handed over`);
    advance(o);
  } else {
    s.value++;
    log(w.role, name === 'mutex' ? 'signal(mutex) → unlocked' : `signal(${name}) → ${name} = ${s.value}`);
  }
}
function checkDeadlock(){
  const P = S.workers.producer, C = S.workers.consumer;
  if (P.blocked && C.blocked && !S.deadlock){
    S.deadlock = true;
    const h = S.sems.mutex.holder;
    log('scene', h ? `Cut. Deadlock: the ${h} holds the lock while blocked on ${S.workers[h].blocked}, and the ${other(h)} is blocked on mutex.` : 'Cut. Deadlock: both workers are blocked.', 'stuck');
    if (simVisible) restart(simEl.querySelector('.stage'), 'shake');
  }
}
function sample(force){
  const last = S.samples[S.samples.length - 1];
  if (!force && last && S.t - last.t < 100) return;
  const P = S.workers.producer, C = S.workers.consumer;
  S.samples.push({t:S.t, occ:occupied(), pb:!!P.blocked, cb:!!C.blocked, dl:S.deadlock});
  while (S.samples.length > 2 && S.samples[1].t < S.t - 46000) S.samples.shift();
}
function exec(w){
  const line = PROG[w.role][w.pc];
  switch (line.op){
    case 'produce':
      log(w.role, `produce(item) → item #${w.item} created`);
      advance(w); break;
    case 'consume':
      log(w.role, `consume(item) → item #${w.item} processed`);
      S.consumed++; w.item = null; advance(w); break;
    case 'wait': {
      const s = S.sems[line.sem];
      if (s.value > 0){
        s.value--;
        if (line.sem === 'mutex'){ s.holder = w.role; log(w.role, 'wait(mutex) → lock acquired'); }
        else log(w.role, `wait(${line.sem}) → reserved ${line.sem === 'empty' ? 'a slot' : 'an item'}, ${line.sem} = ${s.value}`);
        advance(w);
      } else {
        w.blocked = line.sem; w.blockedSince = S.t; w.nextAt = Infinity;
        if (!s.waiters.includes(w.role)) s.waiters.push(w.role);
        const why = line.sem === 'empty' ? 'no free slot (empty = 0)' : line.sem === 'full' ? 'nothing to take (full = 0)' : `the ${s.holder} holds the lock`;
        log(w.role, `wait(${line.sem}) blocks · ${why}`, 'wait');
        checkDeadlock();
      }
      break;
    }
    case 'put': {
      const i = S.inIdx;
      S.buffer[i] = w.item; S.inIdx = (i + 1) % S.cap;
      log(w.role, `item #${w.item} → buffer[${i}], in = ${S.inIdx}`);
      w.item = null; advance(w); break;
    }
    case 'take': {
      const i = S.outIdx;
      w.item = S.buffer[i]; S.buffer[i] = null; S.outIdx = (i + 1) % S.cap;
      log(w.role, `buffer[${i}] → item #${w.item}, out = ${S.outIdx}`);
      if (fxOn()) flyToken(simEl, simSlots.children[i], W.consumer.badge, '#' + w.item, Math.min(700, STEP * 1.4 / cfg.speed));
      advance(w); break;
    }
    case 'signal':
      signal(w, line.sem); advance(w); break;
  }
  sample(true);
}

/* scheduler */
function earliest(){
  const P = S.workers.producer, C = S.workers.consumer;
  const w = P.nextAt <= C.nextAt ? P : C;
  return isFinite(w.nextAt) ? w : null;
}
function runUntil(target){
  let w, guard = 0;
  while ((w = earliest()) && w.nextAt <= target && guard++ < 400){ S.t = w.nextAt; exec(w); }
  if (target > S.t) S.t = target;
}
function step(){
  cfg.paused = true;
  const w = earliest();
  if (!w){
    log('scene', S.deadlock ? 'Nothing to step: the workers are deadlocked. Reset or roll another take.' : 'Nothing to step: both workers are idle or waiting. Press Produce or Consume.');
    return;
  }
  S.t = w.nextAt; exec(w);
}
function request(role){
  if (cfg.auto || S.deadlock) return;
  const w = S.workers[role];
  if (w.pc === -1){
    enterLine(w, 0);
    log(role, role === 'producer' ? `request received · creating item #${w.item}` : 'request received · looking for an item');
  } else {
    w.queued++;
    log(role, `request queued · ${w.queued} more after this cycle`);
  }
}
function setAuto(on, note){
  cfg.auto = on;
  for (const r of ['producer','consumer']){
    const w = S.workers[r]; w.queued = 0;
    if (on && w.pc === -1 && !S.deadlock) enterLine(w, 0);
  }
  if (on){ cfg.paused = false; log('scene', note || 'Auto Run on · both workers repeat their cycle'); }
  else log('scene', 'Auto Run off · each worker finishes its current cycle, then waits for a request');
}
function resetState(){
  S = fresh();
  cfg.auto = false; cfg.paused = false;
  logEl.innerHTML = '';
  noteState.text = ''; noteState.at = 0;
  sample(true);
}
function preload(n){
  for (let i = 0; i < n; i++) S.buffer[i] = S.nextItem++;
  S.inIdx = n % S.cap; S.sems.empty.value = S.cap - n; S.sems.full.value = n;
  log('scene', `Take setup · ${n} items already on the stage, empty = ${S.cap - n}, full = ${n}`);
  sample(true);
}

/* takes */
const TAKES = {
  pfast:  {name:'Producer runs faster', p:400,  c:3600, preload:2, blooper:false},
  cfast:  {name:'Consumer runs faster', p:3600, c:400,  preload:3, blooper:false},
  even:   {name:'Similar speeds',       p:1500, c:1500, preload:2, blooper:false},
  blooper:{name:'Blooper: producer locks first', p:400, c:3600, preload:3, blooper:true}
};
function rollTake(id){
  const T = TAKES[id];
  cfg.interval.producer = T.p; cfg.interval.consumer = T.c; syncSliders();
  if (cfg.blooper !== T.blooper){ cfg.blooper = T.blooper; buildPrograms(); buildCode(); }
  if (cfg.cap !== 5){ cfg.cap = 5; resetState(); buildBufferDom(); } else resetState();
  cfg.take = id;
  log('scene', `Take: ${T.name} · producer ${(T.p / 1000).toFixed(1)} s, consumer ${(T.c / 1000).toFixed(1)} s`);
  preload(T.preload);
  setAuto(true);
}

/* worker cards */
const W = {};
function buildWorker(role){
  const el = $('w-' + role), isP = role === 'producer';
  el.innerHTML =
    `<header class="w-head"><span class="badge ${isP ? 'p' : 'c'}" aria-hidden="true">${isP ? 'P' : 'C'}</span>` +
    `<div><h3>${isP ? 'Producer' : 'Consumer'}</h3><p class="w-film">${isP ? 'The maker' : 'The receiver'}</p></div></header>` +
    `<p class="pill" data-kind="ready"><span class="pill-ico">${ICON.ready}</span><span class="pill-text">Ready</span></p>` +
    `<div class="bar" aria-hidden="true"><span></span></div>` +
    `<dl class="w-meta"><div><dt>Holding</dt><dd class="m-item">Nothing</dd></div><div><dt>Lock</dt><dd class="m-lock">Not held</dd></div><div><dt>Queued</dt><dd class="m-queue">0</dd></div></dl>` +
    `<ol class="code" aria-label="${cap1(role)} program"></ol>`;
  W[role] = {
    badge:el.querySelector('.badge'), pill:el.querySelector('.pill'), ico:el.querySelector('.pill-ico'), text:el.querySelector('.pill-text'),
    bar:el.querySelector('.bar'), barIn:el.querySelector('.bar span'),
    item:el.querySelector('.m-item'), lock:el.querySelector('.m-lock'), queue:el.querySelector('.m-queue'),
    code:el.querySelector('.code'), key:null
  };
}
function buildCode(){
  for (const role of ['producer','consumer']){
    const prog = PROG[role], ol = W[role].code;
    const lockAt = prog.findIndex((l) => l.op === 'wait' && l.sem === 'mutex');
    const unlockAt = prog.findIndex((l) => l.op === 'signal' && l.sem === 'mutex');
    ol.innerHTML = '';
    prog.forEach((l, i) => {
      const li = document.createElement('li');
      if (i > lockAt && i <= unlockAt) li.classList.add('held');
      const n = document.createElement('span'); n.className = 'ln'; n.dataset.n = i + 1;
      const c = document.createElement('span'); c.textContent = l.code;
      li.append(n, c);
      if (l.swapped){ const t = document.createElement('span'); t.className = 'tag'; t.textContent = 'swapped'; li.append(t); }
      else li.append(document.createElement('span'));
      ol.append(li);
    });
    W[role].key = null;
  }
}
function statusOf(role){
  const w = S.workers[role];
  if (w.pc === -1) return {kind:'ready', text:'Ready'};
  const line = PROG[role][w.pc];
  if (w.blocked){
    if (w.blocked === 'mutex') return {kind:S.deadlock ? 'stuck' : 'lockwait', text:'Waiting for lock'};
    return {kind:S.deadlock ? 'stuck' : 'wait', text:w.blocked === 'empty' ? 'Waiting for space' : 'Waiting for item'};
  }
  switch (line.op){
    case 'produce': return {kind:'busy', text:`Creating item #${w.item}`};
    case 'consume': return {kind:'busy', text:`Processing item #${w.item}`};
    case 'wait':    return {kind:'busy', text:line.sem === 'mutex' ? 'Requesting lock' : line.sem === 'empty' ? 'Checking for space' : 'Checking for an item'};
    case 'put':     return {kind:'critical', text:`Adding item #${w.item}`};
    case 'take':    return {kind:'critical', text:'Removing item'};
    case 'signal':
      if (line.sem === 'mutex') return {kind:'critical', text:'Releasing lock'};
      return {kind:'busy', text:line.sem === 'full' ? 'Signalling item available' : 'Signalling space available'};
  }
  return {kind:'ready', text:'Ready'};
}
function paintPill(pill, ico, textEl, st){
  if (pill.dataset.kind !== st.kind || !ico.firstChild){ pill.dataset.kind = st.kind; ico.innerHTML = ICON[st.kind]; }
  setText(textEl, st.text);
}

/* director's note */
const PRIO = {ok:0, critical:1, lock:2, wait:3, stuck:4};
const noteState = {text:'', kind:'ok', at:0};
function explain(){
  const P = S.workers.producer, C = S.workers.consumer, m = S.sems.mutex, N = S.cap, occ = occupied();
  const tail = cfg.paused ? ' Paused: press Step to run the next event, or Resume.' : '';
  if (S.deadlock){
    if (m.holder === 'producer') return {kind:'stuck', text:'Deadlock. The producer holds the lock while it waits for a free slot. The consumer needs that lock to remove an item and free a slot, so neither worker can move. Restore the correct order: check for space first, then lock.'};
    if (m.holder === 'consumer') return {kind:'stuck', text:'Deadlock. The consumer holds the lock while it waits for an item. The producer needs that lock to add one, so neither worker can move.'};
    return {kind:'stuck', text:'Deadlock. Both workers are blocked and neither can signal the other.'};
  }
  if (P.blocked === 'empty'){
    if (m.holder === 'producer') return {kind:'lock', text:'The producer is waiting for space while still holding the lock. As soon as the consumer asks for the lock, neither worker will be able to move.' + tail};
    const hint = (C.pc === -1 && !cfg.auto) ? 'Press Consume: removing one item makes space available again.' : 'Removing one item makes space available again.';
    return {kind:'wait', text:`The producer is waiting because every slot is occupied (empty = 0). ${hint}` + tail};
  }
  if (C.blocked === 'full'){
    const hint = (P.pc === -1 && !cfg.auto) ? 'Press Produce: adding one item wakes it up.' : 'The next item the producer adds will wake it up.';
    return {kind:'wait', text:`The consumer is waiting because there is nothing to take (full = 0). ${hint}` + tail};
  }
  const lw = P.blocked === 'mutex' ? P : (C.blocked === 'mutex' ? C : null);
  if (lw) return {kind:'lock', text:`The ${lw.role} is waiting for the lock, not for ${lw.role === 'producer' ? 'space' : 'an item'}. The ${m.holder} is inside the critical section and hands the lock over at signal(mutex).` + tail};
  if (m.holder){
    const h = S.workers[m.holder], line = PROG[h.role][h.pc];
    if (line.op === 'wait' && line.sem !== 'mutex')
      return {kind:'lock', text:`The ${h.role} took the lock before checking for space. If the buffer is full, it will wait while still holding the lock.` + tail};
  }
  if (m.holder && (!cfg.auto || cfg.paused)){
    const h = S.workers[m.holder], line = PROG[h.role][h.pc];
    let act = 'finishes its update';
    if (line.op === 'put') act = `writes item #${h.item} into slot ${S.inIdx}`;
    else if (line.op === 'take') act = `takes the item in slot ${S.outIdx}`;
    else if (line.op === 'signal') act = 'releases it';
    return {kind:'critical', text:`The ${h.role} holds the lock while it ${act}. Nobody else can touch the buffer until signal(mutex).` + tail};
  }
  if (P.pc === -1 && C.pc === -1){
    return {kind:'ok', text:(occ === 0
      ? 'The stage is empty and both workers are idle. Press Produce to make the first item, or start Auto Run.'
      : `${occ} of ${N} slots hold items and both workers are idle. Press Produce or Consume to request one operation, or start Auto Run.`) + tail};
  }
  return {kind:'ok', text:`Items are flowing: ${occ} of ${N} slots occupied. Neither worker has to wait right now.` + tail};
}
function updateNote(now){
  const c = explain();
  if (c.text === noteState.text) return;
  const hold = cfg.paused ? 0 : 1400;
  if (!noteState.text || PRIO[c.kind] > PRIO[noteState.kind] || now - noteState.at >= hold){
    noteState.text = c.text; noteState.kind = c.kind; noteState.at = now;
  }
}

/* buffer DOM (depends on capacity) */
const simCache = {vals:[], init:false}, monCache = {vals:[], init:false};
let ptrKey = '';
function buildPips(el, n){ el.innerHTML = ''; for (let i = 0; i < n; i++){ const p = document.createElement('span'); p.className = 'pip'; el.append(p); } }
function buildBufferDom(){
  const n = cfg.cap;
  buildSlots(simSlots, n); buildSlots(monSlots, n);
  ptrs.style.setProperty('--n', n);
  buildPips($('p-empty'), n); buildPips($('p-full'), n);
  simCache.vals = []; simCache.init = false; monCache.vals = []; monCache.init = false; ptrKey = '';
  setText($('cap-label'), `Capacity ${n}`); setText($('cap-n'), n);
  document.querySelectorAll('#cap-seg button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.cap === n)));
}
function renderSlots(el, cache){
  const kids = el.children;
  for (let i = 0; i < S.cap; i++){
    const v = S.buffer[i], k = kids[i];
    if (!k) continue;
    if (cache.vals[i] !== v){
      paintSlot(k, v, cache.init);
      k.title = v !== null ? `Slot ${i}: item #${v}` : `Slot ${i}: empty`;
      cache.vals[i] = v;
    }
  }
  cache.init = true;
}
function renderPips(el, n){ const kids = el.children; for (let i = 0; i < kids.length; i++) kids[i].classList.toggle('on', i < n); }
function fmtTC(ms){
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600), m = Math.floor(total / 60) % 60, s = total % 60, f = Math.floor((ms % 1000) / 1000 * 24);
  return [h, m, s, f].map((x) => String(x).padStart(2, '0')).join(':');
}

/* occupancy chart */
function drawChart(cv, compact){
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const padL = compact ? 8 : 30, padR = 10, padT = 10, padB = compact ? 8 : 22;
  const PW = w - padL - padR, PH = h - padT - padB, win = 45000, t1 = S.t, t0 = t1 - win, N = S.cap;
  const X = (t) => padL + (t - t0) / win * PW;
  const Y = (v) => padT + PH - v / N * PH;
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.lineWidth = 1;
  for (let v = 0; v <= N; v++){
    ctx.strokeStyle = v === 0 || v === N ? 'rgba(75,83,32,.22)' : 'rgba(75,83,32,.08)';
    ctx.beginPath(); ctx.moveTo(padL, Math.round(Y(v)) + .5); ctx.lineTo(padL + PW, Math.round(Y(v)) + .5); ctx.stroke();
  }
  if (!compact){
    ctx.fillStyle = '#687160'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('0', padL - 8, Y(0)); ctx.fillText(String(N), padL - 8, Y(N));
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    [[-45, '−45 s'], [-30, '−30 s'], [-15, '−15 s'], [0, 'now']].forEach(([s, lbl]) => {
      const x = X(t1 + s * 1000);
      ctx.textAlign = s === 0 ? 'right' : s === -45 ? 'left' : 'center';
      ctx.fillText(lbl, x, padT + PH + 6);
    });
  }
  const sm = S.samples;
  if (!sm.length) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(padL, padT, PW, PH); ctx.clip();
  for (let i = 0; i < sm.length; i++){
    const s = sm[i], tEnd = i + 1 < sm.length ? sm[i + 1].t : t1;
    if (tEnd < t0) continue;
    let fill = null;
    if (s.dl) fill = 'rgba(142,59,43,.20)';
    else if (s.pb) fill = 'rgba(160,107,34,.22)';
    else if (s.cb) fill = 'rgba(120,145,85,.24)';
    if (fill){ ctx.fillStyle = fill; ctx.fillRect(X(s.t), padT, Math.max(1, X(tEnd) - X(s.t)), PH); }
  }
  ctx.beginPath();
  ctx.moveTo(X(sm[0].t), Y(sm[0].occ));
  for (let i = 1; i < sm.length; i++){ ctx.lineTo(X(sm[i].t), Y(sm[i - 1].occ)); ctx.lineTo(X(sm[i].t), Y(sm[i].occ)); }
  ctx.lineTo(X(t1), Y(sm[sm.length - 1].occ));
  ctx.strokeStyle = '#4b5320'; ctx.lineWidth = compact ? 1.6 : 2; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.lineTo(X(t1), Y(0)); ctx.lineTo(X(sm[0].t), Y(0)); ctx.closePath();
  ctx.fillStyle = 'rgba(75,83,32,.10)'; ctx.fill();
  const ly = Y(sm[sm.length - 1].occ);
  ctx.fillStyle = '#4b5320'; ctx.beginPath(); ctx.arc(X(t1) - 3, ly, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* live pseudocode */
const liveRows = {
  producer:[...document.querySelectorAll('.pcode[data-role="producer"] .row')],
  consumer:[...document.querySelectorAll('.pcode[data-role="consumer"] .row')]
};

/* render */
const btn = {produce:$('btn-produce'), consume:$('btn-consume'), auto:$('btn-auto'), pause:$('btn-pause'), step:$('btn-step'), reset:$('btn-reset'), mpause:$('m-pause')};
const takeBtns = [...document.querySelectorAll('.take')];
const speedBtns = [...document.querySelectorAll('#speed-seg button')];
function render(now){
  const P = S.workers.producer, C = S.workers.consumer, sm = S.sems;
  renderSlots(simSlots, simCache);
  renderSlots(monSlots, monCache);
  const inc = (P.pc >= 0 && PROG.producer[P.pc].op === 'put') ? S.inIdx : -1;
  const out = (C.pc >= 0 && PROG.consumer[C.pc].op === 'take') ? S.outIdx : -1;
  for (let i = 0; i < simSlots.children.length; i++){
    const k = simSlots.children[i];
    k.classList.toggle('incoming', i === inc);
    k.classList.toggle('outgoing', i === out);
  }
  const pk = S.cap + ':' + S.inIdx + ',' + S.outIdx;
  if (pk !== ptrKey){
    ptrKey = pk; ptrs.innerHTML = '';
    for (let i = 0; i < S.cap; i++){
      const s = document.createElement('span'), lbl = [];
      if (i === S.inIdx) lbl.push('in');
      if (i === S.outIdx) lbl.push('out');
      s.textContent = lbl.length ? '▲ ' + lbl.join('·') : '';
      ptrs.append(s);
    }
  }
  setText($('occ'), `${occupied()}/${S.cap}`);

  setText($('v-empty'), sm.empty.value); renderPips($('p-empty'), sm.empty.value);
  setText($('v-full'), sm.full.value); renderPips($('p-full'), sm.full.value);
  setText($('v-mutex'), sm.mutex.value);
  const lm = $('l-mutex'), lockTxt = sm.mutex.holder ? `Locked by ${sm.mutex.holder}` : 'Unlocked';
  if (lm.dataset.t !== lockTxt){ lm.dataset.t = lockTxt; lm.innerHTML = (sm.mutex.holder ? LOCK_CLOSED : LOCK_OPEN) + '<span></span>'; lm.lastChild.textContent = lockTxt; }
  $('sem-mutex').classList.toggle('locked', !!sm.mutex.holder);
  for (const name of ['empty','full','mutex']){
    const q = $('q-' + name), ws = sm[name].waiters;
    q.hidden = ws.length === 0;
    if (ws.length) setText(q, `${cap1(ws[0])} waiting`);
  }

  for (const role of ['producer','consumer']){
    const w = S.workers[role], el = W[role], st = statusOf(role);
    paintPill(el.pill, el.ico, el.text, st);
    let pct = 0;
    if (w.pc !== -1 && !w.blocked && isFinite(w.nextAt) && w.nextAt > w.lineStart) pct = Math.min(1, Math.max(0, (S.t - w.lineStart) / (w.nextAt - w.lineStart)));
    el.barIn.style.width = w.blocked ? '100%' : (pct * 100).toFixed(1) + '%';
    el.bar.classList.toggle('blocked', !!w.blocked);
    setText(el.item, w.item ? `Item #${w.item}` : 'Nothing');
    setText(el.lock, sm.mutex.holder === role ? 'Held' : 'Not held');
    setText(el.queue, cfg.auto ? 'Auto' : w.queued);
    const key = w.pc + '|' + (w.blocked || '');
    if (el.key !== key){
      el.key = key;
      [...el.code.children].forEach((li, i) => { li.classList.toggle('current', i === w.pc); li.classList.toggle('blocked', i === w.pc && !!w.blocked); });
    }
  }

  const mode = cfg.paused ? 'paused' : (cfg.auto ? 'auto' : 'manual'), modeEl = $('mode');
  if (modeEl.dataset.mode !== mode){ modeEl.dataset.mode = mode; setText($('mode-text'), mode === 'paused' ? 'Paused' : mode === 'auto' ? 'Rolling · Auto run' : 'Manual'); }
  const tc = fmtTC(S.t); setText($('tc'), tc); setText($('m-tc'), tc);
  btn.auto.setAttribute('aria-pressed', String(cfg.auto));
  for (const b of [btn.pause, btn.mpause]){ b.setAttribute('aria-pressed', String(cfg.paused)); setText(b, cfg.paused ? 'Resume' : 'Pause'); }
  btn.produce.disabled = cfg.auto || S.deadlock;
  btn.consume.disabled = cfg.auto || S.deadlock;
  $('blooper-banner').hidden = !cfg.blooper;
  takeBtns.forEach((b) => b.setAttribute('aria-pressed', String(cfg.take === b.dataset.take)));
  speedBtns.forEach((b) => b.setAttribute('aria-pressed', String(parseFloat(b.dataset.speed) === cfg.speed)));

  updateNote(now);
  for (const [box, txt] of [[$('note'), $('note-text')], [$('m-note'), $('m-note-text')]]){
    if (box.dataset.kind !== noteState.kind) box.dataset.kind = noteState.kind;
    setText(txt, noteState.text);
  }

  const mp = $('m-p'), mc = $('m-c');
  const stP = statusOf('producer'), stC = statusOf('consumer');
  paintPill(mp, mp.querySelector('.pill-ico'), mp.querySelector('.pill-text'), stP);
  paintPill(mc, mc.querySelector('.pill-ico'), mc.querySelector('.pill-text'), stC);
  setText($('m-empty'), sm.empty.value);
  setText($('m-full'), sm.full.value);
  setText($('m-mutex'), sm.mutex.holder ? (sm.mutex.holder === 'producer' ? '0 · P' : '0 · C') : '1');
  const waited = (w) => ((w.waited + (w.blocked ? S.t - w.blockedSince : 0)) / 1000).toFixed(1) + ' s';
  setText($('m-pw'), waited(P)); setText($('m-cw'), waited(C)); setText($('m-done'), S.consumed);
  const mt = $('m-take');
  const takeTxt = cfg.take ? `Rolling: ${TAKES[cfg.take].name}${S.deadlock ? ' · cut' : ''}` : 'No take rolling. Mirroring the simulator above.';
  if (mt.dataset.t !== takeTxt){
    mt.dataset.t = takeTxt;
    if (cfg.take){ mt.innerHTML = 'Rolling: <b></b>'; mt.lastChild.textContent = TAKES[cfg.take].name + (S.deadlock ? ' · cut' : ''); }
    else mt.textContent = takeTxt;
  }
  $('m-rec').classList.toggle('live', !cfg.paused && (cfg.auto || !!earliest()) && !S.deadlock);

  if (simVisible) drawChart($('chart'), false);
  if (takesVisible) drawChart($('m-chart'), true);

  if (logicVisible){
    for (const role of ['producer','consumer']){
      const w = S.workers[role], line = w.pc >= 0 ? PROG[role][w.pc] : null;
      const key = line ? line.op + (line.sem ? ':' + line.sem : '') : '';
      liveRows[role].forEach((r) => { const on = r.dataset.key === key; r.classList.toggle('live', on && !w.blocked); r.classList.toggle('blocked', on && !!w.blocked); });
    }
    setText($('live-text'), `Live from the simulator · Producer: ${stP.text} · Consumer: ${stC.text}`);
  }
}

/* controls */
let userTouched = false, autoStarted = false;
function syncSliders(){
  for (const role of ['producer','consumer']){
    const v = (cfg.interval[role] / 1000).toFixed(1);
    $('r-' + role).value = v; $('o-' + role).textContent = v + ' s';
  }
}
for (const role of ['producer','consumer']){
  $('r-' + role).addEventListener('input', (e) => {
    cfg.interval[role] = Math.round(parseFloat(e.target.value) * 1000);
    $('o-' + role).textContent = parseFloat(e.target.value).toFixed(1) + ' s';
    cfg.take = null;
  });
}
const togglePause = () => { cfg.paused = !cfg.paused; noteState.at = 0; };
const doReset = () => { resetState(); cfg.take = null; log('scene', `Reset · buffer empty, empty = ${S.cap}, full = 0, mutex = 1`); };
const shiftSpeed = (d) => { const i = SPEEDS.indexOf(cfg.speed); cfg.speed = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, i + d))]; };
btn.produce.addEventListener('click', () => request('producer'));
btn.consume.addEventListener('click', () => request('consumer'));
btn.auto.addEventListener('click', () => setAuto(!cfg.auto));
btn.pause.addEventListener('click', togglePause);
btn.mpause.addEventListener('click', togglePause);
btn.step.addEventListener('click', () => { step(); noteState.at = 0; });
btn.reset.addEventListener('click', doReset);
$('restore-order').addEventListener('click', () => {
  cfg.blooper = false; buildPrograms(); buildCode();
  resetState(); cfg.take = null;
  log('scene', 'Correct order restored · wait for availability first, then lock');
});
speedBtns.forEach((b) => b.addEventListener('click', () => { cfg.speed = parseFloat(b.dataset.speed); }));
document.querySelectorAll('#cap-seg button').forEach((b) => b.addEventListener('click', () => {
  const n = +b.dataset.cap; if (n === cfg.cap) return;
  cfg.cap = n; cfg.take = null; resetState(); buildBufferDom();
  log('scene', `Stage rebuilt with ${n} slots · empty = ${n}, full = 0, mutex = 1`);
}));
takeBtns.forEach((b) => b.addEventListener('click', () => rollTake(b.dataset.take)));
for (const zone of [simEl, $('takes')]){
  zone.addEventListener('click', () => { userTouched = true; render(performance.now()); });
}

/* keyboard shortcuts (only while the simulator or monitor is on screen) */
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (!simVisible && !takesVisible) return;
  const k = e.key.toLowerCase();
  const map = {p:() => request('producer'), c:() => request('consumer'), a:() => setAuto(!cfg.auto), k:togglePause, s:() => { step(); noteState.at = 0; }, r:doReset, j:() => shiftSpeed(-1), l:() => shiftSpeed(1)};
  if (!map[k]) return;
  e.preventDefault(); userTouched = true; map[k]();
  const kb = document.querySelector(`kbd[data-k="${k}"]`);
  if (kb){ kb.classList.add('hit'); setTimeout(() => kb.classList.remove('hit'), 220); }
  render(performance.now());
});

/* visibility + autostart */
if ('IntersectionObserver' in window){
  new IntersectionObserver((es) => es.forEach((e) => {
    simVisible = e.isIntersecting;
    if (e.isIntersecting && e.intersectionRatio >= .25 && !autoStarted && !userTouched && !cfg.auto && !S.deadlock){
      autoStarted = true;
      setAuto(true, 'Camera rolling · Auto Run started when the simulator came into view. Press Pause or K to stop.');
    }
  }), {threshold:[0, .25]}).observe(simEl);
  new IntersectionObserver((es) => es.forEach((e) => { takesVisible = e.isIntersecting; }), {threshold:0}).observe($('takes'));
  new IntersectionObserver((es) => es.forEach((e) => { logicVisible = e.isIntersecting; }), {threshold:0}).observe($('logic'));
} else { simVisible = takesVisible = logicVisible = true; }

/* boot */
buildPrograms();
buildWorker('producer'); buildWorker('consumer');
buildCode();
S = fresh();
buildBufferDom();
syncSliders();
(function seed(){
  fxEnabled = false;
  log('scene', `Scene set · empty = ${S.cap}, full = 0, mutex = 1`);
  sample(true);
  const P = S.workers.producer;
  enterLine(P, 0); P.queued = 1;
  let w, g = 0;
  while ((w = earliest()) && g++ < 100){ S.t = w.nextAt; exec(w); }
  log('scene', 'Two items are on the stage. Your turn: Produce, Consume or Auto Run.');
  fxEnabled = true;
})();

let last = performance.now();
function frame(now){
  const dt = Math.min(now - last, 250); last = now;
  if (!cfg.paused){ runUntil(S.t + dt * cfg.speed); sample(false); }
  render(now);
  requestAnimationFrame(frame);
}
render(performance.now());
requestAnimationFrame(frame);

})();
