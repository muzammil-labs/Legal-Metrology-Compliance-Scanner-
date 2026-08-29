import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ComplianceSummaryCard({ rule }) {
  const [expanded, setExpanded] = useState(false);
  const isExpandable = rule.rule === 'Rule 5' || rule.rule === 'Bilingual Consistency';

  return (
    <div
      className="rule"
      onClick={() => isExpandable && setExpanded(!expanded)}
      style={{ cursor: isExpandable ? 'pointer' : 'default' }}
    >
      <span className={rule.status === 'PASS' ? 'rule-icon pass' : 'rule-icon fail'}>
        {rule.status === 'PASS' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
      </span>
      <div>
        <strong>{rule.rule}</strong>
        <p>{rule.reason}</p>
        {isExpandable && expanded && (
          <div className="rule-details" style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            <pre>{JSON.stringify(rule.calculated_values, null, 2)}</pre>
          </div>
        )}
      </div>
      <span className="rule-status">{rule.status}</span>
    </div>
  );
}
