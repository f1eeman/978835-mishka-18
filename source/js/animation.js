import * as THREE from './vendor/three.module.min.js';

// ─── Shared state between Three.js scene and GSAP ────────────────────────────
var scrollProgress = 0;           // 0 = hero fully visible, 1 = scrolled past
var sceneMeshes = [];             // wireframe shape meshes
var sceneParticleMat = null;      // particle PointsMaterial
var particleEntrance = { v: 0 }; // GSAP animates this 0 → 1 on load

// ─── Three.js: floating shapes in the hero section ───────────────────────────

var promo = document.querySelector('.promo');

if (promo) {
  var W = promo.offsetWidth;
  var H = promo.offsetHeight || window.innerHeight * 0.7;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
  camera.position.z = 6;

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  var canvas = renderer.domElement;
  canvas.style.cssText = [
    'position:absolute',
    'top:0',
    'left:0',
    'width:100%',
    'height:100%',
    'pointer-events:none',
    'z-index:0'
  ].join(';');

  promo.style.position = 'relative';
  promo.prepend(canvas);

  // Lift text content above the canvas
  ['.promo__title', '.promo__catalogues'].forEach(function (sel) {
    var el = promo.querySelector(sel);
    if (el) {
      el.style.position = 'relative';
      el.style.zIndex = '1';
    }
  });

  // Teal brand palette
  var COLORS = [0x63d1bb, 0x46c1ae, 0x96e0d1, 0xffffff, 0x62d1ba];

  // Particle cloud — opacity fully owned by tick() via particleEntrance.v × (1 - scrollProgress)
  var COUNT = 140;
  var positions = new Float32Array(COUNT * 3);
  for (var i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 22;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5 - 2;
  }
  var ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var ptMat = new THREE.PointsMaterial({ color: 0x63d1bb, size: 0.07, transparent: true, opacity: 0 });
  var particles = new THREE.Points(ptGeo, ptMat);
  scene.add(particles);
  sceneParticleMat = ptMat;

  // Floating wireframe shapes
  // Scale starts at 0, entranceFactor starts at 0 — GSAP drives both during entrance.
  // tick() owns position and material.opacity; it never writes to scale.
  var SHAPE_COUNT = 10;
  for (var s = 0; s < SHAPE_COUNT; s++) {
    var geoType = s % 3;
    var geo;
    if (geoType === 0) {
      geo = new THREE.IcosahedronGeometry(0.14 + Math.random() * 0.18, 0);
    } else if (geoType === 1) {
      geo = new THREE.OctahedronGeometry(0.12 + Math.random() * 0.18);
    } else {
      geo = new THREE.TorusGeometry(0.13 + Math.random() * 0.1, 0.04, 6, 12);
    }
    var mat = new THREE.MeshPhongMaterial({
      color: COLORS[s % COLORS.length],
      transparent: true,
      opacity: 0,
      wireframe: true
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 9,
      -4 + Math.random() * 2.5
    );
    mesh.scale.set(0, 0, 0);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    // Scatter target computed once at init so scroll up/down is stable
    var sAngle = Math.random() * Math.PI * 2;
    var sRadius = 12 + Math.random() * 8;

    mesh.userData = {
      rx: (Math.random() - 0.5) * 0.014,
      ry: (Math.random() - 0.5) * 0.014,
      baseX: mesh.position.x,
      baseY: mesh.position.y,
      baseZ: mesh.position.z,
      speed: 0.35 + Math.random() * 0.55,
      amp: 0.18 + Math.random() * 0.28,
      scatterX: mesh.position.x + Math.cos(sAngle) * sRadius,
      scatterY: mesh.position.y + (Math.random() - 0.5) * 8,
      scatterZ: mesh.position.z - 3 - Math.random() * 4,
      entranceFactor: 0  // GSAP animates 0 → 1; tick reads it for opacity
    };
    scene.add(mesh);
    sceneMeshes.push(mesh);
  }

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  var pLight = new THREE.PointLight(0x63d1bb, 2, 25);
  pLight.position.set(4, 4, 6);
  scene.add(pLight);

  var clock = new THREE.Clock();

  // Cursor-tracking state
  var targetRotX = 0, targetRotY = 0, curRotX = 0, curRotY = 0;

  if (!window.matchMedia('(hover: none)').matches) {
    window.addEventListener('mousemove', function (e) {
      var rect = promo.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right ||
          e.clientY < rect.top  || e.clientY > rect.bottom) {
        targetRotX = 0;
        targetRotY = 0;
      } else {
        var nx = (e.clientX - rect.left) / rect.width  * 2 - 1;
        var ny = (e.clientY - rect.top)  / rect.height * 2 - 1;
        targetRotY =  nx * 0.10;
        targetRotX = -ny * 0.06;
      }
    });
  }

  (function tick() {
    requestAnimationFrame(tick);
    var t = clock.getElapsedTime();
    var sp = scrollProgress;

    // Particles
    particles.rotation.y = t * 0.04;
    ptMat.opacity = 0.65 * particleEntrance.v * (1 - sp);

    // Shapes: spin + sinusoidal float blended with scroll scatter
    sceneMeshes.forEach(function (m) {
      m.rotation.x += m.userData.rx;
      m.rotation.y += m.userData.ry;

      var floatY = m.userData.baseY + Math.sin(t * m.userData.speed) * m.userData.amp;
      m.position.x = m.userData.baseX + (m.userData.scatterX - m.userData.baseX) * sp;
      m.position.y = floatY + (m.userData.scatterY - floatY) * sp;
      m.position.z = m.userData.baseZ + (m.userData.scatterZ - m.userData.baseZ) * sp;
      m.material.opacity = 0.45 * m.userData.entranceFactor * (1 - sp);
    });

    // Camera: pull back as hero scrolls away; cursor influence fades with scroll
    camera.position.z = 6 + sp * 3;
    var cursorWeight = 1 - sp * 0.8;
    curRotX += (targetRotX * cursorWeight - curRotX) * 0.04;
    curRotY += (targetRotY * cursorWeight - curRotY) * 0.04;
    camera.rotation.x = curRotX;
    camera.rotation.y = curRotY;

    renderer.render(scene, camera);
  }());

  window.addEventListener('resize', function () {
    var nW = promo.offsetWidth;
    var nH = promo.offsetHeight || window.innerHeight * 0.7;
    camera.aspect = nW / nH;
    camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });
}

