import React, { useState, useEffect, useMemo } from "react";
import { Upload, FileScan, Eye, CameraOff, Box, ShoppingCart } from "lucide-react";

export default function CameraScanner({ file, setFile, demoMode, loading, message, onScan }) {
  const [showOcrInput, setShowOcrInput] = useState(false);
  const [customOcr, setCustomOcr] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [auditMode, setAuditMode] = useState("PHYSICAL");
  const [isDeepScan, setIsDeepScan] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const filePreviewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  useEffect(() => { return () => { if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl); }; }, [filePreviewUrl]);

  useEffect(() => {
    if (loading) {
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + (prev < 50 ? 5 : prev < 80 ? 2 : 0.5);
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setScanProgress(100);
      setTimeout(() => setScanProgress(0), 500);
    }
  }, [loading]);

  function handleFileChange(event) {
    const chosen = event.target.files?.[0] ?? null;
    if (chosen) { setFile(chosen); setPermissionDenied(false); }
  }

  const progressLabel = scanProgress < 40 ? "Reading label text..." : scanProgress < 75 ? "Checking statutory compliance..." : "Preparing audit report...";

  return (
    <div className="theme-bright-card p-5 sm:p-6 md:p-8 flex flex-col w-full max-w-full">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileScan className="text-blue-600 shrink-0" size={20} /> Label Compliance Scanner
        </h2>
      </div>

      <div className="flex p-1 bg-slate-100 border border-slate-200/60 rounded-xl mb-5">
        <button type="button" onClick={() => setAuditMode("PHYSICAL")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${auditMode === "PHYSICAL" ? "bg-white text-blue-600 shadow-sm border border-slate-200/80" : "text-slate-500 hover:text-slate-700"}`}>
          <Box size={16} /> Physical Package
        </button>
        <button type="button" onClick={() => setAuditMode("ECOMMERCE")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${auditMode === "ECOMMERCE" ? "bg-white text-blue-600 shadow-sm border border-slate-200/80" : "text-slate-500 hover:text-slate-700"}`}>
          <ShoppingCart size={16} /> E-Commerce Listing
        </button>
      </div>

      <div className="viewport group">
        {auditMode === "PHYSICAL" ? (
          <>
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-blue-600 z-20 pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity"></div>
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-blue-600 z-20 pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity"></div>
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-blue-600 z-20 pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity"></div>
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-blue-600 z-20 pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity"></div>

            {filePreviewUrl && <img src={filePreviewUrl} alt="Product Label" className={`viewport-image ${loading ? 'scanning' : ''}`} />}
            {loading && <div className="animate-laser"></div>}
            {loading && (
              <div className="absolute bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-slate-200/80 p-4 rounded-xl shadow-lg">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-700">{progressLabel}</span>
                  <span className="font-mono text-blue-600">{Math.floor(scanProgress)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${scanProgress}%` }}></div>
                </div>
              </div>
            )}
            {demoMode && (
              <div className="absolute top-4 left-4 z-30 bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg shadow-sm">Demo Fixture Active</div>
            )}
            {!filePreviewUrl && permissionDenied && (
              <div className="z-30 text-center flex flex-col items-center p-6 text-rose-500">
                <CameraOff size={36} className="mb-3" />
                <p className="font-bold text-sm">Camera access denied</p>
                <small className="text-slate-500 mt-1">Use a demo fixture or allow camera permissions</small>
              </div>
            )}
            {!filePreviewUrl && !permissionDenied && (
              <div className="z-30 flex flex-col items-center justify-center p-6 text-slate-400 group-hover:text-blue-500 transition-colors">
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 mb-3 group-hover:shadow-md transition-shadow">
                  <Upload size={28} />
                </div>
                <p className="font-semibold text-slate-700 text-sm">{demoMode ? "Demo Fixture Active" : "Upload or capture product label"}</p>
                <small className="text-slate-500 mt-1 text-xs">Tap to use rear camera or select an image</small>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" disabled={loading} onChange={handleFileChange} aria-label="Upload label image" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col p-5 z-20">
            {loading && <div className="animate-laser"></div>}
            <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
              {["Blinkit", "Zepto", "Swiggy Instamart", "Amazon"].map((p) => (
                <button key={p} type="button" disabled={loading}
                  className="shrink-0 bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 min-h-[40px]"
                  onClick={() => setCustomOcr(`https://${p.toLowerCase().replace(/\s/g, '')}.com/product/12345`)}>
                  {p}
                </button>
              ))}
            </div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Digital Listing URL / Text</label>
            <textarea className="flex-1 w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none"
              placeholder="Paste e-commerce URL or listing text..." value={customOcr} onChange={(e) => setCustomOcr(e.target.value)} disabled={loading} />
          </div>
        )}
      </div>

      {auditMode === "PHYSICAL" && (
        <label className="mt-4 flex items-start gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors min-h-[48px]">
          <input type="checkbox" checked={isDeepScan} onChange={(e) => setIsDeepScan(e.target.checked)} disabled={loading || demoMode}
            className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600" />
          <div className="flex flex-col">
            <strong className="text-sm font-semibold text-slate-900">Deep Scan Mode (Live AI Analysis)</strong>
            <span className="text-xs text-slate-500 mt-0.5 leading-relaxed">Uses live AI vision for real-time label analysis. May take a few extra seconds for high-accuracy results.</span>
          </div>
        </label>
      )}

      <div className="flex flex-col gap-2.5 mt-5">
        <button className="w-full flex items-center justify-center gap-2 min-h-[52px] bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          disabled={loading || (auditMode === "PHYSICAL" && !file && !demoMode) || (auditMode === "ECOMMERCE" && !customOcr)}
          onClick={() => { if (navigator.vibrate) navigator.vibrate(50); onScan(customOcr, isDeepScan); }}>
          <FileScan size={18} /> {loading ? "Analyzing Label..." : "Run Compliance Scan"}
        </button>
        <button type="button" className="flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          onClick={() => setShowOcrInput(!showOcrInput)}>
          <Eye size={13} /> {showOcrInput ? "Hide Manual Input" : "Manual Text Input"}
        </button>
      </div>

      {showOcrInput && (
        <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Manual OCR Text Override</label>
          <textarea rows={3} className="w-full bg-white border border-slate-200 text-slate-900 font-mono text-xs p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            placeholder="e.g. Manufactured by Acme Ltd..." value={customOcr} onChange={(e) => setCustomOcr(e.target.value)} />
        </div>
      )}
    </div>
  );
}
