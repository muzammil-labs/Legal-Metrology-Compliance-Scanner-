import React, { useState } from "react";
import { Upload, CheckCircle2, AlertTriangle, Sparkles, Store, Download, FileText, FileImage } from "lucide-react";

export default function BatchAuditModal({ onBatchComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleFileSelection(e) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  }

  async function handleBatchUpload(e) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/batch-audit", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (onBatchComplete) {
        onBatchComplete(data);
      }
    } catch (err) {
      console.warn("Batch scan API failed", err);
      setError("Batch audit failed. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="batch-dropzone" style={{ border: "2px dashed var(--cyan)", padding: "2rem", borderRadius: "8px", textAlign: "center", background: "rgba(34, 211, 238, 0.05)" }}>
      <Upload size={36} className="text-cyan" style={{ margin: "0 auto 1rem" }} />
      <h3>Upload Product Labels for Batch Audit</h3>
      <p>
        Select a ZIP archive (up to 50 SKUs) or CSV file containing label texts.
      </p>

      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <input
          type="file"
          accept=".zip,.csv"
          onChange={handleFileSelection}
          disabled={loading}
          style={{ width: "100%", maxWidth: "300px", margin: "0 auto" }}
        />
      </div>

      {file && (
        <div className="file-list-preview" style={{ marginBottom: "1rem" }}>
          <small>Selected for Compliance Verification:</small>
          <div className="file-chips" style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            <span className="chip" style={{ background: "rgba(255,255,255,0.1)", padding: "0.25rem 0.75rem", borderRadius: "16px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {file.name.endsWith('.csv') ? <FileText size={14} /> : <FileImage size={14} />}
              {file.name}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: "#ef4444", marginBottom: "1rem", fontSize: "0.9rem" }}>
          <AlertTriangle size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} />
          {error}
        </div>
      )}

      <button
        className="scan-button"
        disabled={loading || !file}
        onClick={handleBatchUpload}
        style={{ width: "100%", padding: "0.75rem", background: "var(--cyan)", color: "#000", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: loading || !file ? "not-allowed" : "pointer", opacity: loading || !file ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
      >
        <Store size={18} />{" "}
        {loading
          ? "Auditing Catalogue SKUs..."
          : `Batch Audit File`}
      </button>
    </div>
  );
}