// ─── GSAP: entrance + scroll dissolution + section animations ────────────────

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  // ─── Three.js scene entrance + scroll-driven dissolution ──────────────────

  if (sceneMeshes.length) {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      // Skip entrance — appear immediately
      sceneMeshes.forEach(function (m) {
        m.scale.set(1, 1, 1);
        m.userData.entranceFactor = 1;
      });
      particleEntrance.v = 1;
    } else {
      // Staggered entrance: shapes fly in from scale 0 with bounce
      var entranceTl = gsap.timeline({ delay: 0.1 });
      sceneMeshes.forEach(function (m, idx) {
        entranceTl.to(m.scale, {
          x: 1, y: 1, z: 1,
          duration: 0.7,
          ease: 'back.out(2)'
        }, idx * 0.08);
        entranceTl.to(m.userData, {
          entranceFactor: 1,
          duration: 0.5
        }, idx * 0.08 + 0.1);
      });

      // Particles fade up in parallel
      gsap.to(particleEntrance, {
        v: 1,
        duration: 1.2,
        delay: 0.2,
        ease: 'power2.out'
      });
    }

    // Scroll-driven dissolution — scrub makes it fully reversible
    ScrollTrigger.create({
      trigger: '.promo',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: function (self) { scrollProgress = self.progress; }
    });
  }

  // ─── Hero text entrance ────────────────────────────────────────────────────

  gsap.from('.promo__title', {
    duration: 1.2,
    y: 55,
    autoAlpha: 0,
    ease: 'power3.out',
    delay: 0.25
  });

  gsap.from('.catalogues__item', {
    duration: 0.9,
    y: 45,
    autoAlpha: 0,
    stagger: 0.18,
    ease: 'back.out(1.7)',
    delay: 0.55
  });

  // Popular item slides in from left
  gsap.from('.popular-item__wrap', {
    scrollTrigger: { trigger: '.popular-item', start: 'top 82%' },
    duration: 1.1,
    x: -70,
    autoAlpha: 0,
    ease: 'power3.out'
  });

  // Features: текст stagger bounce-in
  gsap.from('.features__item', {
    scrollTrigger: { trigger: '.features', start: 'top 78%' },
    duration: 0.65,
    y: 45,
    autoAlpha: 0,
    stagger: { amount: 0.75 },
    ease: 'back.out(1.7)'
  });

  // ─── SVG icon animations (each icon gets its own personality) ───────────────

  var featuresTrigger = { trigger: '.features', start: 'top 78%' };

  // Иконки: появляются с индивидуальными входами
  gsap.from('.features__item--eco-material .features__icon', {
    scrollTrigger: featuresTrigger,
    duration: 0.9,
    scale: 0,
    rotation: -25,
    autoAlpha: 0,
    ease: 'back.out(2)',
    delay: 0
  });

  gsap.from('.features__item--nordic-style .features__icon', {
    scrollTrigger: featuresTrigger,
    duration: 0.7,
    x: -40,
    scale: 0.4,
    autoAlpha: 0,
    ease: 'back.out(1.5)',
    delay: 0.12
  });

  gsap.from('.features__item--likes .features__icon', {
    scrollTrigger: featuresTrigger,
    duration: 0.5,
    scale: 0,
    autoAlpha: 0,
    ease: 'back.out(3)',
    delay: 0.24
  });

  gsap.from('.features__item--handmade .features__icon', {
    scrollTrigger: featuresTrigger,
    duration: 0.8,
    scale: 0,
    rotation: 180,
    autoAlpha: 0,
    ease: 'back.out(1.7)',
    delay: 0.36
  });

  gsap.from('.features__item--domestic-production .features__icon', {
    scrollTrigger: featuresTrigger,
    duration: 0.8,
    y: 25,
    x: -15,
    autoAlpha: 0,
    ease: 'power3.out',
    delay: 0.48
  });

  gsap.from('.features__item--gift-wrap .features__icon', {
    scrollTrigger: featuresTrigger,
    duration: 0.7,
    y: -30,
    scale: 0.6,
    autoAlpha: 0,
    ease: 'bounce.out',
    delay: 0.6
  });

  // Индивидуальные петли: каждая иконка со своим характером
  ScrollTrigger.create({
    trigger: '.features',
    start: 'top 78%',
    once: true,
    onEnter: function () {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Цветок — колышется как на ветру
      gsap.to('.features__item--eco-material .features__icon', {
        rotation: 12,
        duration: 2.5,
        delay: 1.0,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        transformOrigin: '50% 100%'
      });

      // Кошелёк — мягко плавает вверх-вниз
      gsap.to('.features__item--nordic-style .features__icon', {
        y: -5,
        duration: 1.8,
        delay: 0.9,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });

      // Сердце — двойной удар: lub-dub, пауза, повтор
      var heartTl = gsap.timeline({ repeat: -1, delay: 0.8 });
      heartTl
        .to('.features__item--likes .features__icon', { scale: 1.28, duration: 0.12, ease: 'power2.out' })
        .to('.features__item--likes .features__icon', { scale: 1,    duration: 0.10, ease: 'power2.in' })
        .to('.features__item--likes .features__icon', { scale: 1.16, duration: 0.10, ease: 'power2.out' })
        .to('.features__item--likes .features__icon', { scale: 1,    duration: 0.10, ease: 'power2.in' })
        .to('.features__item--likes .features__icon', { scale: 1,    duration: 1.4  }); // пауза

      // Клубок — непрерывный медленный спин
      gsap.to('.features__item--handmade .features__icon', {
        rotation: '+=360',
        duration: 6,
        delay: 1.2,
        ease: 'none',
        repeat: -1
      });

      // Ракета — парит вверх-вниз
      gsap.to('.features__item--domestic-production .features__icon', {
        y: -7,
        duration: 1.2,
        delay: 1.1,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1
      });

      // Подарок — нетерпеливый прыжок с паузой
      var giftTl = gsap.timeline({ repeat: -1, delay: 1.0 });
      giftTl
        .to('.features__item--gift-wrap .features__icon', { y: -8, duration: 0.4,  ease: 'back.out(2)' })
        .to('.features__item--gift-wrap .features__icon', { y: 0,  duration: 0.5,  ease: 'bounce.out' })
        .to('.features__item--gift-wrap .features__icon', { y: 0,  duration: 1.6 }); // пауза
    }
  });

  // Reviews fade+rise
  gsap.from('.reviews__wrapper', {
    scrollTrigger: { trigger: '.reviews', start: 'top 82%' },
    duration: 1,
    y: 40,
    autoAlpha: 0,
    ease: 'power2.out'
  });

  // Contacts slide up
  gsap.from('.contacts__container', {
    scrollTrigger: { trigger: '.contacts', start: 'top 82%' },
    duration: 1,
    y: 40,
    autoAlpha: 0,
    ease: 'power3.out'
  });
}
