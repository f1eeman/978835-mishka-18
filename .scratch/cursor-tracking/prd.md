# Hero animation: camera follows cursor (parallax rotation)

**Status:** ready-for-agent

## Problem Statement

The hero section (`promo`) has a Three.js animation with floating wireframe shapes and a particle cloud. The animation currently plays independently of user interaction — shapes float and particles rotate on a fixed loop. The experience feels passive: the user sees an animation, but does not feel that the scene responds to their presence. For a handmade goods shop aiming for warmth and interactivity, the hero should feel alive and reactive.

## Solution

When the user moves their cursor over the hero section, the Three.js camera subtly rotates to follow the cursor. The rotation is smoothed with linear interpolation (`lerp`) so the camera glides rather than snapping. When the cursor leaves the section, the camera gently returns to neutral. The effect is minimal — just enough to convey depth and responsiveness — and does not interfere with the existing sinusoidal floating of shapes or particle drift.

## User Stories

1. As a site visitor on desktop, I want the hero scene to subtly respond to my cursor, so that the animation feels alive and personal rather than generic.
2. As a site visitor, I want the camera rotation to be smooth and lag behind the cursor slightly, so that the motion feels organic rather than mechanical.
3. As a site visitor, I want the rotation intensity to be subtle (a few degrees max), so that the scene does not feel disorienting or distracting from the shop content.
4. As a site visitor, I want the existing floating animation of shapes to continue uninterrupted while the cursor-tracking is active, so that both effects coexist naturally.
5. As a site visitor, I want the camera to return to its neutral position when I move my cursor away from the hero section, so that the page feels stable when I scroll down.
6. As a site visitor on a touch device (phone, tablet), I want the animation to remain as-is without attempting cursor tracking, so that there are no broken or jarring effects on mobile.
7. As a site visitor, I want the cursor-tracking to activate only while my cursor is within the hero section boundaries, so that scrolling content below does not trigger unexpected camera movement.
8. As a site visitor, I want the return-to-neutral motion (on mouse leave) to be eased — not an instant snap — so that the transition is graceful.
9. As a site visitor who quickly flicks the cursor across the hero, I want the camera to not overshoot or jitter, so that the experience remains polished.
10. As a site visitor, I want the text (`promo__title`, `promo__catalogues`) to remain perfectly readable at all times, so that cursor tracking never hinders usability.
11. As a developer, I want the cursor-tracking state (`targetRotX`, `targetRotY`, current `rotX`, `rotY`) to live inside the existing `tick()` loop, so that there is one animation update path rather than multiple competing `requestAnimationFrame` chains.
12. As a developer, I want the mouse handler to be removed when the animation cannot be initialised (e.g. `.promo` not found), so that there are no orphaned listeners.

## Implementation Decisions

- **Module modified:** `source/js/animation.js` — only this file needs to change. No new files.
- **Tracking surface:** `mousemove` listener on `window`, with bounds check against the `.promo` element's `getBoundingClientRect()`. This is simpler than attaching to `.promo` directly and avoids event-capture edge cases with the canvas overlay.
- **Mouse normalisation:** cursor position is mapped to the range `[-1, 1]` on both axes relative to the `.promo` bounding box. Values outside the box clamp to zero (cursor not over hero → target returns to neutral).
- **Camera rotation:** `camera.rotation.x` (vertical tilt, ±0.06 rad max) and `camera.rotation.y` (horizontal pan, ±0.10 rad max) are the targets. These values preserve the "looking straight ahead" feel while providing visible depth.
- **Smoothing (lerp):** inside `tick()`, current rotation is interpolated toward target each frame: `cur += (target - cur) * 0.04`. The factor `0.04` gives roughly 1–2 s of lag, which feels organic.
- **Neutral return:** when the cursor is outside `.promo`, targets are set to `0`. The same lerp in `tick()` handles the return — no separate timeout or animation.
- **Touch device guard:** if `window.matchMedia('(hover: none)').matches` is true at init time, the `mousemove` listener is not attached and no tracking state is created.
- **Coexistence with sinusoidal float:** the sinusoidal `position.y` update on each mesh continues unchanged. Camera rotation is additive on top of the existing camera state, not a replacement.
- **No new seams:** all state (`targetRotX`, `targetRotY`, `curRotX`, `curRotY`) lives as `var` declarations in the existing Three.js `if (promo)` block. The `tick()` function reads and updates them. No public API is exported.

## Testing Decisions

A good test checks observable browser behaviour — what the user sees — not internal variable values. Since there is no automated test suite, verification is visual and manual:

- **Test 1 — Basic tracking:** open `index.html` in a browser, move cursor slowly across the hero. The camera should visibly tilt/pan following the cursor direction. Floating shapes continue their sinusoidal bobbing.
- **Test 2 — Smooth return:** move cursor into the hero, then out. Camera should glide back to centre, not snap.
- **Test 3 — No overshoot:** flick the cursor rapidly across the hero. No jitter or oscillation.
- **Test 4 — Mobile guard:** open in Chrome DevTools touch emulation. No console errors; animation plays as before without cursor tracking.
- **Test 5 — Text readability:** at maximum tilt, `promo__title` and catalogue items remain fully legible.
- **Test 6 — Scroll isolation:** scroll past the hero, move cursor over lower sections. No camera movement occurs.

## Out of Scope

- Parallax movement of individual mesh positions (only camera rotation is in scope).
- Touch-based gyroscope or device-orientation tracking.
- Custom easing curves beyond a simple lerp factor.
- Performance instrumentation or frame-rate monitoring.
- Changes to any page other than `index.html` / `animation.js`.
- GSAP-based cursor tracking (the Three.js render loop already handles it).

## Further Notes

- The `.promo` canvas sits at `z-index: 0` with `pointer-events: none`, so `mousemove` must be on `window`, not the canvas itself.
- The `tick()` loop uses `requestAnimationFrame` — cursor state needs no debounce; the frame rate acts as a natural throttle.
- If the hero height is 0 (very small viewports), the bounds check treats the whole section as outside and tracking silently no-ops.
