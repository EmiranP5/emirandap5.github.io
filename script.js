/* ============================================================
   ❤️  San Valentín — Galaxia Romántica  U L T R A
   ============================================================
   Motor de galaxia cinematográfico con:
   · 3 capas de estrellas con parallax diferencial
   · Nebulosas orgánicas pre-renderizadas (offscreen canvas)
   · Efecto warp de entrada (hiperespacio)
   · Estrellas fugaces con trayectorias curvas (Bézier)
   · Eventos cósmicos (pulsos de luz, micro-novas)
   · Glow sprite pre-renderizado (bloom aditivo)
   · Parallax reactivo al mouse / giroscopio
   · Auto-drift con curva Lissajous
   · DeltaTime + FPS adaptativo
   · Viñeta de profundidad
   · Polvo cósmico flotante
   · Respeta prefers-reduced-motion
   ============================================================ */

/* ============================================================
   1. SLIDES — CAMBIA LAS IMÁGENES Y FRASES AQUÍ
   ============================================================
   - Las imágenes van en ./assets/img/
   - Cualquier tamaño (object-fit: cover las adapta).
   - Para cambiar una : reemplaza el archivo y/o el nombre.
   - Para cambiar una frase: edita el campo "text".
   ============================================================ */
var slides = [
  { img: "./assets/img/01.jpeg", text: "Desde que llegaste, todo empezó a brillar ✨" },
  { img: "./assets/img/02.jpeg", text: "Contigo, incluso el silencio es bonito 💜" },
  { img: "./assets/img/03.jpeg", text: "Eres mi casualidad favorita 🌙" },
  { img: "./assets/img/04.jpeg", text: "Mi lugar seguro siempre será a tu lado 🤍" },
  { img: "./assets/img/05.jpeg", text: "Cada recuerdo contigo vale el universo 🌌" },
  { img: "./assets/img/06.jpeg", text: "Tu sonrisa es mi constelación favorita ✨" },
  { img: "./assets/img/07.jpeg", text: "Si te tengo a ti, lo tengo todo 💫" },
  { img: "./assets/img/08.jpeg", text: "Contigo aprendí lo que es amar bonito 💖" },
  { img: "./assets/img/09.jpeg", text: "Eres la mejor historia que me pasó 📖" },
  { img: "./assets/img/10.jpeg", text: "Te elegiría en todas mis vidas 💕" },
  { img: "./assets/img/11.jpeg", text: "Mi universo tiene tu nombre 🌠" },
  { img: "./assets/img/12.jpeg", text: "Amarte se siente como llegar a casa 🏡" },
  { img: "./assets/img/13.jpeg", text: "Eres mi siempre, sin dudas 💍" },
  { img: "./assets/img/14.jpeg", text: "Todo es mejor si es contigo 💞" },
  { img: "./assets/img/15.jpeg", text: "Gracias por existir en mi vida 💜" }
];

/* ============================================================
   2. CONFIGURACIÓN — Ajusta intensidad, colores, velocidad
   ============================================================ */
var CONFIG = {
  /* Estrellas (desktop). En móvil se multiplican por MOBILE_D */
  FAR_STARS:  200,     // Capa lejana: muchas, diminutas
  MID_STARS:  90,      // Capa media: moderadas, con halo
  NEAR_STARS: 25,      // Capa cercana: pocas, con bloom grande
  DUST:       50,      // Polvo cósmico
  NEBULAS:    5,       // Nebulosas orgánicas
  MOBILE_D:   0.38,    // Multiplicador de densidad en móvil (-15% por mayor parallax)

  /* Parallax */
  PX_STRENGTH: window.innerWidth >= 768 ? 65 : 45,  // Desplazamiento máximo: 65px desktop, 45px móvil (era 28)
  PX_SMOOTH:   0.028,  // Suavizado más rápido (era 0.035)

  /* Warp de entrada */
  WARP_DUR: 2.2,       // Segundos del efecto hiperespacio

  /* Estrellas fugaces */
  SHOOT_MIN: 3,        // Intervalo mínimo (s)
  SHOOT_MAX: 7,        // Intervalo máximo (s)

  /* Eventos cósmicos (pulsos, novas) */
  EVENT_MIN: 7,
  EVENT_MAX: 14,

  /* Nebulosas */
  NEB_BREATHE: 0.045,  // Amplitud de la "respiración" (escala)

  /* Carrusel */
  AUTOPLAY: 5000       // ms entre auto-avance
};

/* ============================================================
   3. PALETA DE NEBULOSAS + UTILIDADES
   ============================================================ */
var NEBULA_PALETTE = [
  { r: 140, g: 60,  b: 200 },   // violeta
  { r: 40,  g: 70,  b: 180 },   // azul real
  { r: 220, g: 60,  b: 130 },   // rosa cálido
  { r: 30,  g: 160, b: 155 },   // turquesa
  { r: 180, g: 80,  b: 220 }    // lavanda
];

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

/** Color de estrella basado en "temperatura" */
function starColor() {
  var r = Math.random();
  if (r < 0.55) return '255,255,255';     // blanca
  if (r < 0.72) return '195,215,255';     // azul fría
  if (r < 0.86) return '255,238,210';     // amarilla cálida
  return '255,215,235';                    // rosada
}

function isMobile() { return window.innerWidth < 768; }
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ============================================================
   4. REFERENCIAS DOM
   ============================================================ */
var screenInitial  = document.getElementById('screenInitial');
var screenGalaxy   = document.getElementById('screenGalaxy');
var galaxyCanvas   = document.getElementById('galaxyCanvas');
var yesButton      = document.getElementById('yesButton');
var noButton       = document.getElementById('noButton');
var responseEl     = document.getElementById('response');
var imageContainer = document.getElementById('imageContainer');
var darkModeToggle = document.getElementById('darkModeToggle');
var btnBack        = document.getElementById('btnBack');

/* ============================================================
   5. CLASE GALAXY — Motor de animación cinematográfico
   ============================================================ */
