import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle2, FileDown, MapPin, BarChart3, RefreshCw } from 'lucide-react';
import { fetchAnalyticsSummary, fetchInspections, getNoticeDownloadUrl } from '../services/api';

export default function InspectorAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [summary, list] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchInspections(25),
      ]);
      setAnalytics(summary);
      setInspections(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !analytics) {
    return (
      <div className="dashboard-loading">
        <RefreshCw className="spin" size={24} />
        <p>Loading Enforcement Analytics & Regional Docket...</p>
      </div>
    );
  }

  const regions = analytics?.by_region || {};
  const infractions = analytics?.by_rule_infractions || {};

  return (
    <section className="dashboard-view">
      <div className="dash-header">
        <div>
          <h2>Enforcement Analytics</h2>
          <p className="mono">All India Retail Zones — Statutory Audit Trail</p>
        </div>
        <button className="refresh-btn" onClick={loadData} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span>Total Audits</span>
          <strong>{analytics?.total_inspections ?? 0}</strong>
          <small>Pre-seeded & live field records</small>
        </div>
        <div className="kpi-card">
          <span>Compliance Rate</span>
          <strong className="text-emerald">{analytics?.compliance_rate ?? 0}%</strong>
          <small>{analytics?.compliant_inspections ?? 0} passed / {analytics?.failed_inspections ?? 0} non-compliant</small>
        </div>
        <div className="kpi-card">
          <span>Active Districts</span>
          <strong>{Object.keys(regions).length}</strong>
          <small>Delhi, Mumbai, Bengaluru, Kolkata, Chennai</small>
        </div>
        <div className="kpi-card">
          <span>Top Infraction</span>
          <strong className="text-rose">Rule 6(1)(e)</strong>
          <small>Tax inclusivity phrasing omissions</small>
        </div>
      </div>

      {/* Heatmap & Infraction Breakdown Grid */}
      <div className="dash-charts-grid">
        <div className="chart-panel">
          <div className="panel-head">
            <span><MapPin size={15} /> Regional Enforcement Heatmap</span>
            <span className="mono">Active Audit Hubs</span>
          </div>
          <div className="region-list">
            {Object.entries(regions).map(([name, count]) => (
              <div className="region-item" key={name}>
                <div className="region-name">
                  <b>{name}</b>
                  <span>{count} Inspections</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, (count / (analytics?.total_inspections || 1)) * 100 * 2.5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-panel">
          <div className="panel-head">
            <span><BarChart3 size={15} /> Statutory Infraction Frequency</span>
            <span className="mono">By Rule Code</span>
          </div>
          <div className="infraction-bars">
            {Object.entries(infractions).map(([rule, count]) => (
              <div className="infraction-item" key={rule}>
                <div className="infraction-label">
                  <strong>{rule}</strong>
                  <span className="badge-mini">{count} Violations</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill fill-rose"
                    style={{ width: `${Math.min(100, count * 15)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historical Inspection Docket */}
      <div className="docket-panel">
        <div className="panel-head">
          <span>Recent Inspections</span>
          <span className="mono">Section 36 Ready</span>
        </div>

        <div className="table-responsive">
          <table className="docket-table">
            <thead>
              <tr>
                <th>Dossier ID</th>
                <th>Target SKU / File</th>
                <th>Region & GPS</th>
                <th>Trust Score</th>
                <th>Status</th>
                <th>Violations</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((row) => (
                <tr key={row.inspection_id}>
                  <td><code>LM-{String(row.inspection_id).padStart(6, '0')}</code></td>
                  <td><b>{row.source_filename}</b></td>
                  <td>
                    <div>{row.region}</div>
                    <small className="text-muted">{row.gps_location || '28.6139° N, 77.2090° E'}</small>
                  </td>
                  <td>
                    <span className="trust-pill">{row.trust_score ?? 100}</span>
                  </td>
                  <td>
                    <span className={`status-pill ${row.overall_status === 'PASS' ? 'pass' : 'fail'}`}>
                      {row.overall_status}
                    </span>
                  </td>
                  <td>{row.violation_count} Flags</td>
                  <td>
                    <a
                      href={getNoticeDownloadUrl(row.inspection_id)}
                      className="download-link"
                      download
                    >
                      <FileDown size={14} /> Section 36 PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
