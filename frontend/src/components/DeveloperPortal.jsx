import React, { useState } from 'react';
import { Key, Code, Activity, Copy, Check } from 'lucide-react';

export default function DeveloperPortal() {
  const [apiKey, setApiKey] = useState(null);
  const [keyType, setKeyType] = useState('trial'); // 'trial' or 'enterprise'
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('curl');

  // Mock usage data
  const usage = {
    used: 45,
    limit: keyType === 'trial' ? 100 : 10000
  };

  const generateKey = () => {
    const prefix = keyType === 'trial' ? 'trial_' : 'enterprise_';
    const randomHex = Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');
    setApiKey(`${prefix}${randomHex}`);
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const snippets = {
    curl: `curl -X POST http://localhost:8000/api/v1/pre-audit \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}" \\
  -d '{
    "ocr_text": "Manufactured by Seller Entity Ltd, Plot 1, New Delhi 110001. Net Qty 500 g MRP Rs. 100 (incl. of all taxes) 04/2026. Consumer care 1800111222 care@seller.com"
  }'`,
    python: `import requests

url = "http://localhost:8000/api/v1/pre-audit"
headers = {
    "X-API-Key": "${apiKey || 'YOUR_API_KEY'}",
    "Content-Type": "application/json"
}
data = {
    "ocr_text": "Manufactured by Seller Entity Ltd, Plot 1, New Delhi 110001. Net Qty 500 g MRP Rs. 100 (incl. of all taxes) 04/2026. Consumer care 1800111222 care@seller.com"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`,
    nodejs: `const fetch = require('node-fetch');

const url = 'http://localhost:8000/api/v1/pre-audit';
const options = {
  method: 'POST',
  headers: {
    'X-API-Key': '${apiKey || 'YOUR_API_KEY'}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ocr_text: 'Manufactured by Seller Entity Ltd, Plot 1, New Delhi 110001. Net Qty 500 g MRP Rs. 100 (incl. of all taxes) 04/2026. Consumer care 1800111222 care@seller.com'
  })
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error('error:' + err));`
  };

  return (
    <div className="analytics-dashboard" style={{ padding: '2rem' }}>
      <h2><Code size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }}/> Developer Portal</h2>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>

        {/* API Key Management */}
        <div className="card">
          <h3><Key size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }}/> API Key Management</h3>
          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <label style={{ marginRight: '1rem' }}>
              <input
                type="radio"
                name="keyType"
                value="trial"
                checked={keyType === 'trial'}
                onChange={() => setKeyType('trial')}
                style={{ marginRight: '0.5rem' }}
              />
              Trial (100 req/min)
            </label>
            <label>
              <input
                type="radio"
                name="keyType"
                value="enterprise"
                checked={keyType === 'enterprise'}
                onChange={() => setKeyType('enterprise')}
                style={{ marginRight: '0.5rem' }}
              />
              Enterprise (10,000 req/min)
            </label>
          </div>

          <button className="primary-btn" onClick={generateKey} style={{ marginBottom: '1rem' }}>
            Generate API Key
          </button>

          {apiKey && (
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              <code style={{ flex: 1, fontFamily: 'monospace' }}>{apiKey}</code>
              <button onClick={copyToClipboard} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                {copied ? <Check size={18} color="green" /> : <Copy size={18} />}
              </button>
            </div>
          )}
        </div>

        {/* Usage Quota */}
        <div className="card">
          <h3><Activity size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }}/> Usage Quota</h3>
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Scans Used / Per Minute Quota</span>
              <strong>{usage.used} / {usage.limit}</strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--surface-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${(usage.used / usage.limit) * 100}%`,
                height: '100%',
                background: 'var(--accent-color)'
              }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* Code Snippets */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>API Integration Snippets</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Use the <code>/api/v1/pre-audit</code> endpoint to analyze packaging artwork compliance programmatically.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
          {Object.keys(snippets).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : 'none',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab ? 'bold' : 'normal'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <pre style={{
          background: 'var(--surface-color)',
          padding: '1rem',
          borderRadius: '4px',
          overflowX: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          border: '1px solid var(--border-color)'
        }}>
          <code>{snippets[activeTab]}</code>
        </pre>
      </div>
    </div>
  );
}
