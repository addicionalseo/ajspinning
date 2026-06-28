/* ═══════════════════════════════════════════════════════════════
   AJSpinning — Games Engine v3  (senior rewrite 2026-06-28)
   Game 1 · Pescador Libre     — top-down + timing catch bar
   Game 2 · Toque de Picada   — click-the-fish, 3 lanes, combos
   Game 3 · ¿Qué especie?     — silhouette reveal photo quiz
   Game 4 · Lance Perfecto    — two-phase angle→power + trajectory
   ═══════════════════════════════════════════════════════════════ */
(function (WIN) {
  'use strict';
  if (!WIN.requestAnimationFrame) return;
  var raf = WIN.requestAnimationFrame.bind(WIN);

  /* ── UTILS ──────────────────────────────────────────────────── */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lsGet(k, def) {
    try { var v = localStorage.getItem(k); return v !== null ? +v : def; } catch(e) { return def; }
  }
  function lsSet(k, v) { try { localStorage.setItem(k, '' + v); } catch(e) {} }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ── CANVAS ROUNDRECT POLYFILL ──────────────────────────────── */
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      this.beginPath();
      this.moveTo(x + r, y); this.lineTo(x + w - r, y);
      this.arcTo(x + w, y, x + w, y + r, r); this.lineTo(x + w, y + h - r);
      this.arcTo(x + w, y + h, x + w - r, y + h, r); this.lineTo(x + r, y + h);
      this.arcTo(x, y + h, x, y + h - r, r); this.lineTo(x, y + r);
      this.arcTo(x, y, x + r, y, r); this.closePath();
    };
  }

  /* ── PALETTE ────────────────────────────────────────────────── */
  var C = {
    bg: '#04101e', surf: '#081828', water: '#062840', waterD: '#041520',
    blue: '#4ab8f7', blueD: '#2a9ee4', green: '#22c55e',
    orange: '#f97316', yellow: '#fbbf24', red: '#f87171',
    text: '#cce4f8', text2: '#8ab8d6', muted: '#547a99', border: '#1a3555'
  };

  /* ── WEB AUDIO ENGINE ───────────────────────────────────────── */
  var SFX = (function () {
    var ac = null;
    function getCtx() {
      if (!ac) { try { ac = new (WIN.AudioContext || WIN.webkitAudioContext)(); } catch (e) {} }
      if (ac && ac.state === 'suspended') { try { ac.resume(); } catch (e) {} }
      return ac;
    }
    function tone(f, dur, type, vol) {
      var c = getCtx(); if (!c) return;
      var o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(vol || 0.2, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.start(); o.stop(c.currentTime + dur);
    }
    function sweep(f1, f2, dur, type, vol) {
      var c = getCtx(); if (!c) return;
      var o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination); o.type = type || 'sine';
      o.frequency.setValueAtTime(f1, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(f2, c.currentTime + dur);
      g.gain.setValueAtTime(vol || 0.18, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.start(); o.stop(c.currentTime + dur);
    }
    function noise(dur, vol, fc) {
      var c = getCtx(); if (!c) return;
      var n = Math.ceil(c.sampleRate * dur);
      var buf = c.createBuffer(1, n, c.sampleRate);
      var d = buf.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      var src = c.createBufferSource(); src.buffer = buf;
      var filt = c.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = fc || 800; filt.Q.value = 1.5;
      var g = c.createGain(); g.gain.setValueAtTime(vol || 0.2, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      src.connect(filt); filt.connect(g); g.connect(c.destination);
      src.start(); src.stop(c.currentTime + dur);
    }
    function later(fn, ms) { setTimeout(fn, ms); }
    return {
      cast:    function () { sweep(600, 180, 0.14, 'sine', 0.12); noise(0.09, 0.14, 1100); },
      bite:    function () { tone(700, 0.06, 'square', 0.28); later(function () { tone(900, 0.1, 'square', 0.24); }, 90); },
      catch_:  function () { tone(523, 0.05, 'triangle', 0.2); later(function () { tone(659, 0.05, 'triangle', 0.2); }, 80); later(function () { tone(784, 0.18, 'sine', 0.28); }, 170); },
      miss:    function () { sweep(320, 160, 0.22, 'sawtooth', 0.2); },
      splash:  function () { noise(0.22, 0.22, 520); },
      combo:   function (n) { var f = 440 + n * 100; tone(f, 0.05, 'square', 0.18); later(function () { tone(f * 1.26, 0.05, 'square', 0.18); }, 80); later(function () { tone(f * 1.5, 0.15, 'sine', 0.25); }, 170); },
      correct: function () { tone(659, 0.04, 'triangle', 0.2); later(function () { tone(784, 0.04, 'triangle', 0.2); }, 70); later(function () { tone(1047, 0.15, 'sine', 0.25); }, 150); },
      wrong:   function () { sweep(440, 200, 0.2, 'sawtooth', 0.22); },
      win:     function () { [523, 659, 784, 1047].forEach(function (f, i) { later(function () { tone(f, 0.18, 'sine', 0.3); }, i * 110); }); },
      swoosh:  function () { sweep(800, 200, 0.12, 'sawtooth', 0.1); noise(0.08, 0.1, 1200); },
      tick:    function () { tone(1400, 0.025, 'square', 0.07); }
    };
  }());

  /* ── PARTICLES ──────────────────────────────────────────────── */
  function mkP(x, y, vx, vy, col, life, r) {
    return { x: x, y: y, vx: vx, vy: vy, col: col, life: life, ml: life, r: r || rand(2, 4.5), g: 0.19 };
  }
  function updP(arr, dt) {
    for (var i = arr.length - 1; i >= 0; i--) {
      var p = arr[i]; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life -= dt * 1.5;
      if (p.life <= 0) arr.splice(i, 1);
    }
  }
  function drwP(ctx, arr) {
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i], a = clamp(p.life / p.ml, 0, 1);
      ctx.globalAlpha = a; ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function burst(arr, x, y, n, cols, spd) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = rand(spd * 0.4, spd);
      arr.push(mkP(x, y, Math.cos(a) * s, Math.sin(a) * s - rand(0.5, 2), cols[i % cols.length], rand(0.55, 1.2), rand(2, 5)));
    }
  }
  function waterBurst(arr, x, y, n) {
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + rand(-0.9, 0.9);
      arr.push(mkP(x, y, Math.cos(a) * rand(1, 3.5), Math.sin(a) * rand(1.5, 4.5) - 2,
        i % 3 === 0 ? 'rgba(255,255,255,.7)' : 'rgba(74,184,247,.75)', rand(0.3, 0.75)));
    }
  }

  /* ── SCREEN SHAKE ───────────────────────────────────────────── */
  function Shake() { this.x = 0; this.y = 0; this._t = 0; this._m = 0; }
  Shake.prototype.trig = function (m, d) { this._m = m || 5; this._t = d || 0.28; };
  Shake.prototype.up = function (dt) {
    if (this._t <= 0) { this.x = this.y = 0; return; }
    this._t -= dt; var m = this._m * (this._t > 0 ? this._t / 0.28 : 0);
    this.x = rand(-m, m); this.y = rand(-m, m);
  };

  /* ── FISH SPRITE ────────────────────────────────────────────── */
  function drawFish(ctx, x, y, sz, col, left, alpha) {
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = clamp(alpha, 0, 1) * ctx.globalAlpha;
    ctx.translate(x, y); if (left) ctx.scale(-1, 1);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(0, 0, sz, sz * 0.47, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-sz * 0.72, 0); ctx.lineTo(-sz * 1.28, -sz * 0.52); ctx.lineTo(-sz * 1.28, sz * 0.52); ctx.closePath(); ctx.fill();
    ctx.globalAlpha *= 0.65;
    ctx.beginPath(); ctx.moveTo(-sz * 0.1, -sz * 0.47); ctx.quadraticCurveTo(sz * 0.2, -sz * 0.8, sz * 0.55, -sz * 0.47); ctx.fill();
    ctx.globalAlpha /= 0.65;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sz * 0.5, -sz * 0.1, sz * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(sz * 0.52, -sz * 0.1, sz * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.ellipse(sz * 0.14, -sz * 0.12, sz * 0.2, sz * 0.1, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* ── FLOAT TEXTS ────────────────────────────────────────────── */
  function FT(x, y, txt, col) { this.x = x; this.y = y; this.txt = txt; this.col = col || C.green; this.life = 1.4; this.ml = 1.4; this.vy = -34; }
  FT.prototype.up = function (dt) { this.y += this.vy * dt; this.vy *= 0.93; this.life -= dt; };
  FT.prototype.dr = function (ctx) {
    var a = clamp(this.life / this.ml, 0, 1);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = this.col;
    ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 4;
    ctx.fillText(this.txt, this.x, this.y); ctx.shadowBlur = 0; ctx.restore();
  };


  /* ═══════════════════════════════════════════════════════════════
     GAME 1 — PESCADOR LIBRE
     Top-down tilemap adventure with fishing catch mini-game bar
     ═══════════════════════════════════════════════════════════════ */
  function GameFishing(root) {
    var cvs = $('[data-sg-canvas]', root); if (!cvs) return;
    var ctx = cvs.getContext('2d');
    var btn  = $('[data-sg-btn]',    root);
    var msgE = $('[data-sg-msg]',    root);
    var scoE = $('[data-sg-score]',  root);
    var strE = $('[data-sg-streak]', root);

    var CW = 300, CH = 240, TS = 20;
    var COLS = 15, ROWS = 12;
    cvs.width = CW; cvs.height = CH;

    var MAP = [
      'GGGGGGGGGGGGGGG',
      'GTGGGGGGGGGGGTG',
      'GGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGG',
      'GGGGGGGGpGGGGGG',
      'GGGGGGGGpGGGGGG',
      'GGGGGGGGpddddGG',
      'WWWWWWWWWddddWW',
      'WWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWW',
    ];
    var WATER_Y = 7 * TS;

    var SPOTS = [
      { cx: 2.5 * TS, cy: 8.5 * TS  },
      { cx: 13 * TS,  cy: 8.5 * TS  },
      { cx: 5 * TS,   cy: 10.5 * TS },
      { cx: 11 * TS,  cy: 9.5 * TS  },
      { cx: 7 * TS,   cy: 11.5 * TS },
    ];
    var SPOT_COLS = ['#4ab8f7', '#f97316', '#a78bfa', '#22c55e', '#fbbf24'];

    function tileAt(px, py) {
      var c = Math.floor(px / TS), r = Math.floor(py / TS);
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return '#';
      return MAP[r][c];
    }
    function walkable(t) { return 'Gpd'.indexOf(t) >= 0; }

    // ── State ──────────────────────────────────────────────────
    var S = 'idle', score = 0, best1 = lsGet('ajsp_fishing_best', 0);
    if (strE) strE.textContent = best1;

    var PL = { x: 4 * TS + TS / 2, y: 2 * TS + TS / 2, dir: 0, anim: 0 };
    // dir: 0=down, 1=right, 2=up, 3=left
    var FACE_VEC = [[0,1],[1,0],[0,-1],[-1,0]];

    var FS = { on: false, lx: 0, ly: 0, biting: false, waitT: 0 };
    var ptcls = [], floats = [];
    var shake1 = new Shake();

    // ── Fishing mini-game catch bar ─────────────────────────────
    var MG = {
      active: false,
      barW: 190, barH: 16,
      zoneX: 0, zoneW: 50,
      cursor: 0, curDir: 1, curSpd: 0,
      attempts: 0, maxAttempts: 3,
      phase: 'idle', // idle, active, result
      resultOk: false, resultTimer: 0,
      flashTimer: 0, vigAlpha: 0
    };
    var FISH_NAMES = ['lubina','lucio','trucha','black-bass','perca','dorada','siluro','lucioperca'];
    var lastCaughtName = '';

    // ── Controls ────────────────────────────────────────────────
    var keys = { up: false, dn: false, lt: false, rt: false };
    var actDown = false, actConsumed = true;
    var DPAD_CX = 40, DPAD_CY = CH - 38;
    var ACT_X = CW - 38, ACT_Y = CH - 38;

    function dpadDir(x, y) {
      var dx = x - DPAD_CX, dy = y - DPAD_CY, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 6 || d > 52) return null;
      var a = Math.atan2(dy, dx);
      if (a > -Math.PI * 0.25 && a <= Math.PI * 0.25) return 'rt';
      if (a > Math.PI * 0.25  && a <= Math.PI * 0.75) return 'dn';
      if (a > -Math.PI * 0.75 && a <= -Math.PI * 0.25) return 'up';
      return 'lt';
    }
    function cvsPt(e) {
      var r = cvs.getBoundingClientRect(), src = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
      return { x: (src.clientX - r.left) * CW / r.width, y: (src.clientY - r.top) * CH / r.height };
    }
    var touchDirs = {};
    function onTStart(e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i], p = cvsPt({ changedTouches: [t] });
        var da = Math.hypot(p.x - ACT_X, p.y - ACT_Y);
        if (da < 30) { touchDirs[t.identifier] = 'act'; if (!actDown) { actDown = true; actConsumed = false; } }
        else { var dir = dpadDir(p.x, p.y); if (dir) { touchDirs[t.identifier] = dir; keys[dir] = true; } }
      }
    }
    function onTEnd(e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var id = e.changedTouches[i].identifier, was = touchDirs[id];
        if (was === 'act') actDown = false; else if (was) keys[was] = false;
        delete touchDirs[id];
      }
    }
    cvs.addEventListener('touchstart',  onTStart, { passive: false });
    cvs.addEventListener('touchend',    onTEnd,   { passive: false });
    cvs.addEventListener('touchcancel', onTEnd,   { passive: false });

    var KB1 = { ArrowUp:'up', ArrowDown:'dn', ArrowLeft:'lt', ArrowRight:'rt', KeyW:'up', KeyS:'dn', KeyA:'lt', KeyD:'rt' };
    WIN.addEventListener('keydown', function (e) {
      var k = KB1[e.code]; if (k) { keys[k] = true; return; }
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
        e.preventDefault();
        if (!actDown) { actDown = true; actConsumed = false; }
      }
    });
    WIN.addEventListener('keyup', function (e) {
      var k = KB1[e.code]; if (k) keys[k] = false;
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') actDown = false;
    });
    if (btn) btn.addEventListener('click', function () { if (S === 'idle' || S === 'win') startGame1(); });

    function setMsg1(t, ok) {
      if (!msgE) return; msgE.textContent = t;
      msgE.style.color = ok == null ? '' : ok ? C.green : C.red;
    }

    function startGame1() {
      PL.x = 4 * TS + TS / 2; PL.y = 2 * TS + TS / 2; PL.dir = 0; PL.anim = 0;
      FS.on = false; FS.biting = false; MG.active = false; MG.phase = 'idle';
      score = 0; ptcls = []; floats = [];
      if (scoE) scoE.textContent = '0/5';
      S = 'play';
      if (btn) { btn.textContent = ''; btn.disabled = true; }
      setMsg1('Camina hacia el lago · Espacio para lanzar');
    }

    function castRod() {
      if (FS.on) return;
      var fd = FACE_VEC[PL.dir];
      var fx = -1, fy = -1;
      for (var d = 1; d <= 5; d++) {
        var nx = PL.x + fd[0] * d * TS, ny = PL.y + fd[1] * d * TS;
        if (tileAt(nx, ny) === 'W') {
          fx = clamp(nx + fd[0] * rand(0.3, 1.1) * TS + rand(-10, 10), TS, CW - TS);
          fy = clamp(ny + fd[1] * rand(0.3, 1.1) * TS + rand(-5, 5), WATER_Y + 6, CH - 20);
          break;
        }
      }
      if (fx < 0) { setMsg1('Gírate hacia el agua para lanzar.', false); return; }
      FS.on = true; FS.biting = false; FS.lx = fx; FS.ly = fy;
      FS.waitT = rand(2.2, 5.2);
      SFX.cast(); setMsg1('Flotador lanzado. Espera la picada...');
    }

    function startMiniGame() {
      MG.active = true; MG.phase = 'active'; MG.vigAlpha = 0;
      MG.zoneW = 52 - score * 4;  // zone shrinks as you progress
      MG.zoneX = rand(10, MG.barW - MG.zoneW - 10);
      MG.cursor = 0; MG.curDir = 1;
      MG.curSpd = 1.6 + score * 0.25; // faster as fish caught increases
      MG.attempts = 0; MG.flashTimer = 0;
      SFX.bite(); setMsg1('¡PICADA! Pulsa Espacio — zona verde');
    }

    function resolveMiniGame() {
      if (!MG.active || MG.phase !== 'active') return;
      var barOX = (CW - MG.barW) / 2;
      var curPx = barOX + MG.cursor * MG.barW;
      var zStart = barOX + MG.zoneX, zEnd = zStart + MG.zoneW;
      var hit = curPx >= zStart && curPx <= zEnd;

      if (hit) {
        MG.phase = 'result'; MG.resultOk = true; MG.resultTimer = 0.8;
        MG.active = false; FS.on = false; FS.biting = false;
        score++;
        lastCaughtName = FISH_NAMES[(score - 1) % FISH_NAMES.length];
        SFX.catch_(); shake1.trig(5, 0.28);
        var cols = ['#4ab8f7','#22c55e','#f97316','#a78bfa','#fbbf24'];
        burst(ptcls, PL.x, PL.y, 22, cols, 4.2);
        floats.push(new FT(PL.x, PL.y - 10, '+1 ' + lastCaughtName + '!', C.green));
        if (scoE) scoE.textContent = score + '/5';
        if (score >= best1) { best1 = score; lsSet('ajsp_fishing_best', best1); if (strE) strE.textContent = best1; }
        S = 'play';
        if (score >= 5) { endGame1(); return; }
        setMsg1('¡' + lastCaughtName.charAt(0).toUpperCase() + lastCaughtName.slice(1) + ' capturado/a! ' + (5 - score) + ' peces más.');
      } else {
        MG.attempts++;
        MG.flashTimer = 0.3; SFX.miss();
        if (MG.attempts >= MG.maxAttempts) {
          MG.phase = 'result'; MG.resultOk = false; MG.resultTimer = 0.65;
          MG.active = false; FS.on = false; FS.biting = false;
          S = 'play';
          setMsg1('Se escapó. Vuelve a lanzar.', false);
        } else {
          MG.zoneW = Math.max(24, MG.zoneW - 12); // shrink on miss
          MG.curSpd = Math.min(4, MG.curSpd * 1.3);
          setMsg1('¡Fallo! Tiempos: ' + (MG.maxAttempts - MG.attempts) + ' restantes.', false);
        }
      }
    }

    function endGame1() {
      S = 'win'; SFX.win(); shake1.trig(8, 0.5);
      if (btn) { btn.textContent = 'Jugar otra vez'; btn.disabled = false; }
      setMsg1('¡5 peces! ¡Eres un gran pescador!', true);
    }

    var lt1 = 0;
    function step1(ts) {
      var dt = Math.min((ts - lt1) / 1000, 0.05); lt1 = ts;
      shake1.up(dt); updP(ptcls, dt);
      floats = floats.filter(function (f) { f.up(dt); return f.life > 0; });

      if (S === 'play') {
        var spd = 68 * dt;
        var dx = 0, dy = 0;
        if (keys.lt) { dx = -spd; PL.dir = 3; }
        if (keys.rt) { dx =  spd; PL.dir = 1; }
        if (keys.up) { dy = -spd; PL.dir = 2; }
        if (keys.dn) { dy =  spd; PL.dir = 0; }

        if (dx !== 0 || dy !== 0) {
          PL.anim += dt * 8;
          var nx = PL.x + dx, ny = PL.y + dy;
          if (walkable(tileAt(nx, PL.y))) PL.x = clamp(nx, 8, CW - 8);
          if (walkable(tileAt(PL.x, ny))) PL.y = clamp(ny, 8, CH - 8);
        }

        if (!FS.on && actDown && !actConsumed) { actConsumed = true; castRod(); }
        if (FS.on && !FS.biting) {
          FS.waitT -= dt;
          if (FS.waitT <= 0) { FS.biting = true; startMiniGame(); }
        }
      }

      if (MG.active && MG.phase === 'active') {
        MG.cursor += MG.curDir * MG.curSpd * dt;
        if (MG.cursor >= 1) { MG.cursor = 1; MG.curDir = -1; }
        if (MG.cursor <= 0) { MG.cursor = 0; MG.curDir =  1; }
        MG.flashTimer = Math.max(0, MG.flashTimer - dt);
        MG.vigAlpha = Math.min(0.35, MG.vigAlpha + dt * 2); // vignette fade-in
        if (actDown && !actConsumed) { actConsumed = true; resolveMiniGame(); }
      }
      if (MG.phase === 'result') { MG.resultTimer = Math.max(0, MG.resultTimer - dt); }

      draw1(ts);
      raf(step1);
    }

    // ── Tile renderer ──────────────────────────────────────────
    function drawTile(c, r, ts) {
      var t = MAP[r][c], x = c * TS, y = r * TS;
      if (t === 'W') {
        var wg = ctx.createLinearGradient(x, y, x, y + TS);
        wg.addColorStop(0, '#062840'); wg.addColorStop(1, '#041520');
        ctx.fillStyle = wg; ctx.fillRect(x, y, TS, TS);
        ctx.strokeStyle = 'rgba(74,184,247,0.06)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (var wx = x; wx <= x + TS; wx += 4) {
          var wy = y + TS / 2 + Math.sin(wx * 0.015 + ts * 0.0015 + r * 0.7) * 1.8;
          if (wx === x) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
        }
        ctx.stroke();
      } else if (t === 'G') {
        ctx.fillStyle = '#0e2412'; ctx.fillRect(x, y, TS, TS);
        ctx.fillStyle = '#112a15';
        ctx.fillRect(x + 3, y + 5, 2, 1); ctx.fillRect(x + 12, y + 13, 2, 1); ctx.fillRect(x + 7, y + 9, 2, 1);
      } else if (t === 'T') {
        ctx.fillStyle = '#071008'; ctx.fillRect(x, y, TS, TS);
        ctx.fillStyle = '#0a2a0a'; ctx.fillRect(x + 7, y + 12, 6, 8);
        ctx.fillStyle = '#1e5a1e'; ctx.beginPath(); ctx.arc(x + TS / 2, y + TS * 0.38, TS * 0.43, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#246224'; ctx.beginPath(); ctx.arc(x + TS / 2 - 2, y + TS * 0.32, TS * 0.25, 0, Math.PI * 2); ctx.fill();
      } else if (t === 'p') {
        ctx.fillStyle = '#161008'; ctx.fillRect(x, y, TS, TS);
        ctx.fillStyle = '#201808'; ctx.fillRect(x + 2, y + 2, TS - 4, TS - 4);
        ctx.strokeStyle = '#2a2010'; ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, TS - 4, TS - 4);
      } else if (t === 'd') {
        ctx.fillStyle = '#1a100a'; ctx.fillRect(x, y, TS, TS);
        ctx.fillStyle = '#32200e';
        for (var pi = 0; pi < 3; pi++) ctx.fillRect(x + 1, y + 3 + pi * 6, TS - 2, 3);
        ctx.fillStyle = '#483014'; ctx.fillRect(x, y, TS, 2);
      }
    }

    function draw1(ts) {
      ctx.save(); ctx.translate(shake1.x, shake1.y);

      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) drawTile(c, r, ts);

      // Hotspot fish (animated underwater)
      SPOTS.forEach(function (sp, i) {
        var bob = Math.sin(ts * 0.003 + i * 1.8) * 2.2;
        var alpha = 0.5 + Math.sin(ts * 0.0025 + i * 2.1) * 0.25;
        drawFish(ctx, sp.cx + Math.sin(ts * 0.001 + i) * 4, sp.cy + bob, 5, SPOT_COLS[i], i % 2 === 0, alpha);
        // ripple
        var rph = (ts * 0.001 + i * 0.4) % 1;
        ctx.strokeStyle = 'rgba(74,184,247,' + (0.28 - rph * 0.25) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(sp.cx, sp.cy, rph * 14, 0, Math.PI * 2); ctx.stroke();
      });

      // Fishing line & bobber
      if (FS.on) {
        ctx.strokeStyle = 'rgba(200,230,255,0.45)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(PL.x, PL.y - 12); ctx.lineTo(FS.lx, FS.ly); ctx.stroke();
        var bob2 = FS.biting ? Math.sin(ts * 0.02) * 4 : Math.sin(ts * 0.004) * 2.2;
        ctx.fillStyle = FS.biting ? C.red : C.orange;
        ctx.beginPath(); ctx.arc(FS.lx, FS.ly + bob2, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(FS.lx, FS.ly + bob2 - 1.8, 1.8, 0, Math.PI * 2); ctx.fill();
        // bobber blink on bite
        if (FS.biting && MG.active) {
          var blinkA = (Math.sin(ts * 0.015) + 1) * 0.3;
          ctx.fillStyle = 'rgba(248,113,113,' + blinkA + ')';
          ctx.beginPath(); ctx.arc(FS.lx, FS.ly + bob2, 10, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Player
      var px2 = PL.x, py2 = PL.y;
      var stepF = Math.sin(PL.anim) * 2;
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath();
      ctx.ellipse(px2, py2 + 8, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
      // boots
      ctx.fillStyle = '#2a1a0a';
      ctx.fillRect(px2 - 5, py2 + 5, 4, 4 + stepF);
      ctx.fillRect(px2 + 1, py2 + 5, 4, 4 - stepF);
      // body (fishing vest)
      ctx.fillStyle = '#1a4a7a'; ctx.fillRect(px2 - 5, py2 - 12, 10, 10);
      ctx.fillStyle = '#2a6aaa'; ctx.fillRect(px2 - 3, py2 - 12, 6, 8); // highlight
      // head
      ctx.fillStyle = '#d4a074'; ctx.beginPath(); ctx.arc(px2, py2 - 17, 6, 0, Math.PI * 2); ctx.fill();
      // hat
      ctx.fillStyle = '#4a2a0a'; ctx.fillRect(px2 - 6, py2 - 24, 12, 4); ctx.fillRect(px2 - 4, py2 - 28, 8, 5);
      // rod (point in facing direction)
      if (FS.on) {
        var fd2 = FACE_VEC[PL.dir];
        ctx.strokeStyle = '#a07020'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(px2 + fd2[0] * 4, py2 - 16); ctx.lineTo(px2 + fd2[0] * 14, py2 + fd2[1] * 14 - 16); ctx.stroke();
      }

      // Particles & float texts
      drwP(ctx, ptcls); floats.forEach(function (f) { f.dr(ctx); });

      // Canvas dpad
      if (S === 'play') {
        // Directions
        ctx.fillStyle = 'rgba(0,30,60,0.65)';
        ctx.beginPath(); ctx.arc(DPAD_CX, DPAD_CY, 36, 0, Math.PI * 2); ctx.fill();
        var arrows = [['↑',0,-22],['↓',0,22],['←',-22,0],['→',22,0]];
        arrows.forEach(function (a) {
          ctx.fillStyle = 'rgba(74,184,247,0.85)'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(a[0], DPAD_CX + a[1], DPAD_CY + a[2]);
        });
        // Action button
        ctx.fillStyle = FS.biting ? 'rgba(34,197,94,0.7)' : 'rgba(74,184,247,0.5)';
        ctx.beginPath(); ctx.arc(ACT_X, ACT_Y, 22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(FS.on ? 'TIRAR' : 'LANZAR', ACT_X, ACT_Y);
        ctx.textBaseline = 'alphabetic';
      }

      // ── FISHING MINI-GAME CATCH BAR ──────────────────────────
      if (MG.active || (MG.phase === 'result' && MG.resultTimer > 0)) {
        // Tension vignette on canvas edges during active mini-game
        if (MG.phase === 'active' && MG.vigAlpha > 0) {
          var vigGrad = ctx.createRadialGradient(CW/2, CH/2, CW*0.3, CW/2, CH/2, CW*0.75);
          vigGrad.addColorStop(0, 'rgba(180,30,30,0)');
          vigGrad.addColorStop(1, 'rgba(180,30,30,' + MG.vigAlpha + ')');
          ctx.fillStyle = vigGrad; ctx.fillRect(0, 0, CW, CH);
        }

        var barOX = (CW - MG.barW) / 2, barOY = CH - 48;

        // backdrop
        ctx.fillStyle = 'rgba(2,8,18,0.82)';
        ctx.roundRect(barOX - 14, barOY - 24, MG.barW + 28, 46, 6);
        ctx.fill();

        // instruction text
        if (MG.phase === 'active') {
          var instCol = MG.flashTimer > 0 ? C.red : (MG.attempts > 0 ? C.orange : C.yellow);
          ctx.fillStyle = instCol;
          ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText('¡PICADA! Pulsa Espacio en la zona verde', CW / 2, barOY - 9);
          // mini fish icon near bobber
          drawFish(ctx, FS.lx, FS.ly - 12 + Math.sin(ts * 0.01) * 3, 4, C.blue, true, 0.9);
        }

        // bar background
        ctx.fillStyle = '#050f1c'; ctx.fillRect(barOX, barOY, MG.barW, MG.barH);

        // zone (green, pulsing)
        var zonePulse = MG.phase === 'active' ? (Math.sin(ts * 0.012) + 1) * 0.15 : 0;
        ctx.fillStyle = 'rgba(34,197,94,' + (0.5 + zonePulse) + ')';
        ctx.fillRect(barOX + MG.zoneX, barOY, MG.zoneW, MG.barH);
        // zone glow
        ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 8;
        ctx.strokeStyle = 'rgba(34,197,94,0.6)'; ctx.lineWidth = 1;
        ctx.strokeRect(barOX + MG.zoneX, barOY, MG.zoneW, MG.barH);
        ctx.shadowBlur = 0;

        // cursor (only when active)
        if (MG.phase === 'active') {
          var curPx2 = barOX + MG.cursor * MG.barW;
          // cursor trail
          ctx.fillStyle = 'rgba(251,191,36,0.25)'; ctx.fillRect(curPx2 - 6, barOY, 12, MG.barH);
          ctx.shadowColor = C.yellow; ctx.shadowBlur = 10;
          ctx.fillStyle = C.yellow; ctx.fillRect(curPx2 - 2, barOY - 5, 4, MG.barH + 10);
          ctx.shadowBlur = 0;
        }

        // bar border
        ctx.strokeStyle = 'rgba(74,184,247,0.3)'; ctx.lineWidth = 1;
        ctx.strokeRect(barOX, barOY, MG.barW, MG.barH);

        // attempt dots (hearts)
        for (var ai = 0; ai < MG.maxAttempts; ai++) {
          ctx.fillStyle = ai < MG.attempts ? C.red : C.green;
          ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(ai < MG.attempts ? '✗' : '♥', barOX + MG.barW + 12 + ai * 14, barOY + MG.barH - 1);
        }

        // result flash overlay
        if (MG.phase === 'result') {
          var rA = clamp(MG.resultTimer * 1.5, 0, 0.4);
          ctx.fillStyle = MG.resultOk ? 'rgba(34,197,94,' + rA + ')' : 'rgba(248,113,113,' + rA + ')';
          ctx.fillRect(barOX, barOY, MG.barW, MG.barH);
          ctx.fillStyle = MG.resultOk ? C.green : C.red;
          ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
          ctx.fillText(MG.resultOk ? '¡CAPTURADO!' : '¡SE ESCAPÓ!', CW / 2, barOY - 9);
        }
      }

      // HUD bar
      if (S === 'play') {
        ctx.fillStyle = 'rgba(2,8,18,0.78)'; ctx.fillRect(0, 0, CW, 16);
        ctx.fillStyle = C.text2; ctx.font = '8px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('Peces: ' + score + '/5', 5, 11);
        ctx.textAlign = 'right';
        ctx.fillText('Récord: ' + best1, CW - 5, 11);
      }

      // Idle / Win overlay
      if (S === 'idle' || S === 'win') {
        ctx.fillStyle = 'rgba(2,8,18,0.84)'; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = C.blue; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(S === 'win' ? '¡5 peces capturados!' : 'Pescador Libre', CW / 2, CH * 0.35);
        ctx.fillStyle = C.text2; ctx.font = '9px monospace';
        ctx.fillText(S === 'win' ? 'Pulsa "Jugar otra vez"' : 'WASD · Espacio para pescar', CW / 2, CH * 0.5);
        if (S === 'win' || S === 'idle') {
          ctx.fillStyle = C.yellow; ctx.font = 'bold 11px monospace';
          ctx.fillText('Récord: ' + best1 + ' peces', CW / 2, CH * 0.66);
        }
      }

      ctx.restore();
    }

    S = 'idle';
    if (btn) { btn.disabled = false; btn.textContent = 'Iniciar'; }
    raf(function (ts) { lt1 = ts; raf(step1); });
  }


  /* ═══════════════════════════════════════════════════════════════
     GAME 2 — TOQUE DE PICADA
     Click/tap fish directly — 3 lanes, 3 fish types, combos
     ═══════════════════════════════════════════════════════════════ */
  function GameReflex(root) {
    var cvs = $('[data-rf-canvas]', root); if (!cvs) return;
    var ctx = cvs.getContext('2d');
    var btn  = $('[data-rf-btn]',   root);
    var msgE = $('[data-rf-msg]',   root);
    var scoE = $('[data-rf-score]', root);
    var bstE = $('[data-rf-best]',  root);

    var CW = 300, CH = 246;
    cvs.width = CW; cvs.height = CH;

    var S2 = 'idle', score2 = 0, combo2 = 0, maxCombo2 = 0, best2 = lsGet('ajsp_reflex_best', 0);
    var totalFish2 = 15, spawnedFish2 = 0;
    var fish2 = [], ptcls2 = [], floats2 = [];
    var shake2 = new Shake(), missFlash2 = 0;
    if (bstE) bstE.textContent = best2;

    // 3 lane Y positions
    var LANES2 = [CH * 0.28, CH * 0.52, CH * 0.76];

    // Fish type templates
    var FT2 = [
      { col: '#4ab8f7', sz: 8,  spd: 62, pts: 1 }, // small blue  — fast
      { col: '#22c55e', sz: 10, spd: 50, pts: 1 }, // medium green — medium
      { col: '#f97316', sz: 13, spd: 38, pts: 2 }, // big orange — slow
      { col: '#fbbf24', sz: 16, spd: 28, pts: 3 }, // golden — very slow, rare
    ];

    function setMsg2(t) { if (msgE) msgE.textContent = t; }

    function startGame2() {
      S2 = 'playing'; score2 = 0; combo2 = 0; maxCombo2 = 0;
      spawnedFish2 = 0; fish2 = []; ptcls2 = []; floats2 = [];
      missFlash2 = 0;
      if (scoE) scoE.textContent = '0/' + totalFish2;
      setMsg2('¡Clic/toca los peces! Los dorados valen 3 puntos.');
      if (btn) { btn.textContent = 'En juego...'; btn.disabled = true; }
      spawnNext2(0.4);
    }

    var spawnT2 = 0;
    function spawnNext2(delay) { spawnT2 = delay; }

    function spawnOne2() {
      if (spawnedFish2 >= totalFish2) return;
      var rarity = Math.random();
      var ft = rarity < 0.08 ? FT2[3] : rarity < 0.25 ? FT2[2] : rarity < 0.55 ? FT2[1] : FT2[0];
      var lane = Math.floor(Math.random() * 3);
      var spd = ft.spd + spawnedFish2 * 1.8 + rand(-8, 8); // progressive speed
      fish2.push({ x: CW + ft.sz + 8, y: LANES2[lane], vx: -spd, col: ft.col, sz: ft.sz, pts: ft.pts, anim: rand(0, Math.PI * 2), alive: true });
      spawnedFish2++;
      // next spawn delay (gets shorter as game progresses)
      spawnNext2(rand(0.6, 1.4) * Math.max(0.4, 1.2 - spawnedFish2 * 0.04));
    }

    function tryHit2(mx, my) {
      if (S2 !== 'playing') return;
      SFX.splash(); // wake audio context on first interaction
      var hit = false;
      for (var i = fish2.length - 1; i >= 0; i--) {
        var f = fish2[i];
        if (!f.alive) continue;
        var dx = mx - f.x, dy = my - f.y, hr = f.sz * 2.4;
        if (dx * dx + dy * dy <= hr * hr) {
          f.alive = false; fish2.splice(i, 1);
          combo2++; if (combo2 > maxCombo2) maxCombo2 = combo2;
          var pts = f.pts * (combo2 >= 4 ? 2 : 1);
          score2 += pts;
          shake2.trig(2 + f.sz * 0.25, 0.18);
          burst(ptcls2, f.x, f.y, 10 + f.sz, [f.col, '#fff', C.blue], 3.2);
          waterBurst(ptcls2, f.x, f.y, 7);
          var label = combo2 >= 4 ? '+' + pts + ' x' + combo2 + '!!🔥' : '+' + pts;
          floats2.push(new FT(f.x, f.y - f.sz, label, combo2 >= 4 ? C.yellow : (f.pts >= 3 ? C.orange : C.green)));
          if (combo2 === 3 || combo2 === 5 || combo2 === 7) SFX.combo(Math.min(combo2, 8));
          else SFX.catch_();
          if (scoE) scoE.textContent = score2 + '/' + totalFish2;
          hit = true; break;
        }
      }
      if (!hit) { missFlash2 = 0.12; SFX.miss(); floats2.push(new FT(mx, my, 'FALLO', C.red)); }
      // note: combo only resets on fish escape, not on miss clicks
    }

    cvs.addEventListener('click', function (e) {
      if (S2 === 'idle' || S2 === 'done') { if (S2 === 'done') startGame2(); return; }
      var r = cvs.getBoundingClientRect();
      tryHit2((e.clientX - r.left) / r.width * CW, (e.clientY - r.top) / r.height * CH);
    });
    cvs.addEventListener('touchstart', function (e) {
      e.preventDefault();
      if (S2 === 'idle' || S2 === 'done') return;
      var r = cvs.getBoundingClientRect(), t = e.changedTouches[0];
      tryHit2((t.clientX - r.left) / r.width * CW, (t.clientY - r.top) / r.height * CH);
    }, { passive: false });
    if (btn) btn.addEventListener('click', function () { if (S2 === 'idle' || S2 === 'done') startGame2(); });

    function endGame2() {
      S2 = 'done'; SFX.win();
      if (score2 > best2) { best2 = score2; lsSet('ajsp_reflex_best', best2); if (bstE) bstE.textContent = best2; }
      var rating = score2 >= 28 ? '¡Maestro! 🏆' : score2 >= 18 ? '¡Excelentes reflejos!' : score2 >= 10 ? '¡Bien! Sigue entrenando.' : '¡Practica más!';
      setMsg2(rating + ' Combo máx: x' + maxCombo2);
      if (btn) { btn.textContent = 'Jugar otra vez'; btn.disabled = false; }
    }

    var lt2 = 0;
    function step2(ts) {
      var dt = Math.min((ts - lt2) / 1000, 0.05); lt2 = ts;
      shake2.up(dt); updP(ptcls2, dt);
      floats2 = floats2.filter(function (f) { f.up(dt); return f.life > 0; });
      missFlash2 = Math.max(0, missFlash2 - dt);

      if (S2 === 'playing') {
        spawnT2 -= dt;
        if (spawnT2 <= 0 && spawnedFish2 < totalFish2) spawnOne2();

        for (var i = fish2.length - 1; i >= 0; i--) {
          var f = fish2[i]; f.x += f.vx * dt; f.anim += dt * 4;
          if (f.x < -f.sz * 3) {
            fish2.splice(i, 1); combo2 = 0; // escaped = combo reset
            floats2.push(new FT(20, LANES2[Math.floor(Math.random() * 3)], 'ESCAPÓ', C.muted));
          }
        }

        if (spawnedFish2 >= totalFish2 && fish2.length === 0) endGame2();
      }

      draw2(ts);
      raf(step2);
    }

    function draw2(ts) {
      ctx.save(); ctx.translate(shake2.x, shake2.y);

      // Background — underwater scene
      var sg = ctx.createLinearGradient(0, 0, 0, CH);
      sg.addColorStop(0, '#020912'); sg.addColorStop(0.35, '#062840'); sg.addColorStop(1, '#031520');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, CW, CH);

      if (missFlash2 > 0) {
        ctx.fillStyle = 'rgba(248,113,113,' + missFlash2 * 1.8 + ')'; ctx.fillRect(0, 0, CW, CH);
      }

      // Water surface shimmer
      for (var wi = 0; wi < 3; wi++) {
        ctx.strokeStyle = 'rgba(74,184,247,0.06)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (var wx = 0; wx <= CW; wx += 3) {
          var wpy = 12 + wi * 10 + Math.sin(wx * 0.022 + ts * 0.0012 + wi * 2.1) * 2;
          if (wx === 0) ctx.moveTo(wx, wpy); else ctx.lineTo(wx, wpy);
        }
        ctx.stroke();
      }

      // Lane lanes (subtle dashes)
      LANES2.forEach(function (ly) {
        ctx.strokeStyle = 'rgba(74,184,247,0.05)'; ctx.lineWidth = 1; ctx.setLineDash([6, 14]);
        ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(CW, ly); ctx.stroke();
        ctx.setLineDash([]);
      });

      // Seaweed decor
      for (var sw = 0; sw < 5; sw++) {
        var swx = 22 + sw * 58 + Math.sin(sw * 2.1) * 12;
        ctx.strokeStyle = 'rgba(34,197,94,0.14)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(swx, CH - 8);
        for (var sh = 0; sh < 4; sh++) {
          ctx.quadraticCurveTo(swx + Math.sin(ts * 0.0018 + sh * 1.4 + sw) * 7, CH - 8 - sh * 12 - 6, swx + Math.sin(ts * 0.0018 + sh + sw * 0.6) * 5, CH - 8 - sh * 12 - 12);
        }
        ctx.stroke(); ctx.lineCap = 'butt';
      }

      // Rising bubbles
      for (var bi = 0; bi < 6; bi++) {
        var bph = ((ts * 0.00025 + bi * 0.17) % 1);
        var bx = 35 + bi * 46 + Math.sin(bph * Math.PI * 3 + bi * 1.4) * 12;
        var by3 = CH - 5 - bph * CH * 0.92;
        ctx.fillStyle = 'rgba(74,184,247,' + (0.16 - bph * 0.14) + ')';
        ctx.beginPath(); ctx.arc(bx, by3, 1.5 + (bi % 3) * 0.8, 0, Math.PI * 2); ctx.fill();
      }

      // Fish
      fish2.forEach(function (f) {
        if (!f.alive) return;
        var bob = Math.sin(f.anim) * 1.8;
        drawFish(ctx, f.x, f.y + bob, f.sz, f.col, true);
        // subtle click-target ring
        ctx.strokeStyle = f.col; ctx.globalAlpha = 0.16; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(f.x, f.y + bob, f.sz * 2.4, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      });

      drwP(ctx, ptcls2); floats2.forEach(function (f) { f.dr(ctx); });

      // HUD
      ctx.fillStyle = 'rgba(2,8,18,0.82)'; ctx.fillRect(0, 0, CW, 20);
      ctx.fillStyle = C.text2; ctx.font = '8px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('Peces: ' + score2, 5, 13);
      if (combo2 >= 2) {
        var cc = combo2 >= 5 ? C.yellow : combo2 >= 3 ? C.orange : C.green;
        ctx.fillStyle = cc; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
        ctx.fillText('x' + combo2 + ' COMBO!', CW / 2, 13);
      }
      ctx.fillStyle = C.text2; ctx.font = '8px monospace'; ctx.textAlign = 'right';
      ctx.fillText('Récord: ' + best2, CW - 5, 13);
      // progress bar
      var prog2 = spawnedFish2 / totalFish2;
      ctx.fillStyle = 'rgba(74,184,247,0.12)'; ctx.fillRect(0, 20, CW, 3);
      ctx.fillStyle = C.blue; ctx.fillRect(0, 20, CW * prog2, 3);

      // Idle / Done overlay
      if (S2 === 'idle' || S2 === 'done') {
        ctx.fillStyle = 'rgba(2,8,18,0.84)'; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = C.blue; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Toque de Picada', CW / 2, CH * 0.3);
        ctx.fillStyle = C.text2; ctx.font = '9px monospace';
        ctx.fillText(S2 === 'done' ? 'Puntuación: ' + score2 + ' pts' : 'Toca los peces directamente', CW / 2, CH * 0.46);
        if (S2 === 'done') {
          ctx.fillStyle = C.yellow; ctx.font = 'bold 11px monospace';
          ctx.fillText('Récord: ' + best2 + ' pts', CW / 2, CH * 0.6);
          ctx.fillStyle = C.text2; ctx.font = '9px monospace';
          ctx.fillText('Combo máx: x' + maxCombo2, CW / 2, CH * 0.72);
        } else {
          ctx.fillStyle = C.orange; ctx.font = '9px monospace';
          ctx.fillText('Dorados = 3 pts · Combo x2 desde x4', CW / 2, CH * 0.62);
        }
        ctx.textBaseline = 'alphabetic';
      }

      ctx.restore();
    }

    S2 = 'idle';
    raf(function (ts) { lt2 = ts; raf(step2); });
  }


  /* ═══════════════════════════════════════════════════════════════
     GAME 3 — ¿QUÉ ESPECIE ES?
     Photo quiz with silhouette→reveal, animated choices, audio
     ═══════════════════════════════════════════════════════════════ */
  function GameQuiz(root) {
    var area     = $('[data-qz-area]',        root); if (!area) return;
    var imgEl    = $('[data-qz-img]',         root);
    var timerFill = $('[data-qz-timer-fill]', root);
    var resultEl = $('[data-qz-result]',      root);
    var choicesEl = $('[data-qz-choices]',    root);
    var btn3     = $('[data-qz-btn]',         root);
    var msgE3    = $('[data-qz-msg]',         root);
    var scoE3    = $('[data-qz-score]',       root);
    var bstE3    = $('[data-qz-best]',        root);

    var S3 = 'idle', score3 = 0, qIdx = 0, best3 = lsGet('ajsp_quiz_best', 0);
    if (bstE3) bstE3.textContent = best3;

    var SPECIES3 = [
      { name: 'Lubina',     file: 'lubina',     hint: 'Pez marino plateado. Activo en superficie y estuarios.',      fact: 'La lubina puede vivir en agua dulce, salada y salobre.' },
      { name: 'Lucio',      file: 'lucio',       hint: 'Predador de agua dulce. Cuerpo muy alargado y mandíbula ancha.', fact: 'El lucio puede vivir más de 25 años.' },
      { name: 'Trucha',     file: 'trucha',      hint: 'Ríos de montaña. Puntos rojos y negros sobre fondo dorado.',  fact: 'La trucha necesita aguas muy frías y bien oxigenadas.' },
      { name: 'Black-bass', file: 'black-bass',  hint: 'Especie americana. Gran mandíbula, muy agresivo con señuelos.', fact: 'El bass puede saltar hasta 1 metro al picar.' },
      { name: 'Perca',      file: 'perca',       hint: 'Rayas verticales oscuras. Aleta dorsal con espinas visibles.',  fact: 'La perca forma bancos para cazar cooperativamente.' },
      { name: 'Lucioperca', file: 'lucioperca',  hint: 'Ojos grandes y brillantes. Aspecto entre lucio y perca.',     fact: 'La lucioperca es el pez de agua dulce más valioso de Europa.' },
      { name: 'Dorada',     file: 'dorada',      hint: 'Franja dorada entre los ojos. Especie marina muy cotizada.',  fact: 'La dorada puede cambiar de sexo a lo largo de su vida.' },
      { name: 'Siluro',     file: 'siluro',      hint: 'Sin escamas, bigotes largos. El más grande de los ríos europeos.', fact: 'El siluro puede superar los 2,5 metros de longitud.' }
    ];

    var questions3 = [], timerIv = null, timerLeft3 = 0, timerTotal3 = 5.5;

    function msg3(t, ok) {
      if (!msgE3) return; msgE3.textContent = t;
      msgE3.style.color = ok == null ? '' : ok ? C.green : C.red;
    }

    function startQuiz3() {
      score3 = 0; qIdx = 0;
      questions3 = shuffle(SPECIES3).slice(0, 6);
      S3 = 'playing';
      if (scoE3) scoE3.textContent = '0/6';
      if (resultEl) resultEl.style.display = 'none';
      if (area) area.style.display = '';
      showQ3();
    }

    function showQ3() {
      if (qIdx >= questions3.length) { endQuiz3(); return; }
      var q = questions3[qIdx];

      // Image — starts as pure silhouette
      if (imgEl) {
        imgEl.src = '/assets/img/species/' + q.file + '.webp';
        imgEl.alt = 'Identifica esta especie';
        imgEl.style.display = '';
        imgEl.style.transition = 'none';
        imgEl.style.filter = 'brightness(0%) contrast(120%)';
      }

      // Build choices: 1 correct + 3 wrong
      var wrong3 = shuffle(SPECIES3.filter(function (s) { return s.name !== q.name; })).slice(0, 3);
      var choices3 = shuffle([q].concat(wrong3));

      if (choicesEl) {
        choicesEl.innerHTML = '';
        choices3.forEach(function (sp, idx) {
          var b = document.createElement('button');
          b.className = 'qz-choice'; b.textContent = sp.name;
          b.style.opacity = '0'; b.style.transform = 'translateY(10px)';
          b.style.transition = 'opacity .22s ease ' + (idx * 55) + 'ms, transform .22s ease ' + (idx * 55) + 'ms, background .12s, border-color .12s';
          setTimeout(function () { b.style.opacity = '1'; b.style.transform = 'none'; }, 20);
          b.addEventListener('click', function () { if (S3 === 'playing') answerQ3(sp.name === q.name, b, q); });
          choicesEl.appendChild(b);
        });
      }

      // Timer
      timerLeft3 = timerTotal3;
      if (timerFill) { timerFill.style.transition = 'none'; timerFill.style.width = '100%'; timerFill.style.backgroundColor = C.blue; }
      if (timerIv) clearInterval(timerIv);
      timerIv = setInterval(function () {
        if (S3 !== 'playing') { clearInterval(timerIv); return; }
        timerLeft3 -= 0.1;
        var pct = Math.max(0, timerLeft3 / timerTotal3);
        if (timerFill) {
          timerFill.style.width = (pct * 100) + '%';
          timerFill.style.backgroundColor = pct > 0.5 ? C.blue : pct > 0.25 ? C.orange : C.red;
        }
        // Gradual reveal: starts at 55% timer, fully revealed at 10%
        if (imgEl && pct < 0.55) {
          var revPct = 1 - pct / 0.55; // 0→1
          var brightness = Math.round(revPct * 100);
          var blur = (1 - revPct) * 5;
          imgEl.style.filter = 'brightness(' + brightness + '%) blur(' + blur + 'px)';
        }
        if (timerLeft3 <= 0) { clearInterval(timerIv); if (S3 === 'playing') timeOut3(q); }
      }, 100);

      msg3('Pregunta ' + (qIdx + 1) + '/6 · ' + q.hint);
    }

    function answerQ3(correct, clickedBtn, q) {
      if (timerIv) clearInterval(timerIv);
      S3 = 'feedback';
      if (imgEl) { imgEl.style.transition = 'filter .3s'; imgEl.style.filter = 'brightness(100%)'; }
      if (timerFill) timerFill.style.backgroundColor = correct ? C.green : C.red;
      choicesEl.querySelectorAll('.qz-choice').forEach(function (b) {
        b.disabled = true;
        if (b.textContent === q.name) b.classList.add('qz-correct');
        else if (b === clickedBtn && !correct) b.classList.add('qz-wrong');
      });
      if (correct) { score3++; SFX.correct(); msg3('¡Correcto! ' + q.fact, true); if (scoE3) scoE3.textContent = score3 + '/' + (qIdx + 1); }
      else { SFX.wrong(); msg3('Era ' + q.name + '. ' + q.fact, false); }
      setTimeout(function () { S3 = 'playing'; qIdx++; showQ3(); }, 2100);
    }

    function timeOut3(q) {
      S3 = 'feedback';
      if (imgEl) { imgEl.style.transition = 'filter .3s'; imgEl.style.filter = 'brightness(100%)'; }
      if (timerFill) timerFill.style.backgroundColor = C.red;
      choicesEl.querySelectorAll('.qz-choice').forEach(function (b) { b.disabled = true; if (b.textContent === q.name) b.classList.add('qz-correct'); });
      SFX.wrong(); msg3('¡Tiempo! Era ' + q.name + '. ' + q.fact, false);
      setTimeout(function () { S3 = 'playing'; qIdx++; showQ3(); }, 2200);
    }

    function endQuiz3() {
      S3 = 'done'; if (timerIv) clearInterval(timerIv);
      if (score3 > best3) { best3 = score3; lsSet('ajsp_quiz_best', best3); if (bstE3) bstE3.textContent = best3; }
      if (imgEl) imgEl.style.display = 'none';
      if (timerFill) timerFill.style.width = '0%';
      if (choicesEl) choicesEl.innerHTML = '';
      SFX.win();
      var pct3 = score3 / 6 * 100;
      var stars = score3 >= 5 ? '★★★' : score3 >= 3 ? '★★☆' : '★☆☆';
      if (resultEl) {
        resultEl.style.display = '';
        resultEl.innerHTML = '<div class="qz-result-inner"><div class="qz-result-stars">' + stars + '</div><div class="qz-result-bar"><span style="width:' + pct3 + '%"></span></div><div class="qz-result-label">' + score3 + '/6</div></div>';
      }
      var rating = score3 === 6 ? '¡Perfecto! Experto en peces. 🎣' : score3 >= 4 ? '¡Muy bien! Conoces las especies.' : score3 >= 2 ? '¡Sigue practicando!' : '¡Estudia las guías de especies!';
      msg3(rating, score3 >= 4);
      if (btn3) { btn3.textContent = 'Jugar otra vez'; btn3.disabled = false; }
    }

    if (btn3) btn3.addEventListener('click', function () {
      if (S3 === 'idle' || S3 === 'done') {
        if (timerIv) clearInterval(timerIv);
        if (resultEl) resultEl.style.display = 'none';
        startQuiz3();
        btn3.textContent = 'En juego...'; btn3.disabled = true;
      }
    });

    if (area) area.style.display = 'none';
    msg3('6 preguntas. La foto empieza oculta y se revela con el tiempo.');
  }


  /* ═══════════════════════════════════════════════════════════════
     GAME 4 — LANCE PERFECTO
     Phase 1: angle selection (pendulum arc)
     Phase 2: power bar selection
     Trajectory preview arc · wind indicator · screen shake
     ═══════════════════════════════════════════════════════════════ */
  function GameCast(root) {
    var cvs  = $('[data-ct-canvas]', root); if (!cvs) return;
    var ctx  = cvs.getContext('2d');
    var btn  = $('[data-ct-btn]',    root);
    var msgE = $('[data-ct-msg]',    root);
    var scoE = $('[data-ct-score]',  root);
    var bstE = $('[data-ct-best]',   root);

    var CW = 300, CH = 200;
    cvs.width = CW; cvs.height = CH;

    var S4 = 'idle';
    var castsLeft = 0, score4 = 0, best4 = lsGet('ajsp_cast_best', 0);
    if (bstE) bstE.textContent = best4;

    var ANGLER_X = 38, ANGLER_Y = 108;
    var WATER_Y4 = Math.floor(CH * 0.52);
    var ANGLE_MIN = 12, ANGLE_MAX = 68; // degrees
    var angleOsc = { v: ANGLE_MIN, dir: 1 }; // degrees per second * oscillation
    var powerOsc = { v: 0, dir: 1 };
    var lockedAngle = 0, lockedPower = 0;

    var lure4 = null;
    var ptcls4 = [], floats4 = [];
    var shake4 = new Shake();
    var wind4 = 0;
    var resultMsg4 = null;
    var landingMarks = []; // { x, y, col, age } — persist previous cast landings

    var TX = CW * 0.68, TY = CH * 0.72;
    var RINGS4 = [
      { r: 12, pts: 3, col: '#f87171' },
      { r: 24, pts: 2, col: '#f97316' },
      { r: 38, pts: 1, col: '#fbbf24' }
    ];

    function msg4(t, ok) {
      if (!msgE) return; msgE.textContent = t;
      msgE.style.color = ok == null ? '' : ok ? C.green : C.red;
    }

    function startCastGame() {
      castsLeft = 5; score4 = 0; wind4 = rand(-0.45, 0.45);
      lure4 = null; ptcls4 = []; floats4 = []; resultMsg4 = null; landingMarks = [];
      if (scoE) scoE.textContent = '0/5';
      beginAngle();
    }

    function beginAngle() {
      S4 = 'angle'; angleOsc.v = ANGLE_MIN; angleOsc.dir = 1;
      if (btn) { btn.textContent = 'Fijar ángulo'; btn.disabled = false; }
      msg4('Pulsa para fijar el ángulo de lanzamiento.');
    }

    function lockAngle4() {
      lockedAngle = angleOsc.v;
      S4 = 'power'; powerOsc.v = 0; powerOsc.dir = 1;
      if (btn) { btn.textContent = 'Lanzar'; btn.disabled = false; }
      msg4('Ángulo ' + Math.round(lockedAngle) + '°. Ahora ajusta la potencia.');
    }

    function launch4() {
      lockedPower = powerOsc.v;
      S4 = 'flying'; castsLeft--;
      if (btn) { btn.textContent = '...'; btn.disabled = true; }
      var aRad = lockedAngle * Math.PI / 180;
      var spd = lockedPower * 8;
      lure4 = {
        x: ANGLER_X + 18, y: ANGLER_Y - 20,
        vx: Math.cos(aRad) * spd + wind4 * 0.75,
        vy: -Math.sin(aRad) * spd,
        alive: true
      };
      SFX.swoosh();
      if (scoE) scoE.textContent = score4 + '/' + (5 - castsLeft);
    }

    function onAction4() {
      if (S4 === 'idle' || S4 === 'done') { S4 = 'starting'; startCastGame(); return; }
      if (S4 === 'angle') { lockAngle4(); return; }
      if (S4 === 'power') { launch4(); return; }
    }

    // Use btn click
    if (btn) btn.addEventListener('click', onAction4);
    // Canvas click for mobile
    cvs.addEventListener('click', function (e) {
      e.stopPropagation();
      if (S4 === 'angle' || S4 === 'power') onAction4();
    });
    // Keyboard
    var spaceDown4 = false;
    WIN.addEventListener('keydown', function (e) {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (!spaceDown4) { spaceDown4 = true; e.preventDefault(); onAction4(); }
      }
    });
    WIN.addEventListener('keyup', function (e) { if (e.code === 'Space' || e.code === 'Enter') spaceDown4 = false; });

    function checkLanding4() {
      if (!lure4 || !lure4.alive) return;
      if (lure4.y >= WATER_Y4 && lure4.x > ANGLER_X + 30) {
        lure4.alive = false;
        SFX.splash(); waterBurst(ptcls4, lure4.x, lure4.y, 14);
        var dx = lure4.x - TX, dy = lure4.y - TY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var pts4 = 0, label4 = '';
        if (dist <= RINGS4[0].r) { pts4 = 3; label4 = '¡CENTRO! 🎯'; SFX.win(); shake4.trig(9, 0.4); }
        else if (dist <= RINGS4[1].r) { pts4 = 2; label4 = '¡MUY BIEN!'; SFX.catch_(); shake4.trig(4, 0.25); }
        else if (dist <= RINGS4[2].r) { pts4 = 1; label4 = 'Cerca'; SFX.catch_(); }
        else { pts4 = 0; label4 = 'Fallado'; SFX.miss(); }
        score4 += pts4;
        // Register landing mark
        var markCol = pts4 === 3 ? RINGS4[0].col : pts4 === 2 ? RINGS4[1].col : pts4 === 1 ? RINGS4[2].col : C.muted;
        landingMarks.push({ x: lure4.x, y: lure4.y, col: markCol, age: 0, pts: pts4 });
        if (landingMarks.length > 5) landingMarks.shift();
        floats4.push(new FT(lure4.x, lure4.y - 18, pts4 > 0 ? '+' + pts4 : 'FALLO', pts4 > 1 ? C.green : pts4 === 1 ? C.orange : C.red));
        resultMsg4 = { text: label4 + (pts4 > 0 ? ' +' + pts4 : ''), col: pts4 > 1 ? C.green : pts4 === 1 ? C.orange : C.red, timer: 1.8 };
        msg4(label4 + (pts4 > 0 ? ' · +' + pts4 + ' puntos' : ''), pts4 > 0);
        if (scoE) scoE.textContent = score4 + '/' + (5 - castsLeft);
        setTimeout(function () {
          lure4 = null;
          if (castsLeft <= 0) endCastGame(); else beginAngle();
        }, 1350);
      }
      // Out of bounds
      if (lure4 && (lure4.x > CW + 25 || lure4.x < -10 || lure4.y > CH + 20)) {
        lure4.alive = false; SFX.miss();
        resultMsg4 = { text: 'FUERA', col: C.red, timer: 1.5 };
        msg4('¡Fuera! Ajusta ángulo y potencia.', false);
        setTimeout(function () { lure4 = null; if (castsLeft <= 0) endCastGame(); else beginAngle(); }, 1350);
      }
    }

    function endCastGame() {
      S4 = 'done';
      if (score4 > best4) { best4 = score4; lsSet('ajsp_cast_best', best4); if (bstE) bstE.textContent = best4; }
      SFX.win();
      var rating = score4 >= 12 ? '¡Maestro del lance! 🏆' : score4 >= 8 ? '¡Gran precisión!' : score4 >= 4 ? '¡Sigue practicando!' : '¡A entrenar!';
      msg4(rating + ' · ' + score4 + '/15 pts', score4 >= 8);
      if (btn) { btn.textContent = 'Jugar otra vez'; btn.disabled = false; }
    }

    // Trajectory arc preview
    function arcPts(angleDeg, power) {
      var pts = [], aRad = angleDeg * Math.PI / 180, spd = power * 8;
      var vx = Math.cos(aRad) * spd + wind4 * 0.75, vy = -Math.sin(aRad) * spd;
      var x = ANGLER_X + 18, y = ANGLER_Y - 20;
      for (var t = 0; t < 150; t++) {
        pts.push({ x: x, y: y }); x += vx; y += vy; vy += 0.22;
        if (y >= WATER_Y4 && x > ANGLER_X + 25) break;
        if (x > CW + 10 || x < 0) break;
      }
      return pts;
    }

    var lt4 = 0;
    function step4(ts) {
      var dt = Math.min((ts - lt4) / 1000, 0.05); lt4 = ts;
      shake4.up(dt); updP(ptcls4, dt);
      floats4 = floats4.filter(function (f) { f.up(dt); return f.life > 0; });
      if (resultMsg4) resultMsg4.timer -= dt;

      if (S4 === 'angle') {
        var oscSpd = (ANGLE_MAX - ANGLE_MIN) * 0.9 * dt;
        angleOsc.v += angleOsc.dir * oscSpd;
        if (angleOsc.v >= ANGLE_MAX) { angleOsc.v = ANGLE_MAX; angleOsc.dir = -1; }
        if (angleOsc.v <= ANGLE_MIN) { angleOsc.v = ANGLE_MIN; angleOsc.dir =  1; }
      }
      if (S4 === 'power') {
        powerOsc.v += powerOsc.dir * 1.15 * dt;
        if (powerOsc.v >= 1) { powerOsc.v = 1; powerOsc.dir = -1; }
        if (powerOsc.v <= 0) { powerOsc.v = 0; powerOsc.dir =  1; }
      }
      if (S4 === 'flying' && lure4 && lure4.alive) {
        lure4.x += lure4.vx; lure4.y += lure4.vy; lure4.vy += 0.22;
        checkLanding4();
      }
      landingMarks.forEach(function (m) { m.age += dt; });

      draw4(ts);
      raf(step4);
    }

    function draw4(ts) {
      ctx.save(); ctx.translate(shake4.x, shake4.y);

      // Sky
      var sg = ctx.createLinearGradient(0, 0, 0, WATER_Y4);
      sg.addColorStop(0, '#02060f'); sg.addColorStop(1, '#062840');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, CW, WATER_Y4);
      // Stars
      [[45,10],[90,22],[155,7],[215,18],[270,28],[110,33],[185,5]].forEach(function (s) {
        ctx.fillStyle = 'rgba(200,230,255,' + (0.5 + Math.sin(ts * 0.002 + s[0]) * 0.25) + ')';
        ctx.beginPath(); ctx.arc(s[0], s[1], 0.9, 0, Math.PI * 2); ctx.fill();
      });
      // Water
      var wg = ctx.createLinearGradient(0, WATER_Y4, 0, CH);
      wg.addColorStop(0, '#062840'); wg.addColorStop(1, '#041520');
      ctx.fillStyle = wg; ctx.fillRect(0, WATER_Y4, CW, CH - WATER_Y4);
      // Shore
      var shore = ctx.createLinearGradient(0, WATER_Y4 - 10, 0, WATER_Y4 + 8);
      shore.addColorStop(0, '#1e4a12'); shore.addColorStop(1, '#0a1a05');
      ctx.fillStyle = shore; ctx.fillRect(0, WATER_Y4 - 10, ANGLER_X + 12, 18);
      // Water ripples
      for (var wi = 0; wi < 3; wi++) {
        ctx.strokeStyle = 'rgba(74,184,247,0.07)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (var wx = 0; wx <= CW; wx += 3) {
          var wpy = WATER_Y4 + wi * (CH - WATER_Y4) * 0.22 + Math.sin(wx * 0.02 + ts * 0.0013 + wi * 2) * 2.5;
          if (wx === 0) ctx.moveTo(wx, wpy); else ctx.lineTo(wx, wpy);
        }
        ctx.stroke();
      }

      // Previous landing marks (ripple rings)
      landingMarks.forEach(function (m) {
        var mA = clamp(1 - m.age * 0.4, 0.1, 0.7);
        // ripple expanding ring
        var rippleR = 4 + m.age * 18;
        ctx.strokeStyle = m.col; ctx.lineWidth = 1.5; ctx.globalAlpha = clamp(1 - m.age * 0.5, 0, 0.6);
        ctx.beginPath(); ctx.arc(m.x, m.y, Math.min(rippleR, 30), 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        // center dot
        ctx.fillStyle = m.col; ctx.globalAlpha = mA;
        ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        // pts label
        if (m.pts > 0 && m.age < 2.5) {
          ctx.fillStyle = m.col; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
          ctx.globalAlpha = clamp(1 - m.age * 0.4, 0, 0.85);
          ctx.fillText('+' + m.pts, m.x, m.y - 7); ctx.globalAlpha = 1;
        }
      });

      // Target rings (pulsing)
      for (var ri = RINGS4.length - 1; ri >= 0; ri--) {
        var ring = RINGS4[ri];
        var pulse = (Math.sin(ts * 0.004 + ri * 1.5) + 1) * 0.14;
        var rr = ring.r + pulse * 4;
        ctx.beginPath(); ctx.arc(TX, TY, rr, 0, Math.PI * 2);
        ctx.strokeStyle = ring.col; ctx.lineWidth = ri === 0 ? 2.5 : 1.5;
        ctx.globalAlpha = 0.55 + pulse; ctx.stroke(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(TX, TY, rr, 0, Math.PI * 2);
        ctx.fillStyle = ring.col; ctx.globalAlpha = 0.06; ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = RINGS4[0].col; ctx.beginPath(); ctx.arc(TX, TY, 3.2, 0, Math.PI * 2); ctx.fill();

      // Trajectory preview
      var showArc = S4 === 'angle' || S4 === 'power';
      if (showArc) {
        var prevAngle = S4 === 'angle' ? angleOsc.v : lockedAngle;
        var prevPower = S4 === 'power' ? powerOsc.v : 0.55;
        var ap = arcPts(prevAngle, prevPower);
        if (ap.length > 1) {
          ctx.strokeStyle = S4 === 'power' ? 'rgba(74,184,247,0.65)' : 'rgba(74,184,247,0.28)';
          ctx.lineWidth = 1.5; ctx.setLineDash([4, 7]);
          ctx.beginPath(); ctx.moveTo(ap[0].x, ap[0].y);
          for (var ai = 1; ai < ap.length; ai++) ctx.lineTo(ap[ai].x, ap[ai].y);
          ctx.stroke(); ctx.setLineDash([]);
          // landing marker
          var last4 = ap[ap.length - 1];
          ctx.fillStyle = 'rgba(74,184,247,0.7)'; ctx.beginPath(); ctx.arc(last4.x, last4.y, 3.5, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Angler silhouette
      var ax4 = ANGLER_X, ay4 = ANGLER_Y;
      ctx.fillStyle = '#102018'; ctx.fillRect(ax4 - 7, ay4 - 18, 14, 14); // body
      ctx.fillStyle = '#d4a074'; ctx.beginPath(); ctx.arc(ax4, ay4 - 23, 6.5, 0, Math.PI * 2); ctx.fill(); // head
      ctx.fillStyle = '#3a1a05'; ctx.fillRect(ax4 - 7, ay4 - 30, 14, 4); ctx.fillRect(ax4 - 5, ay4 - 34, 10, 5); // hat
      // Rod
      var rodDeg = S4 === 'angle' ? angleOsc.v : (S4 === 'power' || S4 === 'flying' || S4 === 'done') ? lockedAngle : 35;
      var rodRad = rodDeg * Math.PI / 180;
      var rodLen = 26;
      var rtx = ax4 + 5 + Math.cos(rodRad) * rodLen, rty = (ay4 - 16) - Math.sin(rodRad) * rodLen;
      ctx.strokeStyle = '#9a7015'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ax4 + 5, ay4 - 16); ctx.lineTo(rtx, rty); ctx.stroke();
      ctx.lineCap = 'butt';
      // Line to lure
      if (lure4 && lure4.alive) {
        ctx.strokeStyle = 'rgba(200,220,240,.45)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(rtx, rty); ctx.lineTo(lure4.x, lure4.y); ctx.stroke();
      }

      // Lure
      if (lure4 && lure4.alive) {
        var lang4 = Math.atan2(lure4.vy, lure4.vx);
        ctx.save(); ctx.translate(lure4.x, lure4.y); ctx.rotate(lang4);
        drawFish(ctx, 0, 0, 5.5, C.yellow, false);
        ctx.globalAlpha = 0.32; ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(-9, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.16; ctx.beginPath(); ctx.arc(-16, 0, 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      drwP(ctx, ptcls4); floats4.forEach(function (f) { f.dr(ctx); });

      // Result text float
      if (resultMsg4 && resultMsg4.timer > 0) {
        var ra = clamp(resultMsg4.timer, 0, 1);
        ctx.globalAlpha = ra; ctx.fillStyle = resultMsg4.col;
        ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 6;
        ctx.fillText(resultMsg4.text, TX, TY - 52 + (2 - resultMsg4.timer) * 6);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }

      // ANGLE PHASE UI: arc indicator
      if (S4 === 'angle') {
        var aDeg = angleOsc.v, aRad2 = aDeg * Math.PI / 180;
        var aimLen = 42, aimX = ax4 + 5 + Math.cos(aRad2) * aimLen, aimY = (ay4 - 16) - Math.sin(aRad2) * aimLen;
        // arc range
        ctx.strokeStyle = 'rgba(74,184,247,0.22)'; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.arc(ax4 + 5, ay4 - 16, aimLen, -ANGLE_MAX * Math.PI / 180, -ANGLE_MIN * Math.PI / 180); ctx.stroke();
        // pointer
        ctx.strokeStyle = C.yellow; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.moveTo(ax4 + 5, ay4 - 16); ctx.lineTo(aimX, aimY); ctx.stroke();
        // arrowhead
        ctx.fillStyle = C.yellow;
        ctx.beginPath(); ctx.arc(aimX, aimY, 4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.yellow; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left';
        ctx.fillText(Math.round(aDeg) + '°', ax4 + 8, ay4 - 40);
      }

      // POWER PHASE UI: bar
      if (S4 === 'power') {
        var bx4 = 8, by4 = CH - 30, bw4 = 78, bh4 = 10;
        ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(bx4, by4, bw4, bh4);
        var barCol4 = powerOsc.v < 0.4 ? C.blue : powerOsc.v < 0.75 ? C.orange : C.red;
        ctx.fillStyle = barCol4; ctx.fillRect(bx4, by4, bw4 * powerOsc.v, bh4);
        ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1; ctx.strokeRect(bx4, by4, bw4, bh4);
        ctx.fillStyle = C.text2; ctx.font = '8px monospace'; ctx.textAlign = 'left';
        ctx.fillText('POTENCIA', bx4, by4 - 3);
        // Ideal zone marker (sweet spot center)
        var idealX = bx4 + bw4 * 0.7;
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(idealX, by4 - 2); ctx.lineTo(idealX, by4 + bh4 + 2); ctx.stroke();
      }

      // Wind indicator
      var wax = CW - 52, way = 28;
      ctx.fillStyle = C.muted; ctx.font = '7px monospace'; ctx.textAlign = 'center';
      ctx.fillText('VIENTO', wax, way - 6);
      var arrowLen = 14 * Math.abs(wind4), wDir = wind4 >= 0 ? 1 : -1;
      if (Math.abs(wind4) > 0.05) {
        ctx.strokeStyle = C.blue; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.75;
        ctx.beginPath(); ctx.moveTo(wax - wDir * arrowLen / 2, way); ctx.lineTo(wax + wDir * arrowLen / 2, way); ctx.stroke();
        var ae = wax + wDir * arrowLen / 2;
        ctx.beginPath(); ctx.moveTo(ae, way); ctx.lineTo(ae - 5 * wDir, way - 3); ctx.moveTo(ae, way); ctx.lineTo(ae - 5 * wDir, way + 3); ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = C.muted; ctx.fillText('CALMA', wax, way + 10);
      }

      // Casts HUD
      ctx.fillStyle = 'rgba(2,8,18,0.78)'; ctx.fillRect(CW - 72, 0, 72, 18);
      ctx.fillStyle = C.text2; ctx.font = '8px monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('Lances: ' + castsLeft, CW - 5, 12);

      // Idle overlay
      if (S4 === 'idle') {
        ctx.fillStyle = 'rgba(2,8,18,0.84)'; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = C.blue; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Lance Perfecto', CW / 2, CH * 0.32);
        ctx.fillStyle = C.text2; ctx.font = '9px monospace';
        ctx.fillText('1. Fija el ángulo  2. Ajusta potencia  3. ¡Lanza!', CW / 2, CH * 0.48);
        ctx.fillStyle = C.muted; ctx.font = '8px monospace';
        ctx.fillText('Espacio o botón · 5 lances · máx 15 pts', CW / 2, CH * 0.62);
        ctx.textBaseline = 'alphabetic';
      }
      // Done overlay
      if (S4 === 'done') {
        ctx.fillStyle = 'rgba(2,8,18,0.84)'; ctx.fillRect(0, 0, CW, CH);
        var tc = score4 >= 12 ? C.yellow : score4 >= 8 ? C.blue : C.text2;
        ctx.fillStyle = tc; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(score4 + ' / 15 pts', CW / 2, CH * 0.36);
        ctx.fillStyle = C.text2; ctx.font = '9px monospace';
        ctx.fillText('Récord: ' + best4, CW / 2, CH * 0.52);
        if (score4 >= 12) { ctx.font = '22px serif'; ctx.fillText('🏆', CW / 2, CH * 0.7); }
        ctx.textBaseline = 'alphabetic';
      }

      ctx.restore();
    }

    S4 = 'idle';
    if (btn) { btn.textContent = 'Lanzar'; btn.disabled = false; }
    raf(function (ts) { lt4 = ts; raf(step4); });
  }


  /* ── INIT ───────────────────────────────────────────────────── */
  function init() {
    var g1 = document.querySelector('[data-game-stardew]');
    var g2 = document.querySelector('[data-game-reflex]');
    var g3 = document.querySelector('[data-game-quiz]');
    var g4 = document.querySelector('[data-game-cast]');
    if (g1) GameFishing(g1);
    if (g2) GameReflex(g2);
    if (g3) GameQuiz(g3);
    if (g4) GameCast(g4);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

}(window));
