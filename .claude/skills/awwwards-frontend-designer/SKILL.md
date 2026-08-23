---
name: awwwards-frontend-designer
description: "Automatically trigger when creating, editing, or styling React UI components, Tailwind CSS styling, animations, or viewports in frontend/src/."
---
# Awwwards-Tier Regulatory UI and Design System

Build a high-contrast field auditing interface that is dense, calm, and legible in bright inspection environments. Preserve existing project components and tokens where present; do not introduce a second design system.

## Palette and Surfaces

- Root: `bg-zinc-950` with a restrained radial mesh gradient in CSS, never a large decorative orb.
- Surfaces: `bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80`.
- Text: primary `text-zinc-100`, secondary `text-zinc-400`, labels `text-zinc-500 uppercase tracking-wider text-xs`.
- Pass badge: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]` with Lucide `CheckCircle2`.
- Fail badge: `bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]` with Lucide `AlertTriangle`.
- Review badge: `bg-amber-500/10 text-amber-400 border border-amber-500/20` with Lucide `HelpCircle`.

Do not communicate status by color alone: include the icon and a text label. Keep repeated result items as simple cards with a maximum 8px radius; do not put cards inside cards.

## Type, Layout, and Controls

Use the project font if configured, otherwise choose an expressive sans-serif with a clear numeric style and load it through the existing app pipeline. Do not use oversized hero typography in dashboards. Keep information scannable with stable grid tracks, `min-width: 0`, and responsive stacking. Use Lucide icons in icon buttons with tooltips; use text buttons only for clear commands.

Every interactive control must have at least `min-h-[48px]`, a visible focus ring, and `active:scale-[0.98] transition-transform duration-100`. On mobile, primary actions are full width. Use a segmented control for `Live Camera` versus fixture modes, not a text paragraph or hidden toggle.

## Camera Viewport and Laser

An active camera viewport is `relative overflow-hidden rounded-lg border border-zinc-700` with a stable aspect ratio. Overlay the scan beam without blocking pointer events:

```css
@keyframes scanline {
	0% { top: 0%; opacity: 0.8; }
	50% { opacity: 1; }
	100% { top: 100%; opacity: 0.8; }
}

.scanline {
	position: absolute;
	left: 0;
	top: 0;
	z-index: 1;
	width: 100%;
	height: 4px;
	pointer-events: none;
	background: linear-gradient(90deg, transparent, #22d3ee, transparent);
	box-shadow: 0 0 15px #22d3ee;
	animation: scanline 2.4s linear infinite;
}
```

Respect `prefers-reduced-motion: reduce` by disabling the animation while leaving a static, accessible active indicator. Provide an empty, loading, success, failure, and camera-permission-denied state without layout shifts.

## Mobile Drawer

Inspection details on narrow screens use a slide-over: `fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-900/95 border-l border-zinc-800`, with a focus trap, close button, escape handling, and a backdrop. Do not allow result text or controls to overlap the camera viewport.

## Verification

Before finishing frontend work, test keyboard focus, reduced motion, a narrow mobile viewport, and a wide desktop viewport. Verify pass/fail contrast, 48px tap targets, no horizontal overflow, and that the laser is clipped to the viewport.