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

      <div className="viewport">
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
      </div>

      <div className="capture-actions">
        <button
          className="scan-button"
          disabled={loading || (!file && !demoMode)}
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
