import React, { useState, useEffect } from "react";
import { Upload, FileScan, Eye, CameraOff } from "lucide-react";

export default function CameraScanner({
  file,
  setFile,
  demoMode,
  loading,
  message,
  onScan,
}) {
  const [showOcrInput, setShowOcrInput] = useState(false);
  const [customOcr, setCustomOcr] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [auditMode, setAuditMode] = useState("PHYSICAL"); // PHYSICAL or ECOMMERCE

  // Haptic feedback on demo fixture switch (from PWA branch)
  useEffect(() => {
    if (demoMode && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [demoMode]);

  function handleFileChange(event) {
    const chosen = event.target.files?.[0] ?? null;
    if (chosen) {
      setFile(chosen);
      setPermissionDenied(false);
    }
  }

  function handleInputError() {
    // Triggered when browser blocks camera access (permission denied)
    setPermissionDenied(true);
  }

  return (
    <div className="capture-panel">
      <div className="panel-head">
        <span>Label Scanner</span>
        <span className="mono">{message}</span>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', background: '#18181b', padding: '4px', borderRadius: '8px' }}>
        <button
          type="button"
          className={`tab-btn ${auditMode === "PHYSICAL" ? "active" : ""}`}
          onClick={() => setAuditMode("PHYSICAL")}
          style={{ flex: 1, padding: '8px', borderRadius: '6px', background: auditMode === "PHYSICAL" ? '#27272a' : 'transparent', color: auditMode === "PHYSICAL" ? '#fff' : '#a1a1aa' }}
        >
          Physical Camera Audit
        </button>
        <button
          type="button"
          className={`tab-btn ${auditMode === "ECOMMERCE" ? "active" : ""}`}
          onClick={() => setAuditMode("ECOMMERCE")}
          style={{ flex: 1, padding: '8px', borderRadius: '6px', background: auditMode === "ECOMMERCE" ? '#27272a' : 'transparent', color: auditMode === "ECOMMERCE" ? '#fff' : '#a1a1aa' }}
        >
          E-Commerce Digital Listing
        </button>
      </div>

      <div className="viewport">
        {auditMode === "PHYSICAL" ? (
          <>
            <div className="grid-lines" />

            {/* Scanline — pointer-events:none so it never blocks file input clicks */}
            {loading && <div className="scanline" aria-hidden="true" />}

            {/* Demo fixture active indicator */}
            {demoMode && <div className="fixture-label">Demo Fixture Active</div>}

            {/* Permission-denied state */}
            {permissionDenied ? (
              <div className="viewport-center">
                <CameraOff size={32} className="text-rose" />
                <p style={{ color: "#fb7185" }}>Camera access denied</p>
                <small>
                  Use the fixture selector in the header, or allow camera
                  permissions and retry.
                </small>
              </div>
            ) : (
              <div className="viewport-center">
                <Upload size={32} />
                <p>
                  {file
                    ? file.name
                    : demoMode
                      ? "Demo Fixture Active"
                      : "Capture or upload a product label"}
                </p>
                <small>Supports rear camera capture and image upload</small>
              </div>
            )}

            {/* Native mobile rear-camera input — z-index above all overlays */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={loading}
              onChange={handleFileChange}
              onError={handleInputError}
              aria-label="Upload or capture product label image"
            />
          </>
        ) : (
          <div style={{ padding: '20px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* Scanline Animation overlay during loading */}
            {loading && <div className="scanline" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'cyan', boxShadow: '0 0 10px cyan', zIndex: 10, animation: 'scan 2s linear infinite' }} />}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setCustomOcr("https://blinkit.com/prn/product/12345")}
                style={{ padding: '4px 10px', fontSize: '11px', background: '#3f3f46', color: '#e4e4e7', borderRadius: '4px', border: 'none' }}
                disabled={loading}
              >
                Blinkit Preset
              </button>
              <button
                type="button"
                onClick={() => setCustomOcr("https://zeptonow.com/pn/product/54321")}
                style={{ padding: '4px 10px', fontSize: '11px', background: '#3f3f46', color: '#e4e4e7', borderRadius: '4px', border: 'none' }}
                disabled={loading}
              >
                Zepto Preset
              </button>
              <button
                type="button"
                onClick={() => setCustomOcr("https://www.swiggy.com/instamart/item/98765")}
                style={{ padding: '4px 10px', fontSize: '11px', background: '#3f3f46', color: '#e4e4e7', borderRadius: '4px', border: 'none' }}
                disabled={loading}
              >
                Swiggy Preset
              </button>
            </div>

            <label style={{ marginBottom: '8px', fontSize: '14px', color: '#e4e4e7' }}>Digital Listing URL / Text</label>
            <textarea
              style={{ flex: 1, width: '100%', background: 'transparent', border: '1px solid #3f3f46', borderRadius: '8px', padding: '12px', color: '#fff', resize: 'none' }}
              placeholder="Paste Blinkit, Zepto, Swiggy Instamart URL or extracted listing text here..."
              value={customOcr}
              onChange={(e) => setCustomOcr(e.target.value)}
              disabled={loading}
            />
          </div>
        )}
      </div>

      <div className="capture-actions">
        <button
          className="scan-button"
          disabled={loading || (auditMode === "PHYSICAL" && !file && !demoMode) || (auditMode === "ECOMMERCE" && !customOcr)}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            onScan(customOcr);
          }}
          aria-label={loading ? "Scan in progress" : "Run compliance scan"}
        >
          <FileScan size={18} />
          {loading ? "Analyzing label..." : "Scan for Compliance"}
        </button>

        <button
          type="button"
          className="ocr-toggle-btn"
          onClick={() => setShowOcrInput(!showOcrInput)}
          aria-expanded={showOcrInput}
        >
          <Eye size={14} />
          {showOcrInput ? "Hide OCR Override" : "Custom OCR Text Override"}
        </button>
      </div>

      {showOcrInput && (
        <div className="ocr-override-box">
          <label htmlFor="custom-ocr-field">
            Direct Raw OCR Text Stream (for manual testing or live editing):
          </label>
          <textarea
            id="custom-ocr-field"
            rows={3}
            placeholder="e.g. Manufactured by Acme Ltd 110001. Net Qty 500 g MRP Rs. 50 (incl. of all taxes) 01/2026..."
            value={customOcr}
            onChange={(e) => setCustomOcr(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
