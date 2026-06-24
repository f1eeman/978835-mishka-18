import * as THREE from './vendor/three.module.min.js';

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

  // Particle cloud
  var COUNT = 140;
  var positions = new Float32Array(COUNT * 3);
  for (var i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 22;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5 - 2;
  }
  var ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var ptMat = new THREE.PointsMaterial({ color: 0x63d1bb, size: 0.07, transparent: true, opacity: 0.65 });
  var particles = new THREE.Points(ptGeo, ptMat);
  scene.add(particles);

  // Floating wireframe shapes
  var meshes = [];
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
      opacity: 0.45,
      wireframe: true
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 9,
      -4 + Math.random() * 2.5
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.userData = {
      rx: (Math.random() - 0.5) * 0.014,
      ry: (Math.random() - 0.5) * 0.014,
      baseY: mesh.position.y,
      speed: 0.35 + Math.random() * 0.55,
      amp: 0.18 + Math.random() * 0.28
    };
    scene.add(mesh);
    meshes.push(mesh);
  }

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  var pLight = new THREE.PointLight(0x63d1bb, 2, 25);
  pLight.position.set(4, 4, 6);
  scene.add(pLight);

  var clock = new THREE.Clock();

  (function tick() {
    requestAnimationFrame(tick);
    var t = clock.getElapsedTime();

    particles.rotation.y = t * 0.04;

    meshes.forEach(function (m) {
      m.rotation.x += m.userData.rx;
      m.rotation.y += m.userData.ry;
      m.position.y = m.userData.baseY + Math.sin(t * m.userData.speed) * m.userData.amp;
    });

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

// ─── GSAP: scroll & entrance animations ──────────────────────────────────────

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  // Hero title + catalogues entrance
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

  // Цветок: вырастает из нуля с лёгким покачиванием
  gsap.from('.features__item--eco-material .features__icon', {
    scrollTrigger: featuresTrigger,
    duration: 0.9,
    scale: 0,
    rotation: -25,
    autoAlpha: 0,
    ease: 'back.out(2)',
    delay: 0
  });
  // После появления — медленно покачивается
  ScrollTrigger.create({
    trigger: '.features',
    start: 'top 78%',
    once: true,
    onEnter: function () {
      gsap.to('.features__item--eco-material .features__icon', {
        rotation: 8,
        duration: 2.5,
        delay: 0.9,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }
  });

  // Кошелёк: вылетает слева как монетка
  gsap.from('.features__item--nordic-style .features__icon', {
    scrollTrigger: featuresTrigger,
    duration: 0.7,
    x: -40,
    scale: 0.4,
    autoAlpha: 0,
    ease: 'back.out(1.5)',
    delay: 0.12
  });

  // Сердце: пульсирует после появления
  gsap.from('.features__item--likes .features__icon', {
    scrollTrigger: featuresTrigger,
    duration: 0.5,
    scale: 0,
    autoAlpha: 0,
    ease: 'back.out(3)',
    delay: 0.24
  });
  ScrollTrigger.create({
    trigger: '.features',
    start: 'top 78%',
    once: true,
    onEnter: function () {
      gsap.to('.features__item--likes .features__icon', {
        scale: 1.25,
        duration: 0.35,
        delay: 1.0,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1,
        repeatDelay: 1.2
      });
    }
  });

  // Клубок: крутится как настоящий клубок пряжи
  gsap.from('.features__item--handmade .features__icon', {
    scrollTrigger: featuresTrigger,
    duration: 0.8,
    scale: 0,
    rotation: 180,
    autoAlpha: 0,
    ease: 'back.out(1.7)',
    delay: 0.36
  });
  ScrollTrigger.create({
    trigger: '.features',
    start: 'top 78%',
    once: true,
    onEnter: function () {
      gsap.to('.features__item--handmade .features__icon', {
        rotation: '+=360',
        duration: 6,
        delay: 0.8,
        ease: 'none',
        repeat: -1
      });
    }
  });

  // Ракета: взлетает снизу вверх
  gsap.from('.features__item--domestic-production .features__icon', {
    scrollTrigger: featuresTrigger,
    duration: 0.8,
    y: 25,
    x: -15,
    autoAlpha: 0,
    ease: 'power3.out',
    delay: 0.48
  });
  ScrollTrigger.create({
    trigger: '.features',
    start: 'top 78%',
    once: true,
    onEnter: function () {
      gsap.to('.features__item--domestic-production .features__icon', {
        y: -4,
        duration: 1.2,
        delay: 0.9,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }
  });

  // Подарок: падает сверху и слегка прыгает
  gsap.from('.features__item--gift-wrap .features__icon', {
    scrollTrigger: featuresTrigger,
    duration: 0.7,
    y: -30,
    scale: 0.6,
    autoAlpha: 0,
    ease: 'bounce.out',
    delay: 0.6
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
