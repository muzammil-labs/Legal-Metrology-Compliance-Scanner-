import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Scale,
  ShieldCheck,
  Phone,
} from "lucide-react";

// Plain-language consumer explanations for each rule failure
const RULE_PLAIN_TEXT = {
  "Rule 6(1)(a)":
    "The manufacturer or importer name, address, or PIN code is missing or incomplete.",
  "Rule 6(1)(b)":
    'No common product name (like "Wheat Flour" or "Biscuit") is printed — only a brand name.',
  "Rule 6(1)(c)":
    "The quantity is written using an illegal abbreviation like 'gm' instead of 'g', or is missing entirely.",
  "Rule 6(1)(d)":
    "The date of manufacture or packing is missing, in the wrong format, or is a future date — indicating mislabeling.",
  "Rule 6(1)(e)":
    "The price (MRP) doesn't say '(incl. of all taxes)' — this is mandatory by law.",
  "Rule 6(1)(f)":
    "The consumer helpline, email, or grievance officer contact is missing or incomplete.",
  "Rule 6(11)":
    "The Unit Sale Price (₹ per g/kg/ml/l) is missing or mathematically incorrect.",
  "Rule 5/9 (Font / PDP)":
    "Printed numerals may be too small to read — font height may violate legal minimum standards.",
  "Rule 5":
    "PDP font height does not meet the minimum requirements for this package size.",
  "Bilingual Consistency":
    "Hindi and English label declarations (quantity or MRP) do not match.",
};