function Galaxy(canvas) {
  this.canvas = canvas;
  this.ctx    = canvas.getContext('2d');

  /* Tiempo */
  this.lastTs  = 0;
  this.dt      = 0;
  this.elapsed = 0;
  this.warp    = 0;        // 0 = hiperespacio, 1 = normal

  /* Parallax */
  this.px       = { x: 0, y: 0 };
  this.pxTarget = { x: 0, y: 0 };
  this.pxUser   = { x: 0, y: 0 };
  this.hasInput = false;
  this.inputDecay = 1;  // 1 = control usuario, 0 = auto-drift

  /* Touch drag (móviles) */
  this.touchActive = false;
  this.touchStartX = 0;
  this.touchStartY = 0;
  this.touchDragX  = 0;
  this.touchDragY  = 0;

  /* FPS adaptativo */
  this.fpsBuf  = [];
  this.quality = 1;        // 0.5 – 1.0

  /* Capas de partículas */
  this.farStars  = [];
  this.midStars  = [];
  this.nearStars = [];
  this.dust      = [];
  this.nebulas   = [];
  this.shoots    = [];
  this.events    = [];

  /* Efectos de transición de imagen */
  this.transitionPulses = [];
  this.carouselParticles = [];
  this.microWarp = 0;
  this.microWarpDir = 0;
  this.nebulaBurst = 0;
  this.colorShift = 0;
  this.colorShiftHue = 0;

  /* Timers para spawn */
  this.nextShoot = 0;
  this.nextEvent = 0;

  /* Assets pre-renderizados */
  this.glowSprite = null;

  /* Estado */
  this.running = false;
  this.animId  = null;
  this.w  = 0;
  this.h  = 0;
  this.cx = 0;
  this.cy = 0;
  this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  this._rebuildTimer = null;

  /* Bindings */
  this._onResize = this._handleResize.bind(this);
  this._frameBound = this._frame.bind(this);
  this._onMouse = this._handleMouse.bind(this);
  this._onOrientation = this._handleOrientation.bind(this);
  this._onTouchStart = this._handleTouchStart.bind(this);
  this._onTouchMove  = this._handleTouchMove.bind(this);
  this._onTouchEnd   = this._handleTouchEnd.bind(this);
}

/* ---- Resize ---- */
Galaxy.prototype._resize = function () {
  this.w  = window.innerWidth;
  this.h  = window.innerHeight;
  this.cx = this.w * 0.5;
  this.cy = this.h * 0.5;
  this.canvas.width  = this.w * this.dpr;
  this.canvas.height = this.h * this.dpr;
  this.canvas.style.width  = this.w + 'px';
  this.canvas.style.height = this.h + 'px';
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
};

Galaxy.prototype._handleResize = function () {
  this._resize();
  var self = this;
  if (this._rebuildTimer) clearTimeout(this._rebuildTimer);
  this._rebuildTimer = setTimeout(function () { self._createParticles(); }, 250);
};

/* ---- Glow sprite pre-renderizado (128×128 blanco) ---- */
Galaxy.prototype._createGlowSprite = function () {
  var s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  var x = c.getContext('2d'), h = s / 2;
  var g = x.createRadialGradient(h, h, 0, h, h, h);
  g.addColorStop(0,    'rgba(255,255,255,1)');
  g.addColorStop(0.08, 'rgba(255,255,255,.55)');
  g.addColorStop(0.25, 'rgba(255,255,255,.12)');
  g.addColorStop(0.55, 'rgba(255,255,255,.02)');
  g.addColorStop(1,    'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, s, s);
  this.glowSprite = c;
};

/* ---- Nebulosa orgánica pre-renderizada (offscreen canvas) ---- */
Galaxy.prototype._preRenderNebula = function (neb) {
  var size = Math.ceil(neb.radius * 3);
  var c = document.createElement('canvas');
  c.width = c.height = size;
  var x = c.getContext('2d');
  var ch = size / 2, col = neb.color;

  for (var i = 0; i < 7; i++) {
    var ox = Math.sin(i * 2.1 + neb.seed) * neb.radius * 0.35;
    var oy = Math.cos(i * 1.7 + neb.seed) * neb.radius * 0.35;
    var r  = neb.radius * (0.4 + (i / 7) * 0.6);
    var aC = Math.max(0.02, 0.14 - i * 0.014);
    var aM = Math.max(0.01, 0.05 - i * 0.005);

    var g = x.createRadialGradient(ch + ox, ch + oy, 0, ch + ox, ch + oy, r);
    g.addColorStop(0,    'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + aC + ')');
    g.addColorStop(0.35, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + aM + ')');
    g.addColorStop(1,    'rgba(' + col.r + ',' + col.g + ',' + col.b + ',0)');
    x.fillStyle = g;
    x.fillRect(0, 0, size, size);
  }
  neb.canvas = c;
  neb.cSize  = size;
};

/* ---- Crear todas las partículas ---- */
Galaxy.prototype._createParticles = function () {
  var mob = isMobile(), d = mob ? CONFIG.MOBILE_D : 1;
  var w = this.w, h = this.h, i;

  /* --- Estrellas lejanas --- */
  this.farStars = [];
  var fc = Math.floor(CONFIG.FAR_STARS * d);
  for (i = 0; i < fc; i++) {
    this.farStars.push({
      x: Math.random() * w * 1.15 - w * 0.075,
      y: Math.random() * h * 1.15 - h * 0.075,
      r: Math.random() * 1 + 0.3,
      a: Math.random() * 0.35 + 0.15,
      spd: Math.random() * 1.5 + 0.3,
      ph: Math.random() * 6.28,
      col: starColor()
    });
  }

  /* --- Estrellas medias --- */
  this.midStars = [];
  var mc = Math.floor(CONFIG.MID_STARS * d);
  for (i = 0; i < mc; i++) {
    this.midStars.push({
      x: Math.random() * w * 1.25 - w * 0.125,
      y: Math.random() * h * 1.25 - h * 0.125,
      r: Math.random() * 1.5 + 0.8,
      a: Math.random() * 0.45 + 0.3,
      spd: Math.random() * 2 + 0.5,
      ph: Math.random() * 6.28,
      col: starColor()
    });
  }

  /* --- Estrellas cercanas --- */
  this.nearStars = [];
  var nc = Math.floor(CONFIG.NEAR_STARS * d);
  for (i = 0; i < nc; i++) {
    this.nearStars.push({
      x: Math.random() * w * 1.35 - w * 0.175,
      y: Math.random() * h * 1.35 - h * 0.175,
      r: Math.random() * 1.5 + 1.5,
      a: Math.random() * 0.35 + 0.5,
      spd: Math.random() * 2.5 + 0.8,
      ph: Math.random() * 6.28,
      col: starColor()
    });
  }

  /* --- Polvo cósmico --- */
  this.dust = [];
  var dc = Math.floor(CONFIG.DUST * d);
  for (i = 0; i < dc; i++) {
    var warm = Math.random() > 0.45;
    this.dust.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.4,
      a: Math.random() * 0.18 + 0.03,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.15 - 0.08,
      col: warm ? '255,190,220' : '190,175,255'
    });
  }

  /* --- Nebulosas --- */
  this.nebulas = [];
  var nebC = mob ? Math.min(CONFIG.NEBULAS, 3) : CONFIG.NEBULAS;
  for (i = 0; i < nebC; i++) {
    var c = NEBULA_PALETTE[i % NEBULA_PALETTE.length];
    var neb = {
      x: Math.random() * w,
      y: Math.random() * h,
      radius: 140 + Math.random() * 200,
      color: c,
      baseA: 0.55 + Math.random() * 0.35,
      breatheSpd: Math.random() * 0.4 + 0.15,
      ph: Math.random() * 6.28,
      rotSpd: (Math.random() - 0.5) * 0.015,
      rot: Math.random() * 6.28,
      seed: Math.random() * 100,
      px: 0.12 + Math.random() * 0.13  // 0.06-0.16 → 0.12-0.25 para variación orgánica
    };
    this._preRenderNebula(neb);
    this.nebulas.push(neb);
  }

  this.shoots = [];
  this.events = [];
  this.nextShoot = this.elapsed + CONFIG.SHOOT_MIN + Math.random() * (CONFIG.SHOOT_MAX - CONFIG.SHOOT_MIN);
  this.nextEvent = this.elapsed + CONFIG.EVENT_MIN + Math.random() * (CONFIG.EVENT_MAX - CONFIG.EVENT_MIN);
};

