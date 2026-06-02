import { useState } from 'react';
import { adminAuditData, adminFixOrphans, adminSyncMembership, DataIssue } from '../api';
import { S, mutedText, subheading } from '../theme';

type Props = { phone: string };

const severityStyle = (s: string): React.CSSProperties =>
  s === 'error'
    ? { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }
    : { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };

const FIX_LABELS: Record<string, string> = {
  delete_orphaned_items: '🗑️ Delete orphaned items',
  delete_orphaned_interests: '🗑️ Delete orphaned interests',
  sync_membership: '🔄 Sync community membership',
};

export default function MaintenanceTab({ phone }: Props) {
  const [issues, setIssues] = useState<DataIssue[] | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [auditError, setAuditError] = useState('');

  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [fixError, setFixError] = useState('');

  const runAudit = async () => {
    setAuditing(true); setAuditError(''); setIssues(null); setResults({});
    try {
      const res = await adminAuditData(phone);
      if (!res.success) setAuditError(res.message || 'Audit failed.');
      else setIssues(res.issues);
    } catch (e) { setAuditError(e instanceof Error ? e.message : 'Error'); }
    setAuditing(false);
  };

  const runFix = async (fixKey: string) => {
    setRunning(fixKey); setFixError('');
    try {
      let msg = '';
      if (fixKey === 'sync_membership') {
        const res = await adminSyncMembership(phone);
        msg = res.message || `Updated ${res.communitiesUpdated} communities, ${res.usersUpdated} users`;
      } else {
        const res = await adminFixOrphans(phone, fixKey);
        msg = `Deleted ${res.deleted} orphaned record(s)`;
      }
      setResults(prev => ({ ...prev, [fixKey]: msg }));
      // Re-run audit to refresh
      const audit = await adminAuditData(phone);
      if (audit.success) setIssues(audit.issues);
    } catch (e) { setFixError(e instanceof Error ? e.message : 'Error running fix'); }
    setRunning(null);
  };

  // Group issues by fix type
  const byFix = (issues ?? []).reduce<Record<string, DataIssue[]>>((acc, issue) => {
    const key = issue.fix ?? '__none__';
    (acc[key] ??= []).push(issue);
    return acc;
  }, {});

  const fixKeys = Object.keys(byFix).filter(k => k !== '__none__');
  const unfixable = byFix['__none__'] ?? [];

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <div style={{ ...S.card, display: 'grid', gap: '0.75rem' }}>
        <h3 style={{ ...subheading, margin: 0 }}>🔧 Data Maintenance</h3>
        <p style={mutedText}>Scan all data for known issues, then apply fixes.</p>
        <button style={S.primaryBtn} disabled={auditing} onClick={runAudit}>
          {auditing ? '⏳ Scanning…' : '🔍 Run audit'}
        </button>
        {auditError && <div style={S.errorBox}>{auditError}</div>}
        {issues !== null && issues.length === 0 && (
          <div style={S.successBox}>✅ No issues found — data looks clean!</div>
        )}
      </div>

      {fixKeys.map(fixKey => (
        <div key={fixKey} style={{ ...S.card, display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ ...subheading, margin: 0 }}>
              {FIX_LABELS[fixKey] ?? fixKey}{' '}
              <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#92400e' }}>
                ({byFix[fixKey].length} issue{byFix[fixKey].length !== 1 ? 's' : ''})
              </span>
            </h3>
            <button style={S.smallBtn} disabled={running === fixKey} onClick={() => runFix(fixKey)}>
              {running === fixKey ? '⏳ Fixing…' : '⚡ Apply fix'}
            </button>
          </div>

          {results[fixKey] && (
            <div style={S.successBox}>✅ {results[fixKey]}</div>
          )}

          <div style={{ display: 'grid', gap: '0.4rem' }}>
            {byFix[fixKey].map((issue, i) => (
              <div key={i} style={{ ...severityStyle(issue.severity), borderRadius: '0.6rem', padding: '0.6rem 0.8rem', fontSize: '0.83rem' }}>
                <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', opacity: 0.7 }}>{issue.type} · {issue.severity}</span>
                <div>{issue.description}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {unfixable.length > 0 && (
        <div style={{ ...S.card, display: 'grid', gap: '0.75rem' }}>
          <h3 style={{ ...subheading, margin: 0 }}>⚠️ Manual attention required ({unfixable.length})</h3>
          <div style={{ display: 'grid', gap: '0.4rem' }}>
            {unfixable.map((issue, i) => (
              <div key={i} style={{ ...severityStyle(issue.severity), borderRadius: '0.6rem', padding: '0.6rem 0.8rem', fontSize: '0.83rem' }}>
                <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', opacity: 0.7 }}>{issue.type} · {issue.severity}</span>
                <div>{issue.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fixError && <div style={S.errorBox}>{fixError}</div>}
    </div>
  );
}