export default function ComplianceSummaryCard({ audit, onOpenNoticeModal }) {
  if (!audit) return null;

  const failed = audit.overall_status === "FAIL";
  const passedRules = audit.rules.filter((r) => r.status === "PASS").length;
  const trustScore =
    audit.trust_score !== undefined ? audit.trust_score : failed ? 45 : 100;

  return (
    <div className="results-panel">
      <div className="panel-head">
        <span>Compliance Result</span>
        <span className={failed ? "badge fail" : "badge pass"}>
          {failed ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}{" "}
          {audit.overall_status}
        </span>
      </div>

      <div className="result-hero">
        {/* Dynamic score ring — rose border when FAIL, emerald when PASS */}
        <div
          className={`score-ring ${failed ? "fail" : ""}`}
          style={{ "--score": trustScore }}
        >
          <span className="result-number">{trustScore}</span>
          <small>/100 TRUST</small>
        </div>
        <div>
          <h2>
            {passedRules} of {audit.rules.length} checks passed
          </h2>
          <p>
            Evaluated under Legal Metrology (Packaged Commodities) Rules, 2011
          </p>
        </div>
      </div>

      {audit.usp && audit.usp.applicable && (
        <div className="usp-audit-card">
          <div className="usp-header">
            <Scale size={16} className="text-cyan" />
            <strong>Unit Sale Price Verification</strong>
          </div>
          <div className="usp-grid">
            <div>
              <span>Declared USP</span>
              <b>
                {audit.usp.declared_value
                  ? `₹ ${audit.usp.declared_value} / ${audit.usp.declared_unit || "unit"}`
                  : "Not Declared"}
              </b>
            </div>
            <div>
              <span>Calculated USP</span>
              <b>
                {audit.usp.calculated_value
                  ? `₹ ${audit.usp.calculated_value} / base unit`
                  : "N/A"}
              </b>
            </div>
            <div>
              <span>Math Compliance</span>
              <b
                className={
                  audit.usp.within_tolerance ? "text-emerald" : "text-rose"
                }
              >
                {audit.usp.within_tolerance
                  ? "✓ Matched (±₹0.01)"
                  : "✗ Discrepancy / Missing"}
              </b>
            </div>
          </div>
        </div>
      )}

      <div className="rule-list">
        {audit.rules.map((rule) => {
          const isPass = rule.status === "PASS";
          const plainText = !isPass ? RULE_PLAIN_TEXT[rule.rule] : null;
          const isExpandable =
            rule.rule === "Rule 5" || rule.rule === "Bilingual Consistency";
          return (
            <div className="rule" key={rule.rule}>
              <span className={isPass ? "rule-icon pass" : "rule-icon fail"}>
                {isPass ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertTriangle size={16} />
                )}
              </span>
              <div>
                <strong>{rule.rule}</strong>
                <p>{rule.reason}</p>
                {/* Consumer-friendly plain-language explanation for failures */}
                {plainText && (
                  <p
                    className="text-muted"
                    style={{ fontSize: "11px", marginTop: "2px" }}
                  >
                    ℹ️ {plainText}
                  </p>
                )}
                {rule.evidence && rule.evidence.length > 0 && (
                  <div className="rule-evidence">
                    Evidence: <code>{rule.evidence.join(", ")}</code>
                  </div>
                )}
                {/* Expandable calculated_values for Rule 5 and Bilingual checks */}
                {isExpandable &&
                  rule.calculated_values &&
                  Object.keys(rule.calculated_values).length > 0 && (
                    <details
                      className="rule-details"
                      style={{ marginTop: "6px", fontSize: "11px" }}
                    >
                      <summary style={{ cursor: "pointer", color: "#71717a" }}>
                        View calculated values
                      </summary>
                      <pre style={{ margin: "4px 0 0", color: "#a1a1aa" }}>
                        {JSON.stringify(rule.calculated_values, null, 2)}
                      </pre>
                    </details>
                  )}
              </div>
              <span className={`rule-status ${isPass ? "pass" : "fail"}`}>
                {rule.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* EXPORT STATUTORY NOTICE HERO SECTION */}
      <div className="bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-6">
        {/* Ambient radial glow accent */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Structured Information Hierarchy & Typography */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Legal Metrology Synthesis
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mt-3 mb-0">Court-Admissible Statutory Notice Generator</h3>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl mt-1.5 mb-0">
            Synthesize an official Section 36 compounding notice embedded with a SHA-256 digital signature to ensure chain-of-custody under Sec 65B of the Indian Evidence Act.
          </p>
        </div>

        {/* Dynamic Multi-Column Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5 relative z-10">
          {/* Card 1 (Notice Classification) */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Classification</span>
            {failed ? (
              <span className="text-rose-400 font-mono text-[11px] font-bold">Compounding Fine Demand</span>
            ) : (
              <span className="text-emerald-400 font-mono text-[11px] font-bold">Compliant Ledger Entry</span>
            )}
          </div>
          {/* Card 2 (Fine Exposure) */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Fine Exposure</span>
            {failed ? (
              <span className="text-rose-400 font-mono text-sm font-bold tracking-tight">Est. INR ₹15,000</span>
            ) : (
              <span className="text-slate-300 font-mono text-sm font-bold tracking-tight">₹0 Liability</span>
            )}
          </div>
          {/* Card 3 (Chain-of-Custody) */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Chain of Custody</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-bold">
              <ShieldCheck size={12}/> Sec 65B Secured
            </span>
          </div>
        </div>

        {/* Primary Action Call-to-Action (CTA) Cluster */}
        <div className="flex flex-col sm:flex-row gap-3 relative z-10 mt-6">
          <button
            className="flex-1 relative group overflow-hidden bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-6 py-3.5 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.35)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer"
            onClick={onOpenNoticeModal}
          >
            <span className="absolute inset-0 w-full h-full -ml-[100%] bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shimmer skew-x-12 transition-transform duration-700 ease-in-out group-hover:translate-x-[200%]"></span>
            <FileText size={18} />
            Generate Statutory Notice
          </button>

          {failed && (
            <a
              href="tel:18001144000"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 px-5 py-3 rounded-2xl text-sm font-medium transition-all cursor-pointer no-underline active:scale-[0.98]"
              title="National Consumer Helpline — 1800-11-4000 (Toll Free)"
            >
              <Phone size={16} />
              Consumer Helpline
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