/* ---- Parallax: mouse ---- */
Galaxy.prototype._handleMouse = function (e) {
  this.pxUser.x = (e.clientX / this.w - 0.5) * 2;
  this.pxUser.y = (e.clientY / this.h - 0.5) * 2;
  this.hasInput = true;
};

/* ---- Parallax: giroscopio ---- */
Galaxy.prototype._handleOrientation = function (e) {
  if (e.gamma !== null) {
    this.pxUser.x = clamp((e.gamma || 0) / 30, -1, 1);
    this.pxUser.y = clamp(((e.beta || 0) - 45) / 30, -1, 1);
    this.hasInput = true;
  }
};

/* ---- Parallax: touch drag (móviles) ---- */
Galaxy.prototype._handleTouchStart = function (e) {
  if (e.touches.length !== 1) return;
  this.touchActive = true;
  this.touchStartX = e.touches[0].clientX;
  this.touchStartY = e.touches[0].clientY;
  this.touchDragX  = 0;
  this.touchDragY  = 0;
};

Galaxy.prototype._handleTouchMove = function (e) {
  if (!this.touchActive || e.touches.length !== 1) return;
  var dx = e.touches[0].clientX - this.touchStartX;
  var dy = e.touches[0].clientY - this.touchStartY;
  // Convertir píxeles a normalizado (-1 a 1) con sensibilidad
  this.touchDragX = clamp(dx / (this.w * 0.3), -1, 1);
  this.touchDragY = clamp(dy / (this.h * 0.3), -1, 1);
  this.pxUser.x = this.touchDragX;
  this.pxUser.y = this.touchDragY;
  this.hasInput = true;
};

Galaxy.prototype._handleTouchEnd = function () {
  this.touchActive = false;
  // El auto-drift tomará control gradualmente via inputDecay
};

Galaxy.prototype._setupParallax = function () {
  // Limpiar listeners previos
  window.removeEventListener('mousemove', this._onMouse);
  window.removeEventListener('deviceorientation', this._onOrientation);
  window.removeEventListener('touchstart', this._onTouchStart);
  window.removeEventListener('touchmove', this._onTouchMove);
  window.removeEventListener('touchend', this._onTouchEnd);

  // Añadir listeners
  window.addEventListener('mousemove', this._onMouse);
  window.addEventListener('deviceorientation', this._onOrientation);
  if (isMobile()) {
    window.addEventListener('touchstart', this._onTouchStart, { passive: true });
    window.addEventListener('touchmove', this._onTouchMove, { passive: false });
    window.addEventListener('touchend', this._onTouchEnd, { passive: true });
  }
};

/* ============================================================
   FRAME PRINCIPAL (deltaTime + FPS adaptativo)
   ============================================================ */
Galaxy.prototype._frame = function (ts) {
  if (!this.running) return;

  /* Delta time */
  if (this.lastTs === 0) this.lastTs = ts;
  this.dt = Math.min(0.05, (ts - this.lastTs) / 1000);
  this.lastTs = ts;
  this.elapsed += this.dt;

  /* Warp */
  if (this.warp < 1) this.warp = Math.min(1, this.warp + this.dt / CONFIG.WARP_DUR);

  /* Micro-warp (efecto de transición) */
  if (this.microWarp > 0) {
    this.microWarp -= this.dt * 2.5; // Decay rápido (0.4s total)
    if (this.microWarp <= 0) {
      this.microWarp = 0;
      this.microWarpDir = 0;
    } else if (this.microWarp < 0.125 && this.microWarpDir === 1) {
      this.microWarpDir = -1; // Cambiar a contracción en la mitad
    }
  }

  /* Nebula burst */
  if (this.nebulaBurst > 0) {
    this.nebulaBurst -= this.dt * 1.0; // Decay en 1s
    if (this.nebulaBurst < 0) this.nebulaBurst = 0;
  }

  /* Color shift */
  if (this.colorShift > 0) {
    this.colorShift -= this.dt * 0.65; // Decay en ~1.5s
    if (this.colorShift < 0) this.colorShift = 0;
  }

  /* Parallax: auto-drift Lissajous + input usuario con decay */
  var drift = {
    x: Math.sin(this.elapsed * 0.08) * 0.12 + Math.sin(this.elapsed * 0.14) * 0.05,
    y: Math.cos(this.elapsed * 0.06) * 0.1  + Math.cos(this.elapsed * 0.11) * 0.04
  };

  // Input decay: fade out gradual cuando usuario deja de interactuar
  if (this.hasInput) {
    this.inputDecay = Math.min(1, this.inputDecay + this.dt * 2);  // Ramp up rápido
  } else {
    this.inputDecay = Math.max(0, this.inputDecay - this.dt * 0.5); // Decay lento
  }

  // Mezclar input usuario (con decay) + auto-drift
  this.pxTarget.x = (this.pxUser.x * this.inputDecay) + drift.x;
  this.pxTarget.y = (this.pxUser.y * this.inputDecay) + drift.y;
  this.px.x = lerp(this.px.x, this.pxTarget.x, CONFIG.PX_SMOOTH);
  this.px.y = lerp(this.px.y, this.pxTarget.y, CONFIG.PX_SMOOTH);

  // Reset completo cuando decay termina
  if (this.inputDecay <= 0.01) {
    this.hasInput = false;
    this.pxUser.x = 0;
    this.pxUser.y = 0;
  }

  /* FPS adaptativo */
  if (this.dt > 0) {
    this.fpsBuf.push(1 / this.dt);
    if (this.fpsBuf.length > 90) this.fpsBuf.shift();
    if (this.fpsBuf.length >= 60) {
      var sum = 0;
      for (var i = 0; i < this.fpsBuf.length; i++) sum += this.fpsBuf[i];
      var avg = sum / this.fpsBuf.length;
      if (avg < 28 && this.quality > 0.5)  this.quality = Math.max(0.5, this.quality - 0.08);
      else if (avg > 50 && this.quality < 1) this.quality = Math.min(1, this.quality + 0.03);
    }
  }

  /* Spawn: estrella fugaz */
  if (this.elapsed > this.nextShoot && this.warp > 0.8) {
    this._spawnShoot();
    this.nextShoot = this.elapsed + CONFIG.SHOOT_MIN + Math.random() * (CONFIG.SHOOT_MAX - CONFIG.SHOOT_MIN);
  }
  /* Spawn: evento cósmico */
  if (this.elapsed > this.nextEvent && this.warp > 0.9) {
    this._spawnEvent();
    this.nextEvent = this.elapsed + CONFIG.EVENT_MIN + Math.random() * (CONFIG.EVENT_MAX - CONFIG.EVENT_MIN);
  }

  /* Render */
  this._draw();
  this.animId = requestAnimationFrame(this._frameBound);
};

