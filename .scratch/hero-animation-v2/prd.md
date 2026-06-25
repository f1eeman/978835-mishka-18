# Hero animation v2: GSAP-orchestrated entrance + scroll-driven dissolution

**Status:** ready-for-agent

## Problem Statement

The hero section has a Three.js scene (floating wireframe shapes, particle cloud) and a cursor-tracking camera. The scene is always "mid-flight" — shapes appear fully formed the moment the page loads and stay frozen in their floating loop as the user scrolls away. There is no cinematic moment when the scene comes alive, and no reward for scrolling: the animation simply cuts off as `.promo` leaves view. The result feels passive and disconnected from the user's browsing rhythm.

## Solution

Two coordinated effects, both living in the same animation module with GSAP and Three.js sharing local state:

1. **Entrance sequence** — on page load, the wireframe shapes emerge from the centre of the scene: they fly in from a collapsed point, each with a staggered bounce, so the hero "assembles itself" in the first 1.5 s. Particles fade up simultaneously.

2. **Scroll-driven dissolution** — as the user scrolls the hero section out of view, GSAP ScrollTrigger (with `scrub`) drives a `scrollProgress` variable (0 → 1). The Three.js `tick()` reads it each frame: shapes scatter outward and fade, the camera pulls back, particles thin out. Scrolling back up reverses everything symmetrically.

Both effects compose: cursor-tracking rotation continues alongside the scroll movement, with its influence tapering as `scrollProgress` approaches 1 so it does not fight the outward scatter.

## User Stories

1. As a site visitor, I want the hero shapes to visibly assemble on page load, so that the page feels alive from the first second.
2. As a site visitor, I want each shape to arrive with a slight bounce and stagger, so that the entrance feels organic rather than mechanical.
3. As a site visitor, I want the particles to fade up during the entrance, so that the cloud of points builds alongside the shapes.
4. As a site visitor, I want the entrance to finish before I naturally start scrolling, so that I see the complete scene before I move on.
5. As a site visitor, I want the shapes to scatter and dissolve as I scroll the hero away, so that the transition out of the hero feels intentional rather than abrupt.
6. As a site visitor, I want the dissolution to be tied exactly to my scroll position, so that I can control the pace and reverse it by scrolling back up.
7. As a site visitor who scrolls back to the top, I want the scene to reassemble, so that returning to the hero feels as satisfying as the first arrival.
8. As a site visitor, I want the cursor-tracking camera rotation to remain active while I'm in the hero, so that both interactivity layers coexist.
9. As a site visitor near the bottom of the hero, I want cursor-tracking to gently yield to the scroll animation, so that the two effects don't visibly fight each other.
10. As a site visitor on a touch device, I want the entrance animation to still play, so that the cinematic opening is not lost on mobile.
11. As a site visitor on a touch device, I want the scroll-driven dissolution to still work, so that scrolling past the hero feels smooth on mobile too.
12. As a site visitor with reduced-motion preferences, I want the entrance and scroll effects to be minimal or skipped, so that I'm not uncomfortable.
13. As a developer, I want the scroll progress and entrance state to be local variables read by the existing `tick()`, so that there is one animation update path and no competing RAF loops.
14. As a developer, I want GSAP to drive Three.js object properties directly (position, opacity, scale) during the entrance sequence, so that GSAP's easing and stagger engine handles the curve math rather than a custom interpolator.

## Implementation Decisions

- **Single module, no new files.** All changes are in `animation.js`. GSAP and Three.js already share the same file; the new effects extend that pattern.

- **Entrance sequence via GSAP timeline driving Three.js properties directly.**
  - At scene init, each mesh is placed at its regular floating position but with `scale = 0` and `material.opacity = 0`.
  - A `gsap.timeline({ delay: 0.1 })` staggers each mesh: `gsap.to(mesh.scale, { x:1, y:1, z:1, ease:'back.out(2)', duration:0.7 })` and `gsap.to(mesh.material, { opacity: 0.45, duration:0.5 })`, with a stagger of ~0.08 s per shape.
  - Particles: `gsap.from(ptMat, { opacity: 0, duration: 1.2, ease: 'power2.out', delay: 0.2 })`.
  - The entrance plays once; after it completes, shapes hand off to the existing sinusoidal float in `tick()`.
  - Reduced-motion guard: `window.matchMedia('(prefers-reduced-motion: reduce)').matches` → skip the entrance (shapes appear at full opacity immediately).

