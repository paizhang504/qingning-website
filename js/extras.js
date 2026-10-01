(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  document.querySelectorAll('[data-typewriter]').forEach(function (el) {
    var phrases = (el.getAttribute('data-phrases') || '').split('|').filter(Boolean);
    if (!phrases.length) return;
    if (reduceMotion) { el.textContent = phrases[0]; return; }
    var pi = 0, ci = 0, deleting = false;
    function type() {
      var word = phrases[pi];
      if (!deleting) {
        el.textContent = word.slice(0, ++ci);
        if (ci === word.length) { deleting = true; setTimeout(type, 2600); return; }
        setTimeout(type, 65 + Math.random() * 60);
      } else {
        el.textContent = word.slice(0, --ci);
        if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(type, 350); return; }
        setTimeout(type, 30);
      }
    }
    type();
  });

  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      card.classList.add('tilt-glow');
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        var rx = ((y / r.height) - 0.5) * -9;
        var ry = ((x / r.width) - 0.5) * 11;
        card.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-4px)';
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  var accItems = document.querySelectorAll('.acc-item');
  accItems.forEach(function (item) {
    if (item.classList.contains('open')) {
      var initBody = item.querySelector('.acc-body');
      if (initBody) initBody.style.maxHeight = (initBody.scrollHeight + 20) + 'px';
    }
  });
  accItems.forEach(function (item) {
    var head = item.querySelector('.acc-head');
    var body = item.querySelector('.acc-body');
    if (!head || !body) return;
    head.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      var container = item.closest('.acc-list') || document;
      container.querySelectorAll('.acc-item.open').forEach(function (other) {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.acc-body').style.maxHeight = '0px';
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        body.style.maxHeight = '0px';
      } else {
        item.classList.add('open');
        body.style.maxHeight = (body.scrollHeight + 20) + 'px';
      }
    });
  });
  window.addEventListener('resize', function () {
    accItems.forEach(function (item) {
      if (item.classList.contains('open')) {
        item.querySelector('.acc-body').style.maxHeight = item.querySelector('.acc-body').scrollHeight + 'px';
      }
    });
  });

  var chips = document.querySelectorAll('.filter-bar .chip');
  var hcMount = document.querySelector('.hcarousel-mount');
  var honorGrid = document.querySelector('.honor-grid');
  function applyHonorFilter(f) {
    document.querySelectorAll('.honor-card').forEach(function (card) {
      var show = f === 'all' || card.getAttribute('data-hgroup') === f;
      card.classList.toggle('hide', !show);
    });
    if (hcMount && hcMount.querySelector('.hc-stage')) {
      hcMount.classList.toggle('hide', f !== 'all');
      if (honorGrid) honorGrid.classList.toggle('hide', f === 'all');
    }
  }
  if (chips.length) {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        applyHonorFilter(chip.getAttribute('data-filter'));
      });
    });
  }

  (function () {
    if (!hcMount || !honorGrid) return;
    var cards = Array.prototype.slice.call(honorGrid.querySelectorAll('.honor-card'));
    var items = cards.map(function (card) {
      var trig = card.querySelector('[data-lightbox]');
      var img = card.querySelector('.h-img img');
      var badge = card.querySelector('.badge-rank');
      var h3 = card.querySelector('h3');
      var meta = card.querySelector('.h-meta');
      if (!img) return null;
      return {
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || '',
        cap: trig ? (trig.getAttribute('data-caption') || '') : '',
        badge: badge ? badge.outerHTML : '',
        title: h3 ? h3.textContent : '',
        year: meta && meta.children[0] ? meta.children[0].textContent : '',
        who: meta && meta.querySelector('.who') ? meta.querySelector('.who').textContent : ''
      };
    }).filter(Boolean);
    if (items.length < 3) return;

    var count = items.length;
    var angle = 360 / count;
    var ringEl = document.createElement('div');
    ringEl.className = 'hc-ring';
    var mobile = window.matchMedia('(max-width:860px)').matches;
    var cardW = mobile ? 200 : 250;
    var spacing = 3;
    var factor = 1 + spacing * 0.15;
    var radius = (cardW * factor) / (2 * Math.tan(Math.PI / count));

    var infoHtml = function (it) {
      return '<div class="hc-info">' + it.badge + '<h4>' + it.title + '</h4>' +
        '<div class="hc-meta"><span>' + it.year + '</span><span class="who">' + it.who + '</span></div></div>';
    };
    items.forEach(function (it, i) {
      var item = document.createElement('div');
      item.className = 'hc-item';
      item.style.transform = 'rotateY(' + (i * angle) + 'deg) translateZ(' + radius + 'px)';
      item.setAttribute('data-lightbox', '');
      item.setAttribute('data-group', 'honor');
      item.setAttribute('data-caption', it.cap);
      item.innerHTML =
        '<div class="hc-face"><div class="hc-img"><img src="' + it.src + '" alt="' + it.alt + '" draggable="false"></div>' + infoHtml(it) + '</div>' +
        '<div class="hc-face hc-back" style="transform:rotateY(180deg)"><div class="hc-img"><img src="' + it.src + '" alt="" draggable="false"></div>' + infoHtml(it) + '</div>';
      ringEl.appendChild(item);
    });

    var tilt = document.createElement('div');
    tilt.className = 'hc-tilt';
    tilt.appendChild(ringEl);
    var stage = document.createElement('div');
    stage.className = 'hc-stage';
    stage.appendChild(tilt);
    hcMount.appendChild(stage);

    var rotY = 0, vel = 0, last = 0, dragging = false, dragX = 0, moved = 0;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var DEG_PER_SEC = reduceMotion ? 0 : 6;

    var hcActive = false, hcRunning = false;
    function draw(now) {
      if (!hcActive) { hcRunning = false; return; }
      var dt = last ? (now - last) / 1000 : 0;
      last = now;
      var f = Math.min(dt, 0.1);
      if (!dragging) {
        if (Math.abs(vel) > 0.01) { rotY += vel * f; vel *= 0.94; }
        else rotY += DEG_PER_SEC * f;
      }
      ringEl.style.transform = 'translateZ(' + (-radius) + 'px) rotateY(' + rotY + 'deg)';
      requestAnimationFrame(draw);
    }
    new IntersectionObserver(function (entries) {
      hcActive = entries[0].isIntersecting;
      if (hcActive && !hcRunning) { hcRunning = true; last = 0; requestAnimationFrame(draw); }
    }).observe(hcMount);

    stage.addEventListener('pointerdown', function (e) {
      dragging = true; dragX = e.clientX; moved = 0; vel = 0;
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - dragX;
      dragX = e.clientX;
      moved += Math.abs(dx);
      var k = 0.3 * 1.6;
      rotY += dx * k;
      vel = dx * k * 60;
    });
    var endDrag = function () { dragging = false; };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    
    stage.addEventListener('click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); }
      moved = 0;
    }, true);

    applyHonorFilter('all');
  })();

  var lb, lbImg, lbCap, lbList = [], lbIndex = 0;
  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML =
      '<button class="lb-close" aria-label="关闭">✕</button>' +
      '<button class="lb-arrow lb-prev" aria-label="上一张">‹</button>' +
      '<img alt="证书大图">' +
      '<button class="lb-arrow lb-next" aria-label="下一张">›</button>' +
      '<div class="lb-cap"></div>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('img');
    lbCap = lb.querySelector('.lb-cap');
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb-close')) close();
    });
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); move(-1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); move(1); });
  }
  function move(dir) {
    if (lbList.length < 2) return;
    lbIndex = (lbIndex + dir + lbList.length) % lbList.length;
    show();
  }
  function show() {
    var item = lbList[lbIndex];
    lbImg.src = item.src;
    lbCap.innerHTML = item.cap || '';
  }
  function close() { lb.classList.remove('show'); }

  document.addEventListener('click', function (e) {
    var trig = e.target.closest('[data-lightbox]');
    if (!trig) return;
    e.preventDefault();
    if (!lb) buildLightbox();
    var group = trig.getAttribute('data-group') || 'default';
    lbList = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox][data-group="' + group + '"]')).filter(function (el) {
      return el.offsetParent !== null;
    }).map(function (el) {
      var img = el.querySelector('img');
      return {
        src: el.getAttribute('data-full') || (img ? img.src : ''),
        cap: el.getAttribute('data-caption') || ''
      };
    }).filter(function (x) { return x.src; });
    lbIndex = lbList.findIndex(function (x) {
      var img = trig.querySelector('img');
      return x.src === (trig.getAttribute('data-full') || (img ? img.src : ''));
    });
    if (lbIndex < 0) lbIndex = 0;
    show();
    lb.classList.add('show');
  });
  document.addEventListener('keydown', function (e) {
    if (!lb || !lb.classList.contains('show')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') move(-1);
    if (e.key === 'ArrowRight') move(1);
  });
})();