/* ============================================================
   PIPELINE DE DIBUJO (orden de capas back→front)
   ============================================================ */
Galaxy.prototype._draw = function () {
  var c = this.ctx, w = this.w, h = this.h;
  this._drawBg(c, w, h);             // 1. Fondo (con color shift)
  this._drawNebulas(c);               // 2. Nebulosas (con burst)
  this._drawLayer(c, this.farStars,  0.08, false, 80);  // 3. Far stars (con micro-warp)
  this._drawDust(c, w, h);            // 4. Polvo
  this._drawLayer(c, this.midStars,  0.28, true,  140); // 5. Mid stars
  this._drawNearLayer(c);             // 6. Near stars + bloom
  this._drawCarouselParticles(c);    // 7. ⭐ Partículas del carrusel
  this._drawShoots(c);                // 8. Estrellas fugaces
  this._drawEvents(c);                // 9. Eventos cósmicos
  this._drawTransitionPulses(c);     // 10. ⭐ Pulsos de transición
  this._drawVignette(c, w, h);        // 11. Viñeta
};

/* ---- 1. Fondo degradado con centro animado ---- */
Galaxy.prototype._drawBg = function (c, w, h) {
  var t = this.elapsed;
  // Gradiente sigue al mouse/touch cuando hay input (efecto "luz siguiendo cursor")
  var pxInfluence = this.hasInput ? 0.12 : 0.04;
  var cx = w * 0.5 + Math.sin(t * 0.04) * w * 0.04 + this.px.x * pxInfluence * w;
  var cy = h * 0.5 + Math.cos(t * 0.03) * h * 0.04 + this.px.y * pxInfluence * h;
  var sh = Math.sin(t * 0.08) * 6;
  var g = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.9);
  g.addColorStop(0,    'rgb(' + (18 + sh) + ',' + (12 + sh) + ',' + (50 + sh) + ')');
  g.addColorStop(0.3,  'rgb(12,8,35)');
  g.addColorStop(0.65, 'rgb(6,4,18)');
  g.addColorStop(1,    'rgb(2,2,6)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  /* Color shift atmosférico (efecto transición) */
  if (this.colorShift > 0) {
    var hue = this.colorShiftHue;
    var sat = 40 * this.colorShift;
    var light = 8 * this.colorShift;
    c.fillStyle = 'hsla(' + hue + ', ' + sat + '%, ' + light + '%, ' + (this.colorShift * 0.15) + ')';
    c.fillRect(0, 0, w, h);
  }
};

/* ---- 2. Nebulosas orgánicas (blend screen, respiración + rotación) ---- */
Galaxy.prototype._drawNebulas = function (c) {
  c.globalCompositeOperation = 'screen';
  for (var i = 0; i < this.nebulas.length; i++) {
    var n = this.nebulas[i];
    // Respiración acelerada durante burst
    var breatheSpeed = n.breatheSpd * (1 + this.nebulaBurst * 3);
    var br = Math.sin(this.elapsed * breatheSpeed + n.ph);
    var sc = 1 + br * CONFIG.NEB_BREATHE * (1 + this.nebulaBurst * 0.5);
    // Amplificar brillo durante burst
    var burstBoost = 1 + this.nebulaBurst * 0.8;
    var al = (n.baseA + br * 0.08) * burstBoost;
    var ox = this.px.x * n.px * CONFIG.PX_STRENGTH;
    var oy = this.px.y * n.px * CONFIG.PX_STRENGTH;
    n.rot += n.rotSpd * this.dt;

    c.save();
    c.globalAlpha = clamp(al, 0.1, 1) * clamp(this.warp * 1.5, 0, 1);
    c.translate(n.x + ox, n.y + oy);
    c.rotate(n.rot);
    c.scale(sc, sc);
    c.drawImage(n.canvas, -n.cSize / 2, -n.cSize / 2);
    c.restore();
  }
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
};

