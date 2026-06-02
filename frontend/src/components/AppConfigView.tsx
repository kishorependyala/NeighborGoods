import { useEffect, useState } from 'react';
import { adminGetConfig, AdminConfig } from '../api';
import { S, mutedText, subheading } from '../theme';

type Props = { phone: string };

export default function AppConfigView({ phone }: Props) {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    adminGetConfig(phone)
      .then(res => setConfig(res))
      .catch(e => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [phone]);

  if (loading) return <div style={S.card}><p style={mutedText}>Loading config…</p></div>;
  if (error) return <div style={S.errorBox}>{error}</div>;
  if (!config) return null;

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Section title="🌐 Environment">
        <Row label="Environment" value={config.environment} highlight={config.environment !== 'local'} />
        <Row label="Data directory" value={config.dataDir} mono />
        <Row label="Python version" value={config.pythonVersion.split(' ')[0]} mono />
      </Section>

      <Section title="📊 Data summary">
        <Row label="Users" value={String(config.userCount)} />
        <Row label="Communities" value={String(config.communityCount)} />
        <Row label="Items" value={String(config.itemCount)} />
        <Row label="Total data files" value={String(config.totalDataFiles)} />
      </Section>

      <Section title="🔐 Super admins">
        {config.superAdmins.length === 0
          ? <p style={mutedText}>No super admins configured (set SUPER_ADMIN_PHONES env var).</p>
          : config.superAdmins.map((p, i) => (
            <div key={i} style={{ padding: '0.4rem 0.6rem', background: '#fef3c7', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.88rem', color: '#78350f' }}>
              {p}
            </div>
          ))}
      </Section>

      <Section title="⚙️ Configuration">
        {Object.entries(config.config).map(([key, value]) => (
          <Row key={key} label={key} value={String(value)} mono />
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ ...S.card, display: 'grid', gap: '0.65rem' }}>
      <h3 style={{ ...subheading, margin: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0.3rem 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ ...mutedText, fontSize: '0.85rem' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'monospace' : 'inherit', fontSize: mono ? '0.82rem' : '0.88rem', fontWeight: 600, color: highlight ? '#16a34a' : '#78350f', wordBreak: 'break-all', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}
