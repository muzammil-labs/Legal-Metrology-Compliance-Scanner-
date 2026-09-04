import React, { useState } from "react";
import CameraScanner from "./CameraScanner";
import {
  executeScanWithCircuitBreaker,
  loadPrecachedFixture,
} from "../services/api";
import {
  ShieldCheck,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Phone,
  FileText,
} from "lucide-react";

export default function PublicCitizenPortal() {
  const [file, setFile] = useState(null);
  const [demoMode, setDemoMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Ready to scan product labels");
  const [audit, setAudit] = useState(null);
  const scannerRef = React.useRef(null);

  const handleScan = async (customOcrText = "") => {
    const sides = scannerRef.current?.getScannedSides() || [];
    const imageFiles = sides.length > 0 ? sides.map(s => s.file) : (file ? [file] : []);

    if (imageFiles.length === 0 && !demoMode && !customOcrText) {
      setMessage("Error: Please add at least one product image or video before scanning.");
      return;
    }

    setLoading(true);
    setMessage(imageFiles.length > 1 ? "Analyzing multiple sides..." : "Analyzing product label...");
    try {
      const result = imageFiles.length > 1
        ? await require("../services/api").scanMultipleSides(imageFiles, "New Delhi")
        : await executeScanWithCircuitBreaker(imageFiles[0] || null, demoMode, customOcrText);
      setAudit(result);
      setMessage("Analysis complete");
    } catch (error) {
      console.error(error);
      setMessage(`Error: ${error.message}`);
      setAudit(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoToggle = () => {
    const nextMode =
      demoMode === "control_fail_tax" ? null : "control_fail_tax";
    setDemoMode(nextMode);
    if (nextMode) {
      setAudit(loadPrecachedFixture(nextMode));
      setMessage(`Demo fixture loaded: ${nextMode}`);
    } else {
      setAudit(null);
      setMessage("Ready to scan product labels");
    }
  };

  const generateGrievanceDraft = () => {
    if (!audit) return;

    const failedRules = audit.rules.filter((r) => r.status === "FAIL");
    const violations = failedRules
      .map((r) => r.rule + ": " + r.reason)
      .join("\n- ");

    const draft = `Grievance Report - National Consumer Helpline (NCH)

Product Details:
[Fill in Product Name/Brand]

Violations Detected (Legal Metrology Packaged Commodities Rules, 2011):
- ${violations}

Extracted Information:
${
  audit.extracted_fields
    ? audit.extracted_fields.map((f) => f.name + ": " + f.value).join("\n")
    : "None"
}

Please investigate this non-compliant packaging. Attached is the photograph of the product label.
`;

    const mailto = `mailto:?subject=${encodeURIComponent(
      "Grievance regarding non-compliant product packaging",
    )}&body=${encodeURIComponent(draft)}`;
    window.location.href = mailto;
  };

  return (
    <div className="shell">
      <section className="intro">
        <div>
          <p className="eyebrow">NATIONAL CONSUMER HELPLINE</p>
          <h1>
            Citizen Scanner
            <br />
            <em>Know Your Rights</em>
          </h1>
          <p className="lede">
            Scan product labels at kirana stores or supermarkets to verify
            compliance with Legal Metrology laws.
          </p>
          <button
            onClick={handleDemoToggle}
            className="secondary-btn"
            style={{ marginTop: "12px", fontSize: "12px", padding: "8px 12px" }}
          >
            {demoMode ? "Exit Demo Mode" : "Load Demo (Violation)"}
          </button>
        </div>
      </section>

      <section className="workspace">
        <CameraScanner
          ref={scannerRef}
          file={file}
          setFile={setFile}
          demoMode={demoMode}
          loading={loading}
          message={message}
          onScan={handleScan}
        />

        {audit && (
          <div className="results-panel">
            <div className="panel-head">
              <span>Consumer Rights Protection Summary</span>
              <span
                className={
                  audit.overall_status === "FAIL" ? "badge fail" : "badge pass"
                }
              >
                {audit.overall_status === "FAIL" ? (
                  <AlertTriangle size={15} />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                {audit.overall_status}
              </span>
            </div>

            <div className="rule-list">
              {/* MRP Tax Inclusive Check */}
              {(() => {
                const rule61e = audit.rules.find(
                  (r) => r.rule === "Rule 6(1)(e)",
                );
                if (rule61e) {
                  return (
                    <div className="rule">
                      <span
                        className={
                          rule61e.status === "PASS"
                            ? "rule-icon pass"
                            : "rule-icon fail"
                        }
                      >
                        {rule61e.status === "PASS" ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <AlertTriangle size={16} />
                        )}
                      </span>
                      <div>
                        <strong>Is MRP tax-inclusive?</strong>
                        <p>
                          {rule61e.status === "PASS"
                            ? "Yes, MRP is properly declared with taxes."
                            : "No, missing mandatory '(incl. of all taxes)' declaration."}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Net Weight Legal Check */}
              {(() => {
                const rule61c = audit.rules.find(
                  (r) => r.rule === "Rule 6(1)(c)",
                );
                if (rule61c) {
                  return (
                    <div className="rule">
                      <span
                        className={
                          rule61c.status === "PASS"
                            ? "rule-icon pass"
                            : "rule-icon fail"
                        }
                      >
                        {rule61c.status === "PASS" ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <AlertTriangle size={16} />
                        )}
                      </span>
                      <div>
                        <strong>Is net weight legal?</strong>
                        <p>
                          {rule61c.status === "PASS"
                            ? "Yes, valid SI unit used."
                            : "No, invalid or missing weight declaration."}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Unit Price Fair Check */}
              {(() => {
                const rule11 = audit.rules.find((r) => r.rule === "Rule 6(11)");
                if (rule11) {
                  return (
                    <div className="rule">
                      <span
                        className={
                          rule11.status === "PASS"
                            ? "rule-icon pass"
                            : "rule-icon fail"
                        }
                      >
                        {rule11.status === "PASS" ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <AlertTriangle size={16} />
                        )}
                      </span>
                      <div>
                        <strong>Is Unit Price fair & accurate?</strong>
                        <p>
                          {rule11.status === "PASS"
                            ? "Yes, Unit Sale Price matches the math."
                            : "No, Unit Sale Price is missing or mathematically incorrect."}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {audit.overall_status === "FAIL" && (
              <div className="result-footer-actions">
                <button
                  className="primary-download-btn"
                  onClick={generateGrievanceDraft}
                >
                  <FileText size={16} /> Lodge Grievance with DOCA
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
