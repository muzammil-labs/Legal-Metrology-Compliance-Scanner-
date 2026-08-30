import React, { useState } from "react";
import {
  Store,
  Upload,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Download,
  Sparkles,
} from "lucide-react";
import BatchAuditModal from "./BatchAuditModal";

export default function SellerBulkAudit() {
  const [batchResult, setBatchResult] = useState(null);

  function handleBatchComplete(result) {
    setBatchResult(result);
  }

  return (
    <section className="seller-view">
      <div className="dash-header">
        <div>
          <h2>Seller Compliance Hub</h2>
          <p className="mono">
            Pre-listing Catalogue Audit & Trust Badge Issuance
          </p>
        </div>
      </div>

      <div className="seller-grid">
        {/* Upload Card */}
        <div className="seller-upload-panel">
          <div className="panel-head">
            <span>Batch Catalogue Ingestion</span>
            <span className="mono">{files.length} SKUs Selected</span>
          </div>

          <BatchAuditModal onBatchComplete={handleBatchComplete} />
        </div>

        {/* Verified Badge Generator Card */}
        <div className="seller-badge-panel">
          <div className="panel-head">
            <span>Compliance Trust Badge Generator</span>
            <span className="mono">Verified By DOCA</span>
          </div>

          <div className="badge-preview-card">
            <div className="verified-badge">
              <div className="badge-icon-box">
                <ShieldCheck size={28} />
              </div>
              <div className="badge-text">
                <strong>Legal Metrology Compliant</strong>
                <span>PCR 2011 Verified • DOCA Certified</span>
                <small className="mono">
                  Digital Cert ID: LM-CERT-2026-DOCA
                </small>
              </div>
              <div className="qr-box">
                <QrCode size={36} />
              </div>
            </div>

            <p className="badge-desc">
              Embed this verified SVG trust badge and tamper-evident QR code
              directly into product listings on Amazon, Flipkart, or Blinkit to
              boost buyer conversion.
            </p>

            <div className="embed-code-box">
              <code>
                &lt;img src="https://metrology.doca.gov.in/badge/LM-2026.svg"
                alt="Legal Metrology Compliant" /&gt;
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Results Table */}
      {batchResult && (
        <div className="docket-panel mt-6">

          <div className="panel-head">
            <span>Batch Audit Report · {batchResult.batch_id}</span>
            <div style={{display: "flex", gap: "1rem", alignItems: "center"}}>
                <span className="badge pass">
                  <CheckCircle2 size={15} /> {batchResult.passed_skus} /{" "}
                  {batchResult.total_skus} SKUs Passed
                </span>
                <a href={`/api/v1/batch-audit/download/${batchResult.batch_id}`} className="scan-button" style={{padding: "0.25rem 0.75rem", fontSize: "0.85rem", textDecoration: "none"}}>
                    <Download size={14} /> Download Notices ZIP
                </a>
            </div>
          </div>


          <div className="table-responsive">
            <table className="docket-table">
              <thead>
                <tr>
                  <th>SKU Identifier</th>
                  <th>Image File</th>
                  <th>Compliance Status</th>
                  <th>Trust Score</th>
                  <th>Infractions Flagged</th>
                  <th>Trust Badge</th>
                </tr>
              </thead>
              <tbody>
                {batchResult.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <code>{item.sku_id}</code>
                    </td>
                    <td>
                      <b>{item.filename}</b>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${item.overall_status === "PASS" ? "pass" : "fail"}`}
                      >
                        {item.overall_status}
                      </span>
                    </td>
                    <td>
                      <span className="trust-pill">{item.trust_score}</span>
                    </td>
                    <td>
                      {item.violation_count === 0
                        ? "0 Flags (Clean)"
                        : `${item.violation_count} Violations`}
                    </td>
                    <td>
                      <span className="badge-mini text-emerald">
                        <Sparkles size={12} /> Eligible for Badge
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
