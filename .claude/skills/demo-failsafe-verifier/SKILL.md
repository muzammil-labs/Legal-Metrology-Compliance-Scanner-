'---
name: demo-failsafe-verifier
description: "Automatically trigger when modifying API client code, networking, offline resilience, or circuit breakers in frontend/src/services/api.js."
---
# Live Demo Resilience and Circuit-Breaker Protocol

All live scan requests must be bounded, recoverable, and deterministic during a stage demonstration. Keep fixture data local, versioned, and shaped exactly like the backend Pydantic response contract.

## Required Client Flow

In `frontend/src/services/api.js`, use this behavior (adapt imports and response typing to the existing project):

```js
export async function executeScanWithCircuitBreaker(imageFile, fixtureOverride = null) {
	if (fixtureOverride) return loadPrecachedFixture(fixtureOverride);

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 4500);

	try {
		const formData = new FormData();
		formData.append('file', imageFile);
		const response = await fetch('/api/scan', {
			method: 'POST',
			body: formData,
			signal: controller.signal,
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (error) {
		console.warn('Scan unavailable; serving deterministic fallback.', error);
		return loadPrecachedFixture('control_pass');
	} finally {
		clearTimeout(timeoutId);
	}
}
```

Never leave a timer running, throw an unhandled rejection, or strand a loading state. Preserve the original error in logs only; show a stable user-facing fallback status. Distinguish fixture results from live results in the returned metadata when the schema allows it, without changing the locked response contract.

## Fixture Vectors

Bundle exactly these JSON fixtures in `frontend/src/fixtures/` and validate them at import time or in tests:

- `control_pass.json`: a valid packaged biscuit product; all six Rule 6(1) checks pass and USP is valid.
- `control_fail_tax.json`: `MRP Rs. 50/-`; fails Rule 6(1)(e) because the tax-inclusion suffix is absent.
- `control_fail_unit.json`: `Net Wt: 1000 gm`; fails Rule 6(1)(c) for the legacy unit and Rule 6(11) for missing USP.

`loadPrecachedFixture` must accept only `control_pass`, `control_fail_tax`, or `control_fail_unit`, return a deep-cloned object so callers cannot mutate the fixture, and throw a controlled programming error for an unknown key. The UI must catch that error and keep its loading state recoverable.

## Demo Mode UX

Provide a compact header segmented control with `Live Camera`, `Product 1 (Pass)`, `Product 2 (Tax Fail)`, and `Product 3 (USP Fail)`. Selecting a fixture bypasses camera and network calls immediately. Keep the selected mode visible, keyboard accessible, and usable with a 48px touch target.

## Tests

Test the 4500ms abort with fake timers, HTTP failures, network rejection, successful live responses, each fixture selection, unknown fixture handling, and loading-state recovery. Tests must prove that timeout and network failures resolve to `control_pass` rather than rejecting.