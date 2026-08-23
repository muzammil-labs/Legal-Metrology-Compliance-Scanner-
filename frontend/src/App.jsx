import { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileScan, Upload } from 'lucide-react';
import { executeScanWithCircuitBreaker, loadPrecachedFixture } from './services/api';

const modes = [{ key: null, label: 'Live Camera' }, { key: 'control_pass', label: 'Product 1 · Pass' }, { key: 'control_fail_tax', label: 'Product 2 · Tax fail' }, { key: 'control_fail_unit', label: 'Product 3 · USP fail' }];

export default function App() {
  const [mode, setMode] = useState(null);
  const [file, setFile] = useState(null);
  const [audit, setAudit] = useState(() => loadPrecachedFixture('control_pass'));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Ready for inspection');

  async function runScan() {
    setLoading(true); setMessage('Analyzing label evidence...');
    try { setAudit(await executeScanWithCircuitBreaker(file, mode)); setMessage(mode ? 'Reference fixture loaded' : 'Inspection complete'); }
    catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }

  function chooseMode(key) { setMode(key); if (key) setAudit(loadPrecachedFixture(key)); setMessage(key ? 'Reference fixture loaded' : 'Ready for inspection'); }
  const failed = audit.overall_status === 'FAIL';
  return <main className="shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><FileScan size={20} /></span><div><strong>METROLOGY / 01</strong><span>FIELD AUDIT CONSOLE</span></div></div><div className="status-dot"><i /> SYSTEM ONLINE</div></header>
    <section className="intro"><div><p className="eyebrow">LEGAL METROLOGY COMPLIANCE SCANNER</p><h1>Inspect the label.<br /><em>Trust the evidence.</em></h1><p className="lede">Deterministic statutory checks for packaged commodity declarations.</p></div><div className="audit-stamp">AUDIT MODE<br /><b>{mode ? 'REFERENCE' : 'LIVE CAPTURE'}</b></div></section>
    <nav className="mode-switch" aria-label="Inspection mode">{modes.map(item => <button key={item.label} className={mode === item.key ? 'selected' : ''} onClick={() => chooseMode(item.key)}>{item.label}</button>)}</nav>
    <section className="workspace"><div className="capture-panel"><div className="panel-head"><span>01 / CAPTURE SURFACE</span><span className="mono">{message}</span></div><div className="viewport"><div className="grid-lines" />{loading && <div className="scanline" />}{mode && <div className="fixture-label">{modes.find(item => item.key === mode)?.label}</div>}<div className="viewport-center"><Upload size={28} /><p>{file ? file.name : 'Upload a package label'}</p><small>Camera input or image file</small></div><input type="file" accept="image/*" capture="environment" onChange={event => { setFile(event.target.files?.[0] ?? null); setMode(null); }} /></div><button className="scan-button" disabled={loading || (!file && !mode)} onClick={runScan}><FileScan size={18} /> {loading ? 'SCANNING' : 'RUN COMPLIANCE SCAN'}</button></div><div className="results-panel"><div className="panel-head"><span>02 / AUDIT RESULT</span><span className={failed ? 'badge fail' : 'badge pass'}>{failed ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />} {audit.overall_status}</span></div><div className="result-hero"><span className="result-number">{audit.rules.filter(rule => rule.status === 'PASS').length.toString().padStart(2, '0')}</span><div><h2>Rules passed</h2><p>Out of {audit.rules.length} deterministic checks</p></div></div><div className="rule-list">{audit.rules.map(rule => <div className="rule" key={rule.rule}><span className={rule.status === 'PASS' ? 'rule-icon pass' : 'rule-icon fail'}>{rule.status === 'PASS' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}</span><div><strong>{rule.rule}</strong><p>{rule.reason}</p></div><span className="rule-status">{rule.status}</span></div>)}</div></div></section>
  </main>;
}
