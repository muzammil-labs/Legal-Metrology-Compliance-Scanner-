import React, { useState } from "react";
import { Upload, FileScan, Eye, Package, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CameraScanner({ file, setFile, demoMode, loading, message, onScan }) {
  const [showOcrInput, setShowOcrInput] = useState(false);
  const [customOcr, setCustomOcr] = useState("");
  const [scanType, setScanType] = useState("physical");
  const [isDeepScan, setIsDeepScan] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="theme-bright-card p-6 flex flex-col w-full max-w-full">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-ink/10">
        <h2 className="text-lg font-bold font-serif text-ink flex items-center gap-2">
          <FileScan className="text-turmeric shrink-0" size={20} /> Verification Engine
        </h2>
        <span className="text-[10px] font-bold tracking-widest text-sage bg-sage/10 border border-sage/20 px-2 py-1 rounded-md uppercase">SYSTEM ONLINE</span>
      </div>

      <div className="flex bg-seal-cream border border-ink/10 p-1 rounded-xl mb-5">
        <button
          onClick={() => setScanType("physical")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-200 ease-in-out ${
            scanType === "physical"
              ? "bg-paper shadow-sm text-ink border border-ink/10"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          <Package size={16} /> Physical Package
        </button>
        <button
          onClick={() => setScanType("ecommerce")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-200 ease-in-out ${
            scanType === "ecommerce"
              ? "bg-paper shadow-sm text-ink border border-ink/10"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          <ShoppingBag size={16} /> E-Commerce Listing
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] border-2 border-dashed border-ink/20 hover:border-turmeric active:border-turmeric-deep rounded-xl bg-seal-cream hover:bg-turmeric/5 active:scale-[0.98] transition-all duration-200 relative overflow-hidden mb-5 group cursor-pointer">
        {scanType === "ecommerce" ? (
           <div className="w-full max-w-md p-6 flex flex-col gap-4">
             <h3 className="text-lg font-bold text-ink mb-1 text-center">Analyze E-Commerce Listing</h3>
             <p className="text-sm text-ink-soft text-center mb-2">Paste a product URL from Flipkart, Amazon, or JioMart to run a comprehensive metadata audit.</p>
             <input type="url" placeholder="https://amazon.in/dp/B08XXYZ..." className="w-full bg-white border border-slate-200 text-slate-900 text-sm p-3 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" value={customOcr} onChange={(e) => setCustomOcr(e.target.value)} />
           </div>
        ) : demoMode ? (
          <div className="text-center p-6"><h3 className="text-lg font-bold text-ink mb-1">Demo Fixture Active</h3><p className="text-sm text-ink-soft">Bypassing live camera. Ready for inspection.</p></div>
        ) : file ? (
          <>
            <img src={URL.createObjectURL(file)} alt="Captured label" className="absolute inset-0 w-full h-full object-contain p-2" />
            {loading && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.9)] animate-[scanline_1.2s_linear_infinite]" />
                <div className="absolute inset-0 bg-cyan-400/10 animate-pulse" />
              </div>
            )}
          </>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6">
            <div className="w-16 h-16 rounded-full bg-paper border border-ink/10 text-turmeric flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <Upload size={28} />
            </div>
            <span className="text-sm font-bold text-ink group-hover:text-turmeric-deep transition-colors">Upload Product Label</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
          </label>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-end mb-2 mr-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="form-checkbox w-4 h-4 text-turmeric rounded border-ink/20" checked={isDeepScan} onChange={(e) => setIsDeepScan(e.target.checked)} />
            <span className="text-xs font-bold text-ink-soft select-none">Enable Deep Scan Validation</span>
          </label>
        </div>
        <motion.button whileTap={{ scale: (!file && !demoMode && !customOcr) ? 1 : 0.99 }} disabled={loading || (!file && !demoMode && !customOcr)} onClick={() => onScan(customOcr, isDeepScan)}
          className="w-full min-h-[48px] bg-ink hover:bg-ink-soft disabled:opacity-60 disabled:cursor-not-allowed text-paper font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
          <FileScan size={18} className="text-turmeric" /> {loading ? "Analyzing..." : "Execute Compliance Scan"}
        </motion.button>
        {(!file && !demoMode && !customOcr) && (
          <p className="text-center text-[12px] italic text-ink-soft mt-1">Upload a product label to start scan</p>
        )}
        <button onClick={() => setShowOcrInput(!showOcrInput)} className="text-xs font-bold text-ink-soft hover:text-ink transition-colors min-h-[32px] flex items-center justify-center gap-1 mt-1"><Eye size={14}/> Manual OCR Override</button>
      </div>

      <AnimatePresence>
        {showOcrInput && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
            <textarea rows={3} className="w-full bg-white border border-slate-200 text-slate-900 font-mono text-xs p-3 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" placeholder="Enter extracted label text..." value={customOcr} onChange={(e) => setCustomOcr(e.target.value)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
