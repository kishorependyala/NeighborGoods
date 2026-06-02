import { useEffect, useState } from 'react';
import {
  adminLoginAs,
  Community,
  deleteAdminCommunity,
  deleteAdminUser,
  getAllCommunities,
  getAllUsers,
  User,
} from '../api';
import { S, tab, mutedText, sectionTitle } from '../theme';
import AppConfigView from './AppConfigView';
import DataBrowser from './DataBrowser';
import MaintenanceTab from './MaintenanceTab';

type Props = {
  user: User;
  onImpersonate: (user: User) => void;
};

type SuperTab = 'communities' | 'users' | 'data' | 'config' | 'maintenance';

const SUPER_TABS: { id: SuperTab; label: string; emoji: string }[] = [
  { id: 'communities', label: 'Communities', emoji: '🏘️' },
  { id: 'users', label: 'Users', emoji: '👥' },
  { id: 'data', label: 'Data', emoji: '📁' },
  { id: 'config', label: 'Config', emoji: '⚙️' },
  { id: 'maintenance', label: 'Maintenance', emoji: '🔧' },
];

export default function SuperAdminPanel({ user, onImpersonate }: Props) {
  const [tabId, setTabId] = useState<SuperTab>('communities');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadCommunities = async () => setCommunities(await getAllCommunities(user.phone));
  const loadUsers = async () => setUsers(await getAllUsers(user.phone));

  useEffect(() => {
    if (tabId !== 'communities' && tabId !== 'users') return;
    const run = async () => {
      setLoading(true); setError('');
      try {
        if (tabId === 'communities') await loadCommunities();
        if (tabId === 'users') await loadUsers();
      } catch (err: any) {
        setError(err.message || 'Unable to load admin data');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tabId, user.phone]);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={S.card}>
        <h2 style={sectionTitle}>Admin</h2>
        <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid #fed7aa', marginTop: '0.85rem', overflowX: 'auto' }}>
          {SUPER_TABS.map(tabItem => (
            <button key={tabItem.id} onClick={() => setTabId(tabItem.id)} style={tab(tabId === tabItem.id)}>
              {tabItem.emoji} {tabItem.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={S.errorBox}>{error}</div>}
      {loading && <div style={S.card}>Loading…</div>}

      {!loading && tabId === 'communities' && (
        <div style={S.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fffbeb', borderBottom: '2px solid #fde68a' }}>
                  <th align="left" style={{ padding: '0.6rem', color: '#92400e' }}>Name</th>
                  <th align="left" style={{ padding: '0.6rem', color: '#92400e' }}>Members</th>
                  <th align="left" style={{ padding: '0.6rem', color: '#92400e' }}>Invite</th>
                  <th align="left" style={{ padding: '0.6rem', color: '#92400e' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {communities.map(community => (
                  <tr key={community.id} style={{ borderTop: '1px solid #fed7aa' }}>
                    <td style={{ padding: '0.7rem 0.6rem' }}>{community.name}</td>
                    <td style={{ padding: '0.7rem 0.6rem' }}>{community.memberIds.length}</td>
                    <td style={{ padding: '0.7rem 0.6rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{community.inviteCode}</td>
                    <td style={{ padding: '0.7rem 0.6rem' }}>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Delete "${community.name}"? This removes all its items.`)) return;
                          await deleteAdminCommunity(community.id, user.phone);
                          await loadCommunities();
                        }}
                        style={S.smallOutlineBtn}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tabId === 'users' && (
        <div style={S.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fffbeb', borderBottom: '2px solid #fde68a' }}>
                  <th align="left" style={{ padding: '0.6rem', color: '#92400e' }}>Name</th>
                  <th align="left" style={{ padding: '0.6rem', color: '#92400e' }}>Phone / Email</th>
                  <th align="left" style={{ padding: '0.6rem', color: '#92400e' }}>Tokens</th>
                  <th align="left" style={{ padding: '0.6rem', color: '#92400e' }}>Auth</th>
                  <th align="left" style={{ padding: '0.6rem', color: '#92400e' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(row => (
                  <tr key={row.id} style={{ borderTop: '1px solid #fed7aa' }}>
                    <td style={{ padding: '0.7rem 0.6rem' }}>{row.firstName} {row.lastName}</td>
                    <td style={{ padding: '0.7rem 0.6rem', fontFamily: 'monospace', fontSize: '0.82rem' }}>{row.phone}</td>
                    <td style={{ padding: '0.7rem 0.6rem' }}>{row.tokenBalance} 🪙</td>
                    <td style={{ padding: '0.7rem 0.6rem' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '99px', background: row.authMethod === 'social' ? '#dbeafe' : '#dcfce7', color: row.authMethod === 'social' ? '#1d4ed8' : '#166534', fontWeight: 600 }}>
                        {row.authMethod || 'phone'}
                      </span>
                    </td>
                    <td style={{ padding: '0.7rem 0.6rem', display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={async () => {
                          const res = await adminLoginAs(user.phone, row.phone);
                          onImpersonate(res.user);
                        }}
                        style={S.smallBtn}
                      >
                        Login As
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Delete ${row.firstName} ${row.lastName}?`)) return;
                          await deleteAdminUser(row.id, user.phone);
                          await loadUsers();
                        }}
                        style={S.smallOutlineBtn}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tabId === 'data' && <DataBrowser phone={user.phone} />}
      {tabId === 'config' && <AppConfigView phone={user.phone} />}
      {tabId === 'maintenance' && <MaintenanceTab phone={user.phone} />}
    </div>
  );
}

