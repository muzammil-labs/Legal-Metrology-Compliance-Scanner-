import React, { useState, useEffect, useMemo } from "react";
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
  const [auditMode, setAuditMode] = useState("PHYSICAL");
  const [isDeepScan, setIsDeepScan] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Generate object URL for image preview
  const filePreviewUrl = useMemo(() => {
    return file ? URL.createObjectURL(file) : null;
  }, [file]);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  // Haptic feedback
  useEffect(() => {
    if (demoMode && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [demoMode]);

  // Simulated progress animation while loading
  useEffect(() => {
    if (loading) {
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 90) return prev;
          // Slower progression towards the end to simulate actual work
          const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5;
          return prev + increment;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setScanProgress(100);
      setTimeout(() => setScanProgress(0), 500); // Reset after completion
    }
  }, [loading]);

  function handleFileChange(event) {
    const chosen = event.target.files?.[0] ?? null;
    if (chosen) {
      setFile(chosen);
      setPermissionDenied(false);
    }
  }

  function handleInputError() {
    setPermissionDenied(true);
  }

  return (
    <div className="capture-panel">
      <div className="panel-head">
        <span>Label Scanner</span>
        <span className="mono">{message}</span>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          type="button"
          className={`tab-btn ${auditMode === "PHYSICAL" ? "active" : ""}`}
          onClick={() => setAuditMode("PHYSICAL")}
          style={{ flex: 1 }}
        >
          Physical Audit
        </button>
        <button
          type="button"
          className={`tab-btn ${auditMode === "ECOMMERCE" ? "active" : ""}`}
          onClick={() => setAuditMode("ECOMMERCE")}
          style={{ flex: 1 }}
        >
          E-Commerce
        </button>
      </div>

      <div className="viewport">
        {auditMode === "PHYSICAL" ? (
          <>
            <div className="grid-lines" />

            {/* Image Preview Area */}
            {filePreviewUrl && (
              <img 
                src={filePreviewUrl} 
                alt="Product Label Preview" 
                className={`viewport-image ${loading ? 'scanning' : ''}`}
              />
            )}

            {/* Simulated progress overlay */}
            {loading && (
              <div className="scan-progress-container">
                <div className="scan-text">
                  <span>{scanProgress < 40 ? "Extracting OCR Tokens..." : scanProgress < 75 ? "Evaluating Statutory Logic..." : "Finalizing Ledger..."}</span>
                  <span>{Math.floor(scanProgress)}%</span>
                </div>
                <div className="scan-bar-bg">
                  <div className="scan-bar-fill" style={{ width: `${scanProgress}%` }} />
                </div>
              </div>
            )}
            
            {loading && <div className="scanline" aria-hidden="true" />}

            {demoMode && (
              <div className="fixture-label">Demo Fixture Active</div>
            )}

            {!filePreviewUrl && permissionDenied && (
              <div className="viewport-center">
                <CameraOff size={32} className="text-rose" />
                <p style={{ color: "#ef4444" }}>Camera access denied</p>
                <small>Use fixture mode or allow permissions</small>
              </div>
            )}

            {!filePreviewUrl && !permissionDenied && (
              <div className="viewport-center">
                <Upload size={32} />
                <p>{demoMode ? "Demo Fixture Active" : "Upload or capture product label"}</p>
                <small>Supports rear camera & standard images</small>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={loading}
              onChange={handleFileChange}
              onError={handleInputError}
              aria-label="Upload label image"
            />
          </>
        ) : (
          <div style={{ padding: "24px", width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
            {loading && <div className="scanline" aria-hidden="true" />}
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {["Blinkit", "Zepto", "Swiggy"].map((platform) => (
                <button
                  key={platform}
                  type="button"
                  className="preset-btn tab-btn"
                  onClick={() => setCustomOcr(`https://${platform.toLowerCase()}.com/product/12345`)}
                  style={{ padding: "6px 12px", fontSize: "12px", minHeight: "36px" }}
                  disabled={loading}
                >
                  {platform} Preset
                </button>
              ))}
            </div>

            <label style={{ marginBottom: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
              Digital Listing URL / Text
            </label>
            <textarea
              style={{
                flex: 1, width: "100%",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px", padding: "16px",
                color: "#fff", resize: "none",
                fontFamily: "var(--font-family)"
              }}
              placeholder="Paste E-commerce URL or raw listing text..."
              value={customOcr}
              onChange={(e) => setCustomOcr(e.target.value)}
              disabled={loading}
            />
          </div>
        )}
      </div>

      {auditMode === "PHYSICAL" && (
        <label className="deep-scan-toggle">
          <input 
            type="checkbox" 
            checked={isDeepScan} 
            onChange={(e) => setIsDeepScan(e.target.checked)}
            disabled={loading || demoMode}
          />
          <strong>Deep Scan (Bypass 4.5s Circuit Breaker)</strong>
          <span>Enable for real AI analysis (may take up to 9.5s). Uncheck for strict 4.5s offline-fallback testing.</span>
        </label>
      )}

      <div className="capture-actions">
        <button
          className="scan-button"
          disabled={loading || (auditMode === "PHYSICAL" && !file && !demoMode) || (auditMode === "ECOMMERCE" && !customOcr)}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            onScan(customOcr, isDeepScan);
          }}
        >
          <FileScan size={18} />
          {loading ? "Analyzing label..." : "Run Compliance Scan"}
        </button>

        <button
          type="button"
          className="ocr-toggle-btn"
          onClick={() => setShowOcrInput(!showOcrInput)}
        >
          <Eye size={14} />
          {showOcrInput ? "Hide Developer OCR Override" : "Developer OCR Override"}
        </button>
      </div>

      {showOcrInput && (
        <div className="ocr-override-box animate-in">
          <label>Direct Raw OCR Text Stream Override:</label>
          <textarea
            rows={3}
            placeholder="e.g. Manufactured by Acme Ltd..."
            value={customOcr}
            onChange={(e) => setCustomOcr(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
