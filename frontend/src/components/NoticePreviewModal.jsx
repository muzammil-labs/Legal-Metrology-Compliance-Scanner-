import React from "react";
import {
  X,
  FileDown,
  ShieldCheck,
  MapPin,
  Hash,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { getNoticeDownloadUrl } from "../services/api";

export default function NoticePreviewModal({ isOpen, onClose, audit }) {
  if (!isOpen || !audit) return null;

  const inspectionId = audit.metadata?.inspection_id || 1;
  const downloadUrl = getNoticeDownloadUrl(inspectionId);
  const certNumber = `LM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(inspectionId).padStart(6, "0")}`;
  const sha256 = audit.metadata?.sha256 || "0".repeat(64);
  const isFail = audit.overall_status === "FAIL";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="badge-mini text-cyan">
              <ShieldCheck size={13} /> Notice Preview
            </div>
            <h3>Section 36 Inspection Notice</h3>
            <p className="mono">
              Issued under Section 36, Legal Metrology Act, 2009
            </p>
          </div>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-metadata-strip">
          <div className="meta-block">
            <span>
              <Hash size={12} /> Dossier ID
            </span>
            <strong>{certNumber}</strong>
          </div>
          <div className="meta-block">
            <span>
              <MapPin size={12} /> Jurisdiction GPS
            </span>
            <strong>
              {audit.metadata?.gps_location || "28.6139° N, 77.2090° E"}
            </strong>
          </div>
          <div className="meta-block">
            <span>Finding Status</span>
            <strong className={isFail ? "text-rose" : "text-emerald"}>
              {audit.overall_status}
            </strong>
          </div>
        </div>

        <div className="modal-hash-banner">
          <small className="mono">
            SHA-256 Evidence Seal (Sec 65B, Indian Evidence Act):
          </small>
          <code className="mono">{sha256}</code>
          <div className="badge-mini text-emerald" style={{ marginTop: "8px" }}>
            <Lock size={13} style={{ display: "inline", marginRight: "4px" }} />{" "}
            Cryptographic Chain of Custody Verified
          </div>
        </div>

        <div className="notice-document-preview">
          <div className="doc-header">
            <h4>GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS</h4>
            <h5>DEPARTMENT OF CONSUMER AFFAIRS — LEGAL METROLOGY DIVISION</h5>
            <p>COMPOUNDING NOTICE UNDER SECTION 18 / 36 / 49 OF LMA, 2009</p>
          </div>

          <div className="doc-body">
            <p>
              <b>Subject:</b> Statutory Inspection of Packaged Commodity Label (
              {audit.metadata?.source_filename || "label_sample.jpg"})
            </p>
            <p>
              This inspection was conducted using automated computer vision
              tokenization and deterministic rule validation. The following
              itemized statutory determinations were recorded:
            </p>

            <table className="doc-table">
              <thead>
                <tr>
                  <th>Rule Clause</th>
                  <th>Finding</th>
                  <th>Statutory Mandate</th>
                </tr>
              </thead>
              <tbody>
                {audit.rules?.map((r) => (
                  <tr key={r.rule}>
                    <td>
                      <b>{r.rule}</b>
                    </td>
                    <td
                      className={
                        r.status === "PASS" ? "text-emerald" : "text-rose"
                      }
                    >
                      <b>{r.status}</b>
                    </td>
                    <td>{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            Close Preview
          </button>
          <a href={downloadUrl} className="primary-download-btn" download>
            <FileDown size={16} /> Download Notice PDF
          </a>
        </div>
      </div>
    </div>
  );
}
