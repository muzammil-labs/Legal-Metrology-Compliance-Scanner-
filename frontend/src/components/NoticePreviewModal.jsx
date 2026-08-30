import React, { useEffect, useState } from "react";
import {
  X,
  FileDown,
  ShieldCheck,
  MapPin,
  Hash,
  AlertTriangle,
  Lock,
  Copy,
  CheckCircle2
} from "lucide-react";
import { getNoticeDownloadUrl } from "../services/api";

export default function NoticePreviewModal({ isOpen, onClose, audit }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !audit) return null;

  const inspectionId = audit.metadata?.inspection_id || 1;
  const downloadUrl = getNoticeDownloadUrl(inspectionId);
  const certNumber = `LM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(inspectionId).padStart(6, "0")}`;
  const sha256 = audit.metadata?.sha256 || "0".repeat(64);
  const isFail = audit.overall_status === "FAIL";

  // Logic for dual notice badges based on severity/violation count
  const violationCount = audit.rules?.filter(r => r.status === "FAIL").length || 0;
  const isSevere = violationCount >= 2;

  const copyHashToClipboard = () => {
    navigator.clipboard.writeText(sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 flex justify-end ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={onClose}
    >
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-slate-900/95 border-l border-slate-800 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        onClick={(e) => e.stopPropagation()}
        style={{ color: "#f4f4f5" }}
      >
        <div className="flex flex-col gap-6">
          {/* Header Section */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-6">
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider mb-4 transition-all ${isFail ? (isSevere ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(225,29,72,0.2)]' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]') : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'}`}>
                {isFail ? (
                   isSevere ? (
                     <>
                       <div className="relative flex h-2 w-2 mr-1">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                       </div>
                       [SECTION 36 COMPOUNDING PENALTY DEMAND NOTICE]
                     </>
                   ) : (
                     <>
                       <div className="relative flex h-2 w-2 mr-1">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                       </div>
                       [SECTION 36 IMPROVEMENT NOTICE — 15-DAY GRACE PERIOD]
                     </>
                   )
                ) : (
                  <><CheckCircle2 size={14} className="mr-1"/> COMPLIANT AUDIT DOSSIER</>
                )}
              </div>
              <h3 className="m-0 text-3xl font-extrabold text-slate-100 tracking-tight">Section 36 Inspection Notice</h3>
              <p className="m-0 text-sm text-slate-400 font-mono mt-2">Issued under Section 36, Legal Metrology Act, 2009</p>
            </div>
            <button
              className="bg-slate-800/80 border border-slate-700 text-slate-400 cursor-pointer p-2.5 rounded-xl hover:bg-slate-700 hover:text-slate-100 transition-all active:scale-[0.95]"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Dossier Meta Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 backdrop-blur-xl p-5 border border-slate-800/80 rounded-2xl shadow-lg">
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                <Hash size={14} className="text-cyan-500" /> Dossier ID
              </span>
              <strong className="text-base font-mono text-slate-200">{certNumber}</strong>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                <MapPin size={14} className="text-cyan-500" /> Jurisdiction GPS
              </span>
              <strong className="text-sm font-mono text-slate-200">
                {audit.metadata?.gps_location || "28.6139° N, 77.2090° E"}
              </strong>
            </div>
          </div>

          {/* Cryptographic Hash Banner */}
          <div className="bg-emerald-950/20 border border-emerald-900/40 p-5 rounded-2xl flex flex-col gap-3 relative shadow-inner">
             <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-bold uppercase tracking-widest">
                <Lock size={15} /> SHA-256 Digital Signature Hash (Sec 65B)
             </div>
             <code className="text-xs text-emerald-200/80 break-all font-mono leading-relaxed bg-emerald-950/50 p-3.5 rounded-xl border border-emerald-900/30">
               {sha256}
             </code>
             <button
                onClick={copyHashToClipboard}
                className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-[0.95]"
              >
                {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied ? "COPIED" : "COPY HASH"}
             </button>
          </div>

          {/* PDF Viewer Container */}
          <div className="relative w-full h-[580px] rounded-xl border border-slate-800 bg-slate-950 shadow-inner overflow-hidden my-4">
            {/* The iframe serves the generated PDF via the API route */}
            <iframe
              src={downloadUrl}
              title="Notice PDF Preview"
              className="w-full h-full border-0 absolute inset-0"
            />
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="flex gap-4 mt-8 pt-6 border-t border-slate-800 sticky bottom-0 bg-slate-900/95 backdrop-blur-md">
          <button
            className="flex-[1] bg-slate-800 border border-slate-700 text-slate-300 py-3.5 px-5 rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-700 hover:text-white transition-all min-h-[52px] active:scale-[0.98] shadow-sm"
            onClick={onClose}
          >
            Close Drawer
          </button>
          <a
            href={downloadUrl}
            className="flex-[2] flex items-center justify-center gap-2.5 bg-cyan-600 text-white border border-cyan-500 py-3.5 px-5 rounded-xl font-bold text-sm no-underline cursor-pointer hover:bg-cyan-500 transition-all min-h-[52px] active:scale-[0.98] shadow-[0_0_20px_rgba(6,182,212,0.2)]"
            download
          >
            <FileDown size={18} /> Download Official Notice (PDF)
          </a>
        </div>
      </div>
    </div>
  );
}
