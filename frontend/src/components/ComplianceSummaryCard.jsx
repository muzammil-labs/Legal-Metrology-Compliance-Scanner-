import React, { useState, useEffect } from "react";
import {
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Scale, FileText, FileWarning, Leaf
} from "lucide-react";

const RULE_LABELS = {
  "Rule 6(1)(a)": "Rule 6(1)(a) — Manufacturer / Packer Details",
  "Rule 6(1)(b)": "Rule 6(1)(b) — Generic / Common Name",
  "Rule 6(1)(c)": "Rule 6(1)(c) — Net Quantity Declaration",
  "Rule 6(1)(d)": "Rule 6(1)(d) — Manufacture / Import Date",
  "Rule 6(1)(e)": "Rule 6(1)(e) — Maximum Retail Price (MRP)",
  "Rule 6(1)(f)": "Rule 6(1)(f) — Consumer Care Information",
  "Rule 6(11)": "Rule 6(11) — Unit Sale Price (USP)",
  "Rule 5/9 (Font / PDP)": "Rule 5 / 9 — Principal Display Panel & Font Size",
};

function getHumanTitle(rawRule) {
  return RULE_LABELS[rawRule] || rawRule.replace(/_/g, " ");
}

export default function ComplianceSummaryCard({ audit, onOpenNoticeModal }) {
  if (!audit) return null;

  const {
    overall_status = "PASS",
    rules = [],
    penalty = null,
    fssai_verification = null,
    trust_score = null,
  } = audit;

  const isOverallPass = overall_status === "PASS";
  const [expandedRules, setExpandedRules] = useState([]);

  useEffect(() => {
    const failIndices = rules.map((r, idx) => (r.status === "FAIL" ? idx : null)).filter((idx) => idx !== null);
    setExpandedRules(failIndices);
  }, [rules]);

  const toggleRule = (idx) => {
    setExpandedRules((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]);
  };

  const passCount = rules.filter((r) => r.status === "PASS").length;
  const complianceRate = rules.length ? Math.round((passCount / rules.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 w-full max-w-full overflow-x-hidden pb-16">

      {/* Hero Status Banner */}
      <div className={`p-6 sm:p-8 rounded-2xl border ${isOverallPass ? "bg-emerald-50 border-emerald-200/80" : "bg-rose-50 border-rose-200/80"}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${isOverallPass ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
              {isOverallPass ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-widest block mb-0.5 ${isOverallPass ? "text-emerald-700" : "text-rose-700"}`}>Statutory Determination</span>
              <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${isOverallPass ? "text-emerald-900" : "text-rose-900"}`}>
                {isOverallPass ? "COMPLIANT" : "NON-COMPLIANT"}
              </h3>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm w-full sm:w-auto sm:min-w-[200px]">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>Compliance Score</span><span>{complianceRate}%</span>
            </div>
            <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${isOverallPass ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${complianceRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Jan Vishwas Penalty Card */}
      {!isOverallPass && (
        <div className="theme-bright-card p-5 sm:p-6 border-l-4 border-l-rose-500">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0"><Scale size={22} /></div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-slate-900 mb-0.5">Compounding Liability Assessment</h4>
              <p className="text-xs font-medium text-slate-500 mb-4">Sections 36 & 49, Legal Metrology Act, 2009</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Est. Monetary Exposure</span>
                  <strong className="text-lg font-black text-rose-600">{penalty?.estimated_fine_inr || "₹25,000"}</strong>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Jan Vishwas 2026</span>
                  <strong className="text-sm font-bold text-slate-700">{penalty?.jan_vishwas_eligible ? "15-Day Grace Period" : "Non-Compoundable"}</strong>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Director Liability</span>
                  <strong className="text-sm font-bold text-slate-700">{penalty?.director_liability ? "Section 49 Triggered" : "Corporate Only"}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 36 Notice Button */}
      {!isOverallPass && onOpenNoticeModal && (
        <button onClick={() => onOpenNoticeModal("COMPOUNDING")}
          className="w-full flex items-center justify-center gap-2 min-h-[48px] bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-[0.98]">
          <FileWarning size={18} /> Generate Section 36 Compounding Notice
        </button>
      )}

      {/* Statutory Verification Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Statutory Verification Log</h3>
          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold">{rules.length} Rules</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {rules.map((item, idx) => {
            const isPass = item.status === "PASS";
            const isWarn = item.status === "WARNING";
            const isFail = item.status === "FAIL";
            const isOpen = expandedRules.includes(idx);

            return (
              <div key={idx} className="theme-bright-card overflow-hidden">
                <button onClick={() => toggleRule(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors focus:outline-none min-h-[56px] gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`shrink-0 ${isPass ? "text-emerald-500" : isWarn ? "text-amber-500" : "text-rose-500"}`}>
                      {isPass && <CheckCircle2 size={22} />}
                      {isWarn && <AlertTriangle size={22} />}
                      {isFail && <XCircle size={22} />}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-slate-900 block truncate">{getHumanTitle(item.rule)}</span>
                      <span className="text-xs text-slate-500 block truncate mt-0.5">{item.reason}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                      isPass ? "bg-emerald-50 text-emerald-800 border-emerald-200/80" :
                      isWarn ? "bg-amber-50 text-amber-900 border-amber-200/80" :
                      "bg-rose-50 text-rose-800 border-rose-200/80"
                    }`}>{item.status}</span>
                    <div className="text-slate-400 p-0.5">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1.5">
                        <FileText size={11} /> Extracted Label Text
                      </span>
                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 shadow-inner">
                        <code className="text-xs font-mono text-slate-300 break-words leading-relaxed">
                          {(item.evidence && item.evidence.length > 0) ? item.evidence.join(" | ") : "No label text was detected for this declaration."}
                        </code>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Statutory Finding</span>
                      <p className="text-sm text-slate-700 leading-relaxed bg-white border border-slate-200/80 p-3 rounded-xl shadow-sm">{item.reason}</p>
                    </div>
                    {item.remedy && isFail && (
                      <div className="bg-blue-50 border border-blue-200/80 p-4 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 block mb-1 pl-2">Required Corrective Action</span>
                        <p className="text-sm font-semibold text-blue-900 pl-2">{item.remedy}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FSSAI Panel */}
      {fssai_verification && (
        <div className="theme-bright-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Leaf size={20} /></div>
            <h4 className="text-base font-bold text-slate-900">FSSAI Food Safety Verification</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">License Number</span>
              <strong className="text-sm font-bold text-slate-700 font-mono">{fssai_verification.license_number || "Not Detected"}</strong>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">License Format</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${fssai_verification.license_valid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                {fssai_verification.license_valid ? "VALID 14-DIGIT" : "INVALID FORMAT"}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Dietary Classification</span>
              <strong className="text-sm font-bold text-slate-700">{fssai_verification.veg_nonveg_symbol || "Not Declared"}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
