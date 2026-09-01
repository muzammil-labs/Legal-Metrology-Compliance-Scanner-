import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Scale,
  ShieldAlert,
  Send,
  Copy,
  Check
} from 'lucide-react';

export default function ComplianceSummaryCard({
  audit,
  auditData: explicitAuditData,
  onGenerateNotice,
  onOpenNoticeModal,
  onOpenGrievanceModal
}) {
  const auditData = audit || explicitAuditData;
  const handleNotice = onOpenNoticeModal || onGenerateNotice;
  const [expandedRule, setExpandedRule] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  if (!auditData) return null;

  const {
    overall_status = 'PASS',
    rules = [],
    penalty = null,
    fssai_verification = null,
    pdp_font_evaluation = null,
    sha256_hash = '',
    inspection_id = ''
  } = auditData;

  const isPass = overall_status === 'PASS';
  const isWarning = overall_status === 'WARNING';
  const isFail = overall_status === 'FAIL';

  const toggleAccordion = (index) => {
    setExpandedRule(expandedRule === index ? null : index);
  };

  const handleCopyHash = () => {
    if (!sha256_hash) return;
    navigator.clipboard.writeText(sha256_hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* 1. Overall Status Hero Banner */}
      <div
        className={`p-6 rounded-2xl border backdrop-blur-xl transition-all shadow-2xl animate-in delay-1 ${
          isPass
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100 shadow-emerald-950/20'
            : isWarning
            ? 'bg-amber-950/20 border-amber-500/40 text-amber-100 shadow-amber-950/20'
            : 'bg-rose-950/20 border-rose-500/40 text-rose-100 shadow-rose-950/20'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl border ${
                isPass
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : isWarning
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                  : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
              }`}
            >
              {isPass && <CheckCircle2 className="w-8 h-8" />}
              {isWarning && <AlertTriangle className="w-8 h-8" />}
              {isFail && <XCircle className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700/50">
                  Legal Metrology Assessment
                </span>
                <span className="text-xs text-slate-400">ID: {inspection_id || 'SCAN-LOCAL'}</span>
              </div>
              <h2 className="text-2xl font-bold mt-1">
                {isPass && 'Statutory Compliant Product'}
                {isWarning && 'Procedural Warning Issued'}
                {isFail && 'Statutory Infractions Detected'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {handleNotice && (
              <button
                onClick={() => handleNotice(isFail ? 'COMPOUNDING' : 'IMPROVEMENT')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.15)]"
              >
                <FileText className="w-4 h-4" />
                Section 36 Notice
              </button>
            )}

            {isFail && onOpenGrievanceModal && (
              <button
                onClick={onOpenGrievanceModal}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 active:scale-95 transition-all shadow-[0_0_15px_rgba(244,63,94,0.15)]"
              >
                <Send className="w-4 h-4" />
                Report to NCH
              </button>
            )}
          </div>
        </div>

        {/* Cryptographic SHA-256 Ledger Verification */}
        {sha256_hash && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-slate-500 uppercase tracking-wider font-sans">SHA-256 Chain:</span>
              <span className="truncate text-slate-300">{sha256_hash}</span>
            </div>
            <button
              onClick={handleCopyHash}
              className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 shrink-0 font-sans"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedHash ? 'Copied' : 'Copy Hash'}
            </button>
          </div>
        )}
      </div>

      {/* 2. Statutory Penalty / Jan Vishwas 2026 Card */}
      {penalty && (
        <div className="p-5 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(255,255,255,0.08)] backdrop-blur-xl shadow-lg animate-in delay-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">Compounding Liability Assessment</h3>
                <p className="text-xs text-slate-400">{penalty.applicable_section || 'Legal Metrology Act, 2009'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-amber-300">
                ₹{penalty.estimated_fine_inr?.toLocaleString('en-IN') || 0}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Est. Monetary Exposure</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Jan Vishwas 2026 Eligibility:</span>
              <span className={`font-semibold ${penalty.jan_vishwas_eligible ? 'text-emerald-400' : 'text-slate-400'}`}>
                {penalty.jan_vishwas_eligible ? 'Eligible (Grace Period Granted)' : 'Non-Compoundable'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Statutory Rectification Window:</span>
              <span className="font-semibold text-slate-200">
                {penalty.grace_period_days ? `${penalty.grace_period_days} Days` : 'Immediate Rectification'}
              </span>
            </div>
          </div>

          {penalty.director_liability && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 flex items-center gap-2.5 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Critical Notice: Multiple infractions trigger Section 49 Corporate Director Liability.</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Rule 5 PDP Bounding Box Font Ratio Card */}
      {pdp_font_evaluation && (
        <div className="p-5 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(255,255,255,0.08)] backdrop-blur-xl shadow-lg animate-in delay-3">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
              <span>Rule 5 & Schedule II: Principal Display Panel Geometry</span>
            </h3>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                pdp_font_evaluation.font_size_compliance === 'PASS'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {pdp_font_evaluation.font_size_compliance === 'PASS' ? 'COMPLIANT RATIO' : 'SUB-STATUTORY HEIGHT'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-500 block">Est. PDP Area</span>
              <span className="font-semibold text-slate-200">{pdp_font_evaluation.estimated_pdp_area_sq_cm} cm²</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-500 block">Min. Mandated Font</span>
              <span className="font-semibold text-slate-200">{pdp_font_evaluation.mandatory_min_font_height_mm} mm</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-500 block">Measured Font</span>
              <span className="font-semibold text-slate-200">{pdp_font_evaluation.measured_font_height_mm} mm</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-500 block">Schedule Tier</span>
              <span className="font-semibold text-cyan-400">Schedule II Tier</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">{pdp_font_evaluation.details}</p>
        </div>
      )}

      {/* 4. FSSAI Dual-Regulatory Food Safety Section */}
      {fssai_verification?.is_food_product && (
        <div className="p-5 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(255,255,255,0.08)] backdrop-blur-xl shadow-lg animate-in delay-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                FSSAI
              </span>
              <h3 className="font-semibold text-slate-100 text-sm">Food Safety & Standards Dual-Verification</h3>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                fssai_verification.is_license_valid_format
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {fssai_verification.is_license_valid_format ? 'VALID 14-DIGIT LICENSE' : 'INVALID FSSAI LIC'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">License No:</span>
              <span className="font-mono font-semibold text-slate-200">
                {fssai_verification.license_number || 'Missing from Label'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Dietary Classification:</span>
              <span className={`font-semibold flex items-center gap-1.5 ${
                fssai_verification.dietary_type === 'VEGETARIAN' ? 'text-emerald-400' :
                fssai_verification.dietary_type === 'NON_VEGETARIAN' ? 'text-amber-600' : 'text-slate-200'
              }`}>
                {fssai_verification.dietary_type === 'VEGETARIAN' && (
                  <span className="inline-block w-3 h-3 rounded-full border border-emerald-500 bg-emerald-500/20 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </span>
                )}
                {fssai_verification.dietary_type === 'NON_VEGETARIAN' && (
                  <span className="inline-block w-3 h-3 border border-amber-600 bg-amber-600/20 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  </span>
                )}
                {fssai_verification.dietary_type || 'STANDARD'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Veg/Non-Veg Symbol:</span>
              <span className={`font-semibold ${fssai_verification.has_veg_nonveg_symbol ? 'text-emerald-400' : 'text-amber-400'}`}>
                {fssai_verification.has_veg_nonveg_symbol ? 'Present & Verified' : 'Unconfirmed'}
              </span>
            </div>
          </div>
          {fssai_verification.violations && fssai_verification.violations.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs">
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Statutory FSSAI Violations Detected:
              </div>
              <ul className="list-disc list-inside space-y-1 ml-1 text-rose-300/80">
                {fssai_verification.violations.map((violation, i) => (
                  <li key={i}>{violation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 5. Statutory Clauses Breakdown Accordion List */}
      <div className="space-y-3 animate-in delay-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Statutory Declarations Breakdown (Rule 6 & Rule 6(11))
        </h3>

        {rules.map((item, idx) => {
          const isItemPass = item.status === 'PASS';
          const isItemWarning = item.status === 'WARNING';
          const isItemFail = item.status === 'FAIL';
          const isExpanded = expandedRule === idx;

          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleAccordion(idx)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isItemPass && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {isItemWarning && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                  {isItemFail && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{item.rule}</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-md block">{item.reason}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      isItemPass
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : isItemWarning
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {item.status}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 bg-slate-950/40 text-xs space-y-2">
                  <div>
                    <span className="text-slate-500 font-semibold block">Statutory Reasoning:</span>
                    <p className="text-slate-300 mt-0.5">{item.reason}</p>
                  </div>
                  {item.statutory_clause && (
                    <div>
                      <span className="text-slate-500 font-semibold block">Statutory Reference:</span>
                      <p className="text-slate-400 mt-0.5 font-mono">{item.statutory_clause}</p>
                    </div>
                  )}
                  {item.remedy && (
                    <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300">
                      <span className="font-semibold block">Mandatory Packaging Remedy:</span>
                      <p className="mt-0.5">{item.remedy}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
