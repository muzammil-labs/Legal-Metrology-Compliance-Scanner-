import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Scale,
  ShieldCheck,
  Phone,
  Languages,
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



      {(() => {
        const rule5 = audit.rules.find(r => r.rule === "Rule 5 PDP Font Height & Area Ratio" || r.rule === "Rule 5 PDP" || r.rule.includes("Rule 5"));
        if (!rule5 || !rule5.calculated_values || rule5.calculated_values.pdp_area_cm2 === undefined) return null;
        const vals = rule5.calculated_values;
        return (
          <div className="usp-audit-card" style={{ marginTop: '16px' }}>
            <div className="usp-header">
              <Scale size={16} className="text-cyan" />
              <strong>Rule 5 PDP Font Height & Area Ratio</strong>
            </div>
            <div className="usp-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div>
                <span>PDP Area</span>
                <b>{vals.pdp_area_cm2.toFixed(1)} cm²</b>
              </div>
              <div>
                <span>Font Height</span>
                <b>{vals.char_height_mm.toFixed(1)} mm</b>
              </div>
              <div>
                <span>Minimum Required</span>
                <b className={vals.char_height_mm >= vals.required_mm ? "text-emerald" : "text-rose"}>
                  {vals.required_mm.toFixed(1)} mm
                </b>
              </div>
            </div>
          </div>
        );
      })()}

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

      {audit.bilingual_verification && (
        <div className="usp-audit-card" style={{ marginTop: "1rem" }}>
          <div className="usp-header">
            <Languages size={16} className="text-cyan" />
            <strong>Bilingual Language Consistency</strong>
          </div>
          <div className="usp-grid">
            <div>
              <span>English Details</span>
              <b>
                {audit.bilingual_verification.english_mrp
                  ? `MRP: ₹${audit.bilingual_verification.english_mrp}`
                  : "MRP: N/A"}
                <br />
                {audit.bilingual_verification.english_qty
                  ? `Qty: ${audit.bilingual_verification.english_qty}`
                  : "Qty: N/A"}
              </b>
            </div>
            <div>
              <span>Hindi / Regional Details</span>
              <b>
                {audit.bilingual_verification.hindi_mrp
                  ? `MRP: ₹${audit.bilingual_verification.hindi_mrp}`
                  : "MRP: N/A"}
                <br />
                {audit.bilingual_verification.hindi_qty
                  ? `Qty: ${audit.bilingual_verification.hindi_qty}`
                  : "Qty: N/A"}
              </b>
            </div>
            <div>
              <span>Match Status</span>
              <b
                className={
                  audit.bilingual_verification.mrp_match !== false &&
                  audit.bilingual_verification.qty_match !== false
                    ? "text-emerald"
                    : "text-rose"
                }
              >
                {audit.bilingual_verification.mrp_match !== false &&
                audit.bilingual_verification.qty_match !== false
                  ? "✓ Consistent"
                  : "✗ Discrepancy Found"}
              </b>
            </div>
          </div>
        </div>
      )}

      {audit.penalty && audit.penalty.estimated_fine_range && (
        <div className="usp-audit-card" style={{ marginTop: "16px" }}>
          <div className="usp-header">
            <ShieldCheck size={16} className="text-rose" />
            <strong>Estimated Penalty Range (Jan Vishwas 2026)</strong>
          </div>
          <div className="usp-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <span>Legal Section</span>
              <b>{audit.penalty.sections_violated?.join(", ") || "N/A"}</b>
            </div>
            <div>
              <span>Estimated Fine</span>
              <b className="text-rose">{audit.penalty.estimated_fine_range}</b>
            </div>
          </div>
        </div>
      )}

      {audit.fine_risk && (
        <div className="usp-audit-card" style={{ marginTop: "16px" }}>
          <div className="usp-header">
            <ShieldCheck size={16} className="text-rose" />
            <strong>Estimated Penalty Range (Jan Vishwas 2026)</strong>
          </div>
          <div className="usp-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <span>Legal Section</span>
              <b>{audit.fine_risk.legal_section}</b>
            </div>
            <div>
              <span>Estimated Fine</span>
              <b className="text-rose">
                ₹{audit.fine_risk.min_penalty_inr} - ₹
                {audit.fine_risk.max_penalty_inr}
              </b>
            </div>
          </div>
        </div>
      )}

      {audit.fine_risk && (
        <div className="usp-audit-card" style={{ marginTop: "16px" }}>
          <div className="usp-header">
            <ShieldCheck size={16} className="text-rose" />
            <strong>Estimated Penalty Range (Jan Vishwas 2026)</strong>
          </div>
          <div className="usp-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <span>Legal Section</span>
              <b>{audit.fine_risk.legal_section}</b>
            </div>
            <div>
              <span>Estimated Fine</span>
              <b className="text-rose">
                ₹{audit.fine_risk.min_penalty_inr} - ₹
                {audit.fine_risk.max_penalty_inr}
              </b>
            </div>
          </div>
        </div>
      )}

      {audit.penalty &&
        audit.penalty.estimated_fine_range &&
        !audit.fine_risk && (
          <div className="usp-audit-card" style={{ marginTop: "16px" }}>
            <div className="usp-header">
              <ShieldCheck size={16} className="text-rose" />
              <strong>Estimated Penalty Range (Jan Vishwas 2026)</strong>
            </div>
            <div
              className="usp-grid"
              style={{ gridTemplateColumns: "1fr 1fr" }}
            >
              <div>
                <span>Legal Section</span>
                <b>{audit.penalty.sections_violated?.join(", ") || "N/A"}</b>
              </div>
              <div>
                <span>Estimated Fine</span>
                <b className="text-rose">
                  {audit.penalty.estimated_fine_range}
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

      <div
        className="result-footer-actions"
        style={{ flexDirection: "column" }}
      >
        <button
          className="notice-btn"
          onClick={() => onOpenNoticeModal("IMPROVEMENT")}
          style={{ width: "100%" }}
        >
          <FileText size={16} /> Generate Improvement Notice (15-Day Grace)
        </button>
        <button
          className="notice-btn"
          onClick={() => onOpenNoticeModal("COMPOUNDING")}
          style={{
            width: "100%",
            background: "rgba(225, 29, 72, 0.1)",
            color: "#fb7185",
            border: "1px solid rgba(225, 29, 72, 0.2)",
          }}
        >
          <FileText size={16} /> Generate Compounding Penalty Demand
        </button>

        {/* One-tap NCH Grievance Filing — visible only on FAIL results */}
        {failed && (
          <a
            href="tel:18001144000"
            className="grievance-btn"
            title="National Consumer Helpline — 1800-11-4000 (Toll Free)"
          >
            <Phone size={15} />
            Report to Consumer Helpline (1800-11-4000)
          </a>
        )}
      </div>
    </div>
  );
}
