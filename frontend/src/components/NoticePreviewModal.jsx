import React, { useEffect } from "react";
import {
  X,
  FileDown,
  ShieldCheck,
  MapPin,
  Hash,
  AlertTriangle,
  Lock
} from "lucide-react";
import { getNoticeDownloadUrl } from "../services/api";

export default function NoticePreviewModal({ isOpen, onClose, audit }) {
  // Support escape key to close
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
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 flex justify-end ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md h-full bg-zinc-900/95 border-l border-zinc-800 p-6 flex flex-col gap-6 shadow-[-4px_0_24px_rgba(0,0,0,0.1)] transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        onClick={(e) => e.stopPropagation()}
        style={{ color: "#f4f4f5" }}
      >
        <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
          <div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-semibold uppercase tracking-wider mb-3 ${isFail ? (isSevere ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]') : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
              {isFail ? (
                 isSevere ? <><AlertTriangle size={13} /> [COMPOUNDING PENALTY DEMAND NOTICE]</> : <><ShieldCheck size={13} /> [IMPROVEMENT NOTICE — 15-DAY GRACE WINDOW]</>
              ) : (
                <><ShieldCheck size={13} /> COMPLIANT NOTICE</>
              )}
            </div>
            <h3 className="m-0 text-xl font-semibold text-zinc-100">Section 36 Inspection Notice</h3>
            <p className="m-0 text-[13px] text-zinc-400 font-mono mt-1">Issued under Section 36, Legal Metrology Act, 2009</p>
          </div>
          <button
            className="bg-transparent border-0 text-zinc-400 cursor-pointer p-2 rounded-md hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cryptographic Hash Banner */}
        <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-lg flex flex-col gap-2 relative">
           <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Lock size={14} /> SHA-256 Digital Signature Hash (Sec 65B)
           </div>
           <code className="text-[11px] text-emerald-200/80 break-all font-mono">
             {sha256}
           </code>
           <button
              onClick={copyHashToClipboard}
              className="absolute top-3 right-3 bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:text-white px-2 py-1 rounded text-[10px] font-mono cursor-pointer transition-colors"
            >
              COPY
           </button>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-zinc-950/50 p-4 border border-zinc-800 rounded-lg">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              <Hash size={12} /> Dossier ID
            </span>
            <strong className="text-[13px] font-mono text-zinc-200">{certNumber}</strong>
          </div>
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              <MapPin size={12} /> Jurisdiction GPS
            </span>
            <strong className="text-[13px] text-zinc-200">
              {audit.metadata?.gps_location || "28.6139° N, 77.2090° E"}
            </strong>
          </div>
        </div>

        <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden min-h-[300px] relative">
          <iframe
            src={downloadUrl}
            title="Notice PDF Preview"
            className="w-full h-full border-0 absolute inset-0"
          />
        </div>

        <div className="flex gap-4 mt-auto pt-4 border-t border-zinc-800">
          <button
            className="flex-1 bg-transparent border border-zinc-700 text-zinc-300 py-3 px-4 rounded-lg font-medium text-[13px] cursor-pointer hover:bg-zinc-800 transition-colors min-h-[48px] active:scale-[0.98]"
            onClick={onClose}
          >
            Close Drawer
          </button>
          <a
            href={downloadUrl}
            className="flex-[2] flex items-center justify-center gap-2 bg-cyan-600 text-white py-3 px-4 rounded-lg font-semibold text-[13px] no-underline cursor-pointer hover:bg-cyan-500 transition-colors min-h-[48px] active:scale-[0.98]"
            download
          >
            <FileDown size={16} /> Download Court-Admissible Notice (PDF)
          </a>
        </div>
      </div>
    </div>
  );
}
