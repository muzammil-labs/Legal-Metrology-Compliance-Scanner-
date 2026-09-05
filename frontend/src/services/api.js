import controlPass from "../fixtures/control_pass.json";
import controlFailTax from "../fixtures/control_fail_tax.json";
import controlFailUnit from "../fixtures/control_fail_unit.json";
import { saveOfflineScan } from "./offlineStorage";

const fixtures = {
  control_pass: controlPass,
  control_fail_tax: controlFailTax,
  control_fail_unit: controlFailUnit,
};

export const API_BASE_URL =
  typeof window !== "undefined" && window.location.origin
    ? "" // Dynamic relative routing on Vercel or Vite proxy
    : "http://localhost:8000";

export const resolveUrl = (path) => `${API_BASE_URL}${path}`;

export function loadPrecachedFixture(name) {
  const fixture = fixtures[name];
  if (!fixture) throw new Error(`Unknown fixture: ${name}`);
  return structuredClone(fixture);
}

export async function executeScanWithCircuitBreaker(
  imageFile,
  fixtureOverride = null,
  ocrText = "",
  region = "New Delhi",
  isDeepScan = false
) {
  if (fixtureOverride) return loadPrecachedFixture(fixtureOverride);
  if (!imageFile)
    throw new Error("An image file is required for live scanning.");

  const controller = new AbortController();
  const timeoutMs = isDeepScan ? 120000 : 90000; // 90s normal, 120s deep scan
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("ocr_text", ocrText);
    formData.append("region", region);
    const response = await fetch(resolveUrl("/api/scan"), {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.detail) detail = errJson.detail;
      } catch {}
      throw new Error(detail);
    }
    return await response.json();
  } catch (error) {
    // Convert cryptic AbortError into a user-friendly message
    if (error.name === "AbortError") {
      throw new Error(
        "Scan timed out — the server took too long to respond. Please try again with a clearer image."
      );
    }
    console.error("Scan failed or timed out.", error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function scanMultipleSides(imageFiles, region = "New Delhi") {
  if (!imageFiles || imageFiles.length === 0) throw new Error("No images provided");
  if (imageFiles.length === 1) {
    return executeScanWithCircuitBreaker(imageFiles[0], null, "", region, false);
  }
  
  const ocrTexts = [];
  for (const imgFile of imageFiles) {
    try {
      const result = await executeScanWithCircuitBreaker(imgFile, null, "", region, false);
      if (result.ocr_text) ocrTexts.push(result.ocr_text);
    } catch (e) {
      console.warn("Side scan failed, continuing:", e.message);
    }
  }
  
  const combinedText = ocrTexts.join("\n");
  return executeScanWithCircuitBreaker(imageFiles[0], null, combinedText, region, true);
}

export async function fetchInspections(limit = 50) {
  try {
    const res = await fetch(resolveUrl(`/api/inspections?limit=${limit}`));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(
      "Failed to fetch inspections; falling back to offline records.",
      err,
    );
    return [];
  }
}

export async function fetchAnalyticsSummary() {
  try {
    const res = await fetch(resolveUrl("/api/analytics/summary"));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Failed to fetch analytics summary.", err);
    return {
      total_inspections: 0,
      compliant_inspections: 0,
      failed_inspections: 0,
      warning_inspections: 0,
      compliance_rate: 0.0,
      by_region: {},
      by_rule_infractions: {},
      last_inspection_at: null,
    };
  }
}

export async function executeBatchScan(files) {
  const formData = new FormData();
  for (const f of files) {
    formData.append("files", f);
  }
  const response = await fetch(resolveUrl("/api/scan/batch"), {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

export function getNoticeDownloadUrl(inspectionId, noticeType = "COMPOUNDING") {
  return resolveUrl(
    `/api/inspections/${inspectionId}/export-notice?notice_type=${noticeType}`,
  );
}
