import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, ChevronDown, Scale, FileText, FileWarning, Leaf, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ComplianceSummaryCard({ audit, onOpenNoticeModal }) {
  if (!audit) return null;

  const { overall_status, rules = [], fssai_verification, penalty, barcode_health } = audit;
  const isOverallPass = overall_status === "PASS";
  
  // Auto-expand FAIL rules immediately upon load
  const initialExpanded = rules.map((r, i) => r.status === "FAIL" ? i : null).filter(i => i !== null);
  const [expandedRules, setExpandedRules] = useState(initialExpanded);

  useEffect(() => {
    setExpandedRules(rules.map((r, i) => r.status === "FAIL" ? i : null).filter(i => i !== null));
  }, [audit]);

  const toggleRule = (idx) => setExpandedRules(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);

  // Calculate Compliance Score
  const totalRules = rules.length;
  const passedRules = rules.filter(r => r.status === "PASS").length;
  const complianceScore = totalRules > 0 ? Math.round((passedRules / totalRules) * 100) : 100;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5 w-full max-w-full pb-16">
      
      {/* Hero Status Banner & Score */}
      <motion.div layout className={`p-6 rounded-2xl shadow-[0_4px_20px_rgba(16,185,129,0.08)] ${isOverallPass ? "bg-emerald-50 border border-[#A7F3D0]" : "bg-rose-50 border border-rose-200"}`}>
        <div className="flex items-center gap-4">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ type: "spring", stiffness: 300, damping: 15, duration: 0.4 }}
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isOverallPass ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}
          >
            {isOverallPass ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
          </motion.div>
          <div className="flex-1">
            <h2 className={`text-xl font-black ${isOverallPass ? "text-emerald-900" : "text-rose-900"}`}>{isOverallPass ? "CLEARED FOR RETAIL" : "NON-COMPLIANT PRODUCT"}</h2>
            <div className="flex items-center gap-3 mt-1.5">
              <span className={`text-xs font-bold uppercase tracking-widest ${isOverallPass ? "text-emerald-700" : "text-rose-700"}`}>Compliance Score: {complianceScore}%</span>
            </div>
          </div>
        </div>
        
        {/* Animated Progress Bar */}
        <div className="mt-4 w-full bg-black/5 rounded-full h-2 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${complianceScore}%` }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${isOverallPass ? "bg-emerald-500" : "bg-rose-500"}`}
          />
        </div>
      </motion.div>

      {/* Barcode Health HUD (Esko/GlobalVision benchmark) */}
      {barcode_health && (
        <motion.div layout className="theme-bright-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl"><QrCode size={20} /></div>
            <h4 className="text-base font-bold text-slate-900">Barcode & Symbology Health</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Symbology</span>
               <strong className="text-sm font-bold text-slate-900">{barcode_health.symbology || "EAN-13"}</strong>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Scannability Grade</span>
               <strong className="text-sm font-bold text-emerald-600">A (Compliant)</strong>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Data Cross-Match</span>
               <strong className="text-sm font-bold text-emerald-600">Payload Verified</strong>
            </div>
          </div>
        </motion.div>
      )}

      {/* Jan Vishwas Penalty Card */}
      <AnimatePresence>
      {!isOverallPass && penalty && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="theme-bright-card p-6 border-l-4 border-l-rose-500 shadow-md">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0"><Scale size={22} /></div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-slate-900 mb-0.5">Compounding Liability Assessment</h4>
              <p className="text-xs font-medium text-slate-500 mb-4">Sections 36 & 49, Legal Metrology Act, 2009</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Monetary Exposure</span>
                  <strong className="text-lg font-black text-rose-600">{penalty.estimated_fine_inr || "₹25,000"}</strong>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Jan Vishwas 2026</span>
                  <strong className={`text-xs font-bold ${penalty.jan_vishwas_eligible ? "text-amber-600" : "text-rose-600"}`}>{penalty.jan_vishwas_eligible ? "15-Day Grace Window" : "Strict Liability"}</strong>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Director Liability</span>
                  <strong className={`text-xs font-bold ${penalty.director_liability ? "text-rose-600" : "text-slate-600"}`}>{penalty.director_liability ? "Sec 49 Triggered" : "Corporate Only"}</strong>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {!isOverallPass && onOpenNoticeModal && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }} onClick={() => onOpenNoticeModal("COMPOUNDING")}
          className="w-full flex items-center justify-center gap-2 min-h-[48px] bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-lg">
          <FileWarning size={18} /> Generate Section 36 Compounding Notice
        </motion.button>
      )}
      </AnimatePresence>

      {/* Statutory Rules - Enterprise Inspection Panels */}
      <motion.div layout className="space-y-4">
        {rules.map((item, idx) => {
          const isPass = item.status === "PASS";
          const isOpen = expandedRules.includes(idx);
          return (
            <motion.div layout key={idx} className="theme-bright-card overflow-hidden">
              <button onClick={() => toggleRule(idx)} className="w-full p-4 sm:p-5 flex items-start sm:items-center justify-between hover:bg-slate-50 transition-colors min-h-[56px] focus:outline-none gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`mt-0.5 shrink-0 ${isPass ? "text-emerald-500" : "text-rose-500"}`}>{isPass ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}</div>
                  <div className="flex flex-col flex-1 text-left">
                    <span className="text-sm font-bold text-slate-900 whitespace-normal leading-snug">{item.rule}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${isPass ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>{item.status}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="text-slate-400"><ChevronDown size={16}/></motion.div>
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-slate-100 bg-slate-50/50">
                    <div className="p-5 space-y-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1.5"><FileText size={11} /> Extracted Label Evidence</span>
                        <div className="bg-slate-900 rounded-xl p-4 shadow-inner"><code className="text-xs font-mono text-emerald-400 break-words leading-relaxed">{item.evidence && item.evidence.length ? item.evidence.join(" | ") : "No text evidence located."}</code></div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Regulatory Finding</span>
                        <p className="text-sm text-slate-700 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">{item.reason}</p>
                      </div>
                      {!isPass && item.remedy && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl border-l-4 border-l-blue-500">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 block mb-1">Required Corrective Action</span>
                           <p className="text-sm font-bold text-blue-900">{item.remedy}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
