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
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto items-start pb-20 mt-4 relative z-10 p-4">
      
      {/* ── Left Column: Scanner ── */}
      <div className="w-full md:w-5/12 lg:w-[450px] flex-shrink-0 animate-fade-in-up">
        
        <div className="theme-bright-card p-6 mb-6">
          <p className="text-[10px] font-bold tracking-widest text-turmeric uppercase mb-2">NATIONAL CONSUMER HELPLINE</p>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">
            Citizen Scanner<br />
            <span className="text-turmeric italic text-2xl">Know Your Rights</span>
          </h1>
          <p className="text-sm text-ink-soft leading-relaxed">
            Scan product labels at kirana stores or supermarkets to verify
            compliance with Legal Metrology laws.
          </p>
          <button
            onClick={handleDemoToggle}
            className="mt-4 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
          >
            {demoMode ? "Exit Demo Mode" : "Load Demo (Violation)"}
          </button>
        </div>

        <CameraScanner
          ref={scannerRef}
          file={file}
          setFile={setFile}
          demoMode={demoMode}
          loading={loading}
          message={message}
          onScan={handleScan}
        />
      </div>

      {/* ── Right Column: Results ── */}
      <div className="w-full md:flex-1 flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {!audit ? (
          <div className="hidden md:flex flex-col items-center justify-center h-[500px] theme-bright-card border-dashed border-2 border-white/10 opacity-70">
            <ShieldCheck size={48} className="text-white/20 mb-4" />
            <h3 className="text-xl font-serif font-bold text-white mb-2">Ready to Inspect</h3>
            <p className="text-sm text-ink-soft text-center max-w-xs">
              Upload or capture a product label on the left. The PakkaLabel engine will instantly verify it against Legal Metrology Rules, 2011.
            </p>
          </div>
        ) : (
          <div className="theme-bright-card p-6 flex flex-col gap-6 relative overflow-hidden">
            {/* Background glow based on status */}
            <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-20 pointer-events-none ${audit.overall_status === 'FAIL' ? 'bg-terracotta' : 'bg-sage'}`} />
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
              <span className="font-serif font-bold text-white text-lg">Consumer Rights Protection Summary</span>
              <span
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                  audit.overall_status === "FAIL" ? "bg-terracotta/20 text-terracotta border border-terracotta/30" : "bg-sage/20 text-sage border border-sage/30"
                }`}
              >
                {audit.overall_status === "FAIL" ? (
                  <AlertTriangle size={15} />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                {audit.overall_status}
              </span>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              {/* MRP Tax Inclusive Check */}
              {(() => {
                const rule61e = audit.rules.find((r) => r.rule === "Rule 6(1)(e)");
                if (rule61e) {
                  return (
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                      <span
                        className={`mt-1 flex-shrink-0 ${
                          rule61e.status === "PASS" ? "text-sage" : "text-terracotta"
                        }`}
                      >
                        {rule61e.status === "PASS" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                      </span>
                      <div className="flex flex-col">
                        <strong className="text-white text-sm">Is MRP tax-inclusive?</strong>
                        <p className="text-ink-soft text-xs mt-1 leading-relaxed">
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
                const rule61c = audit.rules.find((r) => r.rule === "Rule 6(1)(c)");
                if (rule61c) {
                  return (
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                      <span
                        className={`mt-1 flex-shrink-0 ${
                          rule61c.status === "PASS" ? "text-sage" : "text-terracotta"
                        }`}
                      >
                        {rule61c.status === "PASS" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                      </span>
                      <div className="flex flex-col">
                        <strong className="text-white text-sm">Is net weight legal?</strong>
                        <p className="text-ink-soft text-xs mt-1 leading-relaxed">
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
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                      <span
                        className={`mt-1 flex-shrink-0 ${
                          rule11.status === "PASS" ? "text-sage" : "text-terracotta"
                        }`}
                      >
                        {rule11.status === "PASS" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                      </span>
                      <div className="flex flex-col">
                        <strong className="text-white text-sm">Is Unit Price fair & accurate?</strong>
                        <p className="text-ink-soft text-xs mt-1 leading-relaxed">
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
              <div className="pt-4 border-t border-white/10 relative z-10">
                <button
                  className="w-full py-3 bg-terracotta hover:bg-terracotta/90 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                  onClick={generateGrievanceDraft}
                >
                  <FileText size={18} /> Lodge Grievance with DOCA
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
