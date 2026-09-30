/* ============================================================
   cursor.js · 高级光标系统
   - 三层光标：外发光光环(aura) + 磁吸跟随环(ring) + 核心光点(dot)
   - 移动拖尾粒子
   - 悬停可交互元素时环被磁吸到元素中心、放大并变色
   - 点击：彩色粒子迸发 + 三层同心冲击波 + 环收缩回弹
   纯手工实现，零依赖。触摸设备 / reduced-motion 自动降级。
   ============================================================ */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- 粒子画布 ---------- */
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

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---------- 青柠切片点击效果（手绘 Canvas 青柠横截面） ---------- */
  function spawnLime(x, y) {
    if (reduceMotion) return;
    limes.push({ x: x, y: y, rot: rand(-0.7, 0.7), tilt: rand(0.82, 0.95), r: rand(15, 21), age: 0 });
    if (limes.length > 12) limes.shift();
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
    // 果皮外圈（暗绿）
    ctx.beginPath(); ctx.fillStyle = '#3f8f2a';
    ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    // 果皮内环（青绿）
    ctx.beginPath(); ctx.fillStyle = '#7cc74f';
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2); ctx.fill();
    // 果肉底（浅青黄）
    ctx.beginPath(); ctx.fillStyle = '#d9f2a6';
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2); ctx.fill();
    // 果瓣层次
    ctx.fillStyle = 'rgba(168,224,99,0.5)';
    for (var j = 0; j < 8; j++) {
      var a0 = j / 8 * Math.PI * 2 + 0.07, a1 = (j + 1) / 8 * Math.PI * 2 - 0.07;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r * 0.7, a0, a1);
      ctx.closePath(); ctx.fill();
    }
    // 果瓣分隔线
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(r * 0.045, 0.8);
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.13, Math.sin(a) * r * 0.13);
      ctx.lineTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75);
      ctx.stroke();
    }
    // 中心白芯
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
    // 中心闪光
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
      ctx.shadowColor = p.color;
      if (p.kind === 'spark') {
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'flash') {
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (1 - p.life) * 6), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    // 青柠切片（在粒子之上绘制）
    for (var li = limes.length - 1; li >= 0; li--) {
      var s = limes[li];
      s.age += 0.016;
      if (!drawLime(s)) limes.splice(li, 1);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ---------- 多层冲击波 ---------- */
  function shockwaves(x, y) {
    if (reduceMotion) return;
    ['r1', 'r2', 'r3'].forEach(function (cls, idx) {
      setTimeout(function () {
        var el = document.createElement('span');
        el.className = 'click-ripple ' + cls;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        document.body.appendChild(el);
        setTimeout(function () { el.remove(); }, 820);
      }, idx * 60);
    });
  }

  /* ---------- 自定义光标（仅鼠标设备） ---------- */
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
      var rx = -100, ry = -100;      // ring 目标（磁吸后）
      var ax = -100, ay = -100;      // aura
      var dx = -100, dy = -100;      // dot（略带动量）
      var magnet = null;             // 当前磁吸目标元素

      window.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
      }, { passive: true });

      function loop() {
        // dot：轻微平滑跟随
        dx += (mx - dx) * 0.55;
        dy += (my - dy) * 0.55;
        dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px) translate(-50%,-50%)';

        // ring：磁吸到元素中心，否则跟随鼠标（带延迟）
        if (magnet) {
          var r = magnet.getBoundingClientRect();
          var tx = r.left + r.width / 2;
          var ty = r.top + r.height / 2;
          rx += (tx - rx) * 0.22;
          ry += (ty - ry) * 0.22;
        } else {
          rx += (mx - rx) * 0.16;
          ry += (my - ry) * 0.16;
        }
        ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';

        // aura：最慢跟随
        ax += (mx - ax) * 0.06;
        ay += (my - ay) * 0.06;
        aura.style.transform = 'translate(' + ax + 'px,' + ay + 'px) translate(-50%,-50%)';

        // 拖尾
        var prevX = dx, prevY = dy;
        for (var i = 0; i < trails.length; i++) {
          var tr = trails[i];
          var ease = 0.32 - i * 0.022;
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
        // 按下时额外迸射少量粒子
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

  /* ---------- 点击 / 触摸事件 ---------- */
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
