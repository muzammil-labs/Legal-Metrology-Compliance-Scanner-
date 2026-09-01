import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Scale, Lock, RefreshCw, FileText } from 'lucide-react';

export default function ComplianceSummaryCard({ auditData, onReset }) {
  if (!auditData) return null;

  const {
    overall_status = 'PASS',
    rules = [],
    penalty = null,
    fssai_verification = null,
    pdp_font_evaluation = null,
  } = auditData;

  const isOverallPass = overall_status === 'PASS';
  
  // Auto-expand failing rules by default.
  // Instead of a single expanded rule, we track an array/set of expanded indices.
  const [expandedRules, setExpandedRules] = useState([]);

  useEffect(() => {
    // On mount or when auditData changes, auto-expand any rule that failed.
    const initialExpanded = rules
      .map((rule, idx) => (rule.status === 'FAIL' ? idx : null))
      .filter((idx) => idx !== null);
    setExpandedRules(initialExpanded);
  }, [rules]);

  const toggleAccordion = (idx) => {
    setExpandedRules((prev) => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const passCount = rules.filter(r => r.status === 'PASS').length;
  const complianceRate = rules.length ? Math.round((passCount / rules.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Action Header */}
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Audit Ledger</h2>
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm hover:shadow active:scale-95"
        >
          <RefreshCw size={16} /> New Audit
        </button>
      </div>

      {/* Hero Status Banner */}
      <div className={`p-8 rounded-2xl shadow-sm border ${
        isOverallPass ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-4 shadow-sm ${
              isOverallPass ? 'bg-emerald-100 text-emerald-600 border-emerald-50' : 'bg-rose-100 text-rose-600 border-rose-50'
            }`}>
              {isOverallPass ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
            </div>
            <div>
              <span className={`text-xs font-black uppercase tracking-widest block mb-1 ${
                isOverallPass ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                Statutory Determination
              </span>
              <h3 className={`text-3xl font-black tracking-tight ${
                isOverallPass ? 'text-emerald-900' : 'text-rose-900'
              }`}>
                {isOverallPass ? 'COMPLIANT' : 'NON-COMPLIANT'}
              </h3>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm flex items-center gap-4 min-w-[200px]">
             <div className="flex-1">
               <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                 <span>Compliance Score</span>
                 <span>{complianceRate}%</span>
               </div>
               <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                 <div className={`h-full ${isOverallPass ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${complianceRate}%` }}></div>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Jan Vishwas Penalty Card (If Failed) */}
      {!isOverallPass && penalty && (
        <div className="theme-bright-card p-6 border-l-4 border-l-rose-500">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
              <Scale size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-slate-900 mb-1">Compounding Liability Assessment</h4>
              <p className="text-sm font-medium text-slate-500 mb-4">Sections 36 & 49, Legal Metrology Act, 2009</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Est. Monetary Exposure</span>
                  <strong className="text-xl font-black text-rose-600">{penalty.estimated_fine_inr}</strong>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Jan Vishwas Eligibility</span>
                  <strong className="text-sm font-bold text-slate-700 block mt-1">{penalty.jan_vishwas_eligible ? "15-Day Grace Period" : "Non-Compoundable"}</strong>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Director Liability</span>
                  <strong className="text-sm font-bold text-slate-700 block mt-1">{penalty.director_liability ? "Section 49 Triggered" : "Corporate Only"}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Rules Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 px-2 flex justify-between items-center">
          <span>Statutory Verification Log</span>
          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px]">{rules.length} Rules Processed</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((item, idx) => {
            const isItemPass = item.status === 'PASS';
            const isItemWarning = item.status === 'WARNING';
            const isItemFail = item.status === 'FAIL';
            const isExpanded = expandedRules.includes(idx);

            // Clean title translation
            const humanTitle = item.rule.replace(/_/g, ' ').replace('RULE', 'Rule').replace(/(6\s*1\s*[a-z])/i, (match) => match.replace(/\s+/g, ''));

            return (
              <div key={idx} className="theme-bright-card overflow-hidden flex flex-col">
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                    <div className={`shrink-0 ${isItemPass ? 'text-emerald-500' : isItemWarning ? 'text-amber-500' : 'text-rose-500'}`}>
                      {isItemPass && <CheckCircle2 size={24} />}
                      {isItemWarning && <AlertTriangle size={24} />}
                      {isItemFail && <XCircle size={24} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 truncate">{humanTitle}</span>
                      <span className="text-xs text-slate-500 font-medium truncate">{item.reason}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                      isItemPass ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      isItemWarning ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {item.status}
                    </span>
                    <div className="p-1 rounded-full text-slate-400 bg-slate-100">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {/* Raw Extraction Block */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 flex items-center gap-1.5">
                        <FileText size={12} /> Raw Label Extraction
                      </span>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-inner">
                        <code className="text-xs font-mono text-slate-300 break-words line-clamp-3">
                          {item.raw_evidence || "No distinct text vector mapped to this rule during extraction phase."}
                        </code>
                      </div>
                    </div>

                    {/* Human Translation */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Executive Summary</span>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                        {item.reason}
                      </p>
                    </div>

                    {/* Actionable Remediation */}
                    {item.remedy && !isItemPass && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 block mb-1">Required Remediation</span>
                        <p className="text-sm font-bold text-blue-900">{item.remedy}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
