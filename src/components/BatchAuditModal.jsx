import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  FileArchive,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";

export default function BatchAuditModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (
      droppedFile &&
      (droppedFile.name.endsWith(".zip") || droppedFile.name.endsWith(".csv"))
    ) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please drop a valid .zip or .csv file");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/v1/batch-audit", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Batch upload failed:", err);
      setError("Failed to process batch. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content batch-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2>High-Throughput Batch Audit</h2>

        {!result ? (
          <>
            <p>
              Upload a ZIP archive (up to 50 label images) or a CSV file
              (packaging text) for concurrent statutory validation.
            </p>

            <div
              className={`dropzone ${file ? "has-file" : ""}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".zip,.csv"
                onChange={handleFileChange}
              />

              {file ? (
                <div className="selected-file">
                  <FileArchive size={48} className="text-cyan" />
                  <h4>{file.name}</h4>
                  <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                  <button
                    className="btn-secondary mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="empty-dropzone">
                  <Upload size={48} className="text-muted" />
                  <h4>Drag & Drop ZIP or CSV here</h4>
                  <p>or click to browse files</p>
                </div>
              )}
            </div>

            {error && (
              <div className="error-message mt-4 text-red-500">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <div className="modal-actions mt-6">
              <button
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-primary scan-button"
                disabled={!file || loading}
                onClick={handleUpload}
              >
                {loading ? "Processing Batch..." : "Start Audit Engine"}
              </button>
            </div>

            {loading && (
              <div className="progress-container mt-4">
                <div className="progress-bar-indeterminate"></div>
                <p className="text-center mt-2 small">
                  Analyzing SKUs concurrently...
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="batch-results">
            <div className="summary-stats mt-4">
              <div className="stat-box">
                <span className="stat-label">Total SKUs</span>
                <span className="stat-value">{result.total_skus}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label text-emerald">Passed</span>
                <span className="stat-value text-emerald">
                  {result.passed_skus}
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-label text-rose">Failed</span>
                <span className="stat-value text-rose">
                  {result.failed_skus}
                </span>
              </div>
            </div>

            <h3 className="mt-6 mb-2">Item Breakdown</h3>
            <div
              className="table-responsive"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              <table className="docket-table">
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "var(--bg-card)",
                    zIndex: 1,
                  }}
                >
                  <tr>
                    <th>SKU / Filename</th>
                    <th>Status</th>
                    <th>Violations</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <b>{item.filename}</b>
                        <br />
                        <small className="mono text-muted">{item.sku_id}</small>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${item.overall_status === "PASS" ? "pass" : "fail"}`}
                        >
                          {item.overall_status}
                        </span>
                      </td>
                      <td>
                        {item.violation_count > 0
                          ? `${item.violation_count} Flags`
                          : "Clean"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="modal-actions mt-6"
              style={{ justifyContent: "space-between" }}
            >
              <button className="btn-secondary" onClick={resetModal}>
                Upload Another
              </button>

              <a
                href={`/api/v1/batch-audit/download/${result.batch_id}`}
                className="btn-primary"
                download={`${result.batch_id}_notices.zip`}
              >
                <Download size={18} /> Download All PDF Notices (ZIP)
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