/* ---- 3/5. Capa de estrellas (lejanas o medias) con warp ---- */
Galaxy.prototype._drawLayer = function (c, stars, pxFactor, glow, maxStreak) {
  var ox = this.px.x * pxFactor * CONFIG.PX_STRENGTH;
  var oy = this.px.y * pxFactor * CONFIG.PX_STRENGTH;
  var wp = this.warp;
  var count = Math.floor(stars.length * this.quality);

  for (var i = 0; i < count; i++) {
    var s = stars[i];
    var twinkle = Math.sin(this.elapsed * s.spd + s.ph);
    var a = Math.max(0.05, s.a + twinkle * 0.2);
    var sx = s.x + ox;
    var sy = s.y + oy;

    /* Aplicar micro-warp (respiro de transición) */
    if (this.microWarp > 0) {
      var mwFactor = this.microWarp * this.microWarpDir;
      var mwScale = 1 + mwFactor * 0.15; // Escala sutil (±15% max)
      sx = this.cx + (sx - this.cx) * mwScale;
      sy = this.cy + (sy - this.cy) * mwScale;
    }

    /* Efecto warp: estrellas como trazos radiales */
    if (wp < 1) {
      var dx = sx - this.cx;
      var dy = sy - this.cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var ang = Math.atan2(dy, dx);
      var streak = (1 - wp) * Math.min(dist * 0.4, maxStreak);
      if (streak > 1) {
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(sx - Math.cos(ang) * streak, sy - Math.sin(ang) * streak);
        c.strokeStyle = 'rgba(' + s.col + ',' + (a * (0.2 + wp * 0.8)) + ')';
        c.lineWidth = Math.max(0.5, s.r * 0.6);
        c.lineCap = 'round';
        c.stroke();
      }
    }

    /* Estrella normal (aparece gradualmente durante el warp) */
    if (wp > 0.25) {
      var sa = a * clamp((wp - 0.25) / 0.75, 0, 1);
      c.beginPath();
      c.arc(sx, sy, s.r, 0, 6.28);
      c.fillStyle = 'rgba(' + s.col + ',' + sa + ')';
      c.fill();

      /* Halo sutil para estrellas medias */
      if (glow && s.r > 1) {
        c.beginPath();
        c.arc(sx, sy, s.r * 3.5, 0, 6.28);
        c.fillStyle = 'rgba(' + s.col + ',' + (sa * 0.07) + ')';
        c.fill();
      }
    }
  }
};

/* ---- 4. Polvo cósmico flotante ---- */
Galaxy.prototype._drawDust = function (c, w, h) {
  var ox = this.px.x * 0.15 * CONFIG.PX_STRENGTH;  // 0.1→0.15 para más profundidad
  var oy = this.px.y * 0.15 * CONFIG.PX_STRENGTH;
  var count = Math.floor(this.dust.length * this.quality);
  var dt60 = this.dt * 60;

  for (var i = 0; i < count; i++) {
    var d = this.dust[i];
    d.x += d.vx * dt60;
    d.y += d.vy * dt60;
    if (d.x < -10) d.x = w + 10;
    if (d.x > w + 10) d.x = -10;
    if (d.y < -10) d.y = h + 10;
    if (d.y > h + 10) d.y = -10;

    c.beginPath();
    c.arc(d.x + ox, d.y + oy, d.r, 0, 6.28);
    c.fillStyle = 'rgba(' + d.col + ',' + d.a + ')';
    c.fill();
  }
};

/* ---- 6. Estrellas cercanas con bloom (glow sprite aditivo) ---- */
Galaxy.prototype._drawNearLayer = function (c) {
  var ox = this.px.x * 0.55 * CONFIG.PX_STRENGTH;  // 0.35→0.55 para primer plano dramático
  var oy = this.px.y * 0.55 * CONFIG.PX_STRENGTH;
  var wp = this.warp;
  var sprite = this.glowSprite;

  for (var i = 0; i < this.nearStars.length; i++) {
    var s = this.nearStars[i];
    var twinkle = Math.sin(this.elapsed * s.spd + s.ph);
    var a = Math.max(0.1, s.a + twinkle * 0.25);
    var sx = s.x + ox;
    var sy = s.y + oy;

    /* Aplicar micro-warp (respiro de transición) */
    if (this.microWarp > 0) {
      var mwFactor = this.microWarp * this.microWarpDir;
      var mwScale = 1 + mwFactor * 0.15;
      sx = this.cx + (sx - this.cx) * mwScale;
      sy = this.cy + (sy - this.cy) * mwScale;
    }

    /* Warp streak (largo para estrellas cercanas) */
    if (wp < 1) {
      var dx = sx - this.cx;
      var dy = sy - this.cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var ang = Math.atan2(dy, dx);
      var streak = (1 - wp) * Math.min(dist * 0.5, 200);
      if (streak > 1) {
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(sx - Math.cos(ang) * streak, sy - Math.sin(ang) * streak);
        c.strokeStyle = 'rgba(' + s.col + ',' + (a * (0.3 + wp * 0.7)) + ')';
        c.lineWidth = Math.max(0.8, s.r * 0.8);
        c.lineCap = 'round';
        c.stroke();
      }
    }

    /* Bloom + core */
    if (wp > 0.4) {
      var sa = a * clamp((wp - 0.4) / 0.6, 0, 1);

      /* Glow sprite (composición aditiva = bloom) */
      var gs = s.r * 14;
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = sa * 0.3;
      c.drawImage(sprite, sx - gs / 2, sy - gs / 2, gs, gs);
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';

      /* Core brillante */
      c.beginPath();
      c.arc(sx, sy, s.r, 0, 6.28);
      c.fillStyle = 'rgba(' + s.col + ',' + sa + ')';
      c.fill();
    }
  }
};

/* ---- 7. Estrellas fugaces (trayectorias Bézier curvas) ---- */
Galaxy.prototype._spawnShoot = function () {
  var w = this.w, h = this.h;
  var sx = Math.random() * w * 0.7 + w * 0.15;
  var sy = Math.random() * h * 0.35;
  var ang = Math.PI * 0.2 + Math.random() * Math.PI * 0.3;
  var len = 250 + Math.random() * 250;
  var ex = sx + Math.cos(ang) * len;
  var ey = sy + Math.sin(ang) * len;
  var mx = (sx + ex) / 2, my = (sy + ey) / 2;
  var perp = ang + Math.PI / 2;
  var curve = (Math.random() - 0.5) * 120;

  this.shoots.push({
    sx: sx, sy: sy,
    cpx: mx + Math.cos(perp) * curve,
    cpy: my + Math.sin(perp) * curve,
    ex: ex, ey: ey,
    t: 0,
    spd: 0.35 + Math.random() * 0.25,
    w: 1.2 + Math.random() * 1.2,
    trail: [],
    maxT: 18 + Math.floor(Math.random() * 10)
  });
};

