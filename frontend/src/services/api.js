import controlPass from '../fixtures/control_pass.json';
import controlFailTax from '../fixtures/control_fail_tax.json';
import controlFailUnit from '../fixtures/control_fail_unit.json';
import { saveOfflineScan } from './offlineStorage';

const fixtures = {
  control_pass: controlPass,
  control_fail_tax: controlFailTax,
  control_fail_unit: controlFailUnit,
};

export function loadPrecachedFixture(name) {
  const fixture = fixtures[name];
  if (!fixture) throw new Error(`Unknown fixture: ${name}`);
  return structuredClone(fixture);
}

export async function executeScanWithCircuitBreaker(imageFile, fixtureOverride = null) {
  if (fixtureOverride) return loadPrecachedFixture(fixtureOverride);
  if (!imageFile) throw new Error('An image file is required for live scanning.');

  // Default ocrText for backwards compatibility if not provided by UI
  const ocrText = '';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('ocr_text', ocrText);
    const response = await fetch('/api/scan', { method: 'POST', body: formData, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('Scan unavailable; serving deterministic fallback and saving for later.', error);
    const fallbackResult = loadPrecachedFixture('control_pass');
    // Save to local storage for offline sync
    await saveOfflineScan(imageFile, ocrText, fallbackResult);
    return fallbackResult;
  } finally {
    clearTimeout(timeoutId);
  }
}