- **Scroll-driven dissolution via ScrollTrigger `scrub` + local variable.**
  - A local `var scrollProgress = 0` is declared alongside the cursor-tracking state.
  - `ScrollTrigger.create({ trigger: '.promo', start: 'top top', end: 'bottom top', scrub: true, onUpdate: self => { scrollProgress = self.progress; } })` — progress runs 0 (hero fully visible) → 1 (hero scrolled fully past).
  - Each mesh has a `userData.scatterTarget` (random unit vector × scatter radius ~18) computed at init. In `tick()`: `mesh.position.lerp(scatterTarget, scrollProgress * 0.15)` and `mesh.material.opacity = 0.45 * (1 - scrollProgress)`.
  - Particles: `ptMat.opacity = 0.65 * (1 - scrollProgress)`.
  - Camera Z: `camera.position.z = 6 + scrollProgress * 3` — pulls back gently.
  - Cursor-tracking weight: `cursorWeight = 1 - scrollProgress * 0.8` — multiplied into the lerp target so tracking fades without snapping.

- **Coexistence with sinusoidal float:** the sinusoidal `position.y` offset is additive on top of the lerped position, unchanged. At `scrollProgress = 0` the scatter lerp contributes nothing; the float is identical to before.

- **No GSAP dependency change needed.** GSAP and ScrollTrigger are already loaded as vendor scripts. Three.js mesh properties are plain JS objects; `gsap.to(mesh.position, ...)` works without a plugin.

## Testing Decisions

A good test checks what the user sees, not which variables changed. Since there is no automated test suite, verification is visual and manual:

- **Test 1 — Entrance on load:** hard-refresh the page. Shapes should appear to fly in from centre over ~1.5 s, each with a bounce, with particles fading up in parallel.
- **Test 2 — Entrance stagger:** shapes arrive in a visible sequence (not all at once), and the timing feels organic rather than mechanical.
- **Test 3 — Scroll dissolution:** slowly scroll the hero out of view. Shapes should scatter outward and fade; particles should thin. Pausing mid-scroll should pause the effect at that state.
- **Test 4 — Scroll reversal:** after partially scrolling away, scroll back up. Scene should reassemble proportionally.
- **Test 5 — Cursor tracking during scroll:** while the hero is fully visible, move the cursor — camera still responds. Near the bottom of the hero, cursor influence should feel reduced.
- **Test 6 — No fighting:** at any scroll position, the camera should look stable — no visible flickering between cursor and scroll targets.
- **Test 7 — Mobile:** on a touch device or DevTools touch emulation, the entrance plays and scroll dissolution works (scrub responds to touch scroll).
- **Test 8 — Reduced motion:** in OS reduced-motion mode, shapes appear immediately at full opacity; no entrance sequence plays; scroll dissolution still works (it's a scroll affordance, not decoration).
- **Test 9 — Existing animations unaffected:** GSAP scroll-trigger animations on `.popular-item`, `.features`, `.reviews`, `.contacts` still play correctly.

Prior art: existing manual visual checks for the cursor-tracking feature and GSAP scroll triggers in `animation.js`.

## Out of Scope

- Morphing geometry between shapes (would require custom shaders).
- WebGL post-processing effects (bloom, depth of field).
- Audio-reactive animation.
- Animating sections other than `.promo`.
- Automated browser tests (no test runner in this project).
- Changes to HTML or SCSS.

## Further Notes

- GSAP can animate Three.js object properties directly because they are plain JS objects — no Three.js-GSAP plugin is needed.
- The `scrub: true` ScrollTrigger option makes the scroll animation fully reversible for free; no manual reverse logic is needed.
- Scatter targets must be computed once at init (not per-frame) so they are stable across scroll up/down cycles.
- The entrance sequence and scroll dissolution are independent: the entrance is time-based (plays once on load), the dissolution is scroll-position-based (always active). They do not conflict.
- If the user loads the page mid-scroll (e.g. browser restoring scroll position), `scrollProgress` will be non-zero immediately after ScrollTrigger initialises — the scene will appear in its partially-scattered state, which is correct behaviour.