Galaxy.prototype._drawShoots = function (c) {
  c.globalCompositeOperation = 'lighter';

  for (var i = this.shoots.length - 1; i >= 0; i--) {
    var ss = this.shoots[i];
    ss.t += ss.spd * this.dt;
    if (ss.t >= 1) { this.shoots.splice(i, 1); continue; }

    /* Posición en curva Bézier cuadrática */
    var t = ss.t, it = 1 - t;
    var x = it * it * ss.sx + 2 * it * t * ss.cpx + t * t * ss.ex;
    var y = it * it * ss.sy + 2 * it * t * ss.cpy + t * t * ss.ey;
    ss.trail.push({ x: x, y: y });
    if (ss.trail.length > ss.maxT) ss.trail.shift();

    /* Trail */
    for (var j = 0; j < ss.trail.length; j++) {
      var p = ss.trail[j];
      var prog = j / ss.trail.length;
      var ta = prog * (1 - t * 0.6) * 0.7;
      var tr = ss.w * prog;
      c.beginPath();
      c.arc(p.x, p.y, tr, 0, 6.28);
      c.fillStyle = 'rgba(255,255,255,' + ta + ')';
      c.fill();
    }

    /* Cabeza brillante */
    var hr = ss.w * 3.5;
    var ha = 0.8 * (1 - t * 0.5);
    var hg = c.createRadialGradient(x, y, 0, x, y, hr);
    hg.addColorStop(0, 'rgba(255,255,255,' + ha + ')');
    hg.addColorStop(1, 'rgba(200,210,255,0)');
    c.fillStyle = hg;
    c.fillRect(x - hr, y - hr, hr * 2, hr * 2);
  }
  c.globalCompositeOperation = 'source-over';
};

/* ---- 8. Eventos cósmicos (pulsos + micro-novas) ---- */
Galaxy.prototype._spawnEvent = function () {
  var type = Math.random() > 0.5 ? 'pulse' : 'nova';
  this.events.push({
    type: type,
    x: Math.random() * this.w,
    y: Math.random() * this.h,
    ph: 0,
    spd: type === 'pulse' ? 0.25 : 0.5,
    maxR: type === 'pulse' ? 60 + Math.random() * 80 : 15 + Math.random() * 25,
    col: NEBULA_PALETTE[Math.floor(Math.random() * NEBULA_PALETTE.length)]
  });
};

Galaxy.prototype._drawEvents = function (c) {
  c.globalCompositeOperation = 'lighter';

  for (var i = this.events.length - 1; i >= 0; i--) {
    var e = this.events[i];
    e.ph += e.spd * this.dt;
    if (e.ph >= 1) { this.events.splice(i, 1); continue; }

    var col = e.col;

    if (e.type === 'pulse') {
      /* Anillo expansivo */
      var r = e.maxR * e.ph;
      var a = 0.12 * (1 - e.ph);
      c.beginPath();
      c.arc(e.x, e.y, r, 0, 6.28);
      c.strokeStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + a + ')';
      c.lineWidth = 2 + (1 - e.ph) * 3;
      c.stroke();
      /* Resplandor interior */
      var ig = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * 0.5);
      ig.addColorStop(0, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (a * 0.4) + ')');
      ig.addColorStop(1, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',0)');
      c.fillStyle = ig;
      c.fillRect(e.x - r, e.y - r, r * 2, r * 2);

    } else {
      /* Micro-nova: flash expansivo */
      var r2 = e.maxR * Math.pow(e.ph, 0.4);
      var a2 = 0.5 * Math.pow(1 - e.ph, 2);
      var ng = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, r2);
      ng.addColorStop(0,   'rgba(255,255,255,' + a2 + ')');
      ng.addColorStop(0.3, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (a2 * 0.4) + ')');
      ng.addColorStop(1,   'rgba(' + col.r + ',' + col.g + ',' + col.b + ',0)');
      c.fillStyle = ng;
      c.fillRect(e.x - r2, e.y - r2, r2 * 2, r2 * 2);
    }
  }
  c.globalCompositeOperation = 'source-over';
};

/* ---- 9. Viñeta de profundidad ---- */
Galaxy.prototype._drawVignette = function (c, w, h) {
  var g = c.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0,    'rgba(0,0,0,0)');
  g.addColorStop(0.65, 'rgba(0,0,0,.1)');
  g.addColorStop(1,    'rgba(0,0,0,.5)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
};

/* ---- Frame estático (reduced motion) ---- */
Galaxy.prototype._drawStatic = function () {
  this.warp = 1;
  this.elapsed = 5;
  this.dt = 0.016;
  this._draw();
};

/* ============================================================
   API PÚBLICA DE GALAXY
   ============================================================ */
Galaxy.prototype.start = function () {
  if (this.running) return;
  this.running = true;
  this.elapsed = 0;
  this.lastTs  = 0;
  this.warp    = 0;
  this.fpsBuf  = [];
  this.quality = 1;
  this.px = { x: 0, y: 0 };
  this.pxTarget = { x: 0, y: 0 };
  this.hasInput = false;
  this.inputDecay = 1;

  this._resize();
  this._createGlowSprite();
  this._createParticles();
  this._setupParallax();
  window.addEventListener('resize', this._onResize);
  window.addEventListener('orientationchange', this._onResize);

  if (prefersReducedMotion()) {
    this._drawStatic();
  } else {
    this._frame(performance.now());
  }
};

Galaxy.prototype.stop = function () {
  this.running = false;
  if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
  if (this._rebuildTimer) { clearTimeout(this._rebuildTimer); this._rebuildTimer = null; }
  window.removeEventListener('resize', this._onResize);
  window.removeEventListener('orientationchange', this._onResize);
  window.removeEventListener('mousemove', this._onMouse);
  window.removeEventListener('deviceorientation', this._onOrientation);
  window.removeEventListener('touchstart', this._onTouchStart);
  window.removeEventListener('touchmove', this._onTouchMove);
  window.removeEventListener('touchend', this._onTouchEnd);
};

Galaxy.prototype.pause = function () {
  if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
};

Galaxy.prototype.resume = function () {
  if (this.running && !this.animId && !prefersReducedMotion()) {
    this.lastTs = 0;
    this._frame(performance.now());
  }
};

/* ============================================================
   EFECTO DE TRANSICIÓN DE IMAGEN
   ============================================================ */
Galaxy.prototype.triggerTransition = function () {
  if (!this.running || prefersReducedMotion()) return;

  var self = this;

  // 1. Pulso cósmico (anillo expansivo brillante)
  this._spawnTransitionPulse();

  // 2. Warp momentáneo (respiro de estrellas)
  this._triggerMicroWarp();

  // 3. Estrellas fugaces múltiples (3-5, escalonadas)
  var shootCount = 3 + Math.floor(Math.random() * 3);
  for (var i = 0; i < shootCount; i++) {
    setTimeout(function () { self._spawnShoot(); }, i * 80);
  }

  // 4. Brillo de nebulosas
  this._triggerNebulaBurst();

  // 5. Partículas emergentes (desde carrusel)
  this._spawnCarouselParticles();

  // 6. Color shift atmosférico
  this._triggerColorShift();
};