(function () {
  var root = document.getElementById('teacherGallery');
  if (!root) return;
  var viewport = root.querySelector('.tgal-viewport');
  var cards = Array.prototype.slice.call(root.querySelectorAll('.tgal-card'));
  var n = cards.length;
  if (n < 2) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var step = 250, totalW = step * n, H = 600, B = 160, R = 1200;
  var cardW = 212;
  function measure() {
    var mobile = window.matchMedia('(max-width:860px)').matches;
    cardW = mobile ? 150 : 212;
    step = mobile ? 178 : 250;
    totalW = step * n;
    H = viewport.clientWidth / 2;
    B = H * Math.tan(14 * Math.PI / 180);
    R = (H * H + B * B) / (2 * B);
    target = ((target % totalW) + totalW) % totalW;
  }

  var current = 0, target = 0, last = 0;
  var dragging = false, moved = 0, startX = 0, startScroll = 0, idleAt = 0;
  var interacted = false;
  var AUTO = reduceMotion ? 0 : 6;

  function mod(v, m) { return ((v % m) + m) % m; }

  function centerIndex() {
    return Math.round(mod(target, totalW) / step) % n;
  }

  var tgActive = false, tgRunning = false;
  function frame(now) {
    if (!tgActive) { tgRunning = false; return; }
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    if (!dragging && !interacted && AUTO && !document.hidden) {
      target += AUTO * dt * 6;
    }
    current += (target - current) * 0.09;
    if (Math.abs(target - current) < 0.05) current = target;

    var s = mod(current, totalW);
    var ci = centerIndex();
    for (var i = 0; i < n; i++) {
      var cx = mod(i * step - s + totalW / 2, totalW) - totalW / 2;
      var eff = Math.min(Math.abs(cx), H);
      var arc = R - Math.sqrt(Math.max(R * R - eff * eff, 0));
      var y = -arc;
      var deg = -Math.sign(cx) * Math.asin(Math.min(eff / R, 1)) * 180 / Math.PI;
      var depth = Math.min(eff / H, 1);
      var sc = 1 - 0.15 * depth;
      var screenX = cx + H;
      var visible = Math.abs(cx) < H + cardW;
      var card = cards[i];
      card.style.transform = 'translate3d(' + screenX.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-50%) rotate(' + deg.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
      card.style.zIndex = String(100 - Math.round(eff));
      card.style.visibility = visible ? 'visible' : 'hidden';
      card.classList.toggle('is-center', i === ci);
      card.classList.toggle('is-near', i !== ci && depth < 0.62);
    }
    requestAnimationFrame(frame);
  }

  function nudge(dir) {
    interacted = true;
    target = Math.round(current / step) * step + dir * step;
  }

  var prevBtn = root.querySelector('.tgal-prev');
  var nextBtn = root.querySelector('.tgal-next');
  if (prevBtn) prevBtn.addEventListener('click', function (e) { e.stopPropagation(); nudge(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); nudge(1); });

  viewport.addEventListener('pointerdown', function (e) {
    interacted = true;
    dragging = true; moved = 0; startX = e.clientX; startScroll = target;
    viewport.classList.add('grabbing');
  });
  window.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    target = startScroll - dx * 1.35;
  });
  window.addEventListener('pointerup', function (e) {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('grabbing');
    target = Math.round(target / step) * step;
  });

  cards.forEach(function (card, i) {
    card.addEventListener('click', function () {
      if (moved > 6) return;
      interacted = true;
      var s = mod(current, totalW);
      var cx = mod(i * step - s + totalW / 2, totalW) - totalW / 2;
      target = current + cx;
    });
  });

  viewport.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) && !e.shiftKey) return;
    e.preventDefault();
    interacted = true;
    var d = e.shiftKey ? e.deltaY : e.deltaX;
    target += d * 0.9;
  }, { passive: false });

  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(measure, 150);
  });

  measure();
  new IntersectionObserver(function (entries) {
    tgActive = entries[0].isIntersecting;
    if (tgActive && !tgRunning) { tgRunning = true; last = 0; requestAnimationFrame(frame); }
  }).observe(root);
})();
