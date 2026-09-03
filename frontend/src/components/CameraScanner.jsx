import React, { useState, useRef } from "react";
import { Upload, Camera, FileScan, Eye, Package, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CameraScanner({ file, setFile, demoMode, loading, message, onScan }) {
  const [showOcrInput, setShowOcrInput] = useState(false);
  const [customOcr, setCustomOcr] = useState("");
  const [scanType, setScanType] = useState("physical");
  const [isDeepScan, setIsDeepScan] = useState(false);
  const [inputMode, setInputMode] = useState("upload"); // "upload" | "camera"
  const [isMobile, setIsMobile] = useState(true);

  React.useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f) setFile(f);
    // reset so the same file can be picked again
    e.target.value = "";
  }

  function clearFile() {
    setFile(null);
  }

  function switchToMode(mode) {
    setInputMode(mode);
    clearFile();
  }

  const previewUrl = file ? URL.createObjectURL(file) : null;
  const canScan = file || demoMode || customOcr;

  return (
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
        <span className="text-[10px] font-bold tracking-widest text-sage bg-sage/10 border border-sage/20 px-2 py-1 rounded-md uppercase">
          SYSTEM ONLINE
        </span>
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

      {/* ── Toggle 2: Upload / Camera — physical + no demo only ── */}
      {scanType === "physical" && !demoMode && isMobile && (
        <div className="flex bg-seal-cream border border-ink/10 p-1 rounded-xl mb-4">
          <button
            onClick={() => switchToMode("upload")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-bold rounded-lg transition-all duration-200 ${
              inputMode === "upload"
                ? "bg-paper shadow-sm text-ink border border-ink/10"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Upload size={15} /> Upload Photo
          </button>
          <button
            onClick={() => switchToMode("camera")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-bold rounded-lg transition-all duration-200 ${
              inputMode === "camera"
                ? "bg-paper shadow-sm text-ink border border-ink/10"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Camera size={15} /> Use Camera
          </button>
        </div>
      )}

      {/* ── Drop zone / preview ── */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] border-2 border-dashed border-ink/20 hover:border-turmeric rounded-xl bg-seal-cream hover:bg-turmeric/5 transition-all duration-200 relative overflow-hidden mb-5 group">

        {/* E-commerce URL input */}
        {scanType === "ecommerce" && (
          <div className="w-full max-w-md p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-ink mb-1 text-center">Analyze E-Commerce Listing</h3>
            <p className="text-sm text-ink-soft text-center mb-2">
              Paste a product URL from Flipkart, Amazon, or JioMart to run a comprehensive metadata audit.
            </p>
            <input
              type="url"
              placeholder="https://amazon.in/dp/B08XXYZ..."
              className="w-full bg-white border border-slate-200 text-slate-900 text-sm p-3 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
              value={customOcr}
              onChange={(e) => setCustomOcr(e.target.value)}
            />
          </div>
        )}

        {/* Demo fixture banner */}
        {scanType === "physical" && demoMode && (
          <div className="text-center p-6">
            <h3 className="text-lg font-bold text-ink mb-1">Demo Fixture Active</h3>
            <p className="text-sm text-ink-soft">Bypassing live camera. Ready for inspection.</p>
          </div>
        )}

        {/* Image preview with clear button */}
        {scanType === "physical" && !demoMode && file && (
          <div className="relative w-full h-full flex items-center justify-center p-2">
            {/* × clear button */}
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 z-10 w-7 h-7 bg-ink/70 hover:bg-ink text-paper rounded-full flex items-center justify-center transition-colors"
              title="Remove image"
            >
              <X size={14} />
            </button>
            <div className="relative max-w-full max-h-full inline-block">
              <img
                src={previewUrl}
                alt="Captured label"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              {loading && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                  <div className="absolute left-0 w-full h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] animate-[scanline_1.5s_ease-in-out_infinite]" />
                  <div className="absolute inset-0 bg-cyan-400/10 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload trigger — no file yet, upload mode */}
        {scanType === "physical" && !demoMode && !file && inputMode === "upload" && (
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6">
            <div className="w-16 h-16 rounded-full bg-paper border border-ink/10 text-turmeric flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <Upload size={28} />
            </div>
            <span className="text-sm font-bold text-ink group-hover:text-turmeric-deep transition-colors">
              Upload Product Label
            </span>
            <span className="text-xs text-ink-soft mt-1">JPG, PNG, WEBP — up to 10 MB</span>
            {/*
              NO capture attribute here — opens gallery / file picker on mobile.
              This is intentional. Do not add capture="environment".
            */}
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
        {scanType === "physical" && !demoMode && !file && inputMode === "camera" && (
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6">
            <div className="w-16 h-16 rounded-full bg-paper border border-ink/10 text-turmeric flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <Camera size={28} />
            </div>
            <span className="text-sm font-bold text-ink group-hover:text-turmeric-deep transition-colors">
              Tap to Open Camera
            </span>
            <span className="text-xs text-ink-soft mt-1">Points at rear camera for label scanning</span>
            {/*
              capture="environment" is what forces the OS camera app on mobile.
              MUST stay on this input. Do not remove it.
            */}
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
      </div>

      {/* ── Bottom controls ── */}
      <div className="flex flex-col gap-2">
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
          {loading ? "Analyzing..." : "Execute Compliance Scan"}
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
    </motion.div>
  );
}