/* ---- Pulso Cósmico ---- */
Galaxy.prototype._spawnTransitionPulse = function () {
  var color = NEBULA_PALETTE[Math.floor(Math.random() * NEBULA_PALETTE.length)];
  this.transitionPulses.push({
    x: this.cx,
    y: this.cy,
    phase: 0,
    speed: 0.9,
    maxRadius: 300 + Math.random() * 200,
    color: color,
    intensity: 0.8
  });
};

Galaxy.prototype._drawTransitionPulses = function (c) {
  c.globalCompositeOperation = 'lighter';

  for (var i = this.transitionPulses.length - 1; i >= 0; i--) {
    var p = this.transitionPulses[i];
    p.phase += p.speed * this.dt;

    if (p.phase >= 1) {
      this.transitionPulses.splice(i, 1);
      continue;
    }

    var radius = p.maxRadius * Math.pow(p.phase, 0.6);
    var alpha = p.intensity * Math.pow(1 - p.phase, 1.5);
    var col = p.color;

    // Anillo exterior brillante
    c.beginPath();
    c.arc(p.x, p.y, radius, 0, 6.28);
    c.strokeStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (alpha * 0.6) + ')';
    c.lineWidth = 6 + (1 - p.phase) * 8;
    c.stroke();

    // Resplandor interior
    var innerGrad = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 0.8);
    innerGrad.addColorStop(0, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (alpha * 0.3) + ')');
    innerGrad.addColorStop(0.5, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (alpha * 0.1) + ')');
    innerGrad.addColorStop(1, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',0)');
    c.fillStyle = innerGrad;
    c.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
  }

  c.globalCompositeOperation = 'source-over';
};

/* ---- Micro-Warp ---- */
Galaxy.prototype._triggerMicroWarp = function () {
  this.microWarp = 0.25;
  this.microWarpDir = 1;
};

/* ---- Nebula Burst ---- */
Galaxy.prototype._triggerNebulaBurst = function () {
  this.nebulaBurst = 1;
};

/* ---- Partículas Emergentes ---- */
Galaxy.prototype._spawnCarouselParticles = function () {
  var carouselX = this.w / 2;
  var carouselY = this.h / 2;
  var count = isMobile() ? 15 : 25;

  for (var i = 0; i < count; i++) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 50 + Math.random() * 100;
    var color = NEBULA_PALETTE[Math.floor(Math.random() * NEBULA_PALETTE.length)];

    this.carouselParticles.push({
      x: carouselX,
      y: carouselY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.6 + Math.random() * 0.4,
      size: 2 + Math.random() * 3,
      color: color
    });
  }
};

Galaxy.prototype._drawCarouselParticles = function (c) {
  c.globalCompositeOperation = 'lighter';

  for (var i = this.carouselParticles.length - 1; i >= 0; i--) {
    var p = this.carouselParticles[i];

    p.x += p.vx * this.dt;
    p.y += p.vy * this.dt;
    p.life -= p.decay * this.dt;

    if (p.life <= 0) {
      this.carouselParticles.splice(i, 1);
      continue;
    }

    var alpha = p.life * 0.7;
    var size = p.size * p.life;

    // Partícula core
    c.beginPath();
    c.arc(p.x, p.y, size, 0, 6.28);
    c.fillStyle = 'rgba(' + p.color.r + ',' + p.color.g + ',' + p.color.b + ',' + alpha + ')';
    c.fill();

    // Halo
    c.beginPath();
    c.arc(p.x, p.y, size * 3, 0, 6.28);
    c.fillStyle = 'rgba(' + p.color.r + ',' + p.color.g + ',' + p.color.b + ',' + (alpha * 0.2) + ')';
    c.fill();
  }

  c.globalCompositeOperation = 'source-over';
};

/* ---- Color Shift ---- */
Galaxy.prototype._triggerColorShift = function () {
  this.colorShift = 0.6;
  this.colorShiftHue = Math.random() * 360;
};

/* ============================================================
   6. CLASE CAROUSEL — Visor de imágenes + frases
   ============================================================ */
function Carousel(data) {
  this.data    = data;
  this.current = 0;
  this.busy    = false;
  this.timer   = null;
  this.touchX  = 0;
  this.touchY  = 0;

  this.viewport = document.getElementById('carouselViewport');
  this.textEl   = document.getElementById('carouselText');
  this.dotsEl   = document.getElementById('carouselDots');
  this.prevBtn  = document.getElementById('carouselPrev');
  this.nextBtn  = document.getElementById('carouselNext');

  this.slideEls = [];
  this.dotEls   = [];

  this._build();
  this._events();
}

Carousel.prototype._build = function () {
  this.viewport.innerHTML = '';
  this.dotsEl.innerHTML   = '';
  var self = this;

  this.data.forEach(function (slide, i) {
    var div = document.createElement('div');
    div.className = 'carousel-slide';
    div.setAttribute('role', 'tabpanel');
    div.setAttribute('aria-label', ' ' + (i + 1) + ' de ' + self.data.length);

    var img = document.createElement('img');
    img.src      = slide.img;
    img.alt      = slide.text;
    img.loading  = i === 0 ? 'eager' : 'lazy';
    img.draggable = false;
    div.appendChild(img);
    self.viewport.appendChild(div);
    self.slideEls.push(div);

    var dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', 'Ir a  ' + (i + 1));
    dot.addEventListener('click', function () { self.goTo(i); });
    self.dotsEl.appendChild(dot);
    self.dotEls.push(dot);
  });

  this.goTo(0, true);
};

Carousel.prototype._events = function () {
  var self = this;
  this.prevBtn.addEventListener('click', function () { self.prev(); });
  this.nextBtn.addEventListener('click', function () { self.next(); });

  document.addEventListener('keydown', function (e) {
    if (!screenGalaxy.classList.contains('active')) return;
    if (e.key === 'ArrowLeft')  { self.prev(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { self.next(); e.preventDefault(); }
  });

  this.viewport.addEventListener('touchstart', function (e) {
    self.touchX = e.touches[0].clientX;
    self.touchY = e.touches[0].clientY;
    self.stopAuto();
  }, { passive: true });

  this.viewport.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - self.touchX;
    var dy = e.changedTouches[0].clientY - self.touchY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) self.next(); else self.prev();
    }
    self.startAuto();
  }, { passive: true });

  var container = document.getElementById('carouselContainer');
  container.addEventListener('mouseenter', function () { self.stopAuto(); });
  container.addEventListener('mouseleave', function () { self.startAuto(); });
};

