import React, { useState, useEffect } from 'react';
import { BarChart3, AlertTriangle, CheckCircle2, ShieldAlert, Activity, FileWarning, Search, ChevronDown, ListFilter } from 'lucide-react';

export default function InspectorAnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('All');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/summary');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="workspace">
        <div className="capture-panel" style={{ width: '100%', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="scanline" style={{ position: 'relative', width: '200px' }} />
          <p className="mono" style={{ color: '#22d3ee', marginTop: '20px' }}>AGGREGATING DATA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace">
        <div className="capture-panel" style={{ width: '100%' }}>
          <div className="panel-head">
            <span>ERROR</span>
            <span className="badge fail"><AlertTriangle size={15} /> FAILED</span>
          </div>
          <p style={{ color: '#fb7185' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const districts = ['All', ...Object.keys(data.by_region)];
  const filteredTotal = selectedDistrict === 'All' ? data.total_inspections : data.by_region[selectedDistrict];
  const filteredFailed = selectedDistrict === 'All' ? data.failed_inspections : (data.regional_non_compliance[selectedDistrict] || 0);
  const filteredCompliance = filteredTotal > 0 ? ((filteredTotal - filteredFailed) / filteredTotal * 100).toFixed(1) : 0.0;

  return (
    <div className="dashboard-view" style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', marginTop: '18px' }}>

      {/* Top Controls */}
      <div className="capture-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
        <div className="panel-head" style={{ paddingBottom: 0 }}>
          <span>01 / ANALYTICS OVERVIEW</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ListFilter size={16} color="#71717a" />
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{
              background: '#18181b',
              color: '#f4f4f5',
              border: '1px solid #27272a',
              padding: '6px 12px',
              fontFamily: "'DM Mono', monospace",
              fontSize: '11px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {districts.map(d => (
              <option key={d} value={d}>{d.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px' }}>
        <div className="results-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span className="mono" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={14}/> TOTAL INSPECTIONS</span>
          <div className="result-number" style={{ color: '#f4f4f5', fontSize: '36px', border: 'none', padding: 0 }}>{filteredTotal}</div>
          {selectedDistrict !== 'All' && <small style={{ color: '#71717a', fontSize: '11px' }}>In {selectedDistrict}</small>}
        </div>

        <div className="results-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span className="mono" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14}/> COMPLIANCE RATE</span>
          <div className="result-number" style={{ color: filteredCompliance >= 80 ? '#34d399' : '#fb7185', fontSize: '36px', border: 'none', padding: 0 }}>
            {selectedDistrict === 'All' ? data.compliance_rate.toFixed(1) : filteredCompliance}%
          </div>
        </div>

        <div className="results-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span className="mono" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Search size={14}/> ACTIVE DISTRICTS</span>
          <div className="result-number" style={{ color: '#22d3ee', fontSize: '36px', border: 'none', padding: 0 }}>{data.active_districts}</div>
        </div>

        <div className="results-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span className="mono" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={14}/> REPEAT OFFENDERS</span>
          <div className="result-number" style={{ color: '#f59e0b', fontSize: '36px', border: 'none', padding: 0 }}>3</div>
          <small style={{ color: '#71717a', fontSize: '11px' }}>Brands flagged &gt; 2 times</small>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

        {/* Statutory Violation Frequencies */}
        <div className="capture-panel">
          <div className="panel-head">
            <span>STATUTORY INFRACTION FREQUENCIES</span>
            <BarChart3 size={15} color="#71717a" />
          </div>
          <div className="rule-list" style={{ marginTop: '10px' }}>
            {data.top_violations.map((v, i) => {
              const maxCount = data.top_violations[0]?.count || 1;
              const width = `${Math.max((v.count / maxCount) * 100, 5)}%`;
              return (
                <div key={v.rule} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#d4d4d8' }}>{v.rule}</strong>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#fb7185' }}>{v.count} violations</span>
                  </div>
                  <div style={{ width: '100%', background: '#27272a', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width, background: '#fb7185', height: '100%', transition: 'width 0.5s ease-out' }}></div>
                  </div>
                </div>
              );
            })}
            {data.top_violations.length === 0 && (
              <p style={{ color: '#71717a', fontSize: '12px' }}>No violations recorded.</p>
            )}
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="capture-panel">
          <div className="panel-head">
            <span>REGIONAL NON-COMPLIANCE</span>
            <FileWarning size={15} color="#71717a" />
          </div>
          <div className="rule-list" style={{ marginTop: '10px' }}>
            {Object.entries(data.regional_non_compliance)
              .sort((a, b) => b[1] - a[1])
              .map(([region, count]) => {
                const maxCount = Math.max(...Object.values(data.regional_non_compliance));
                const width = `${Math.max((count / maxCount) * 100, 5)}%`;
                return (
                  <div key={region} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#d4d4d8' }}>{region}</strong>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#f59e0b' }}>{count} fails</span>
                    </div>
                    <div style={{ width: '100%', background: '#27272a', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width, background: '#f59e0b', height: '100%', transition: 'width 0.5s ease-out' }}></div>
                    </div>
                  </div>
                );
            })}
            {Object.keys(data.regional_non_compliance).length === 0 && (
              <p style={{ color: '#71717a', fontSize: '12px' }}>No non-compliant regions recorded.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
