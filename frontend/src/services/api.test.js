import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadPrecachedFixture, executeScanWithCircuitBreaker, fetchInspections, fetchAnalyticsSummary, executeBatchScan, getNoticeDownloadUrl } from './api';
import * as offlineStorage from './offlineStorage';

// Mock the offline storage
vi.mock('./offlineStorage', () => ({
  saveOfflineScan: vi.fn(),
}));

// Mock fetch globally
const originalFetch = global.fetch;

describe('api.js', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('loadPrecachedFixture', () => {
    it('returns the cloned fixture for known names', () => {
      const data = loadPrecachedFixture('control_pass');
      expect(data).toHaveProperty('metadata');
      // ensure it's cloned, mutating shouldn't affect subsequent calls
      data.mutated = true;
      const data2 = loadPrecachedFixture('control_pass');
      expect(data2.mutated).toBeUndefined();
    });

    it('throws an error for unknown fixtures', () => {
      expect(() => loadPrecachedFixture('unknown')).toThrow('Unknown fixture: unknown');
    });
  });

  describe('executeScanWithCircuitBreaker', () => {
    const mockFile = new File(['dummy content'], 'test.png', { type: 'image/png' });

    it('returns fixture immediately if fixtureOverride is provided', async () => {
      const result = await executeScanWithCircuitBreaker(null, 'control_pass');
      expect(result).toBeDefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('throws error if no image file is provided for live scan', async () => {
      await expect(executeScanWithCircuitBreaker(null)).rejects.toThrow('An image file is required for live scanning.');
    });

    it('calls fetch with correct parameters on success', async () => {
      const mockResponse = { id: 123, status: 'pass' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await executeScanWithCircuitBreaker(mockFile, null, 'Test OCR', 'Mumbai');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/scan', expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
        signal: expect.any(AbortSignal),
      }));

      const callArgs = global.fetch.mock.calls[0];
      const formData = callArgs[1].body;
      expect(formData.get('file')).toBe(mockFile);
      expect(formData.get('ocr_text')).toBe('Test OCR');
      expect(formData.get('region')).toBe('Mumbai');

      expect(result).toEqual(mockResponse);
    });

    it('falls back to control_pass and saves offline on fetch failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Spy on console.warn to suppress it in test output
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await executeScanWithCircuitBreaker(mockFile, null, 'Test OCR', 'Mumbai');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Scan unavailable; serving deterministic fallback and saving for later.',
        expect.any(Error)
      );

      // Check fallback result
      expect(result).toBeDefined(); // should be the control_pass fixture

      // Check offline saving
      expect(offlineStorage.saveOfflineScan).toHaveBeenCalledTimes(1);
      expect(offlineStorage.saveOfflineScan).toHaveBeenCalledWith(mockFile, 'Test OCR', result);

      consoleWarnSpy.mockRestore();
    });

    it('falls back to control_pass and saves offline on non-ok response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await executeScanWithCircuitBreaker(mockFile, null, 'Test OCR', 'Mumbai');

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(offlineStorage.saveOfflineScan).toHaveBeenCalledTimes(1);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('fetchInspections', () => {
    it('returns data on successful fetch', async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchInspections(10);
      expect(global.fetch).toHaveBeenCalledWith('/api/inspections?limit=10');
      expect(result).toEqual(mockData);
    });

    it('throws error and falls back on non-ok response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchInspections(10);
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(result).toEqual([]);

      consoleWarnSpy.mockRestore();
    });

    it('returns empty array on fetch failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchInspections(10);
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(result).toEqual([]);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('fetchAnalyticsSummary', () => {
    it('returns data on successful fetch', async () => {
      const mockData = { total: 100 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchAnalyticsSummary();
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/summary');
      expect(result).toEqual(mockData);
    });

    it('throws error and returns fallback data on non-ok response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchAnalyticsSummary();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(result.total_inspections).toBe(30);

      consoleWarnSpy.mockRestore();
    });

    it('returns fallback data on fetch failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchAnalyticsSummary();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(result.total_inspections).toBe(30); // specific fallback value check

      consoleWarnSpy.mockRestore();
    });
  });

  describe('executeBatchScan', () => {
    it('calls fetch with form data containing all files', async () => {
      const mockData = { results: [] };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const files = [
        new File(['c1'], 'f1.png'),
        new File(['c2'], 'f2.png'),
      ];

      const result = await executeBatchScan(files);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const callArgs = global.fetch.mock.calls[0];
      expect(callArgs[0]).toBe('/api/scan/batch');
      expect(callArgs[1].method).toBe('POST');

      const formData = callArgs[1].body;
      const formDataFiles = formData.getAll('files');
      expect(formDataFiles).toHaveLength(2);
      expect(formDataFiles[0]).toBe(files[0]);
      expect(formDataFiles[1]).toBe(files[1]);

      expect(result).toEqual(mockData);
    });

    it('throws error if response is not ok', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(executeBatchScan([new File([], 'a')])).rejects.toThrow('HTTP 400');
    });
  });

  describe('getNoticeDownloadUrl', () => {
    it('returns correct url', () => {
      expect(getNoticeDownloadUrl('123')).toBe('/api/inspections/123/export-notice');
    });
  });
});
