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
  Check,
  Activity
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
    inspection_id = '',
    ocr_text = ''
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

  // Calculate pass percentage for animated ring
  const totalRules = rules.length || 1;
  const passedRules = rules.filter(r => r.status === 'PASS').length;
  const passPercentage = Math.round((passedRules / totalRules) * 100);
  const strokeDashoffset = 125.6 - (125.6 * passPercentage) / 100;

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* 1. Overall Status Hero Banner (Animated Score Badge) */}
      <div className={`score-badge animate-in delay-1 ${
        isPass ? 'border-green-200' : isWarning ? 'border-yellow-200' : 'border-red-200'
      }`}>
        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
          <svg className="w-16 h-16 transform -rotate-90 absolute inset-0">
            <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
            <circle
              cx="32"
              cy="32"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray="125.6"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`progress-ring__circle ${isPass ? 'text-green-500' : isWarning ? 'text-yellow-500' : 'text-red-500'}`}
            />
          </svg>
          <div className={`z-10 ${isPass ? 'status-glow-pass text-green-600' : isWarning ? 'text-yellow-600' : 'status-glow-fail text-red-600'}`}>
            {isPass && <CheckCircle2 className="w-8 h-8" />}
            {isWarning && <AlertTriangle className="w-8 h-8" />}
            {isFail && <XCircle className="w-8 h-8" />}
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-600">
              ID: {inspection_id || 'SCAN-LOCAL'}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
            {isPass && 'Statutory Compliant'}
            {isWarning && 'Procedural Warning'}
            {isFail && 'Statutory Infractions Detected'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Automated visual compliance audit completed.</p>
        </div>

        <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0 z-10">
          {handleNotice && (
            <button
              onClick={() => handleNotice(isFail ? 'COMPOUNDING' : 'IMPROVEMENT')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 active:scale-95 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Section 36 Notice
            </button>
          )}

          {isFail && onOpenGrievanceModal && (
            <button
              onClick={onOpenGrievanceModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-95 transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
              Report to NCH
            </button>
          )}
        </div>
      </div>

      {sha256_hash && (
        <div className="animate-in delay-2 flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 shadow-sm text-xs font-mono text-gray-500">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="uppercase tracking-widest text-[10px] font-sans font-bold text-gray-400">SHA-256</span>
            <span className="truncate">{sha256_hash}</span>
          </div>
          <button onClick={handleCopyHash} className="flex items-center gap-1.5 text-blue-500 hover:text-blue-600 font-sans font-semibold ml-4">
            {copiedHash ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedHash ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      {/* 2. Statutory Penalty / Jan Vishwas 2026 Card */}
      {penalty && (
        <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm animate-in stagger-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-50 text-orange-500 border border-orange-100">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Compounding Liability Assessment</h3>
                <p className="text-xs text-gray-500">{penalty.applicable_section || 'Legal Metrology Act, 2009'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-orange-600 tracking-tight">
                ₹{penalty.estimated_fine_inr?.toLocaleString('en-IN') || 0}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Est. Exposure</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <span className="text-gray-500 font-medium">Jan Vishwas 2026:</span>
              <span className={`font-bold ${penalty.jan_vishwas_eligible ? 'text-green-600' : 'text-gray-700'}`}>
                {penalty.jan_vishwas_eligible ? 'Eligible (Grace Granted)' : 'Non-Compoundable'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <span className="text-gray-500 font-medium">Rectification Window:</span>
              <span className="font-bold text-gray-900">
                {penalty.grace_period_days ? `${penalty.grace_period_days} Days` : 'Immediate'}
              </span>
            </div>
          </div>

          {penalty.director_liability && (
            <div className="mt-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 flex items-center gap-3 text-xs shadow-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-500" />
              <span className="font-medium">Critical Notice: Multiple infractions trigger Section 49 Corporate Director Liability.</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Rule 5 PDP Bounding Box Font Ratio Card */}
      {pdp_font_evaluation && (
        <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm animate-in stagger-3">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span>Rule 5 Geometry Analysis</span>
            </h3>
            <span className={`text-[10px] font-bold tracking-wider px-3 py-1 rounded-md border ${
                pdp_font_evaluation.font_size_compliance === 'PASS'
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}
            >
              {pdp_font_evaluation.font_size_compliance === 'PASS' ? 'COMPLIANT RATIO' : 'SUB-STATUTORY HEIGHT'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block mb-1">Est. PDP Area</span>
              <span className="font-bold text-gray-900 text-sm">{pdp_font_evaluation.estimated_pdp_area_sq_cm} cm²</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block mb-1">Min. Font</span>
              <span className="font-bold text-gray-900 text-sm">{pdp_font_evaluation.mandatory_min_font_height_mm} mm</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block mb-1">Measured Font</span>
              <span className="font-bold text-gray-900 text-sm">{pdp_font_evaluation.measured_font_height_mm} mm</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-blue-500 block mb-1">Schedule Tier</span>
              <span className="font-bold text-blue-700 text-sm">Tier II</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">{pdp_font_evaluation.details}</p>
        </div>
      )}

      {/* 4. FSSAI Dual-Regulatory Food Safety Section */}
      {fssai_verification?.is_food_product && (
        <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm animate-in stagger-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-100 text-orange-600 border border-orange-200">
                FSSAI
              </span>
              <h3 className="font-bold text-gray-900 text-sm">Food Safety Verification</h3>
            </div>
            <span className={`text-[10px] font-bold tracking-wider px-3 py-1 rounded-md border ${
                fssai_verification.is_license_valid_format
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}
            >
              {fssai_verification.is_license_valid_format ? 'VALID 14-DIGIT LIC' : 'INVALID LIC'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block mb-1">License No:</span>
              <span className="font-mono font-bold text-gray-900 text-sm">
                {fssai_verification.license_number || 'Missing'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block mb-1">Dietary Class:</span>
              <span className={`font-bold text-sm flex items-center gap-2 ${
                fssai_verification.dietary_type === 'VEGETARIAN' ? 'text-green-600' :
                fssai_verification.dietary_type === 'NON_VEGETARIAN' ? 'text-red-600' : 'text-gray-900'
              }`}>
                {fssai_verification.dietary_type === 'VEGETARIAN' && (
                  <span className="inline-flex w-4 h-4 rounded-full border-2 border-green-500 items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  </span>
                )}
                {fssai_verification.dietary_type === 'NON_VEGETARIAN' && (
                  <span className="inline-flex w-4 h-4 border-2 border-red-600 items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  </span>
                )}
                {fssai_verification.dietary_type || 'STANDARD'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block mb-1">Dietary Symbol:</span>
              <span className={`font-bold text-sm ${fssai_verification.has_veg_nonveg_symbol ? 'text-green-600' : 'text-orange-500'}`}>
                {fssai_verification.has_veg_nonveg_symbol ? 'Verified' : 'Unconfirmed'}
              </span>
            </div>
          </div>
          {fssai_verification.violations && fssai_verification.violations.length > 0 && (
            <div className="mt-3 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs shadow-sm">
              <div className="font-bold mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                FSSAI Violations:
              </div>
              <ul className="list-disc list-inside space-y-1.5 ml-1 font-medium">
                {fssai_verification.violations.map((violation, i) => (
                  <li key={i}>{violation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 4.5 Raw OCR Dump for Transparency */}
      {ocr_text && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner animate-in stagger-5">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>Vision AI OCR Telemetry (Debug)</span>
            </h3>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 max-h-48 overflow-y-auto shadow-sm">
            <pre className="text-[10px] text-slate-500 font-mono whitespace-pre-wrap">{ocr_text}</pre>
          </div>
        </div>
      )}

      {/* 5. Statutory Clauses Breakdown Interactive Grid */}
      <div className="space-y-6 animate-in stagger-6 pt-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
            Statutory Verification (Rule 6)
          </h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md">
            {rules.length} Rules Processed
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rules.map((item, idx) => {
            const isItemPass = item.status === 'PASS';
            const isItemWarning = item.status === 'WARNING';
            const isItemFail = item.status === 'FAIL';
            const isExpanded = expandedRule === idx;

            return (
              <div key={idx} className="rule-card group">
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-5 flex items-center justify-between text-left focus:outline-none bg-transparent border-none cursor-pointer gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    <div className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                      isItemPass ? 'status-glow-pass text-green-500' :
                      isItemWarning ? 'text-yellow-500' :
                      'status-glow-fail text-red-500'
                    }`}>
                      {isItemPass && <CheckCircle2 className="w-6 h-6" />}
                      {isItemWarning && <AlertTriangle className="w-6 h-6" />}
                      {isItemFail && <XCircle className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 overflow-hidden pr-2">
                      <span className="text-sm font-extrabold text-gray-900 block mb-1 tracking-tight group-hover:text-blue-600 transition-colors truncate">{item.rule}</span>
                      <span className="text-xs text-gray-500 leading-relaxed line-clamp-1">{item.reason}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] whitespace-nowrap font-black uppercase tracking-wider px-2.5 py-1 rounded-md border shadow-sm ${
                        isItemPass ? 'bg-green-50 text-green-600 border-green-200 shadow-green-100/50' : 
                        isItemWarning ? 'bg-yellow-50 text-yellow-600 border-yellow-200 shadow-yellow-100/50' : 
                        'bg-red-50 text-red-600 border-red-200 shadow-red-100/50'
                      }`}
                    >
                      {item.status}
                    </span>
                    <div className="p-1 rounded-full bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                <div className={`expandable-content ${isExpanded ? 'expanded' : ''}`}>
                  <div className="expandable-inner">
                    <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-gray-50/50 text-sm space-y-4">
                      <div>
                        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px] block mb-1.5">Reasoning Details</span>
                        <p className="text-gray-700 font-medium leading-relaxed">{item.reason}</p>
                      </div>
                      {item.statutory_clause && (
                        <div>
                          <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px] block mb-1.5">Statutory Clause</span>
                          <code className="text-blue-700 font-mono text-xs bg-blue-50 px-2 py-1 rounded border border-blue-100 shadow-sm inline-block">{item.statutory_clause}</code>
                        </div>
                      )}
                      {item.remedy && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-100 shadow-sm mt-3 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                          <span className="text-blue-800 font-extrabold uppercase tracking-widest text-[10px] block mb-1">Required Remediation</span>
                          <p className="text-blue-900 font-semibold text-sm leading-relaxed">{item.remedy}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
