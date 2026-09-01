import React, { useState, useEffect, useMemo } from "react";
import { Upload, FileScan, Eye, CameraOff, Box, ShoppingCart } from "lucide-react";

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

  // Simulated progress animation while loading
  useEffect(() => {
    if (loading) {
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 90) return prev;
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
    <div className="theme-bright-card p-6 md:p-8 flex flex-col h-full w-full mx-auto relative z-10">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileScan className="text-blue-600" size={20} />
          Compliance Scanner
        </h2>
        <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md tracking-tight">
          {message}
        </span>
      </div>

      {/* Segmented Mode Switcher */}
      <div className="flex p-1 bg-slate-100 border border-slate-200 rounded-xl mb-6 shadow-inner">
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
            auditMode === "PHYSICAL" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setAuditMode("PHYSICAL")}
        >
          <Box size={16} /> Physical Package
        </button>
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
            auditMode === "ECOMMERCE" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setAuditMode("ECOMMERCE")}
        >
          <ShoppingCart size={16} /> Digital E-Commerce
        </button>
      </div>

      {/* Main Viewport */}
      <div className="viewport shadow-inner group">
        {auditMode === "PHYSICAL" ? (
          <>
            {/* Cobalt Blue Crosshairs */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-600 z-20 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-600 z-20 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-600 z-20 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-600 z-20 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>

            <div className="absolute inset-0 z-10 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Image Preview */}
            {filePreviewUrl && (
              <img 
                src={filePreviewUrl} 
                alt="Product Label Preview" 
                className={`viewport-image ${loading ? 'scanning' : ''}`}
              />
            )}

            {/* Active Scan Laser HUD */}
            {loading && <div className="animate-laser"></div>}

            {loading && (
              <div className="absolute bottom-6 left-6 right-6 z-40 bg-white/95 backdrop-blur border border-slate-200 p-4 rounded-xl shadow-lg">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-700">{scanProgress < 40 ? "Extracting OCR Tokens..." : scanProgress < 75 ? "Evaluating Statutory Logic..." : "Finalizing Ledger..."}</span>
                  <span className="font-mono text-blue-600">{Math.floor(scanProgress)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-300 ease-out" style={{ width: `${scanProgress}%` }}></div>
                </div>
              </div>
            )}

            {demoMode && (
              <div className="absolute top-6 left-6 z-30 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg shadow-sm">
                Demo Fixture Active
              </div>
            )}

            {!filePreviewUrl && permissionDenied && (
              <div className="z-30 text-center flex flex-col items-center p-6 text-rose-500">
                <CameraOff size={40} className="mb-3" />
                <p className="font-bold text-sm">Camera access denied</p>
                <small className="text-slate-500 mt-1">Use fixture mode or allow permissions</small>
              </div>
            )}

            {!filePreviewUrl && !permissionDenied && (
              <div className="z-30 flex flex-col items-center justify-center p-6 text-slate-400 group-hover:text-blue-500 transition-colors">
                <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100 mb-4 group-hover:shadow-md transition-all">
                  <Upload size={32} />
                </div>
                <p className="font-bold text-slate-700 text-sm">{demoMode ? "Demo Fixture Active" : "Upload or capture product label"}</p>
                <small className="text-slate-500 mt-1">Supports rear camera & standard images</small>
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
              className="absolute inset-0 opacity-0 cursor-pointer z-50 w-full h-full"
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col p-6 z-20">
            {loading && <div className="animate-laser"></div>}
            
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
              {["Blinkit", "Zepto", "Swiggy Instamart", "Amazon"].map((platform) => (
                <button
                  key={platform}
                  type="button"
                  className="shrink-0 bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                  onClick={() => setCustomOcr(`https://${platform.toLowerCase().replace(' ', '')}.com/product/12345`)}
                  disabled={loading}
                >
                  {platform}
                </button>
              ))}
            </div>

            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Digital Listing URL / Text
            </label>
            <textarea
              className="flex-1 w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 focus-visible:border-blue-500 transition-all resize-none shadow-sm"
              placeholder="Paste E-commerce URL or raw listing text..."
              value={customOcr}
              onChange={(e) => setCustomOcr(e.target.value)}
              disabled={loading}
            />
          </div>
        )}
      </div>

      {auditMode === "PHYSICAL" && (
        <label className="mt-4 flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors group">
          <input 
            type="checkbox" 
            checked={isDeepScan} 
            onChange={(e) => setIsDeepScan(e.target.checked)}
            disabled={loading || demoMode}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
          <div className="flex flex-col">
            <strong className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Deep Scan Mode (Bypass 4.5s Cache)</strong>
            <span className="text-xs text-slate-500 mt-0.5 leading-relaxed">Force live Multimodal AI analysis (may take up to 9.5s). Uncheck for strict offline-fallback testing.</span>
          </div>
        </label>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-6">
        <button
          className="w-full flex items-center justify-center gap-2 min-h-[56px] bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
          disabled={loading || (auditMode === "PHYSICAL" && !file && !demoMode) || (auditMode === "ECOMMERCE" && !customOcr)}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            onScan(customOcr, isDeepScan);
          }}
        >
          <FileScan size={20} />
          {loading ? "Analyzing Document..." : "Run Compliance Scan"}
        </button>

        <button
          type="button"
          className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          onClick={() => setShowOcrInput(!showOcrInput)}
        >
          <Eye size={14} />
          {showOcrInput ? "Hide Developer Override" : "Developer OCR Override"}
        </button>
      </div>

      {showOcrInput && (
        <div className="mt-2 p-4 bg-slate-900 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Raw OCR Stream Override</label>
          <textarea
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs p-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="e.g. Manufactured by Acme Ltd..."
            value={customOcr}
            onChange={(e) => setCustomOcr(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