Carousel.prototype.goTo = function (index, instant) {
  if (this.busy && !instant) return;
  this.busy = true;
  this.current = ((index % this.data.length) + this.data.length) % this.data.length;

  for (var i = 0; i < this.slideEls.length; i++) {
    var active = i === this.current;
    this.slideEls[i].classList.toggle('active', active);
    this.dotEls[i].classList.toggle('active', active);
    this.dotEls[i].setAttribute('aria-selected', active);
  }

  /* ⭐ NUEVO: Trigger efectos de galaxia (solo si no es instant) */
  if (!instant && typeof galaxy !== 'undefined' && galaxy.running) {
    galaxy.triggerTransition();
  }

  /* Fade del texto (solo si ya pasó la entrada) */
  var self = this;
  if (!instant && this.textEl.classList.contains('ready')) {
    this.textEl.style.opacity = '0';
    setTimeout(function () {
      self.textEl.textContent = self.data[self.current].text;
      self.textEl.style.opacity = '';
    }, 300);
  } else {
    this.textEl.textContent = this.data[this.current].text;
  }

  var delay = (instant || prefersReducedMotion()) ? 0 : 600;
  setTimeout(function () { self.busy = false; }, delay);
};

Carousel.prototype.next = function () { this.goTo(this.current + 1); };
Carousel.prototype.prev = function () { this.goTo(this.current - 1); };

Carousel.prototype.startAuto = function () {
  if (prefersReducedMotion()) return;
  this.stopAuto();
  var self = this;
  this.timer = setInterval(function () { self.next(); }, CONFIG.AUTOPLAY);
};

Carousel.prototype.stopAuto = function () {
  if (this.timer) { clearInterval(this.timer); this.timer = null; }
};

/* ============================================================
   7. INSTANCIAS
   ============================================================ */
var galaxy   = new Galaxy(galaxyCanvas);
var carousel = new Carousel(slides);

/* ============================================================
   8. TRANSICIONES DE PANTALLA (cinematográficas)
   ============================================================ */
var _enterTimer = null;

function enterGalaxy() {
  noButton.style.display = 'none';

  /* Crossfade: galaxia aparece SOBRE la pantalla inicial */
  screenGalaxy.classList.add('active');
  galaxy.start();
  carousel.goTo(0, true);

  setTimeout(function () {
    screenInitial.classList.add('hidden');
  }, 200);

  /* Autoplay + clase "ready" del texto después de la entrada */
  _enterTimer = setTimeout(function () {
    carousel.textEl.classList.add('ready');
    carousel.startAuto();
  }, 3500);
}

function exitGalaxy() {
  if (_enterTimer) { clearTimeout(_enterTimer); _enterTimer = null; }
  galaxy.stop();
  carousel.stopAuto();
  carousel.textEl.classList.remove('ready');
  carousel.textEl.style.opacity = '';
  screenGalaxy.classList.remove('active');

  setTimeout(function () {
    screenInitial.classList.remove('hidden');
    noButton.style.display = '';
  }, 600);
}

/* ============================================================
   9. BOTONES SÍ / VOLVER
   ============================================================ */
yesButton.addEventListener('click', enterGalaxy);
btnBack.addEventListener('click', exitGalaxy);

/* ============================================================
   10. BOTÓN "NO" — Comportamiento original (esquiva)
   ============================================================ */
var isFirstClick = true;

function moveNoButton() {
  var sw = window.innerWidth, sh = window.innerHeight;
  var bw = noButton.offsetWidth, bh = noButton.offsetHeight;
  noButton.style.position = 'fixed';
  noButton.style.left = (Math.random() * (sw - bw)) + 'px';
  noButton.style.top  = (Math.random() * (sh - bh)) + 'px';
}

function activateMouseover() {
  noButton.addEventListener('mouseover', function () {
    imageContainer.innerHTML =
      '<img src="./assets/img/00.png" alt="Laughing Snoopy">';
    responseEl.textContent = "Jaja, no puedes tocar el botón 🤣🫢";
    moveNoButton();
  });
}

noButton.addEventListener('click', function () {
  if (isFirstClick) {
    noButton.style.transition = 'transform 0.5s ease';
    noButton.style.transform = 'scale(1.2)';
    setTimeout(function () {
      noButton.style.transform = 'scale(1)';
      isFirstClick = false;
    }, 500);
  }
  activateMouseover();
  moveNoButton();
});

/* ============================================================
   11. MODO OSCURO — Dark mode ACTIVADO por defecto
   ============================================================ */

// Activar dark mode por defecto al cargar la página
document.body.classList.add('dark-mode');
darkModeToggle.textContent = 'Modo Claro ☀️';

darkModeToggle.addEventListener('click', function () {
  document.body.classList.toggle('dark-mode');
  darkModeToggle.textContent = document.body.classList.contains('dark-mode')
    ? 'Modo Claro ☀️'
    : 'Modo Oscuro 🌙';
});

/* ============================================================
   12. VISIBILIDAD — Pausar cuando la pestaña no es visible
   ============================================================ */
document.addEventListener('visibilitychange', function () {
  if (!screenGalaxy.classList.contains('active')) return;
  if (document.hidden) {
    galaxy.pause();
    carousel.stopAuto();
  } else {
    galaxy.resume();
    carousel.startAuto();
  }
});

/* ============================================================
   13. TARJETA ROMÁNTICA (MODAL)
   ============================================================ */
var romanticCardOverlay = document.getElementById('romanticCardOverlay');
var romanticCardClose = document.getElementById('romanticCardClose');
var showCardButton = document.getElementById('showCardButton');
var btnCard = document.getElementById('btnCard');

function showRomanticCard() {
  romanticCardOverlay.classList.add('active');
}

function hideRomanticCard() {
  romanticCardOverlay.classList.remove('active');
}

// Event listeners
if (showCardButton) {
  showCardButton.addEventListener('click', showRomanticCard);
}

if (btnCard) {
  btnCard.addEventListener('click', showRomanticCard);
}

if (romanticCardClose) {
  romanticCardClose.addEventListener('click', hideRomanticCard);
}

// Cerrar al hacer click fuera del modal
if (romanticCardOverlay) {
  romanticCardOverlay.addEventListener('click', function (e) {
    if (e.target === romanticCardOverlay) {
      hideRomanticCard();
    }
  });
}

// Cerrar con tecla ESC
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && romanticCardOverlay.classList.contains('active')) {
    hideRomanticCard();
  }
});
