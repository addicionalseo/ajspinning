/* ═══════════════════════════════════════════════════════════════
   AJSpinning — Home Games v1
   Game 1 · Pescador Libre      (top-down adventure fishing)
   Game 2 · Toque de picada     (reflex / timing game)
   Game 3 · ¿Qué especie?       (species photo quiz)
   ═══════════════════════════════════════════════════════════════ */
(function (WIN) {
  'use strict';

  if (!WIN.requestAnimationFrame) return;
  var raf = WIN.requestAnimationFrame.bind(WIN);

  // ── utils ────────────────────────────────────────────────────
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b)  { return a + Math.random() * (b - a); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // canvas roundRect polyfill
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      this.beginPath();
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.arcTo(x + w, y, x + w, y + r, r);
      this.lineTo(x + w, y + h - r);
      this.arcTo(x + w, y + h, x + w - r, y + h, r);
      this.lineTo(x + r, y + h);
      this.arcTo(x, y + h, x, y + h - r, r);
      this.lineTo(x, y + r);
      this.arcTo(x, y, x + r, y, r);
      this.closePath();
    };
  }

  // palette (Ocean Depth)
  var C = {
    bg:     '#04101e', surf:  '#081828',
    water:  '#062840', waterD:'#041a2e',
    blue:   '#4ab8f7', blueD: '#2a9ee4',
    green:  '#22c55e', orange:'#f97316',
    red:    '#f87171', text:  '#cce4f8',
    text2:  '#8ab8d6', border:'#1a3555'
  };

  /* ═══════════════════════════════════════════════════════════
     GAME 1: PESCADOR LIBRE  (top-down adventure fishing)
     ═══════════════════════════════════════════════════════════ */
  function GameFishing(root) {
    var cvs  = $('[data-sg-canvas]', root);
    if (!cvs) return;
    var ctx  = cvs.getContext('2d');
    var btn  = $('[data-sg-btn]',    root);
    var msgE = $('[data-sg-msg]',    root);
    var scoE = $('[data-sg-score]',  root);
    var strE = $('[data-sg-streak]', root);

    // Fixed logical canvas size — CSS scales it
    var CW = 300, CH = 240;
    cvs.width = CW; cvs.height = CH;

    var TS = 20; // tile size px
    var COLS = 15, ROWS = 12;

    // ── map layout ───────────────────────────────────────
    // G=grass  T=tree  P=path  d=dock  W=water  B=boat-spot
    var MAP = [
      'GGGGGGGGGGGGGGG',  // 0
      'GTGGGGGGGGGGGTG',  // 1
      'GGGGGGGGGGGGGGG',  // 2  player starts col 4, row 2
      'GGGGGGGGGGGGGGG',  // 3
      'GGGGGGGGpGGGGGG',  // 4  (p = stone path)
      'GGGGGGGGpGGGGGG',  // 5
      'GGGGGGGGpddddGG',  // 6  dock starts
      'WWWWWWWWWddddWW',  // 7  water + dock
      'WWWWWWWWWWWWWWW',  // 8
      'WWWWWWWWWWWWWWW',  // 9
      'WWWWWWWWWWWWWWW',  // 10
      'WWWWWWWWWWWWWWW',  // 11
    ];

    var WATER_ROW = 7;                         // first all-water row
    var WATER_Y   = WATER_ROW * TS;            // 140px
    var BOAT_COL  = 11, BOAT_ROW = 7;          // boat rests here
    var BOAT_X    = BOAT_COL * TS + TS / 2;
    var BOAT_Y    = BOAT_ROW * TS + TS / 2;

    // fishing hotspots (column, row, hint radius)
    var SPOTS = [
      { c: 2,  r: 8  }, { c: 13, r: 8  },
      { c: 5,  r: 10 }, { c: 11, r: 9  },
      { c: 7,  r: 11 }, { c: 12, r: 11 },
    ];

    // tile helpers
    function tileXY(px, py) {
      var c = Math.floor(px / TS), r = Math.floor(py / TS);
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return '#';
      return MAP[r][c];
    }
    function tileRC(c, r) {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return '#';
      return MAP[r][c];
    }
    function canFoot(t) { return 'GpTd'.indexOf(t) >= 0 && t !== 'T'; }
    function canBoat(t) { return t === 'W' || t === 'd'; }

    // ── game state ───────────────────────────────────────
    var S = 'idle';    // idle | play | win
    var score = 0, best = 0;

    // player
    var PL = { x: 4*TS+TS/2, y: 2*TS+TS/2, dir: 0, frame: 0, frameT: 0, inBoat: false };
    // dir: 0=down 1=right 2=up 3=left

    // fishing
    var FS = { on: false, floatX: 0, floatY: 0, biting: false, waitMs: 0, waitT: 0, biteMs: 0 };

    // particles (catch sparkles)
    var ptcls = [];

    // keys
    var keys  = { up: false, dn: false, lt: false, rt: false };
    var actDown = false, actConsumed = true; // one-shot action

    // ── controls ─────────────────────────────────────────
    // D-pad drawn on canvas; track touch IDs
    var DPAD_CX = 40, DPAD_CY = CH - 38;
    var ACT_X   = CW - 38, ACT_Y = CH - 38;

    function dpadDirAt(x, y) {
      var dx = x - DPAD_CX, dy = y - DPAD_CY, d = Math.sqrt(dx*dx+dy*dy);
      if (d < 6 || d > 50) return null;
      var a = Math.atan2(dy, dx);
      if (a > -Math.PI*0.25 && a <= Math.PI*0.25)  return 'rt';
      if (a > Math.PI*0.25  && a <= Math.PI*0.75)  return 'dn';
      if (a > -Math.PI*0.75 && a <= -Math.PI*0.25) return 'up';
      return 'lt';
    }

    function cvsPt(e) {
      var r = cvs.getBoundingClientRect();
      var src = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
      return { x: (src.clientX - r.left) * CW / r.width,
               y: (src.clientY - r.top)  * CH / r.height };
    }

    var touchDirs = {}; // touchId → key string
    function onTStart(e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var p = cvsPt({ changedTouches: [t] });
        var da = Math.sqrt((p.x-ACT_X)*(p.x-ACT_X)+(p.y-ACT_Y)*(p.y-ACT_Y));
        if (da < 28) {
          touchDirs[t.identifier] = 'act';
          if (!actDown) { actDown = true; actConsumed = false; }
        } else {
          var dir = dpadDirAt(p.x, p.y);
          if (dir) { touchDirs[t.identifier] = dir; keys[dir] = true; }
        }
      }
    }
    function onTEnd(e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var id = e.changedTouches[i].identifier;
        var was = touchDirs[id];
        if (was === 'act') actDown = false;
        else if (was) keys[was] = false;
        delete touchDirs[id];
      }
    }
    cvs.addEventListener('touchstart',  onTStart, { passive: false });
    cvs.addEventListener('touchend',    onTEnd,   { passive: false });
    cvs.addEventListener('touchcancel', onTEnd,   { passive: false });

    var KB = { ArrowUp:'up', ArrowDown:'dn', ArrowLeft:'lt', ArrowRight:'rt',
               KeyW:'up', KeyS:'dn', KeyA:'lt', KeyD:'rt' };
    WIN.addEventListener('keydown', function(e) {
      var k = KB[e.code];
      if (k) { keys[k] = true; return; }
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
        e.preventDefault();
        if (!actDown) { actDown = true; actConsumed = false; }
      }
    });
    WIN.addEventListener('keyup', function(e) {
      var k = KB[e.code];
      if (k) keys[k] = false;
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') actDown = false;
    });

    if (btn) btn.addEventListener('click', function() {
      if (S === 'idle' || S === 'win') startGame();
    });

    // ── helpers ──────────────────────────────────────────
    function msg(t, ok) {
      if (!msgE) return;
      msgE.textContent = t;
      msgE.style.color = ok == null ? C.text2 : ok ? C.green : C.red;
    }

    function startGame() {
      PL.x = 4*TS+TS/2; PL.y = 2*TS+TS/2;
      PL.dir = 0; PL.frame = 0; PL.inBoat = false;
      FS.on = false; FS.biting = false;
      score = 0; ptcls = [];
      if (scoE) scoE.textContent = '0/5';
      S = 'play';
      if (btn) { btn.textContent = ''; btn.disabled = true; }
      msg('Camina hacia el lago · Espacio/A para pescar');
    }

    // fishing: find water in front of player or around boat
    function castRod() {
      if (FS.on) return;
      var FACE = [[0,1],[1,0],[0,-1],[-1,0]];
      var fd = FACE[PL.dir];
      var fx = -1, fy = -1;
      // search 1..4 tiles ahead
      for (var d = 1; d <= 4; d++) {
        var nx = PL.x + fd[0]*d*TS, ny = PL.y + fd[1]*d*TS;
        var t  = tileXY(nx, ny);
        if (t === 'W') {
          // cast into water, random offset to the sides for variety
          var perp = [-fd[1], fd[0]];
          fx = nx + fd[0]*rand(0.3,0.9)*TS + perp[0]*rand(-0.4,0.4)*TS;
          fy = ny + fd[1]*rand(0.3,0.9)*TS + perp[1]*rand(-0.4,0.4)*TS;
          break;
        }
      }
      if (fx < 0) { msg('Gírate hacia el agua para lanzar', false); return; }
      fx = clamp(fx, TS, CW - TS);
      fy = clamp(fy, WATER_Y + 4, CH - 30);
      FS.on = true; FS.biting = false;
      FS.floatX = fx; FS.floatY = fy;
      FS.waitMs = 0; FS.waitT = rand(2200, 5200); FS.biteMs = 0;
      msg('Flotador lanzado. Espera la picada…');
    }

    function reelIn() {
      if (!FS.on) return;
      if (FS.biting) {
        FS.on = false; FS.biting = false;
        score++;
        var names = PL.inBoat
          ? ['Lucio','Lucioperca','Black Bass','Siluro']
          : ['Perca','Trucha','Carpa','Lucio'];
        var nm = names[Math.floor(Math.random()*names.length)];
        if (scoE) scoE.textContent = score + '/5';
        for (var i = 0; i < 14; i++) ptcls.push({
          x: FS.floatX, y: FS.floatY,
          vx: rand(-3.5,3.5), vy: rand(-5,-0.5),
          r: rand(2,5), life: 1,
          col: PL.inBoat ? '#f97316' : C.green
        });
        msg('¡' + nm + ' capturado! +1 🎣', true);
        if (score >= 5) {
          setTimeout(function() {
            if (score > best) { best = score; if (strE) strE.textContent = best; }
            S = 'win';
            if (btn) { btn.textContent = 'Pescar más'; btn.disabled = false; }
            msg('¡5 peces! ¡Sesión completada!', true);
          }, 1100);
        }
      } else {
        FS.on = false;
        msg('Demasiado pronto. El pez se asustó.', false);
      }
    }

    function tryBoard() {
      var dx = PL.x - BOAT_X, dy = PL.y - BOAT_Y;
      if (Math.sqrt(dx*dx+dy*dy) < TS * 1.4) {
        PL.inBoat = true;
        msg('¡En el barco! Navega al lago y pesca.');
        return true;
      }
      return false;
    }

    function tryDisembark() {
      var c = Math.round((PL.x - TS/2) / TS), r2 = Math.round((PL.y - TS/2) / TS);
      var nb = [[0,-1],[0,1],[1,0],[-1,0]];
      for (var n = 0; n < nb.length; n++) {
        var tc = tileRC(c + nb[n][0], r2 + nb[n][1]);
        if (tc === 'd') {
          PL.x = (c + nb[n][0]) * TS + TS/2;
          PL.y = (r2 + nb[n][1]) * TS + TS/2;
          PL.inBoat = false;
          msg('Bajaste del barco.');
          return true;
        }
      }
      msg('Acércate al muelle para bajar.', false);
      return false;
    }

    // ── update loop ───────────────────────────────────────
    var lt = 0;
    function step(ts) {
      var dt = Math.min(ts - lt, 50) / 1000; lt = ts;

      // consume one-shot action
      var act = !actConsumed && actDown === false;
      if (!actConsumed && actDown) act = true;   // also fire while held (once)
      if (act) actConsumed = true;

      // particles
      for (var i = ptcls.length - 1; i >= 0; i--) {
        var p = ptcls[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= dt * 1.5;
        if (p.life <= 0) ptcls.splice(i, 1);
      }

      if (S === 'play') {
        // ── movement ──
        var mvx = (keys.rt ? 1 : 0) - (keys.lt ? 1 : 0);
        var mvy = (keys.dn ? 1 : 0) - (keys.up ? 1 : 0);

        if (mvx !== 0 || mvy !== 0) {
          if      (mvx > 0) PL.dir = 1;
          else if (mvx < 0) PL.dir = 3;
          else if (mvy > 0) PL.dir = 0;
          else               PL.dir = 2;

          var len = Math.sqrt(mvx*mvx + mvy*mvy);
          mvx /= len; mvy /= len;
          var spd = 82;
          var hw = 7, hh = 7;
          var chk = PL.inBoat ? canBoat : canFoot;

          var nx2 = PL.x + mvx * spd * dt;
          if (chk(tileXY(nx2+hw, PL.y)) && chk(tileXY(nx2-hw, PL.y)) &&
              chk(tileXY(nx2+hw, PL.y-hh)) && chk(tileXY(nx2-hw, PL.y-hh))) PL.x = nx2;

          var ny2 = PL.y + mvy * spd * dt;
          if (chk(tileXY(PL.x+hw, ny2+hh)) && chk(tileXY(PL.x-hw, ny2+hh)) &&
              chk(tileXY(PL.x+hw, ny2-hh)) && chk(tileXY(PL.x-hw, ny2-hh))) PL.y = ny2;

          // clamp to map bounds
          PL.x = clamp(PL.x, hw + 1, CW - hw - 1);
          PL.y = clamp(PL.y, hh + 1, CH - hh - 1);

          PL.frameT += dt;
          if (PL.frameT > 0.2) { PL.frame = (PL.frame + 1) % 4; PL.frameT = 0; }

          // cancel cast when moving (only if not biting)
          if (FS.on && !FS.biting) { FS.on = false; }
        }

        // ── action ──
        if (act) {
          if (FS.on) {
            reelIn();
          } else if (!PL.inBoat) {
            if (!tryBoard()) castRod();
          } else {
            // in boat: disembark near dock, else fish
            var c2 = Math.round((PL.x - TS/2) / TS), r3 = Math.round((PL.y - TS/2) / TS);
            var nearD = false;
            var nb2 = [[0,-1],[0,1],[1,0],[-1,0]];
            for (var ni = 0; ni < nb2.length; ni++) {
              if (tileRC(c2+nb2[ni][0], r3+nb2[ni][1]) === 'd') { nearD = true; break; }
            }
            if (nearD) tryDisembark(); else castRod();
          }
        }

        // ── fishing sim ──
        if (FS.on) {
          FS.waitMs += dt * 1000;
          if (!FS.biting && FS.waitMs >= FS.waitT) {
            FS.biting = true; FS.biteMs = 0;
            msg('¡¡PICADA!! Pulsa Espacio/A rápido 🎣', true);
          }
          if (FS.biting) {
            FS.biteMs += dt * 1000;
            if (FS.biteMs > 1900) {
              FS.on = false; FS.biting = false;
              msg('El pez se escapó…', false);
            }
          }
        }
      }

      draw(ts);
      raf(step);
    }

    // ── draw ─────────────────────────────────────────────
    function draw(ts) {
      var T = ts || 0;
      ctx.clearRect(0, 0, CW, CH);

      // ── tiles ──
      for (var row = 0; row < ROWS; row++) {
        for (var col = 0; col < COLS; col++) {
          var tx = col * TS, ty = row * TS;
          var t  = MAP[row][col];

          if (t === 'G') {
            ctx.fillStyle = (col + row) % 2 === 0 ? '#26521e' : '#2b5a22';
            ctx.fillRect(tx, ty, TS, TS);
            // subtle grass detail
            if ((col * 3 + row * 7) % 5 === 0) {
              ctx.fillStyle = 'rgba(50,120,40,0.4)';
              ctx.fillRect(tx + 2, ty + 3, 5, 2);
              ctx.fillRect(tx + 9, ty + 12, 4, 2);
            }
          } else if (t === 'p') {
            ctx.fillStyle = '#7a6540';
            ctx.fillRect(tx, ty, TS, TS);
            ctx.fillStyle = '#6a5530';
            ctx.fillRect(tx+2, ty+2, 7, 7);
            ctx.fillRect(tx+11, ty+11, 7, 7);
          } else if (t === 'd') {
            ctx.fillStyle = '#7a5c18';
            ctx.fillRect(tx, ty, TS, TS);
            ctx.fillStyle = '#694e14';
            ctx.fillRect(tx, ty+5, TS, 2);
            ctx.fillRect(tx, ty+13, TS, 2);
          } else if (t === 'T') {
            ctx.fillStyle = '#26521e'; ctx.fillRect(tx, ty, TS, TS); // ground under tree
          } else if (t === 'W') {
            var ph = T * 0.0007 + col * 0.28 + row * 0.36;
            var bright = 0.82 + Math.sin(ph) * 0.1;
            ctx.fillStyle = 'rgb(' + Math.round(6*bright) + ',' + Math.round(55*bright) + ',' + Math.round(110*bright) + ')';
            ctx.fillRect(tx, ty, TS, TS);
          }
        }
      }

      // water shimmer streaks
      ctx.strokeStyle = 'rgba(120,200,255,0.07)'; ctx.lineWidth = 1;
      for (var wr = WATER_ROW; wr < ROWS; wr++) {
        for (var wc = 0; wc < COLS; wc++) {
          var ph2 = T * 0.001 + wc * 0.6 + wr * 0.8;
          var sl = 3 + Math.sin(ph2) * 3;
          if (sl > 0.5) {
            ctx.beginPath();
            ctx.moveTo(wc*TS + 3, wr*TS + TS/2 + Math.sin(ph2*0.5)*3);
            ctx.lineTo(wc*TS + 3 + sl, wr*TS + TS/2 + Math.sin(ph2*0.5)*3);
            ctx.stroke();
          }
        }
      }

      // trees (drawn on top of grass)
      for (var tr = 0; tr < ROWS; tr++) {
        for (var tc = 0; tc < COLS; tc++) {
          if (MAP[tr][tc] !== 'T') continue;
          var ttx = tc*TS+TS/2, tty = tr*TS + TS - 2;
          ctx.fillStyle = '#5a3c10'; ctx.fillRect(ttx-3, tty-8, 6, 12);
          ctx.fillStyle = '#1c4a18'; ctx.beginPath(); ctx.arc(ttx, tty-14, 13, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#286024'; ctx.beginPath(); ctx.arc(ttx-4, tty-17, 8,  0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#286024'; ctx.beginPath(); ctx.arc(ttx+4, tty-16, 7,  0, Math.PI*2); ctx.fill();
        }
      }

      // fishing hotspot glows
      for (var si = 0; si < SPOTS.length; si++) {
        var sp = SPOTS[si];
        var sx = sp.c*TS+TS/2, sy = sp.r*TS+TS/2;
        var pulse = (Math.sin(T*0.003 + si*1.1) + 1) * 0.5;
        ctx.beginPath(); ctx.arc(sx, sy, 9 + pulse*6, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(74,184,247,' + (0.18 + pulse*0.2) + ')';
        ctx.lineWidth = 1.5; ctx.stroke();
      }

      // boat (only if player not in it, or draw as base when in boat)
      if (!PL.inBoat) drawBoat(BOAT_X, BOAT_Y, T);

      // fishing line + float
      if (FS.on) {
        var bob = FS.biting
          ? Math.sin(T * 0.022) * 6
          : Math.sin(T * 0.005) * 2.5;
        var floatDrawY = FS.floatY + bob;

        // tension line
        ctx.strokeStyle = 'rgba(220,220,220,0.6)'; ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(PL.x, PL.y - 10);
        // slight curve
        ctx.quadraticCurveTo(
          (PL.x + FS.floatX) * 0.5,
          Math.min(PL.y, floatDrawY) - 15,
          FS.floatX, floatDrawY
        );
        ctx.stroke();

        // float
        ctx.save(); ctx.translate(FS.floatX, floatDrawY);
        if (FS.biting) ctx.rotate(Math.sin(T*0.022)*0.35);
        ctx.fillStyle = '#f0f4f8'; ctx.beginPath(); ctx.ellipse(0,-3,2.5,5,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.ellipse(0,3,2.5,4,0,0,Math.PI*2); ctx.fill();
        ctx.restore();

        // bite ripples
        if (FS.biting) {
          var br = (FS.biteMs / 1900) * 18;
          ctx.beginPath(); ctx.arc(FS.floatX, FS.floatY, br, 0, Math.PI*2);
          ctx.strokeStyle = 'rgba(249,115,22,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.beginPath(); ctx.arc(FS.floatX, FS.floatY, br*0.55, 0, Math.PI*2);
          ctx.strokeStyle = 'rgba(249,115,22,0.3)'; ctx.lineWidth = 1; ctx.stroke();
        }
      }

      // player
      drawPlayer(T);

      // particles
      for (var j = 0; j < ptcls.length; j++) {
        var pp = ptcls[j];
        ctx.globalAlpha = Math.max(0, pp.life);
        ctx.beginPath(); ctx.arc(pp.x, pp.y, pp.r, 0, Math.PI*2);
        ctx.fillStyle = pp.col; ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── HUD top bar ──
      ctx.fillStyle = 'rgba(2,8,18,0.72)'; ctx.fillRect(0, 0, CW, 20);
      // fish caught icons
      for (var fi = 0; fi < score && fi < 5; fi++) {
        ctx.fillStyle = fi < score ? '#4ab8f7' : '#1a3555';
        ctx.beginPath(); ctx.arc(12 + fi*16, 10, 5, 0, Math.PI*2); ctx.fill();
      }
      // context hint
      var hint = '';
      if (S === 'play') {
        if (FS.on && FS.biting) hint = '¡PICAR! → Espacio / A';
        else if (FS.on) hint = 'Esperando picada…';
        else {
          var nx3 = PL.x, ny3 = PL.y;
          var FACE2 = [[0,1],[1,0],[0,-1],[-1,0]][PL.dir];
          var aheadWater = false;
          for (var fwd = 1; fwd <= 3; fwd++) {
            if (tileXY(nx3+FACE2[0]*fwd*TS, ny3+FACE2[1]*fwd*TS) === 'W') { aheadWater = true; break; }
          }
          var nbk = Math.sqrt((PL.x-BOAT_X)*(PL.x-BOAT_X)+(PL.y-BOAT_Y)*(PL.y-BOAT_Y));
          if (!PL.inBoat && nbk < TS*1.4) hint = '→ A · subir al barco';
          else if (PL.inBoat) hint = '→ A · lanzar (o bajar al muelle)';
          else if (aheadWater) hint = '→ Espacio/A · lanzar caña';
          else hint = 'Camina hacia el lago ↓';
        }
        ctx.fillStyle = 'rgba(204,228,248,0.7)'; ctx.font = '9px JetBrains Mono,monospace'; ctx.textAlign = 'center';
        ctx.fillText(hint, CW/2, 13);
      }

      // ── WIN overlay ──
      if (S === 'win') {
        ctx.fillStyle = 'rgba(2,8,18,0.80)'; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = C.green; ctx.font = 'bold 20px Inter,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('¡Sesión completada!', CW/2, CH*0.38);
        // fish icons
        ctx.font = '22px serif'; for (var wi = 0; wi < 5; wi++) ctx.fillText('🐟', 90+wi*26, CH*0.52);
        ctx.fillStyle = C.text2; ctx.font = '10px Inter,sans-serif';
        ctx.fillText('Pulsa "Pescar más" para otra ronda', CW/2, CH*0.64);
      }

      // ── IDLE overlay ──
      if (S === 'idle') {
        ctx.fillStyle = 'rgba(2,8,18,0.78)'; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = C.blue; ctx.font = 'bold 17px Inter,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Pescador Libre', CW/2, CH*0.36);
        ctx.fillStyle = C.text2; ctx.font = '10px Inter,sans-serif';
        ctx.fillText('Explora el lago · sube al barco · pesca 5 peces', CW/2, CH*0.50);
        ctx.fillStyle = 'rgba(138,184,214,0.55)'; ctx.font = '9px JetBrains Mono,monospace';
        ctx.fillText('WASD/flechas · Espacio · mando en pantalla', CW/2, CH*0.62);
      }

      // ── mobile controls overlay ──
      drawControls();
    }

    function drawBoat(x, y, T) {
      ctx.save(); ctx.translate(x, y + Math.sin(T*0.001)*1.5);
      ctx.fillStyle = '#7a520e';
      ctx.beginPath(); ctx.ellipse(0, 2, 14, 7, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#5a3c0a'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#9b6e18'; ctx.fillRect(-12, -2, 24, 4);
      // mast stub
      ctx.strokeStyle = '#5a3c0a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, -10); ctx.stroke();
      ctx.restore();
    }

    function drawPlayer(T) {
      var x = PL.x, y = PL.y;
      var leg = [0, 2, 0, -2][PL.frame] || 0;

      ctx.save(); ctx.translate(x, y);

      if (PL.inBoat) {
        ctx.translate(0, Math.sin(T*0.001)*1.5);
        ctx.fillStyle = '#7a520e';
        ctx.beginPath(); ctx.ellipse(0, 9, 14, 7, 0, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#5a3c0a'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#9b6e18'; ctx.fillRect(-12, 5, 24, 4);
      }

      // legs
      if (!PL.inBoat) {
        ctx.fillStyle = '#1a3a50';
        ctx.fillRect(-5, 4 + leg, 4, 8);
        ctx.fillRect( 1, 4 + leg, 4, 8);
      }

      // body (shirt)
      ctx.fillStyle = '#1d4ed8'; ctx.fillRect(-5, -5, 10, 10);

      // head
      ctx.fillStyle = '#f5c09a'; ctx.beginPath(); ctx.arc(0, -9, 5, 0, Math.PI*2); ctx.fill();

      // hat (fishing cap)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-5, -14, 10, 4);
      ctx.fillRect(-3, -18, 6, 5);
      // brim
      ctx.fillRect(-7, -12, 14, 2);

      // rod (simple diagonal line)
      if (!PL.inBoat) {
        var RODS = [[ 5, 0, 10,-12],[  6,-4, 14,-14],[-5, 0,-10,-12],[-6,-4,-14,-14]];
        var rd = RODS[PL.dir];
        ctx.strokeStyle = '#8b6010'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(rd[0], rd[1]+leg); ctx.lineTo(rd[2], rd[3]+leg); ctx.stroke();
      }

      ctx.restore();
    }

    function drawControls() {
      if (S !== 'play') return;
      ctx.globalAlpha = 0.55;

      // D-pad background
      ctx.fillStyle = '#04101e';
      ctx.beginPath(); ctx.arc(DPAD_CX, DPAD_CY, 38, 0, Math.PI*2); ctx.fill();

      // directional arrows
      var DARR = [
        { k:'up', dx:0, dy:-20, lbl:'▲' },
        { k:'dn', dx:0, dy: 20, lbl:'▼' },
        { k:'lt', dx:-20, dy:0, lbl:'◀' },
        { k:'rt', dx: 20, dy:0, lbl:'▶' },
      ];
      DARR.forEach(function(d) {
        ctx.fillStyle = keys[d.k] ? 'rgba(74,184,247,0.75)' : 'rgba(74,184,247,0.22)';
        ctx.beginPath(); ctx.arc(DPAD_CX+d.dx, DPAD_CY+d.dy, 13, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#cce4f8'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(d.lbl, DPAD_CX+d.dx, DPAD_CY+d.dy+4);
      });

      // A button
      var acol = (actDown && !actConsumed) ? 'rgba(34,197,94,0.8)' : 'rgba(34,197,94,0.28)';
      ctx.fillStyle = acol;
      ctx.beginPath(); ctx.arc(ACT_X, ACT_Y, 18, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(34,197,94,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#e0ffe8'; ctx.font = 'bold 13px JetBrains Mono,monospace'; ctx.textAlign = 'center';
      ctx.fillText('A', ACT_X, ACT_Y+5);

      ctx.globalAlpha = 1;
    }

    // ── start idle draw ───────────────────────────────────
    S = 'idle';
    if (btn) { btn.textContent = 'Iniciar'; btn.disabled = false; }
    msg('Explora el lago y pesca 5 peces');

    raf(function(ts) { lt = ts; raf(step); });
  }

  /* ═══════════════════════════════════════════════════════════
     GAME 2: TOQUE DE PICADA  (reflex / fish timing)
     ═══════════════════════════════════════════════════════════ */
  function GameReflex(root) {
    var cvs   = $('[data-rf-canvas]', root);
    if (!cvs) return;
    var ctx   = cvs.getContext('2d');
    var btn   = $('[data-rf-btn]',    root);
    var msgE  = $('[data-rf-msg]',    root);
    var scoE  = $('[data-rf-score]',  root);
    var bestE = $('[data-rf-best]',   root);

    var CW, CH;
    function resize() {
      var pw = root.clientWidth || 300;
      CW = cvs.width  = Math.min(pw, 340);
      CH = cvs.height = Math.round(CW * 0.82);
    }
    resize();
    WIN.addEventListener('resize', resize);

    var S2 = 'idle';
    var score2 = 0, best2 = 0;
    var totalFish = 10, fishLeft = 10;
    var spawnTimer = 0, spawnDelay = 1200;
    var fishes = []; // active fish on screen
    var resultTimer = 0;

    var FISH_TYPES = [
      { em: '🐟', col: '#4ab8f7', pts: 1 },
      { em: '🐠', col: '#f97316', pts: 2 },
      { em: '🐡', col: '#a78bfa', pts: 1 },
      { em: '🦈', col: '#64748b', pts: 3 }
    ];

    // zone: x range where fish can be caught
    var ZX1, ZX2;

    function msg2(t, ok) {
      if (!msgE) return;
      msgE.textContent = t;
      msgE.style.color = ok == null ? C.text2 : ok ? C.green : C.red;
    }

    function setS2(s) {
      S2 = s;
      if (btn) {
        var labels = { idle: 'Empezar', active: '', done: 'Jugar otra vez' };
        btn.textContent = labels[s] || '';
        btn.disabled = (s === 'active');
      }
    }

    function spawnFish() {
      if (fishLeft <= 0) return;
      fishLeft--;
      var type = FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];
      var speed = 90 + (totalFish - fishLeft) * 18; // 90–270 px/s
      var dir = 1; // always left (from right)
      fishes.push({
        x: CW + 40, y: CH * rand(0.22, 0.62),
        vx: -speed,
        type: type,
        caught: false, missed: false, shown: false,
        flash: 0,
        alpha: 0  // fade in
      });
    }

    function tryStrike(cx) {
      if (S2 !== 'active') return;
      var hit = false;
      for (var i = 0; i < fishes.length; i++) {
        var f = fishes[i];
        if (f.caught || f.missed) continue;
        var inZone = f.x >= ZX1 && f.x <= ZX2;
        if (inZone) {
          f.caught = true; f.flash = 1;
          score2++;
          if (scoE) scoE.textContent = score2 + '/' + (totalFish - fishLeft);
          msg2('¡Pillado! +' + f.type.pts + (f.type.pts > 1 ? ' pts 🔥' : ' pt'), true);
          spawnTimer = spawnDelay * 0.6;
          hit = true;
          break;
        }
      }
      if (!hit) {
        var anyVisible = fishes.some(function (f2) { return !f2.caught && !f2.missed; });
        if (anyVisible) msg2('¡Demasiado pronto! Espera la zona roja.', false);
      }
    }

    function startGame() {
      fishes = []; fishLeft = totalFish; score2 = 0; spawnTimer = 600;
      if (scoE) scoE.textContent = '0/0';
      setS2('active');
      msg2('¡Toca o pulsa cuando el pez esté en la zona roja!');
    }

    function endGame() {
      setS2('done');
      if (score2 > best2) { best2 = score2; if (bestE) bestE.textContent = best2; }
      var rating = score2 >= 8 ? '¡Experto! 🏆' : score2 >= 5 ? '¡Bien hecho!' : '¡Sigue practicando!';
      msg2(rating + ' Capturaste ' + score2 + '/10 peces.', score2 >= 5);
    }

    if (btn) btn.addEventListener('click', function () {
      if (S2 === 'idle' || S2 === 'done') startGame();
    });

    function handleHit(e) {
      if (S2 !== 'active') return;
      var r = cvs.getBoundingClientRect();
      var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      tryStrike(cx);
    }
    cvs.addEventListener('click',      handleHit);
    cvs.addEventListener('touchstart', function (e) { e.preventDefault(); handleHit(e); }, { passive: false });

    // ── loop ──────────────────────────────────────────────
    var lt2 = 0;
    function step2(ts) {
      var dt = Math.min(ts - lt2, 50) / 1000;
      lt2 = ts;

      ZX1 = CW * 0.10; ZX2 = CW * 0.46;

      if (S2 === 'active') {
        spawnTimer -= dt * 1000;
        if (spawnTimer <= 0 && fishLeft > 0) {
          spawnFish();
          spawnTimer = rand(1100, 2200);
        }
        for (var i = fishes.length - 1; i >= 0; i--) {
          var f = fishes[i];
          f.alpha = Math.min(1, f.alpha + dt * 4);
          if (!f.caught && !f.missed) {
            f.x += f.vx * dt;
            if (f.x < -50) { f.missed = true; }
          }
          if (f.flash > 0) f.flash -= dt * 3;
          if ((f.caught || f.missed) && f.alpha > 0) {
            f.alpha -= dt * 2.5;
            if (f.alpha <= 0) fishes.splice(i, 1);
          }
        }
        // check if round is over
        if (fishLeft <= 0 && fishes.length === 0) endGame();
      }

      draw2(ts);
      raf(step2);
    }

    function draw2(ts) {
      ctx.clearRect(0, 0, CW, CH);
      var T = ts || 0;

      // bg + water
      ctx.fillStyle = C.surf; ctx.fillRect(0, 0, CW, CH);
      var wH = CH * 0.78;
      var wg = ctx.createLinearGradient(0, 0, 0, wH);
      wg.addColorStop(0, C.water); wg.addColorStop(1, C.waterD);
      ctx.fillStyle = wg; ctx.fillRect(0, 0, CW, wH);
      ctx.fillStyle = '#060f1c'; ctx.fillRect(0, wH, CW, CH - wH);

      // wave ripples
      ctx.strokeStyle = 'rgba(74,184,247,0.07)'; ctx.lineWidth = 1;
      for (var wi = 0; wi < 4; wi++) {
        ctx.beginPath();
        var wy = wH * 0.12 + wi * (wH * 0.22);
        for (var wx = 0; wx <= CW; wx += 4) {
          var wpt = wy + Math.sin(wx * 0.02 + T * 0.0007 + wi * 2) * 3.5;
          if (wx === 0) ctx.moveTo(wx, wpt); else ctx.lineTo(wx, wpt);
        }
        ctx.stroke();
      }

      // strike zone highlight
      ctx.fillStyle = 'rgba(249,115,22,0.07)';
      ctx.fillRect(ZX1, 0, ZX2 - ZX1, wH);

      // strike zone border
      ctx.strokeStyle = 'rgba(249,115,22,0.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(ZX1, 0); ctx.lineTo(ZX1, wH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ZX2, 0); ctx.lineTo(ZX2, wH); ctx.stroke();
      ctx.setLineDash([]);

      // zone label
      ctx.fillStyle = 'rgba(249,115,22,0.75)';
      ctx.font = 'bold 9px JetBrains Mono,monospace'; ctx.textAlign = 'center';
      ctx.fillText('ZONA DE PESCA', (ZX1 + ZX2) / 2, wH - 8);

      // rod (right side)
      ctx.strokeStyle = '#4a7a98'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(CW * 0.9, CH * 0.95); ctx.lineTo(CW * 0.75, CH * 0.28); ctx.stroke();
      // rod tip glow when fish in zone
      var anyInZone = fishes.some(function (f) { return !f.caught && !f.missed && f.x >= ZX1 && f.x <= ZX2; });
      if (anyInZone) {
        var glow = (Math.sin(T * 0.015) + 1) * 0.5;
        ctx.beginPath(); ctx.arc(CW * 0.75, CH * 0.28, 7 + glow * 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(249,115,22,' + (0.5 + glow * 0.4) + ')'; ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(CW * 0.75, CH * 0.28, 4, 0, Math.PI * 2);
        ctx.fillStyle = C.blue; ctx.fill();
      }

      // fishing line
      ctx.strokeStyle = 'rgba(74,184,247,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(CW * 0.75, CH * 0.28); ctx.lineTo(CW * 0.28, CH * 0.42); ctx.stroke();
      // float
      ctx.save(); ctx.translate(CW * 0.28, CH * 0.42 + Math.sin(T * 0.002) * 3);
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.ellipse(0, -4, 3, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.ellipse(0, 4, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // draw fish
      for (var fi = 0; fi < fishes.length; fi++) {
        var f2 = fishes[fi];
        ctx.globalAlpha = Math.max(0, Math.min(1, f2.alpha));

        // glow when in zone
        var inZ = !f2.caught && !f2.missed && f2.x >= ZX1 && f2.x <= ZX2;
        if (inZ) {
          ctx.beginPath(); ctx.arc(f2.x, f2.y, 26, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(249,115,22,0.2)'; ctx.fill();
        }
        if (f2.flash > 0) {
          ctx.beginPath(); ctx.arc(f2.x, f2.y, 22, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34,197,94,' + f2.flash * 0.5 + ')'; ctx.fill();
        }

        var sz = 26 + (inZ ? 4 : 0);
        ctx.save();
        // flip fish direction (swimming left)
        ctx.translate(f2.x, f2.y);
        ctx.scale(-1, 1);
        ctx.font = sz + 'px serif'; ctx.textAlign = 'center';
        ctx.fillText(f2.type.em, 0, sz * 0.4);
        ctx.restore();

        ctx.globalAlpha = 1;
      }

      // score during game
      if (S2 === 'active') {
        ctx.fillStyle = 'rgba(204,228,248,0.8)'; ctx.font = 'bold 11px JetBrains Mono,monospace'; ctx.textAlign = 'right';
        ctx.fillText('Quedan: ' + fishLeft, CW - 10, 16);
      }

      if (S2 === 'idle') {
        ctx.fillStyle = 'rgba(204,228,248,0.55)'; ctx.font = '12px Inter,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Toca el pez cuando esté en la zona roja', CW * 0.5, CH * 0.88);
      }

      // done overlay
      if (S2 === 'done') {
        ctx.fillStyle = 'rgba(4,16,30,0.7)'; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = C.blue; ctx.font = 'bold 20px Inter,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Resultado: ' + score2 + '/10', CW * 0.5, CH * 0.46);
      }
    }

    setS2('idle');
    msg2('10 peces. ¿Cuántos pillarás?');
    raf(function (ts) { lt2 = ts; raf(step2); });
  }

  /* ═══════════════════════════════════════════════════════════
     GAME 3: ¿QUÉ ESPECIE?  (species photo quiz)
     ═══════════════════════════════════════════════════════════ */
  function GameQuiz(root) {
    var imgEl     = $('[data-qz-img]',        root);
    var choicesEl = $('[data-qz-choices]',    root);
    var timerFill = $('[data-qz-timer-fill]', root);
    var btn3      = $('[data-qz-btn]',        root);
    var msgE3     = $('[data-qz-msg]',        root);
    var scoE3     = $('[data-qz-score]',      root);
    var bestE3    = $('[data-qz-best]',       root);
    var quizArea  = $('[data-qz-area]',       root);
    var resultEl  = $('[data-qz-result]',     root);

    var SPECIES = [
      { name: 'Lubina',     file: 'lubina',     hint: 'Mar · costa' },
      { name: 'Lucio',      file: 'lucio',      hint: 'Dulce · embalse' },
      { name: 'Trucha',     file: 'trucha',     hint: 'Dulce · río' },
      { name: 'Black Bass', file: 'black-bass', hint: 'Dulce · embalse' },
      { name: 'Perca',      file: 'perca',      hint: 'Dulce · lago' },
      { name: 'Lucioperca', file: 'lucioperca', hint: 'Dulce · Mequinenza' },
      { name: 'Dorada',     file: 'dorada',     hint: 'Mar · Mediterráneo' },
      { name: 'Siluro',     file: 'siluro',     hint: 'Dulce · Ebro' }
    ];

    var S3 = 'idle';
    var score3 = 0, best3 = 0;
    var questions = [], qIdx = 0;
    var timerStart = 0, timerMs = 5500;
    var timerRaf = null, answered = false;

    function msg3(t, ok) {
      if (!msgE3) return;
      msgE3.textContent = t;
      msgE3.style.color = ok == null ? C.text2 : ok ? C.green : C.red;
    }

    function startQuiz() {
      questions = shuffle(SPECIES).slice(0, 6);
      qIdx = 0; score3 = 0; answered = false;
      if (scoE3) scoE3.textContent = '0/6';
      S3 = 'active';
      if (btn3) { btn3.textContent = ''; btn3.disabled = true; }
      if (quizArea) quizArea.style.display = '';
      if (resultEl) resultEl.style.display = 'none';
      if (imgEl) imgEl.style.display = '';
      if (timerFill) timerFill.parentElement.style.display = '';
      showQuestion();
    }

    function showQuestion() {
      if (qIdx >= questions.length) { endQuiz(); return; }
      var q = questions[qIdx];
      answered = false;

      if (imgEl) {
        imgEl.src = '/assets/img/species/' + q.file + '.webp';
        imgEl.style.filter = 'none';
        imgEl.style.transition = 'none';
        // blur after 1.8s
        setTimeout(function () {
          if (!answered) {
            imgEl.style.transition = 'filter 0.8s';
            imgEl.style.filter = 'blur(10px) brightness(0.55)';
          }
        }, 1800);
      }

      // Build choices: correct + 3 random wrongs
      var wrong = shuffle(SPECIES.filter(function (s) { return s.name !== q.name; })).slice(0, 3);
      var choices = shuffle([q].concat(wrong));

      if (choicesEl) {
        choicesEl.innerHTML = '';
        choices.forEach(function (c) {
          var b = document.createElement('button');
          b.className = 'qz-choice';
          b.textContent = c.name;
          b.addEventListener('click', function () {
            answer(c.name === q.name, c.name, q.name, b, choices);
          });
          choicesEl.appendChild(b);
        });
      }

      // Timer
      timerStart = performance.now();
      if (timerFill) { timerFill.style.transition = 'none'; timerFill.style.width = '100%'; }

      function tick() {
        var elapsed = performance.now() - timerStart;
        var pct = Math.max(0, 1 - elapsed / timerMs);
        if (timerFill) {
          timerFill.style.transition = 'none';
          timerFill.style.width = (pct * 100) + '%';
          timerFill.style.background = pct > 0.5 ? C.blue : pct > 0.25 ? C.orange : C.red;
        }
        if (elapsed >= timerMs && !answered) {
          answer(false, null, q.name, null, choices);
        } else if (!answered) {
          timerRaf = raf(function () { tick(); });
        }
      }
      timerRaf = raf(function () { tick(); });
    }

    function answer(correct, chosen, correctName, chosenBtn, allChoices) {
      if (answered) return;
      answered = true;
      if (timerRaf) cancelAnimationFrame(timerRaf);

      // Style all buttons
      if (choicesEl) {
        choicesEl.querySelectorAll('.qz-choice').forEach(function (b) {
          b.disabled = true;
          if (b.textContent === correctName) b.classList.add('qz-correct');
          else if (b === chosenBtn && !correct) b.classList.add('qz-wrong');
        });
      }
      if (imgEl) { imgEl.style.transition = 'filter .3s'; imgEl.style.filter = 'none'; }
      if (timerFill) timerFill.style.width = '0';

      if (correct) {
        var elapsed2 = performance.now() - timerStart;
        score3++;
        var qual = elapsed2 < 2000 ? '¡Ultra rápido! 🔥' : elapsed2 < 3500 ? '¡Correcto! ✓' : '¡Correcto!';
        if (scoE3) scoE3.textContent = score3 + '/' + (qIdx + 1);
        msg3(qual + ' +1', true);
      } else if (chosen) {
        msg3('¡No! Era ' + correctName + '.', false);
      } else {
        msg3('¡Tiempo! Era ' + correctName + '.', false);
      }

      qIdx++;
      setTimeout(function () { if (S3 === 'active') showQuestion(); }, 1700);
    }

    function endQuiz() {
      S3 = 'done';
      if (score3 > best3) { best3 = score3; if (bestE3) bestE3.textContent = best3; }
      if (scoE3) scoE3.textContent = score3 + '/6';

      // ocultar imagen (evita icono de archivo roto)
      if (imgEl) { imgEl.src = ''; imgEl.style.display = 'none'; }
      if (timerFill) { timerFill.style.width = '0'; timerFill.parentElement.style.display = 'none'; }
      if (choicesEl) choicesEl.innerHTML = '';

      // panel de resultado en lugar de la imagen
      if (resultEl) {
        var stars = score3 === 6 ? '★★★' : score3 >= 4 ? '★★☆' : score3 >= 2 ? '★☆☆' : '☆☆☆';
        var label = score3 === 6 ? 'Experto' : score3 >= 4 ? 'Muy bien' : score3 >= 2 ? 'Practicando' : 'Principiante';
        var pct   = Math.round((score3 / 6) * 100);
        resultEl.innerHTML =
          '<div class="qz-result-inner">' +
            '<div class="qz-result-stars">' + stars + '</div>' +
            '<div class="qz-result-score">' + score3 + '<span>/6</span></div>' +
            '<div class="qz-result-bar"><span style="width:' + pct + '%"></span></div>' +
            '<div class="qz-result-label">' + label + '</div>' +
          '</div>';
        resultEl.style.display = '';
      }

      var rating = score3 === 6 ? '¡Pescador experto! Récord perfecto.'
                 : score3 >= 4  ? '¡Muy bien! Conoces bien las especies.'
                 : score3 >= 2  ? '¡Sigue practicando!'
                                : '¡Estudia las especies!';
      msg3(rating, score3 >= 4);
      if (btn3) { btn3.textContent = 'Jugar otra vez'; btn3.disabled = false; }
    }

    if (btn3) btn3.addEventListener('click', function () {
      if (S3 === 'idle' || S3 === 'done') startQuiz();
    });

    // hide quiz area until game starts
    if (quizArea) quizArea.style.display = 'none';
    msg3('6 preguntas. ¿Conoces las especies de España?');
  }

  /* ── INIT ──────────────────────────────────────────────── */
  function init() {
    var g1 = document.querySelector('[data-game-stardew]');
    var g2 = document.querySelector('[data-game-reflex]');
    var g3 = document.querySelector('[data-game-quiz]');
    if (g1) GameFishing(g1);
    if (g2) GameReflex(g2);
    if (g3) GameQuiz(g3);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

}(window));
