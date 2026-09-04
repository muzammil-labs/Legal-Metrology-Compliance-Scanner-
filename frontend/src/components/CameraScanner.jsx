import React, { useState, useRef, useImperativeHandle } from "react";
import { Upload, Camera, FileScan, Eye, Package, ShoppingBag, X, XCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default React.forwardRef(function CameraScanner({ file, setFile, demoMode, loading, message, onScan, audit }, ref) {
  const [showOcrInput, setShowOcrInput] = useState(false);
  const [customOcr, setCustomOcr] = useState("");
  const [scanType, setScanType] = useState("physical");
  const [isDeepScan, setIsDeepScan] = useState(false);
  const [inputMode, setInputMode] = useState("upload"); // "upload" | "camera"
  const [isMobile, setIsMobile] = useState(true);

  // Multi-image state
  const [scannedSides, setScannedSides] = useState([]);
  const SIDE_LABELS = ['Front Panel', 'Back Panel', 'Side Panel', 'Bottom Panel'];
  const [scanProgress, setScanProgress] = useState({ current: 1, total: 1 });

  useImperativeHandle(ref, () => ({
    getScannedSides: () => scannedSides,
  }));

  // Guided Rescan State
  const [scanPhase, setScanPhase] = useState("idle"); // "idle" | "complete" | "guiding"
  const [missingFields, setMissingFields] = useState([]);
  const prevFileRef = useRef(null);
  const hasScannedOnceRef = useRef(false);

  React.useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const rescanInputRef = useRef(null);

  const getMissingFields = (currentAudit) => {
    if (!currentAudit || !currentAudit.rules) return [];
    
    const hints = {
      "Manufacturer": "Try the back or side panel",
      "Packer": "Try the back or side panel",
      "Net Quantity": "Look near the bottom front or back panel",
      "Maximum Retail Price": "Check the front panel or price sticker",
      "Date of Manufacture": "Check the bottom, cap, or price sticker",
      "Country of Origin": "Look near the manufacturer details on the back",
      "Consumer Care": "Check the back panel for phone or email",
      "Unit Sale Price": "Look near the MRP sticker",
      "FSSAI": "Check for the FSSAI logo on the back or side"
    };

    return currentAudit.rules
      .filter(r => r.status === "FAIL")
      .map(r => {
        let label = r.rule;
        if (label.includes(" - ")) label = label.split(" - ")[1];
        
        let hint = "Try capturing another visible side of the package";
        for (const [key, val] of Object.entries(hints)) {
          if (label.includes(key)) {
            hint = val;
            break;
          }
        }
        return { label, hint };
      });
  };

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f) {
      if (scannedSides.length === 0) {
        setScannedSides([{ id: Date.now(), label: SIDE_LABELS[0], file: f, previewUrl: URL.createObjectURL(f), status: 'pending' }]);
      } else {
        const nextIdx = scannedSides.length;
        setScannedSides(prev => [...prev, { id: Date.now(), label: SIDE_LABELS[nextIdx] || `Side ${nextIdx + 1}`, file: f, previewUrl: URL.createObjectURL(f), status: 'pending' }]);
      }
      setFile(f);
    }
    // reset so the same file can be picked again
    e.target.value = "";
  }

  function clearFile() {
    setFile(null);
    // If we're in single file mode (backward compat)
    if (scannedSides.length === 0) return;
  }

  function clearAll() {
    scannedSides.forEach(s => URL.revokeObjectURL(s.previewUrl));
    setScannedSides([]);
    setFile(null);
    setScanPhase("idle");
  }

  function removeSide(index) {
    const side = scannedSides[index];
    if (side) URL.revokeObjectURL(side.previewUrl);
    setScannedSides(prev => prev.filter((_, i) => i !== index));
    if (scannedSides.length === 1) {
      setFile(null);
      setScanPhase("idle");
    }
  }

  function switchToMode(mode) {
    setInputMode(mode);
    clearAll();
  }

  React.useEffect(() => {
    if (audit) {
      hasScannedOnceRef.current = true;
      const missing = getMissingFields(audit);
      setMissingFields(missing);
      if (missing.length > 0) {
        setScanPhase("complete");
      }
      // mark all as scanned
      setScannedSides(prev => prev.map(s => ({ ...s, status: 'scanned' })));
    } else {
      setScanPhase("idle");
      setMissingFields([]);
      setScannedSides(prev => prev.map(s => ({ ...s, status: 'pending' })));
    }
  }, [audit]);

  React.useEffect(() => {
    if (file && prevFileRef.current !== file) {
      prevFileRef.current = file;
      // Only auto-rescan if a prior scan has already completed (not on first upload)
      if (hasScannedOnceRef.current && scanPhase === "complete") {
        onScan("", false);
      }
    } else if (!file) {
      prevFileRef.current = null;
    }
  }, [file, scanPhase]); // onScan intentionally excluded — it is stable and its inclusion causes re-render loops

  // Mock progress for multi-scan
  React.useEffect(() => {
    let interval;
    if (loading && scannedSides.length > 1) {
      setScanProgress({ current: 1, total: scannedSides.length });
      interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev.current < prev.total) return { ...prev, current: prev.current + 1 };
          return prev;
        });
      }, 2500);
    } else {
      setScanProgress({ current: 1, total: 1 });
    }
    return () => clearInterval(interval);
  }, [loading, scannedSides.length]);

  const previewUrl = file ? URL.createObjectURL(file) : null;
  const canScan = scanType === "physical" && (scannedSides.length > 0 || file || demoMode || customOcr);

  return (
    <div className="flex flex-col gap-4 w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="theme-bright-card p-6 flex flex-col w-full max-w-full"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-ink/10">
          <h2 className="text-lg font-bold font-serif text-ink flex items-center gap-2">
            <FileScan className="text-turmeric shrink-0" size={20} />
            Verification Engine
          </h2>
          {scannedSides.length > 1 ? (
            <span className="text-[10px] font-bold tracking-widest text-turmeric bg-turmeric/10 border border-turmeric/20 px-2 py-1 rounded-md uppercase">
              MULTI-PANEL MODE — {scannedSides.length} sides loaded
            </span>
          ) : (
            <span className="text-[10px] font-bold tracking-widest text-sage bg-sage/10 border border-sage/20 px-2 py-1 rounded-md uppercase">
              SYSTEM ONLINE
            </span>
          )}
        </div>

        {/* ── Toggle 1: Physical / E-Commerce ── */}
        <div className="flex bg-seal-cream border border-ink/10 p-1 rounded-xl mb-4">
          <button
            onClick={() => setScanType("physical")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-200 ${
              scanType === "physical"
                ? "bg-paper shadow-sm text-ink border border-ink/10"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Package size={16} /> Physical Package
          </button>
          <button
            onClick={() => setScanType("ecommerce")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-200 ${
              scanType === "ecommerce"
                ? "bg-paper shadow-sm text-ink border border-ink/10"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <ShoppingBag size={16} /> E-Commerce Listing
          </button>
        </div>

        {/* ── Toggle 2: Upload / Camera / Video — physical + no demo only ── */}
        {scanType === "physical" && !demoMode && (
          <div className="flex bg-seal-cream border border-ink/10 p-1 rounded-xl mb-4 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => switchToMode("upload")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${
                inputMode === "upload"
                  ? "bg-paper shadow-sm text-ink border border-ink/10"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Upload size={15} /> Upload Photo
            </button>
            {isMobile && (
              <button
                onClick={() => switchToMode("camera")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${
                  inputMode === "camera"
                    ? "bg-paper shadow-sm text-ink border border-ink/10"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <Camera size={15} /> Use Camera
              </button>
            )}
            <button
              onClick={() => switchToMode("video")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${
                inputMode === "video"
                  ? "bg-paper shadow-sm text-ink border border-ink/10"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Camera size={15} /> 360° Video
            </button>
          </div>
        )}

        {/* ── Drop zone / preview ── */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] border-2 border-dashed border-ink/20 hover:border-turmeric rounded-xl bg-seal-cream hover:bg-turmeric/5 transition-all duration-200 relative overflow-hidden mb-5 group">

          {/* E-commerce URL input */}
          {scanType === "ecommerce" && (
            <div className="w-full max-w-md p-6 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-turmeric/10 border border-turmeric/20 flex items-center justify-center">
                <ShoppingBag size={26} className="text-turmeric" />
              </div>
              <h3 className="text-base font-bold font-serif text-ink">E-Commerce Audit</h3>
              <p className="text-sm text-ink-soft leading-relaxed max-w-xs">Screenshot the product listing and use Physical Package mode to audit compliance now. URL-based auditing coming soon.</p>
              <span className="text-[10px] font-bold uppercase tracking-widest text-turmeric bg-turmeric/10 px-3 py-1 rounded-full border border-turmeric/20">Coming Soon</span>
            </div>
          )}

          {/* Demo fixture banner */}
          {scanType === "physical" && demoMode && (
            <div className="text-center p-6">
              <h3 className="text-lg font-bold text-ink mb-1">Demo Fixture Active</h3>
              <p className="text-sm text-ink-soft">Bypassing live camera. Ready for inspection.</p>
            </div>
          )}

          {/* Multi-Panel UI */}
          {scanType === "physical" && !demoMode && scannedSides.length > 0 && (
            <div className="w-full h-full flex flex-col justify-center gap-6 p-4">
              <div className="flex flex-row justify-center gap-4 overflow-x-auto pb-2">
                {scannedSides.map((side, idx) => (
                  <div key={side.id} className="relative flex flex-col items-center gap-2 shrink-0">
                    <div className="relative w-24 h-24">
                      <img src={side.previewUrl} className="w-24 h-24 object-cover rounded-xl border border-ink/10 shadow-sm bg-white" alt={side.label} />
                      <button onClick={() => removeSide(idx)} className="absolute -top-2 -right-2 bg-ink/70 hover:bg-ink text-paper rounded-full p-1 shadow-md transition-colors">
                        <X size={14} />
                      </button>
                      {side.status === 'scanned' && (
                        <div className="absolute -bottom-2 -right-2 bg-sage text-paper rounded-full p-1 shadow-md">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">{side.label}</span>
                  </div>
                ))}
              </div>
              
              {scannedSides.length < 4 && (
                <div className="flex items-center justify-center">
                  <button 
                    onClick={() => {
                      if (inputMode === "camera") cameraInputRef.current?.click();
                      else uploadInputRef.current?.click();
                    }}
                    className="flex items-center gap-2 py-2 px-4 rounded-full border border-ink/20 text-ink hover:bg-ink/5 transition-colors text-xs font-bold uppercase tracking-widest shadow-sm bg-white"
                  >
                    <Camera size={16} /> Add Another Side
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Image/Video preview with clear button (backward compatibility / single mode fallback) */}
          {scanType === "physical" && !demoMode && file && scannedSides.length === 0 && (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 z-10 w-7 h-7 bg-ink/70 hover:bg-ink text-paper rounded-full flex items-center justify-center transition-colors"
                title="Remove image"
              >
                <X size={14} />
              </button>
              <div className="relative max-w-full max-h-full inline-block">
                {file.type.startsWith("video/") ? (
                  <video src={previewUrl} controls className="max-w-full max-h-full object-contain rounded-lg" />
                ) : (
                  <img src={previewUrl} alt="Captured label" className="max-w-full max-h-full object-contain rounded-lg" />
                )}
              </div>
            </div>
          )}
          
          {loading && (scanType === "physical" && !demoMode) && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-20">
              <div className="absolute left-0 w-full h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] animate-[scanline_1.5s_ease-in-out_infinite]" />
              <div className="absolute inset-0 bg-cyan-400/10 animate-pulse" />
            </div>
          )}

          {/* Upload trigger — no file yet, upload mode */}
          {scanType === "physical" && !demoMode && !file && scannedSides.length === 0 && inputMode === "upload" && (
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6">
              <div className="w-16 h-16 rounded-full bg-paper border border-ink/10 text-turmeric flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Upload size={28} />
              </div>
              <span className="text-sm font-bold text-ink group-hover:text-turmeric-deep transition-colors">
                Upload Product Label
              </span>
              <span className="text-xs text-ink-soft mt-1">JPG, PNG, WEBP — up to 10 MB</span>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                className="w-0 h-0 absolute opacity-0 overflow-hidden"
                onChange={handleFileChange}
              />
            </label>
          )}

          {/* Camera trigger — no file yet, camera mode */}
          {scanType === "physical" && !demoMode && !file && scannedSides.length === 0 && inputMode === "camera" && (
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-paper border border-ink/10 text-turmeric flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Camera size={28} />
              </div>
              <span className="text-sm font-bold text-ink group-hover:text-turmeric-deep transition-colors">
                Tap to Open Camera
              </span>
              <span className="text-xs text-ink-soft mt-1">Points at rear camera for label scanning</span>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="w-0 h-0 absolute opacity-0 overflow-hidden"
                onChange={handleFileChange}
              />
            </label>
          )}

          {/* Video trigger — no file yet, video mode */}
          {scanType === "physical" && !demoMode && !file && scannedSides.length === 0 && inputMode === "video" && (
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-paper border border-ink/10 text-turmeric flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Camera size={28} />
              </div>
              <span className="text-sm font-bold text-ink group-hover:text-turmeric-deep transition-colors">
                Record 360° Product Spin
              </span>
              <span className="text-xs text-ink-soft mt-1">Slowly rotate the product in front of the camera (Max 15s)</span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                capture="environment"
                className="w-0 h-0 absolute opacity-0 overflow-hidden"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>

        {/* ── Bottom controls ── */}
        <div className="flex flex-col gap-2">
          {scannedSides.length > 0 && !loading && (
            <div className="flex items-center justify-end mb-2">
              <button onClick={clearAll} className="text-xs font-bold text-terracotta hover:text-red-700 uppercase tracking-widest flex items-center gap-1">
                <X size={12} /> Clear All Sides
              </button>
            </div>
          )}
          <div className="flex items-center justify-end mb-2 mr-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox w-4 h-4 text-turmeric rounded border-ink/20"
                checked={isDeepScan}
                onChange={(e) => setIsDeepScan(e.target.checked)}
              />
              <span className="text-xs font-bold text-ink-soft select-none">Enable Deep Scan Validation</span>
            </label>
          </div>

          <motion.button
            whileTap={{ scale: canScan ? 0.99 : 1 }}
            disabled={loading || !canScan}
            onClick={() => onScan(customOcr, isDeepScan)}
            className="w-full min-h-[48px] bg-ink hover:bg-ink-soft disabled:opacity-60 disabled:cursor-not-allowed text-paper font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <FileScan size={18} className="text-turmeric" />
            {loading 
              ? (scannedSides.length > 1 ? `Analyzing side ${scanProgress.current} of ${scanProgress.total}...` : "Analyzing...") 
              : "Execute Compliance Scan"}
          </motion.button>

          {!canScan && (
            <p className="text-center text-[12px] italic text-ink-soft mt-1">
              {inputMode === "camera"
                ? "Tap 'Use Camera' above, capture label, then scan"
                : "Upload a product label to start scan"}
            </p>
          )}

          <button
            onClick={() => setShowOcrInput(!showOcrInput)}
            className="text-xs font-bold text-ink-soft hover:text-ink transition-colors min-h-[32px] flex items-center justify-center gap-1 mt-1"
          >
            <Eye size={14} /> Manual OCR Override
          </button>
        </div>

        <AnimatePresence>
          {showOcrInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <textarea
                rows={3}
                className="w-full bg-white border border-slate-200 text-slate-900 font-mono text-xs p-3 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                placeholder="Enter extracted label text..."
                value={customOcr}
                onChange={(e) => setCustomOcr(e.target.value)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Always-present hidden input for Guided Rescan — never conditionally rendered */}
        <input
          ref={rescanInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </motion.div>

      {/* Guided Rescan Panel */}
      <AnimatePresence>
        {scanPhase === "complete" && missingFields.length > 0 && !demoMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="theme-bright-card p-5 border border-terracotta/30 flex flex-col gap-4 shadow-lg"
          >
            <h3 className="text-base font-bold font-serif text-terracotta">
              🔍 Missing declarations detected
            </h3>
            
            <div className="flex flex-col gap-3">
              {missingFields.map((f, i) => (
                <div key={i} className="flex items-start gap-2 bg-paper p-3 rounded-xl border border-ink/5">
                  <div className="text-terracotta shrink-0 mt-0.5"><XCircle size={16} /></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-ink">{f.label}</span>
                    <span className="text-xs text-ink-soft">{f.hint}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => { if (rescanInputRef.current) rescanInputRef.current.click(); }}
                className="w-full py-3 bg-terracotta text-paper font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-terracotta/90 transition-colors"
              >
                <Camera size={18} /> Scan Another Side
              </motion.button>
              
              <button
                onClick={() => setScanPhase("idle")}
                className="text-xs font-bold text-ink-soft hover:text-ink py-2"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
