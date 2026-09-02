import React, { useState } from "react";
import { Store, Upload, CheckCircle2, AlertTriangle, QrCode, ShieldCheck, Download, Sparkles, Box, ListChecks } from "lucide-react";
import { executeBatchScan } from "../services/api";
import BatchAuditModal from "./BatchAuditModal";

export default function SellerBulkAudit() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  return (
    <section className="animate-fade-in-up pb-12 w-full overflow-x-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Store size={14} /></span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase">Enterprise Seller Hub</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Catalogue Compliance Engine</h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-lg leading-relaxed">High-throughput pre-listing audit and Trust Badge issuance for digital marketplaces.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upload Card */}
        <div className="theme-bright-card p-6 flex flex-col justify-between relative overflow-hidden group h-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
          
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Box className="text-blue-500" size={20} /> Batch Catalogue Ingestion
              </h3>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md tracking-wider border border-slate-200 uppercase">
                {files.length} SKUs Ready
              </span>
            </div>

            <button 
              onClick={() => setIsBatchModalOpen(true)}
              className="w-full relative group/dropzone rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition-all duration-300 p-10 flex flex-col items-center justify-center text-center gap-3"
            >
              <div className="p-4 bg-white rounded-full shadow-sm group-hover/dropzone:shadow-md group-hover/dropzone:scale-110 transition-all duration-300 text-slate-400 group-hover/dropzone:text-blue-500 mb-2">
                <Upload size={32} />
              </div>
              <strong className="text-slate-900 font-bold group-hover/dropzone:text-blue-700 transition-colors">Select Product Labels (ZIP/CSV)</strong>
              <span className="text-xs text-slate-500 font-medium max-w-xs">Upload bulk catalogue imagery for high-speed automated compliance screening.</span>
            </button>
          </div>

          <button
            className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-black hover:shadow-lg active:scale-95 transition-all"
            onClick={() => setIsBatchModalOpen(true)}
          >
            <ListChecks size={18} /> Launch High-Throughput Batch Audit
          </button>
        </div>

        {/* Verified Badge Generator Card */}
        <div className="theme-bright-card p-6 flex flex-col relative overflow-hidden group h-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" size={20} /> Trust Badge Generator
            </h3>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md tracking-wider border border-emerald-200 uppercase flex items-center gap-1">
              <Sparkles size={12} /> DOCA Verified
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex-1 flex flex-col items-center justify-center text-center">
            
            {/* The Badge */}
            <div className="flex items-center gap-4 bg-white border border-emerald-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-4 sm:p-5 w-full max-w-sm mx-auto animate-float">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0"><ShieldCheck size={32} /></div>
              <div className="flex-1 text-left min-w-0">
                <strong className="block text-slate-900 font-black text-sm mb-0.5 truncate">Legal Metrology Compliant</strong>
                <span className="block text-emerald-600 font-bold text-[10px] uppercase tracking-wider mb-1">PCR 2011 Verified</span>
                <span className="block text-slate-400 font-mono text-[9px]">ID: LM-CERT-2026</span>
              </div>
              <div className="p-2 border border-slate-100 bg-slate-50 rounded-lg shrink-0 text-slate-400"><QrCode size={28} /></div>
            </div>

            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto mt-6 leading-relaxed">
              Embed this cryptographically verifiable SVG trust badge into your Amazon or Flipkart listings to boost buyer conversion and demonstrate statutory compliance.
            </p>

            <div className="mt-6 w-full max-w-sm mx-auto text-left relative group/code">
              <span className="absolute -top-2.5 left-3 bg-slate-50 px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest z-10">HTML Embed Code</span>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-inner relative overflow-hidden">
                <code className="text-xs font-mono text-blue-300 break-all leading-loose">
                  &lt;img src="https://metrology.doca.gov.in/badge/LM-2026.svg" alt="Legal Metrology Compliant" /&gt;
                </code>
              </div>
            </div>

          </div>
        </div>
      </div>

      <BatchAuditModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} />
    </section>
  );
}
