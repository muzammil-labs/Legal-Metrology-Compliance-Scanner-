import React, { useState } from "react";
import { Upload, FileScan, Eye, Package, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CameraScanner({ file, setFile, demoMode, loading, message, onScan }) {
  const [showOcrInput, setShowOcrInput] = useState(false);
  const [customOcr, setCustomOcr] = useState("");
  const [scanType, setScanType] = useState("physical");

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="theme-bright-card p-6 flex flex-col w-full max-w-full">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileScan className="text-blue-600 shrink-0" size={20} /> Metrology Verification Engine
        </h2>
        <span className="text-[10px] font-bold tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md uppercase">SYSTEM ONLINE</span>
      </div>

      <div className="flex bg-[#F1F5F9] border border-[#E2E8F0] p-1 rounded-xl mb-5">
        <button
          onClick={() => setScanType("physical")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-200 ease-in-out ${
            scanType === "physical"
              ? "bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] text-[#1D4ED8] border border-[#3B82F6]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Package size={16} /> Physical Package
        </button>
        <button
          onClick={() => setScanType("ecommerce")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-200 ease-in-out ${
            scanType === "ecommerce"
              ? "bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] text-[#1D4ED8] border border-[#3B82F6]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ShoppingBag size={16} /> E-Commerce Listing
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] border-2 border-dashed border-[#CBD5E1] hover:border-blue-500 active:border-blue-600 rounded-xl bg-slate-50 hover:bg-blue-50/20 active:scale-[0.98] transition-all duration-200 relative overflow-hidden mb-5 group cursor-pointer">
        {demoMode ? (
          <div className="text-center p-6"><h3 className="text-lg font-bold text-slate-900 mb-1">Demo Fixture Active</h3><p className="text-sm text-slate-500">Bypassing live camera. Ready for inspection.</p></div>
        ) : file ? (
          <img src={URL.createObjectURL(file)} alt="Captured label" className="absolute inset-0 w-full h-full object-contain p-2" />
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6">
            <div className="w-16 h-16 rounded-full bg-blue-100/50 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload size={28} />
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">Upload Product Label</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
          </label>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <motion.button whileTap={{ scale: (!file && !demoMode && !customOcr) ? 1 : 0.99 }} disabled={loading || (!file && !demoMode && !customOcr)} onClick={() => onScan(customOcr)}
          className="w-full min-h-[48px] bg-[#1D4ED8] hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-[0_4px_12px_rgba(29,78,216,0.25)] flex items-center justify-center gap-2">
          <FileScan size={18} /> {loading ? "Analyzing..." : "Execute Compliance Scan"}
        </motion.button>
        {(!file && !demoMode && !customOcr) && (
          <p className="text-center text-[12px] italic text-slate-400 mt-1">Upload a product label to start scan</p>
        )}
        <button onClick={() => setShowOcrInput(!showOcrInput)} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors min-h-[32px] flex items-center justify-center gap-1 mt-1"><Eye size={14}/> Manual OCR Override</button>
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
