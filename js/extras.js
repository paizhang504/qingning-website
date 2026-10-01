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

    function draw(now) {
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
    requestAnimationFrame(draw);

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
