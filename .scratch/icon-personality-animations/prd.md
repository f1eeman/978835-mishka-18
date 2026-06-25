# Feature icons: individual personality loops

**Status:** ready-for-agent

## Problem Statement

The six feature icons in the "Коротко о нас" section currently have entrance animations with unique personality, but after that play a single uniform scale-wave that treats all icons identically. The icons represent very different concepts (a flower, a wallet, a heart, a ball of yarn, a rocket, a gift box) — a single shared wave erases that identity. The section feels mechanical rather than warm and handmade.

## Solution

Replace the unified scale wave with six distinct continuous loops, each designed around what the icon actually represents:

- **Flower** (eco-material) — sways gently, like a plant in a breeze
- **Wallet** (nordic-style) — floats up and down subtly, like a coin bobbing
- **Heart** (likes) — beats with a double-thump heartbeat rhythm
- **Ball of yarn** (handmade) — spins slowly and continuously, like a rolling ball
- **Rocket** (domestic-production) — thrusts upward in a hovering float
- **Gift box** (gift-wrap) — bounces up eagerly, pauses, repeats — like a present that wants to be opened

All loops start after the icon's entrance animation completes (each has its own delay to avoid fighting the entry). All loops are infinite. The existing entrance animations are unchanged.

## User Stories

1. As a site visitor, I want the flower icon to sway gently after it appears, so that it feels alive and organic, like a real plant.
2. As a site visitor, I want the sway to be slow and calm, so that it does not distract from reading the feature text.
3. As a site visitor, I want the wallet icon to bob up and down subtly, so that it feels like a coin in motion without being distracting.
4. As a site visitor, I want the heart icon to beat with a double-pulse rhythm (lub-dub), so that it mimics a real heartbeat and reinforces the "likes" message.
5. As a site visitor, I want the heartbeat to pause between cycles, so that it reads as a natural rhythm rather than a mechanical loop.
6. As a site visitor, I want the ball of yarn icon to spin continuously and slowly, so that it looks like a ball of yarn actually rolling.
7. As a site visitor, I want the spin to be smooth and unending, so that it feels like an idle, cosy motion rather than a jerky loop.
8. As a site visitor, I want the rocket icon to float upward in a gentle thrust, so that it conveys flight and motion without leaving the screen.
9. As a site visitor, I want the rocket's hover to be slow and repeating, so that it reads as hovering rather than launching.
10. As a site visitor, I want the gift box to bounce up with a slight pause between bounces, so that it looks eager and inviting, like a present waiting to be opened.
11. As a site visitor, I want all six icons to feel thematically distinct rather than doing the same animation, so that each feature's character comes through.
12. As a site visitor, I want the loops to start only after the entrance animation finishes, so that the entry and the loop never play simultaneously and fight each other.
13. As a site visitor with reduced-motion preferences, I want the personality loops to not play, so that the section remains comfortable for me.
14. As a developer, I want all six loops to be added in a single `ScrollTrigger.create` callback, so that the setup is in one place and easy to modify.
15. As a developer, I want each loop to use only the property appropriate to its character (rotation for spin, y for float, scale for heartbeat), so that loops don't compete with the existing entrance animations.

## Implementation Decisions

- **Module modified:** `animation.js` — only the GSAP section. The current unified scale-wave `ScrollTrigger.create` is replaced by six individual GSAP tweens inside a single `ScrollTrigger.create({ once: true, onEnter })` callback.

- **Reduced-motion guard:** before starting any loop, check `window.matchMedia('(prefers-reduced-motion: reduce)').matches`. If true, return immediately without creating any looping tweens.

- **Trigger:** same `ScrollTrigger.create` as the existing wave — `trigger: '.features', start: 'top 78%', once: true`. One callback sets up all six loops.

- **Flower — sway:**
  - Property: `rotation`
  - Motion: `±12°`, sine.inOut ease, 2.5 s per half-cycle, yoyo, repeat -1
  - Delay: 1.0 s (entrance finishes at ~0.9 s)

