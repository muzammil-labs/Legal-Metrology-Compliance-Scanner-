import React, { useState } from "react";
import { Upload, FileScan, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CameraScanner({ file, setFile, demoMode, loading, message, onScan }) {
  const [showOcrInput, setShowOcrInput] = useState(false);
  const [customOcr, setCustomOcr] = useState("");

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="theme-bright-card p-6 flex flex-col w-full max-w-full">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileScan className="text-blue-600 shrink-0" size={20} /> Metrology Verification Engine
        </h2>
        <span className="text-[10px] font-bold tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md uppercase">SYSTEM ONLINE</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 relative overflow-hidden mb-5">
        {demoMode ? (
          <div className="text-center p-6"><h3 className="text-lg font-bold text-slate-900 mb-1">Demo Fixture Active</h3><p className="text-sm text-slate-500">Bypassing live camera. Ready for inspection.</p></div>
        ) : file ? (
          <img src={URL.createObjectURL(file)} alt="Captured label" className="absolute inset-0 w-full h-full object-contain p-2" />
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-slate-100 transition-colors p-6">
            <Upload size={32} className="text-slate-400 mb-3" />
            <span className="text-sm font-bold text-slate-700">Upload Product Label</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
          </label>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <motion.button whileTap={{ scale: 0.98 }} disabled={loading || (!file && !demoMode && !customOcr)} onClick={() => onScan(customOcr)}
          className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
          <FileScan size={18} /> {loading ? "Analyzing..." : "Execute Compliance Scan"}
        </motion.button>
        <button onClick={() => setShowOcrInput(!showOcrInput)} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors min-h-[32px] flex items-center justify-center gap-1"><Eye size={14}/> Manual OCR Override</button>
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
