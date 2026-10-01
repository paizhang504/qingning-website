(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  var canvas = document.createElement('canvas');
  canvas.id = 'fx-canvas';
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '9997'
  });
  document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(canvas); });

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  var COLORS = ['#A8E063', '#9BE15D', '#00E5FF', '#83F1FF', '#FFC845', '#7CFFB2'];
  var particles = [];
  var limes = [];
  var PARTICLE_MAX = 220;   
  var LIME_MAX = 8;         

  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawnLime(x, y) {
    if (reduceMotion) return;
    limes.push({ x: x, y: y, rot: rand(-0.7, 0.7), tilt: rand(0.82, 0.95), r: rand(15, 21), age: 0 });
    if (limes.length > LIME_MAX) limes.splice(0, limes.length - LIME_MAX);
  }

  function drawLime(s) {
    var pop = Math.min(s.age / 0.12, 1);
    var ease = 1 - Math.pow(1 - pop, 3);
    var fade = s.age < 0.55 ? 1 : 1 - (s.age - 0.55) / 0.5;
    if (fade <= 0) return false;
    var r = s.r * (0.45 + 0.55 * ease);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot + s.age * 0.22);
    ctx.scale(1, s.tilt);
    ctx.globalAlpha = Math.max(fade, 0) * ease;
    
    ctx.beginPath(); ctx.fillStyle = '#3f8f2a';
    ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    
    ctx.beginPath(); ctx.fillStyle = '#7cc74f';
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2); ctx.fill();
    
    ctx.beginPath(); ctx.fillStyle = '#d9f2a6';
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2); ctx.fill();
    
    ctx.fillStyle = 'rgba(168,224,99,0.5)';
    for (var j = 0; j < 8; j++) {
      var a0 = j / 8 * Math.PI * 2 + 0.07, a1 = (j + 1) / 8 * Math.PI * 2 - 0.07;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r * 0.7, a0, a1);
      ctx.closePath(); ctx.fill();
    }
    
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(r * 0.045, 0.8);
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.13, Math.sin(a) * r * 0.13);
      ctx.lineTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75);
      ctx.stroke();
    }
    
    ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return true;
  }

  function burst(x, y, count) {
    if (reduceMotion) return;
    count = count || 22;
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2 + rand(-0.18, 0.18);
      var speed = rand(1.8, 6.4);
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(0.4, 1.6),
        size: rand(1.8, 4.6),
        life: 1,
        decay: rand(0.012, 0.028),
        color: COLORS[(Math.random() * COLORS.length) | 0],
        kind: Math.random() < 0.28 ? 'spark' : 'dot'
      });
    }
    
    particles.push({ x: x, y: y, vx: 0, vy: 0, size: 6, life: 1, decay: 0.06, color: '#ffffff', kind: 'flash' });
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.09;
      p.vx *= 0.982;
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      if (p.kind === 'spark') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (p.kind === 'flash') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (1 - p.life) * 6), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    
    for (var li = limes.length - 1; li >= 0; li--) {
      var s = limes[li];
      s.age += 0.016;
      if (!drawLime(s)) limes.splice(li, 1);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  var ripplePool = [];
  var rippleInited = false;
  function initRipplePool() {
    if (rippleInited) return;
    rippleInited = true;
    
    ['r1', 'r2', 'r3'].forEach(function (cls) {
      for (var i = 0; i < 3; i++) {
        var el = document.createElement('span');
        el.className = 'click-ripple ' + cls;
        el.style.display = 'none';
        document.body.appendChild(el);
        ripplePool.push({ el: el, busy: false });
      }
    });
  }

  function shockwaves(x, y) {
    if (reduceMotion) return;
    initRipplePool();
    ['r1', 'r2', 'r3'].forEach(function (cls, idx) {
      
      var slot = null;
      for (var i = 0; i < ripplePool.length; i++) {
        if (!ripplePool[i].busy && ripplePool[i].el.className.indexOf(cls) !== -1) { slot = ripplePool[i]; break; }
      }
      if (!slot) return;   
      slot.busy = true;
      setTimeout(function () {
        var el = slot.el;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.display = 'block';
        el.classList.remove('click-ripple'); void el.offsetWidth; el.classList.add('click-ripple'); 
        setTimeout(function () { el.style.display = 'none'; slot.busy = false; }, 820);
      }, idx * 60);
    });
  }

  var dot, ring, aura;
  var trails = [];
  var TRAIL_MAX = 10;

  if (finePointer && !reduceMotion) {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.classList.add('qn-cursor');

      aura = document.createElement('div'); aura.id = 'cursor-aura';
      ring = document.createElement('div'); ring.id = 'cursor-ring';
      dot = document.createElement('div');  dot.id = 'cursor-dot';
      document.body.appendChild(aura);
      document.body.appendChild(ring);
      document.body.appendChild(dot);

      for (var t = 0; t < TRAIL_MAX; t++) {
        var tr = document.createElement('div');
        tr.className = 'cursor-trail';
        tr.style.opacity = '0';
        document.body.appendChild(tr);
        trails.push({ el: tr, x: -100, y: -100 });
      }

      var mx = -100, my = -100;
      var rx = -100, ry = -100;      
      var ax = -100, ay = -100;      
      var dx = -100, dy = -100;      
      var magnet = null;             

      window.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
      }, { passive: true });

      function loop() {
        
        dx = mx;
        dy = my;
        dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px) translate(-50%,-50%)';

        if (magnet) {
          var r = magnet.getBoundingClientRect();
          var tx = r.left + r.width / 2;
          var ty = r.top + r.height / 2;
          rx += (tx - rx) * 0.45;
          ry += (ty - ry) * 0.45;
        } else {
          rx += (mx - rx) * 0.38;
          ry += (my - ry) * 0.38;
        }
        ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';

        ax += (mx - ax) * 0.16;
        ay += (my - ay) * 0.16;
        aura.style.transform = 'translate(' + ax + 'px,' + ay + 'px) translate(-50%,-50%)';

        var prevX = dx, prevY = dy;
        for (var i = 0; i < trails.length; i++) {
          var tr = trails[i];
          var ease = 0.55 - i * 0.035;
          tr.x += (prevX - tr.x) * ease;
          tr.y += (prevY - tr.y) * ease;
          tr.el.style.transform = 'translate(' + tr.x + 'px,' + tr.y + 'px) translate(-50%,-50%)';
          var s = (1 - i / trails.length) * 4.2;
          tr.el.style.width = s + 'px';
          tr.el.style.height = s + 'px';
          tr.el.style.opacity = String((1 - i / trails.length) * 0.5);
          prevX = tr.x; prevY = tr.y;
        }
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);

      var HOVER_SEL = 'a,button,.honor-card,.photo-thumb,.photo-card,.acc-head,.chip,.copy-btn,.tilt,input,textarea,select,[data-lightbox]';
      document.addEventListener('mouseover', function (e) {
        var t = e.target.closest && e.target.closest(HOVER_SEL);
        if (t) {
          ring.classList.add('hovering');
          magnet = t;
          if (t.closest && t.closest('[data-lightbox]')) ring.classList.add('viewing');
        }
      });
      document.addEventListener('mouseout', function (e) {
        var t = e.target.closest && e.target.closest(HOVER_SEL);
        if (t) {
          ring.classList.remove('hovering');
          ring.classList.remove('viewing');
          magnet = null;
        }
      });
      window.addEventListener('mousedown', function () {
        ring.classList.add('pressing');
        
        burst(mx, my, 8);
      });
      window.addEventListener('mouseup', function () { ring.classList.remove('pressing'); });
      document.addEventListener('mouseleave', function () {
        dot.style.opacity = ring.style.opacity = aura.style.opacity = '0';
      });
      document.addEventListener('mouseenter', function () {
        dot.style.opacity = ring.style.opacity = aura.style.opacity = '1';
      });
    });
  }

  document.addEventListener('click', function (e) {
    burst(e.clientX, e.clientY);
    shockwaves(e.clientX, e.clientY);
    spawnLime(e.clientX, e.clientY);
  });
  document.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches[0]) {
      var t = e.touches[0];
      burst(t.clientX, t.clientY, 12);
      shockwaves(t.clientX, t.clientY);
      spawnLime(t.clientX, t.clientY);
    }
  }, { passive: true });

  window.__qnBurst = burst;
})();
