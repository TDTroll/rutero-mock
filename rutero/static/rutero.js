'use strict';
(function () {

  var W = 192, H = 32;
  var GLYPH_W = 5, GLYPH_H = 7, CHAR_ADVANCE = 6;
  var SCROLL_STEP = 2, SCROLL_TICK_MS = 16;
  var LED_DIE = 0.40, LED_BLOOM = 1.9, LED_BLOOM_ALPHA = 0.18, LED_OFF_ALPHA = 0.9;
  var OFF_COLOR = [26, 26, 26];
  var MAX_FONT_SCALE = Math.max(1, Math.floor(H / GLYPH_H));

  var SPACE = [0, 0, 0, 0, 0, 0, 0];
  var FONT = {
    ' ': [0, 0, 0, 0, 0, 0, 0],
    'A': [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
    'B': [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
    'C': [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
    'D': [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
    'E': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
    'F': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
    'G': [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
    'H': [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
    'I': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b11111],
    'J': [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
    'K': [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
    'L': [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
    'M': [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
    'N': [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
    'O': [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
    'P': [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
    'Q': [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
    'R': [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
    'S': [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
    'T': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
    'U': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
    'V': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
    'W': [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
    'X': [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
    'Y': [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
    'Z': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
    '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
    '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
    '2': [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
    '3': [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
    '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
    '5': [0b11111, 0b10000, 0b10000, 0b11110, 0b00001, 0b00001, 0b11110],
    '6': [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
    '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
    '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
    '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
    '!': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
    '.': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100],
    ',': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100, 0b01000],
    '-': [0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000, 0b00000],
    '_': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b11111],
    ':': [0b00000, 0b00100, 0b00100, 0b00000, 0b00100, 0b00100, 0b00000],
    '/': [0b00001, 0b00010, 0b00010, 0b00100, 0b01000, 0b01000, 0b10000],
    "'": [0b00100, 0b00100, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000]
  };

  var PRESET_MESSAGES = [
    "Bienvenidos a bordo", "Buenos dias", "Buenas tardes", "Buenas noches",
    "Proxima parada", "Detengase por favor", "Bajan por la puerta trasera",
    "Suben por la puerta delantera", "Favor de pasar al fondo",
    "Ceda el asiento, por favor", "Cuide su equipaje", "Sujetese del pasamanos",
    "Evite hablar con el operador", "Evite comer y beber a bordo",
    "Gracias por su preferencia", "Que tengan buen viaje",
    "Con cuidado al bajar"
  ];

  var theme = { primary: [244, 8, 26], secondary: [253, 211, 207], tertiary: [238, 51, 68], label: [28, 27, 31] };

  var state = {
    text: 'ESTE AUTOBUS SE AUTODESTRUIRA EN 5 SEGUNDOS',
    color: [255, 167, 38],
    fontScale: 1,
    flipH: false,
    flipV: false,
    direction: 'NONE',
    scrollX: 0,
    scrollY: 0,
    scroll: 0,
    bitmap: null,
    cols: 0,
    rows: 0
  };

  var design = document.getElementById('design');
  var bgImg = document.getElementById('bg');
  var statusEl = document.getElementById('status');
  var followEl = document.getElementById('follow');
  var pushEl = document.getElementById('push');
  var DESIGN_W = 1280, DESIGN_H = 704;

  var pushEnabled = pushEl ? pushEl.checked : false;
  var pushTimer = null;
  var pushDelta = {};       // cambios de estado pendientes de enviar (mods)
  var applyingRemote = false; // evita re-enviar lo que llega del servidor

  var widgets = [];
  var roadmapWidget = null;
  var editorInput = null;
  var lastSeq = -Infinity;
  var lastRev = -Infinity;
  var followTimer = null;

  // ---------------- utils ----------------
  function sanitize(t) { return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function glyphsFor(ch) { return FONT[ch.toUpperCase()] || SPACE; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rgbStr(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')'; }
  function hex8(c) { function h(n) { return n.toString(16).padStart(2, '0').toUpperCase(); } return 'FF' + h(c[0]) + h(c[1]) + h(c[2]); }
  function hexToRgb(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 8) h = h.slice(2);
    if (h.length !== 6) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgbToHsv(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
    if (d !== 0) {
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return { h: h, s: mx === 0 ? 0 : d / mx, v: mx };
  }
  function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360;
    var c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c, r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function cssHsv(h, s, v) { var c = hsvToRgb(h, s, v); return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }
  function parseDir(raw) {
    var up = String(raw).trim().toUpperCase();
    return ['NONE', 'LEFT', 'RIGHT', 'UP', 'DOWN'].indexOf(up) >= 0 ? up : null;
  }

  // ---------------- bitmap ----------------
  function rebuild() {
    state.text = sanitize(state.text);
    var chars = state.text.split('');
    var glyphs = chars.map(glyphsFor);
    if (glyphs.length === 0) {
      state.bitmap = null; state.cols = 0; state.rows = 0; state.scroll = 0; return;
    }
    var scale = state.fontScale;
    var spacing = CHAR_ADVANCE - GLYPH_W;
    var columns = glyphs.length * GLYPH_W + (glyphs.length - 1) * spacing;
    var cols = columns * scale, rows = GLYPH_H * scale;
    var bmp = new Uint8Array(cols * rows);
    for (var gi = 0; gi < glyphs.length; gi++) {
      var glyph = glyphs[gi];
      var baseX = gi * CHAR_ADVANCE * scale;
      for (var row = 0; row < GLYPH_H; row++) {
        var mask = glyph[row];
        for (var bit = 0; bit < GLYPH_W; bit++) {
          if (!(mask & (1 << (GLYPH_W - 1 - bit)))) continue;
          var gx = Math.min(baseX + bit * scale, cols - 1);
          var gy = Math.min(row * scale, rows - 1);
          for (var sy = 0; sy < scale; sy++) {
            for (var sx = 0; sx < scale; sx++) {
              var px = gx + sx, py = gy + sy;
              if (px < cols && py < rows) bmp[py * cols + px] = 1;
            }
          }
        }
      }
    }
    if (state.flipH || state.flipV) {
      var f = new Uint8Array(cols * rows);
      for (var py = 0; py < rows; py++) {
        for (var px = 0; px < cols; px++) {
          var src;
          if (state.flipH && state.flipV) src = (rows - 1 - py) * cols + (cols - 1 - px);
          else if (state.flipH) src = py * cols + (cols - 1 - px);
          else src = (rows - 1 - py) * cols + px;
          f[py * cols + px] = bmp[src];
        }
      }
      bmp = f;
    }
    state.bitmap = bmp; state.cols = cols; state.rows = rows; state.scroll = 0;
  }

  function frameMask() {
    var mask = new Uint8Array(W * H);
    if (!state.cols) return mask;
    var x0, y0;
    if (state.direction === 'LEFT' || state.direction === 'RIGHT') x0 = state.scrollX;
    else x0 = state.cols > W ? state.scroll : ((W - state.cols) / 2) | 0;
    if (state.direction === 'UP' || state.direction === 'DOWN') y0 = state.scrollY;
    else y0 = ((H - state.rows) / 2) | 0;
    var bmp = state.bitmap, cols = state.cols, rows = state.rows;
    for (var py = 0; py < rows; py++) {
      for (var px = 0; px < cols; px++) {
        if (!bmp[py * cols + px]) continue;
        var vx = x0 + px, vy = y0 + py;
        if (vx < 0 || vx >= W || vy < 0 || vy >= H) continue;
        mask[vy * W + vx] = 1;
      }
    }
    return mask;
  }

  function maxScroll() { return Math.max(0, state.cols - W); }
  function scrollTo(v) { state.scroll = clamp(v | 0, 0, maxScroll()); }
  function markDelta(k, v) { if (!applyingRemote) pushDelta[k] = v; }
  function setText(t) { state.text = sanitize(t); rebuild(); syncAll(); markDelta('text', state.text); schedulePush(); }
  function setColor(rgb) { state.color = rgb; syncAll(); markDelta('color', '#' + hex8(state.color).slice(2)); schedulePush(); }
  function setFontScale(v) { state.fontScale = clamp(v | 0, 1, MAX_FONT_SCALE); rebuild(); syncAll(); markDelta('fontScale', state.fontScale); schedulePush(); }
  function toggleFlipH() { state.flipH = !state.flipH; rebuild(); syncAll(); markDelta('flipHorizontal', state.flipH); schedulePush(); }
  function toggleFlipV() { state.flipV = !state.flipV; rebuild(); syncAll(); markDelta('flipVertical', state.flipV); schedulePush(); }

  // ---------------- push al mock (-> MPC80T) ----------------
  function sendPush(body) {
    return fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }
  function pushNow() {
    if (!pushEnabled || followTimer) return;
    if (!Object.keys(pushDelta).length) return;
    var body = { state: pushDelta };
    pushDelta = {};
    sendPush(body).then(function (j) {
      statusEl.textContent = 'enviado seq=' + j.seq + ' a MPC80T (' + j.pending + ' en cola)';
    }).catch(function () { statusEl.textContent = 'push error'; });
  }
  function schedulePush() {
    if (!pushEnabled || followTimer) return;
    if (pushTimer) return;
    pushTimer = setTimeout(function () { pushTimer = null; pushNow(); }, 80);
  }
  function pushAction(action) {
    if (!pushEnabled || followTimer) return;
    sendPush({ actions: [action] }).then(function (j) {
      statusEl.textContent = 'enviado seq=' + j.seq + ' a MPC80T';
    }).catch(function () { statusEl.textContent = 'push error'; });
  }

  // ---------------- scroll ----------------
  var scrollTimer = null;
  function stopScrollTimer() { if (scrollTimer) { clearInterval(scrollTimer); scrollTimer = null; } }
  function startScroll(dir) {
    if (dir === 'NONE') { stopScroll(); return; }
    stopScrollTimer();
    state.direction = dir;
    if (dir === 'LEFT') state.scrollX = state.cols > W ? 0 : ((W - state.cols) / 2) | 0;
    else if (dir === 'RIGHT') state.scrollX = -state.cols;
    else if (dir === 'UP') state.scrollY = H;
    else if (dir === 'DOWN') state.scrollY = -state.rows;
    scrollTimer = setInterval(function () {
      if (dir === 'LEFT') { var n = state.scrollX - SCROLL_STEP; state.scrollX = n <= -state.cols ? W : n; }
      else if (dir === 'RIGHT') { var n2 = state.scrollX + SCROLL_STEP; state.scrollX = n2 >= W ? -state.cols : n2; }
      else if (dir === 'UP') { var n3 = state.scrollY - SCROLL_STEP; state.scrollY = n3 <= -state.rows ? H : n3; }
      else if (dir === 'DOWN') { var n4 = state.scrollY + SCROLL_STEP; state.scrollY = n4 >= H ? -state.rows : n4; }
      if (roadmapWidget) roadmapWidget.render();
    }, SCROLL_TICK_MS);
    syncAll();
  }
  function stopScroll() {
    stopScrollTimer();
    state.direction = 'NONE';
    state.scrollX = 0; state.scrollY = 0;
    syncAll();
  }
  function toggleScroll(dir) {
    if (dir === 'NONE') { stopScroll(); return; }
    if (state.direction === dir && scrollTimer) stopScroll(); else startScroll(dir);
  }

  // ---------------- canvas toolkit ----------------
  var ss = 2;
  function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    if (r < 0) r = 0;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function addArc(p, cx, cy, r) { p.moveTo(cx + r, cy); p.arc(cx, cy, r, 0, Math.PI * 2); }

  function makeCanvas(parent, left, top, w, h, drawFn, onPointer) {
    var c = document.createElement('canvas');
    c.style.position = 'absolute';
    c.style.left = left + 'px';
    c.style.top = top + 'px';
    c.style.width = w + 'px';
    c.style.height = h + 'px';
    var obj = { el: c, ctx: c.getContext('2d'), w: w, h: h, draw: drawFn, bw: 0, bh: 0 };
    obj.render = function () {
      var bw = Math.max(1, Math.round(w * ss)), bh = Math.max(1, Math.round(h * ss));
      if (bw !== obj.bw || bh !== obj.bh) { c.width = bw; c.height = bh; obj.bw = bw; obj.bh = bh; }
      var ctx = obj.ctx;
      ctx.setTransform(ss, 0, 0, ss, 0, 0);
      ctx.clearRect(0, 0, w, h);
      drawFn(ctx, w, h);
    };
    if (onPointer) {
      c.style.touchAction = 'none';
      var local = function (e) {
        var r = c.getBoundingClientRect();
        return { x: (e.clientX - r.left) * w / r.width, y: (e.clientY - r.top) * h / r.height };
      };
      c.addEventListener('pointerdown', function (e) { c.setPointerCapture(e.pointerId); onPointer('down', local(e), e); });
      c.addEventListener('pointermove', function (e) { if (e.buttons) onPointer('move', local(e), e); });
      c.addEventListener('pointerup', function (e) { onPointer('up', local(e), e); });
    }
    parent.appendChild(c);
    widgets.push(obj);
    return obj;
  }

  // ---------------- shared control drawing ----------------
  function drawControlBackground(ctx, w, h) {
    var r = Math.min(12, h / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    roundRectPath(ctx, 0, 0, w, h, r);
    ctx.fill();
  }
  function drawControlButton(ctx, region, active, aCol, oCol, r) {
    var col = active ? aCol : oCol;
    var rw = region.right - region.left, rh = region.bottom - region.top;
    ctx.fillStyle = rgbStr(col, active ? 0.30 : 0.16);
    roundRectPath(ctx, region.left, region.top, rw, rh, r);
    ctx.fill();
    if (active) {
      ctx.strokeStyle = rgbStr(col, 1);
      ctx.lineWidth = 2;
      roundRectPath(ctx, region.left + 1, region.top + 1, rw - 2, rh - 2, r);
      ctx.stroke();
    }
  }
  function drawStepButton(ctx, region, enabled, isMinus, aCol, oCol, r) {
    var col = enabled ? aCol : oCol;
    var rw = region.right - region.left, rh = region.bottom - region.top;
    ctx.fillStyle = rgbStr(col, enabled ? 0.30 : 0.10);
    roundRectPath(ctx, region.left, region.top, rw, rh, r);
    ctx.fill();
    var cx = (region.left + region.right) / 2, cy = (region.top + region.bottom) / 2;
    var half = Math.min(rw, rh) * 0.22, sw = Math.min(rw, rh) * 0.12;
    ctx.strokeStyle = rgbStr(col, enabled ? 1 : 0.4);
    ctx.lineWidth = sw;
    ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(cx - half, cy); ctx.lineTo(cx + half, cy); ctx.stroke();
    if (!isMinus) { ctx.beginPath(); ctx.moveTo(cx, cy - half); ctx.lineTo(cx, cy + half); ctx.stroke(); }
  }
  function drawFlipIcon(ctx, cx, cy, size, deg, col) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(deg * Math.PI / 180); ctx.fillStyle = rgbStr(col, 1);
    var a = size * 0.5, b = size * 0.28;
    ctx.beginPath(); ctx.moveTo(-a, -b); ctx.lineTo(-a + b, 0); ctx.lineTo(-a, b); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(a, -b); ctx.lineTo(a - b, 0); ctx.lineTo(a, b); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawDirectionArrow(ctx, cx, cy, size, deg, col) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(deg * Math.PI / 180); ctx.fillStyle = rgbStr(col, 1);
    var a = size * 0.5, b = size * 0.42;
    ctx.beginPath(); ctx.moveTo(-a, -b); ctx.lineTo(size * 0.14, 0); ctx.lineTo(-a, b); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawDeleteIcon(ctx, cx, cy, size, col) {
    var w = size, h = size * 0.9, stroke = size * 0.14, lidY = cy - h * 0.40;
    ctx.strokeStyle = rgbStr(col, 1); ctx.fillStyle = rgbStr(col, 1); ctx.lineCap = 'butt';
    ctx.lineWidth = stroke * 1.4;
    ctx.beginPath(); ctx.moveTo(cx - w / 2, lidY); ctx.lineTo(cx + w / 2, lidY); ctx.stroke();
    ctx.lineWidth = stroke;
    ctx.beginPath(); ctx.moveTo(cx - w * 0.18, lidY - stroke * 0.9); ctx.lineTo(cx + w * 0.18, lidY - stroke * 0.9); ctx.stroke();
    var bodyTop = lidY + stroke * 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.60, bodyTop); ctx.lineTo(cx - w * 0.46, cy + h * 0.40);
    ctx.lineTo(cx + w * 0.46, cy + h * 0.40); ctx.lineTo(cx + w * 0.60, bodyTop);
    ctx.closePath(); ctx.fill();
    ctx.lineWidth = stroke;
    for (var px = -w * 0.30; px <= w * 0.30 + 0.001; px += w * 0.30) {
      ctx.beginPath(); ctx.moveTo(cx + px, bodyTop); ctx.lineTo(cx + px * 0.92, cy + h * 0.36); ctx.stroke();
    }
  }
  function drawControlLabel(ctx, text, cx, baselineY, col, size) {
    ctx.font = 'bold ' + size + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = rgbStr(col, 1);
    ctx.fillText(text, cx, baselineY);
  }
  function drawControlText(ctx, text, cx, cy, col, size) {
    ctx.font = 'bold ' + size + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgbStr(col, 1);
    ctx.fillText(text, cx, cy);
  }

  // ---------------- widget draws ----------------
  function drawRoadmap(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    var strokeWidth = 2;
    var margin = strokeWidth + 3;
    var availW = w - margin * 2, availH = h - margin * 2;
    var pitch = Math.max(1, Math.floor(Math.min(availW / W, availH / H)));
    var gridW = pitch * W, gridH = pitch * H;
    var gx0 = Math.round(margin + (availW - gridW) / 2);
    var gy0 = Math.round(margin + (availH - gridH) / 2);
    var ledR = pitch * LED_DIE, bloomR = ledR * LED_BLOOM;

    var mask = frameMask();
    var offPath = new Path2D(), onPath = new Path2D(), bloomPath = new Path2D();
    var i = 0;
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++, i++) {
        var cx = gx0 + x * pitch + pitch / 2, cy = gy0 + y * pitch + pitch / 2;
        if (mask[i]) { addArc(onPath, cx, cy, ledR); addArc(bloomPath, cx, cy, bloomR); }
        else { addArc(offPath, cx, cy, ledR); }
      }
    }
    ctx.fillStyle = rgbStr(OFF_COLOR, LED_OFF_ALPHA); ctx.fill(offPath);
    ctx.fillStyle = rgbStr(state.color, LED_BLOOM_ALPHA); ctx.fill(bloomPath);
    ctx.fillStyle = rgbStr(state.color, 1); ctx.fill(onPath);
  }

  function drawOrientation(ctx, w, h) {
    drawControlBackground(ctx, w, h);
    var m = 14;
    var groupW = (w - 2 * m) / 3;
    var top = h * 0.16, btnH = h * 0.46, btnW = Math.min(groupW * 0.8, h * 1.05);
    function group(cx) { return { left: cx - btnW / 2, top: top, right: cx + btnW / 2, bottom: top + btnH }; }
    var cx0 = m + groupW * 0.5, cx1 = m + groupW * 1.5, cx2 = m + groupW * 2.5;
    var stepW = groupW * 0.3, stepH = btnH * 0.9, stepTop = top + (btnH - stepH) / 2, stepBottom = stepTop + stepH;
    var vertical = group(cx0), horizontal = group(cx1);
    var minus = { left: cx2 - stepW * 2, top: stepTop, right: cx2 - stepW, bottom: stepBottom };
    var value = { left: cx2 - stepW, top: top, right: cx2 + stepW, bottom: top + btnH };
    var plus = { left: cx2 + stepW, top: stepTop, right: cx2 + stepW * 2, bottom: stepBottom };
    var aCol = theme.primary, oCol = theme.tertiary, lCol = theme.label;
    var corner = Math.min(10, (vertical.bottom - vertical.top) / 2);
    var stepCorner = Math.min(corner, (minus.right - minus.left) / 2);
    var labelBaseline = h - h * 0.06, labelSize = h * 0.13;

    drawControlButton(ctx, vertical, state.flipV, aCol, oCol, corner);
    drawFlipIcon(ctx, (vertical.left + vertical.right) / 2, (vertical.top + vertical.bottom) / 2, (vertical.bottom - vertical.top) * 0.45, 90, state.flipV ? aCol : oCol);
    drawControlLabel(ctx, 'Vertical', (vertical.left + vertical.right) / 2, labelBaseline, state.flipV ? aCol : lCol, labelSize);

    drawControlButton(ctx, horizontal, state.flipH, aCol, oCol, corner);
    drawFlipIcon(ctx, (horizontal.left + horizontal.right) / 2, (horizontal.top + horizontal.bottom) / 2, (horizontal.bottom - horizontal.top) * 0.45, 0, state.flipH ? aCol : oCol);
    drawControlLabel(ctx, 'Horizontal', (horizontal.left + horizontal.right) / 2, labelBaseline, state.flipH ? aCol : lCol, labelSize);

    drawStepButton(ctx, minus, state.fontScale > 1, true, aCol, oCol, stepCorner);
    drawStepButton(ctx, plus, state.fontScale < MAX_FONT_SCALE, false, aCol, oCol, stepCorner);
    drawControlText(ctx, state.fontScale + 'x', (value.left + value.right) / 2, (value.top + value.bottom) / 2, state.fontScale > 1 ? aCol : oCol, (value.bottom - value.top) * 0.6);
    drawControlLabel(ctx, 'Fuente', (value.left + value.right) / 2, labelBaseline, lCol, labelSize);
  }

  function drawAnimation(ctx, w, h) {
    drawControlBackground(ctx, w, h);
    var m = 14;
    var groupW = (w - 2 * m) / 4;
    var top = h * 0.16, btnH = h * 0.46, btnW = Math.min(groupW * 0.8, h * 1.05);
    function group(cx) { return { left: cx - btnW / 2, top: top, right: cx + btnW / 2, bottom: top + btnH }; }
    var cx0 = m + groupW * 0.5, cx1 = m + groupW * 1.5, cx2 = m + groupW * 2.5, cx3 = m + groupW * 3.5;
    var left = group(cx0), right = group(cx1), up = group(cx2), down = group(cx3);
    var aCol = theme.primary, oCol = theme.tertiary, lCol = theme.label;
    var corner = Math.min(10, (left.bottom - left.top) / 2);
    var labelBaseline = h - h * 0.06, labelSize = h * 0.13;

    function dirBtn(region, dir, rot, label) {
      var active = state.direction === dir && scrollTimer != null;
      var col = active ? aCol : oCol;
      drawControlButton(ctx, region, active, aCol, oCol, corner);
      drawDirectionArrow(ctx, (region.left + region.right) / 2, (region.top + region.bottom) / 2, (region.bottom - region.top) * 0.45, rot, col);
      drawControlLabel(ctx, label, (region.left + region.right) / 2, labelBaseline, active ? aCol : lCol, labelSize);
    }
    dirBtn(left, 'LEFT', 180, 'Izquierda');
    dirBtn(right, 'RIGHT', 0, 'Derecha');
    dirBtn(up, 'UP', 270, 'Arriba');
    dirBtn(down, 'DOWN', 90, 'Abajo');
  }

  function editorFieldRegion(w, h, marginX) {
    var t = h * 0.25, fh = h * 0.4;
    return { left: marginX, top: t, right: w - marginX, bottom: t + fh };
  }
  function editorControlRegions(w, h, marginX) {
    var s = h * 0.18, top = h * 0.04;
    return {
      delete: { left: marginX, top: top, right: marginX + s, bottom: top + s },
      preset: { left: w - marginX - s, top: top, right: w - marginX, bottom: top + s }
    };
  }
  function drawTextEditor(ctx, w, h) {
    drawControlBackground(ctx, w, h);
    var m = 14;
    var field = editorFieldRegion(w, h, m);
    var corner = Math.min(8, (field.bottom - field.top) / 2);
    ctx.strokeStyle = rgbStr(theme.tertiary, 0.35);
    ctx.lineWidth = 1.5;
    roundRectPath(ctx, field.left, field.top, field.right - field.left, field.bottom - field.top, corner);
    ctx.stroke();
    drawControlLabel(ctx, 'Texto', w / 2, h - h * 0.06, theme.label, h * 0.13);

    var icons = editorControlRegions(w, h, 0);
    var iconCorner = Math.min(10, (icons.delete.bottom - icons.delete.top) / 2);
    var dw = icons.delete.right - icons.delete.left, dh = icons.delete.bottom - icons.delete.top;
    ctx.fillStyle = rgbStr(theme.tertiary, 0.16);
    roundRectPath(ctx, icons.delete.left, icons.delete.top, dw, dh, iconCorner); ctx.fill();
    drawDeleteIcon(ctx, (icons.delete.left + icons.delete.right) / 2, (icons.delete.top + icons.delete.bottom) / 2, dh * 0.5, theme.primary);
    var pw = icons.preset.right - icons.preset.left;
    ctx.fillStyle = rgbStr(theme.tertiary, 0.16);
    roundRectPath(ctx, icons.preset.left, icons.preset.top, pw, dh, iconCorner); ctx.fill();
    drawDirectionArrow(ctx, (icons.preset.left + icons.preset.right) / 2, (icons.preset.top + icons.preset.bottom) / 2, dh * 0.5, 90, theme.primary);
  }

  function pickerGeom(w, h) {
    var margin = 12, sliderHeight = 16;
    var circleTop = margin;
    var available = h - circleTop - sliderHeight - margin * 1.5;
    var circleD = Math.min(w - margin * 2, available);
    var center = { x: w / 2, y: circleTop + circleD / 2 };
    var sliderTop = circleTop + circleD + margin * 0.5;
    return { center: center, radius: circleD / 2, slider: { left: margin, top: sliderTop, right: w - margin, bottom: sliderTop + sliderHeight } };
  }
  function drawColorPicker(ctx, w, h) {
    drawControlBackground(ctx, w, h);
    var g = pickerGeom(w, h);
    var c = g.center, radius = g.radius;
    var hsv = rgbToHsv(state.color);

    if (radius > 0) {
      if (ctx.createConicGradient) {
        var cg = ctx.createConicGradient(0, c.x, c.y);
        for (var d = 0; d <= 360; d += 10) cg.addColorStop(d / 360, cssHsv(d, 1, 1));
        ctx.fillStyle = cg;
      } else {
        ctx.fillStyle = cssHsv(0, 1, 1);
      }
      ctx.beginPath(); ctx.arc(c.x, c.y, radius, 0, Math.PI * 2); ctx.fill();

      var rg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, radius);
      rg.addColorStop(0, 'rgba(255,255,255,1)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(c.x, c.y, radius, 0, Math.PI * 2); ctx.fill();

      if (hsv.v < 1) {
        ctx.fillStyle = 'rgba(0,0,0,' + (1 - hsv.v) + ')';
        ctx.beginPath(); ctx.arc(c.x, c.y, radius, 0, Math.PI * 2); ctx.fill();
      }

      ctx.strokeStyle = rgbStr(theme.tertiary, 1);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(c.x, c.y, radius - 1, 0, Math.PI * 2); ctx.stroke();

      var ang = hsv.h * Math.PI / 180, dist = radius * hsv.s;
      var hx = c.x + dist * Math.cos(ang), hy = c.y + dist * Math.sin(ang);
      var hr = Math.min(radius * 0.14, 12);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = hsv.v < 0.6 ? '#fff' : '#000';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(hx, hy, hr * 0.55, 0, Math.PI * 2); ctx.stroke();
    }

    var sl = g.slider, sc = Math.min(8, (sl.bottom - sl.top) / 2);
    ctx.fillStyle = rgbStr(theme.tertiary, 0.25);
    roundRectPath(ctx, sl.left, sl.top, sl.right - sl.left, sl.bottom - sl.top, sc); ctx.fill();
    var lg = ctx.createLinearGradient(sl.left, sl.top, sl.right, sl.top);
    lg.addColorStop(0, 'rgb(0,0,0)');
    lg.addColorStop(1, cssHsv(hsv.h, hsv.s, 1));
    ctx.fillStyle = lg;
    roundRectPath(ctx, sl.left, sl.top, sl.right - sl.left, sl.bottom - sl.top, sc); ctx.fill();
    var sx = sl.left + (sl.right - sl.left) * hsv.v;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx, sl.top); ctx.lineTo(sx, sl.bottom); ctx.stroke();

    drawControlText(ctx, '#' + hex8(state.color).slice(2), w / 2, sl.bottom + 12 * 0.4 + 10, theme.primary, h * 0.045);
  }

  // ---------------- widget builders ----------------
  function addWidgetWrap(left, top, w, h, z) {
    var wrap = document.createElement('div');
    wrap.className = 'widget';
    wrap.style.left = left + 'px';
    wrap.style.top = top + 'px';
    wrap.style.width = w + 'px';
    wrap.style.height = h + 'px';
    wrap.style.zIndex = z;
    design.appendChild(wrap);
    return wrap;
  }

  function buildTextEditor(wrap, w, h) {
    var m = 14;
    var widget = makeCanvas(wrap, 0, 0, w, h, drawTextEditor, function (phase, p) {
      if (phase !== 'down') return;
      var icons = editorControlRegions(w, h, 0);
      function inside(r) { return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom; }
      if (inside(icons.preset)) { presetsEl.classList.toggle('open'); }
      else if (inside(icons.delete)) { editorInput.value = ''; setText(''); }
    });

    var field = editorFieldRegion(w, h, m);
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'led-input';
    input.style.left = field.left + 'px';
    input.style.top = field.top + 'px';
    input.style.width = (field.right - field.left) + 'px';
    input.style.height = (field.bottom - field.top) + 'px';
    input.style.fontSize = ((field.bottom - field.top) * 0.48) + 'px';
    input.value = state.text;
    input.addEventListener('input', function () {
      input.value = sanitize(input.value);
      setText(input.value);
    });
    wrap.appendChild(input);
    editorInput = input;

    var presetsEl = document.createElement('div');
    presetsEl.className = 'presets';
    PRESET_MESSAGES.forEach(function (msg) {
      var item = document.createElement('div');
      item.textContent = msg;
      item.addEventListener('click', function () {
        input.value = msg;
        setText(msg);
        presetsEl.classList.remove('open');
      });
      presetsEl.appendChild(item);
    });
    wrap.appendChild(presetsEl);
    void widget;
  }

  function buildColorPicker(wrap, w, h) {
    makeCanvas(wrap, 0, 0, w, h, drawColorPicker, function (phase, p) {
      if (phase !== 'down' && phase !== 'move') return;
      var g = pickerGeom(w, h);
      var hsv = rgbToHsv(state.color);
      if (p.x >= g.slider.left && p.x <= g.slider.right && p.y >= g.slider.top && p.y <= g.slider.bottom) {
        var frac = clamp((p.x - g.slider.left) / (g.slider.right - g.slider.left), 0, 1);
        setColor(hsvToRgb(hsv.h, hsv.s, frac));
        return;
      }
      var dx = p.x - g.center.x, dy = p.y - g.center.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d <= g.radius) {
        var hue = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
        var sat = clamp(d / g.radius, 0, 1);
        setColor(hsvToRgb(hue, sat, hsv.v));
      }
    });
  }

  // ---------------- config / build ----------------
  function syncAll() { for (var i = 0; i < widgets.length; i++) widgets[i].render(); if (editorInput) editorInput.value = state.text; }

  function build(cfg) {
    DESIGN_W = cfg.width || 1280;
    DESIGN_H = cfg.height || 704;
    design.style.width = DESIGN_W + 'px';
    design.style.height = DESIGN_H + 'px';
    if (cfg.theme) {
      theme.primary = hexToRgb(cfg.theme.primary) || theme.primary;
      theme.secondary = hexToRgb(cfg.theme.secondary) || theme.secondary;
      theme.tertiary = hexToRgb(cfg.theme.tertiary) || theme.tertiary;
    }

    var items = cfg.items || [];
    items.forEach(function (it, idx) {
      var s = it.scale || 1;
      var w = it.width * s, h = it.height * s;
      var left = it.offsetX + it.width * (1 - s) / 2;
      var top = it.offsetY + it.height * (1 - s) / 2;
      var wrap = addWidgetWrap(left, top, w, h, idx);
      switch (it.type) {
        case 'ROADMAP_192X32':
          roadmapWidget = makeCanvas(wrap, 0, 0, w, h, drawRoadmap, null);
          break;
        case 'CONTROL_TEXT_EDITOR':
          buildTextEditor(wrap, w, h);
          break;
        case 'CONTROL_ORIENTATION':
          makeCanvas(wrap, 0, 0, w, h, drawOrientation, function (phase, p) {
            if (phase !== 'down') return;
            var m = 14, groupW = (w - 2 * m) / 3, top = h * 0.16, btnH = h * 0.46, btnW = Math.min(groupW * 0.8, h * 1.05);
            function group(cx) { return { left: cx - btnW / 2, top: top, right: cx + btnW / 2, bottom: top + btnH }; }
            var cx0 = m + groupW * 0.5, cx1 = m + groupW * 1.5, cx2 = m + groupW * 2.5;
            var stepW = groupW * 0.3, stepH = btnH * 0.9, stepTop = top + (btnH - stepH) / 2, stepBottom = stepTop + stepH;
            function inside(r) { return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom; }
            if (inside(group(cx0))) toggleFlipV();
            else if (inside(group(cx1))) toggleFlipH();
            else if (inside({ left: cx2 - stepW * 2, top: stepTop, right: cx2 - stepW, bottom: stepBottom })) setFontScale(state.fontScale - 1);
            else if (inside({ left: cx2 + stepW, top: stepTop, right: cx2 + stepW * 2, bottom: stepBottom })) setFontScale(state.fontScale + 1);
          });
          break;
        case 'CONTROL_ANIMATION':
          makeCanvas(wrap, 0, 0, w, h, drawAnimation, function (phase, p) {
            if (phase !== 'down') return;
            var m = 14, groupW = (w - 2 * m) / 4, top = h * 0.16, btnH = h * 0.46, btnW = Math.min(groupW * 0.8, h * 1.05);
            function group(cx) { return { left: cx - btnW / 2, top: top, right: cx + btnW / 2, bottom: top + btnH }; }
            function inside(r) { return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom; }
            function tapDir(dir) {
              var wasActive = (state.direction === dir && scrollTimer != null);
              toggleScroll(dir);
              if (wasActive) pushAction({ type: 'stopScroll' });
              else pushAction({ type: 'startScroll', direction: dir });
            }
            if (inside(group(m + groupW * 0.5))) tapDir('LEFT');
            else if (inside(group(m + groupW * 1.5))) tapDir('RIGHT');
            else if (inside(group(m + groupW * 2.5))) tapDir('UP');
            else if (inside(group(m + groupW * 3.5))) tapDir('DOWN');
          });
          break;
        case 'COLOR_PICKER':
          buildColorPicker(wrap, w, h);
          break;
        default:
          break;
      }
    });

    rebuild();
    fit();
    statusEl.textContent = 'RUTERO ' + DESIGN_W + 'x' + DESIGN_H + ' - ' + items.length + ' widgets';
  }

  // ---------------- fit to viewport ----------------
  function fit() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var s = Math.min(vw / DESIGN_W, vh / DESIGN_H);
    var ox = (vw - DESIGN_W * s) / 2, oy = (vh - DESIGN_H * s) / 2;
    design.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + s + ')';
    var dpr = window.devicePixelRatio || 1;
    ss = clamp(s * dpr, 1, 3);
    for (var i = 0; i < widgets.length; i++) widgets[i].render();
  }

  // ---------------- remote follow ----------------
  function applyAction(a) {
    var t = String(a.type || '').toLowerCase();
    if (t === 'settext' && a.text != null) setText(a.text);
    else if (t === 'cleartext') setText('');
    else if (t === 'setcolor' && a.color) { var c = hexToRgb(a.color); if (c) setColor(c); }
    else if (t === 'setfontscale' && a.value != null) setFontScale(a.value);
    else if (t === 'increasefont') setFontScale(state.fontScale + 1);
    else if (t === 'decreasefont') setFontScale(state.fontScale - 1);
    else if (t === 'setfliphorizontal' && a.enabled != null) { state.flipH = !!a.enabled; rebuild(); syncAll(); }
    else if (t === 'togglefliphorizontal') toggleFlipH();
    else if (t === 'setflipvertical' && a.enabled != null) { state.flipV = !!a.enabled; rebuild(); syncAll(); }
    else if (t === 'toggleflipvertical') toggleFlipV();
    else if (t === 'startscroll' && a.direction) { var d = parseDir(a.direction); if (d) startScroll(d); }
    else if (t === 'stopscroll') stopScroll();
    else if (t === 'scrollby' && a.delta != null) { scrollTo(state.scroll + a.delta); syncAll(); }
    else if (t === 'scrollto' && a.offset != null) { scrollTo(a.offset); syncAll(); }
    else if (t === 'resetscroll') { scrollTo(0); syncAll(); }
  }

  function applyRemote(msg) {
    if (!msg) return;
    var now = Date.now();
    if (msg.ttlMs > 0 && msg.issuedAt > 0 && now > msg.issuedAt + msg.ttlMs) return;
    if (msg.rev != null) {
      // El device reporta cambios de estado sin cambiar seq: usar rev.
      if (msg.rev <= lastRev && !(msg.seq > lastSeq)) return;
      if (msg.rev > lastRev) lastRev = msg.rev;
    } else if (msg.seq > 0 && msg.seq <= lastSeq) {
      return;
    }
    if (msg.seq > 0) lastSeq = msg.seq;
    applyingRemote = true;
    try {
      var st = msg.state || {};
      if (st.text != null) state.text = sanitize(st.text);
      if (st.color) { var c = hexToRgb(st.color); if (c) state.color = c; }
      if (st.fontScale != null) state.fontScale = clamp(st.fontScale | 0, 1, MAX_FONT_SCALE);
      if (st.flipHorizontal != null) state.flipH = !!st.flipHorizontal;
      if (st.flipVertical != null) state.flipV = !!st.flipVertical;
      rebuild();
      if (st.scrollDirection) { var d = parseDir(st.scrollDirection); if (d) startScroll(d); }
      if (st.scrollOffset != null) scrollTo(st.scrollOffset);
      (msg.actions || []).forEach(applyAction);
    } finally {
      applyingRemote = false;
    }
    statusEl.textContent = 'servidor seq=' + (msg.seq || '-');
    syncAll();
  }

  function setFollow(on) {
    if (followTimer) { clearInterval(followTimer); followTimer = null; }
    if (on) {
      pushEnabled = false;
      if (pushEl) pushEl.checked = false;
    } else {
      statusEl.textContent = pushEnabled ? 'control MPC80T' : 'modo local';
      return;
    }
    var poll = function () {
      fetch('/roadmap.json', { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(applyRemote)
        .catch(function () { statusEl.textContent = 'servidor no disponible'; });
    };
    lastSeq = -Infinity;
    lastRev = -Infinity;
    poll();
    followTimer = setInterval(poll, 1000);
  }

  // Sincronizacion de arranque: la web adopta el estado actual del servidor
  // para empezar identica al MPC80T (no modifica el device, solo lee).
  function syncFromServer() {
    lastSeq = -Infinity;
    lastRev = -Infinity;
    return fetch('/roadmap.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (msg) {
        applyRemote(msg);
        statusEl.textContent = pushEnabled ? 'control MPC80T' : 'servidor seq=' + (msg.seq || '-');
      })
      .catch(function () { statusEl.textContent = 'servidor no disponible'; });
  }

  followEl.addEventListener('change', function () { setFollow(followEl.checked); });
  if (pushEl) {
    pushEl.addEventListener('change', function () {
      pushEnabled = pushEl.checked;
      if (pushEnabled && followEl.checked) { followEl.checked = false; setFollow(false); }
      statusEl.textContent = pushEnabled ? 'control MPC80T' : 'modo local';
    });
  }
  window.addEventListener('resize', fit);

  // ---------------- boot ----------------
  bgImg.addEventListener('error', function () { bgImg.style.display = 'none'; });

  fetch('/api/config', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('config HTTP ' + r.status); return r.json(); })
    .then(build)
    .then(syncFromServer)
    .catch(function (e) { statusEl.textContent = 'error config: ' + e.message; });

})();