- **Wallet — bob:**
  - Property: `y`
  - Motion: `−5px`, sine.inOut ease, 1.8 s per half-cycle, yoyo, repeat -1
  - Delay: 0.9 s

- **Heart — heartbeat (double-thump):**
  - Uses a GSAP timeline, not a simple tween, to produce the lub-dub rhythm
  - Sequence: scale to 1.25 (0.12 s, power2.out) → back to 1 (0.1 s) → scale to 1.15 (0.1 s, power2.out) → back to 1 (0.1 s) → wait 1.4 s
  - Timeline: repeat -1
  - Delay: 0.8 s

- **Ball of yarn — spin:**
  - Property: `rotation`
  - Motion: `+=360°`, ease: none, 6 s per revolution, repeat -1
  - Delay: 1.2 s (entrance ends at ~1.16 s)

- **Rocket — thrust float:**
  - Property: `y`
  - Motion: `−7px`, power1.inOut ease, 1.2 s per half-cycle, yoyo, repeat -1
  - Delay: 1.1 s

- **Gift box — eager bounce:**
  - Property: `y`
  - Motion: `−8px`, back.out(2) ease, 0.4 s up; back to 0, bounce.out ease, 0.5 s; repeatDelay: 1.6 s; repeat -1
  - Implemented as a timeline (up then down with different eases), not a simple yoyo
  - Delay: 1.0 s

- **No scale in the loops:** scale is used by the entrance animations. Keeping loops off `scale` avoids GSAP overwrite conflicts. The heartbeat uses scale but starts after the entrance is complete, so there is no overlap.

- **The old unified wave is removed** and replaced entirely by this set of individual loops.

## Testing Decisions

A good test checks what the user sees, not which GSAP tweens are registered. All testing is manual and visual:

- **Test 1 — Flower sways:** scroll to the features section, wait 1 s. Flower icon should swing left/right gently, indefinitely.
- **Test 2 — Wallet bobs:** wallet icon rises and falls subtly. Motion is slow and unobtrusive.
- **Test 3 — Heartbeat:** heart icon thumps twice in quick succession, pauses ~1.4 s, thumps again. Rhythm should feel biological.
- **Test 4 — Yarn spins:** ball of yarn rotates slowly and smoothly, one revolution every 6 s. No pause between revolutions.
- **Test 5 — Rocket floats:** rocket icon floats up and down, 1.2 s each way. Feels like hovering.
- **Test 6 — Gift bounces:** gift bounces up, drops back, pauses 1.6 s, bounces again. Feels eager and playful.
- **Test 7 — No conflict with entries:** refresh and watch each icon enter. Loops must not start until entry is finished. No jitter or mid-entrance jump.
- **Test 8 — Reduced motion:** OS reduced-motion on → section renders with no loops; icons are still, readable.
- **Test 9 — Other sections unaffected:** popular-item, reviews, contacts, hero Three.js all still animate correctly.

Prior art: existing entrance animations in `animation.js` are verified the same way.

## Out of Scope

- Changing the SVG icon artwork.
- Animating the feature text or list items (those already have their own scroll-triggered entrance).
- Touch/gyroscope-based icon interaction.
- Per-icon color animation or filter effects.
- Scroll-linked loop speed (loops run at constant speed regardless of scroll position).

## Further Notes

- GSAP `rotation` on an SVG element rotates around its CSS transform-origin. The existing SCSS sets `transform-origin: center center` on `.features__icon` — this is correct for all six loops.
- The heartbeat timeline must be built with an explicit `gsap.timeline({ repeat: -1, delay: 0.8 })` rather than chained `.to()` on a single tween, because the two pulses have different amplitudes and the pause after them is not a yoyo.
- The ball of yarn already had a 360° spin in the old animation (before being replaced by the wave). The new spin is identical in concept; only the delay is adjusted to account for the entrance finishing.
