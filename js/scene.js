(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 860px)').matches;

  function init() {
    var scene = document.body.getAttribute('data-scene') || 'lite';
    var dense = scene === 'dense';

    var canvas = document.createElement('canvas');
    canvas.id = 'scene';
    document.body.appendChild(canvas);
    var veil = document.createElement('div');
    veil.className = 'bg-veil';
    document.body.appendChild(veil);

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, stars = [], nodes = [];
    var mouse = { x: -9999, y: -9999 };
    var running = true;

    var DIR = 34 * Math.PI / 180;
    
    var LINK_D = dense ? 230 : 170;      
    var HOVER_R = dense ? 280 : 220;     
    var LINK2 = LINK_D * LINK_D;

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var area = W * H;
      var base = dense ? 8000 : 16000;
      var count = Math.round(area / base * 0.7);   
      if (isMobile) count = Math.round(count * 0.55);
      count = Math.max(dense ? 56 : 28, Math.min(count, dense ? 280 : 105));
      stars = [];
      for (var i = 0; i < count; i++) {
        var cyan = Math.random() < 0.22;
        var spd = (0.1 + Math.random() * 0.26) * (dense ? 1 : 0.6);
        var jit = (Math.random() - 0.5) * 0.9;
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.5 + Math.random() * (dense ? 1.5 : 1.1),
          vx: Math.sin(DIR + jit) * spd,
          vy: Math.cos(DIR + jit) * spd,
          tw: Math.random() * Math.PI * 2,
          tws: 0.008 + Math.random() * 0.02,
          c: cyan ? '0,229,255' : (Math.random() < 0.5 ? '168,224,99' : '255,255,255'),
          depth: 0.5 + Math.random() * 0.8,
          lit: 0,
          rx: 0, ry: 0
        });
      }
      nodes = [];
      if (dense && !isMobile) {
        var nc = Math.round(area / 26000);
        for (var k = 0; k < Math.min(nc, 10); k++) {
          nodes.push({ x: Math.random() * W, y: Math.random() * H, ph: Math.random() * Math.PI * 2 });
        }
      }
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      var px = (mouse.x - W / 2) * 0.012, py = (mouse.y - H / 2) * 0.012;
      var hoverOn = mouse.x > -999 && !isMobile;

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.x += s.vx; s.y += s.vy; s.tw += s.tws;
        if (s.x < -5) s.x = W + 5; if (s.x > W + 5) s.x = -5;
        if (s.y < -5) s.y = H + 5; if (s.y > H + 5) s.y = -5;

        var target = 0;
        if (hoverOn) {
          var dxm = s.x - mouse.x, dym = s.y - mouse.y;
          var dm = Math.sqrt(dxm * dxm + dym * dym);
          if (dm < HOVER_R) target = 1 - dm / HOVER_R;
        }
        s.lit += (target - s.lit) * 0.18;

        var a = 0.25 + Math.abs(Math.sin(s.tw)) * 0.55 + s.lit * 0.75;
        if (a > 1) a = 1;
        var x = s.x + px * s.depth, y = s.y + py * s.depth;
        s.rx = x; s.ry = y;
        var rr = s.r + s.lit * 2.2;

        ctx.beginPath();
        ctx.fillStyle = s.lit > 0.3 ? 'rgba(168,224,99,' + a + ')' : 'rgba(' + s.c + ',' + a + ')';
        ctx.shadowColor = s.lit > 0.3 ? 'rgba(168,224,99,1)' : 'rgba(' + s.c + ',0.9)';
        ctx.shadowBlur = (s.r > 1.4 || s.lit > 0.15) ? 8 + s.lit * 18 : 0;
        ctx.arc(x, y, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      var linkBase = dense ? 0.15 : 0.08;
      for (var m = 0; m < stars.length; m++) {
        for (var n = m + 1; n < stars.length; n++) {
          var ddx = stars[m].x - stars[n].x, ddy = stars[m].y - stars[n].y;
          var dd = ddx * ddx + ddy * ddy;
          if (dd < LINK2) {
            var la = 1 - Math.sqrt(dd) / LINK_D;
            var boost = Math.max(stars[m].lit, stars[n].lit);
            var alpha = la * linkBase + boost * 0.42;
            ctx.strokeStyle = boost > 0.04
              ? 'rgba(168,224,99,' + alpha + ')'
              : 'rgba(0,229,255,' + alpha + ')';
            ctx.lineWidth = boost > 0.04 ? 1.1 : 0.6;
            ctx.beginPath();
            ctx.moveTo(stars[m].rx, stars[m].ry);
            ctx.lineTo(stars[n].rx, stars[n].ry);
            ctx.stroke();
          }
        }
      }

      if (hoverOn) {
        for (var h = 0; h < stars.length; h++) {
          var st = stars[h];
          if (st.lit > 0.03) {
            ctx.strokeStyle = 'rgba(168,224,99,' + (st.lit * 0.7) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(st.rx, st.ry);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
        
        var grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 90);
        grad.addColorStop(0, 'rgba(168,224,99,0.14)');
        grad.addColorStop(1, 'rgba(168,224,99,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 90, 0, Math.PI * 2);
        ctx.fill();
      }

      if (dense) {
        for (var q = 0; q < nodes.length; q++) {
          var nd = nodes[q]; nd.ph += 0.02;
          var pulse = Math.abs(Math.sin(nd.ph));
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(168,224,99,' + pulse * 0.35 + ')';
          ctx.arc(nd.x, nd.y, 6 + pulse * 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.fillStyle = 'rgba(168,224,99,' + (0.4 + pulse * 0.5) + ')';
          ctx.arc(nd.x, nd.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (!reduceMotion) requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    if (!reduceMotion) {
      window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
      document.addEventListener('mouseleave', function () { mouse.x = -9999; mouse.y = -9999; });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; }
      else if (!running) { running = true; requestAnimationFrame(frame); }
    });

    if (!reduceMotion) requestAnimationFrame(frame);
    else { frame(); running = false; }
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
