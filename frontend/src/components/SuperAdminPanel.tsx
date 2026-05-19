import { useEffect, useState } from 'react';
import {
  adminBrowseData,
  adminGetConfig,
  adminLoginAs,
  adminReadFile,
  Community,
  deleteAdminCommunity,
  deleteAdminUser,
  getAllCommunities,
  getAllUsers,
  User,
  AdminBrowseEntry,
} from '../api';
import { S, tab, mutedText, sectionTitle } from '../theme';

type Props = {
  user: User;
  onImpersonate: (user: User) => void;
};

type SuperTab = 'communities' | 'users' | 'data' | 'config';

const SUPER_TABS: { id: SuperTab; label: string; emoji: string }[] = [
  { id: 'communities', label: 'Communities', emoji: '🏘️' },
  { id: 'users', label: 'Users', emoji: '👥' },
  { id: 'data', label: 'Data', emoji: '📁' },
  { id: 'config', label: 'Config', emoji: '⚙️' },
];

export default function SuperAdminPanel({ user, onImpersonate }: Props) {
  const [tabId, setTabId] = useState<SuperTab>('communities');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<AdminBrowseEntry[]>([]);
  const [dataDir, setDataDir] = useState('');
  const [path, setPath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [config, setConfig] = useState<Record<string, string | boolean>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadCommunities = async () => setCommunities(await getAllCommunities(user.phone));
  const loadUsers = async () => setUsers(await getAllUsers(user.phone));

  const loadData = async (nextPath = '') => {
    const res = await adminBrowseData(user.phone, nextPath);
    setEntries(res.entries);
    setPath(res.path);
    setDataDir(res.dataDir);
  };

  const loadConfig = async () => {
    const res = await adminGetConfig(user.phone);
    setConfig(res.config);
    setDataDir(res.dataDir);
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        if (tabId === 'communities') await loadCommunities();
        if (tabId === 'users') await loadUsers();
        if (tabId === 'data') await loadData(path);
        if (tabId === 'config') await loadConfig();
      } catch (err: any) {
        setError(err.message || 'Unable to load admin data');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tabId, user.phone]);

  const parentPath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={S.card}>
        <h2 style={sectionTitle}>Super Admin</h2>
        <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid #fed7aa', marginTop: '0.85rem', overflowX: 'auto' }}>
          {SUPER_TABS.map(tabItem => (
            <button key={tabItem.id} onClick={() => setTabId(tabItem.id)} style={tab(tabId === tabItem.id)}>
              {tabItem.emoji} {tabItem.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={S.errorBox}>{error}</div>}
      {loading && <div style={S.card}>Loading admin tools...</div>}

      {!loading && tabId === 'communities' && (
        <div style={S.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th align="left">Name</th>
                  <th align="left">Members</th>
                  <th align="left">Invite</th>
                  <th align="left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {communities.map(community => (
                  <tr key={community.id} style={{ borderTop: '1px solid #fed7aa' }}>
                    <td style={{ padding: '0.7rem 0' }}>{community.name}</td>
                    <td>{community.memberIds.length}</td>
                    <td>{community.inviteCode}</td>
                    <td>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Delete ${community.name}?`)) return;
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
                <tr>
                  <th align="left">Name</th>
                  <th align="left">Phone</th>
                  <th align="left">Tokens</th>
                  <th align="left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(row => (
                  <tr key={row.id} style={{ borderTop: '1px solid #fed7aa' }}>
                    <td style={{ padding: '0.7rem 0' }}>{row.firstName} {row.lastName}</td>
                    <td>{row.phone}</td>
                    <td>{row.tokenBalance}</td>
                    <td style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', padding: '0.45rem 0' }}>
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

      {!loading && tabId === 'data' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <strong style={{ color: '#78350f' }}>DATA_DIR</strong>
                <div style={mutedText}>{dataDir || '(loading...)'}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => loadData('')} style={S.smallOutlineBtn}>Root</button>
                <button onClick={() => loadData(parentPath)} style={S.smallOutlineBtn} disabled={!path}>Up</button>
              </div>
            </div>
            <div style={{ marginTop: '0.85rem', display: 'grid', gap: '0.6rem' }}>
              {entries.map(entry => (
                <button
                  key={entry.path}
                  onClick={async () => {
                    if (entry.isDir) {
                      await loadData(entry.path);
                    } else {
                      const res = await adminReadFile(user.phone, entry.path);
                      setFileContent(res.content);
                    }
                  }}
                  style={{
                    textAlign: 'left',
                    border: '1px solid #fed7aa',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <strong>{entry.isDir ? '📁' : '📄'} {entry.name}</strong>
                  <div style={mutedText}>{entry.modified} • {entry.size} bytes</div>
                </button>
              ))}
            </div>
          </div>
          <div style={S.card}>
            <strong style={{ color: '#78350f' }}>File viewer</strong>
            <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', marginTop: '0.85rem', fontSize: '0.82rem', color: '#444', background: '#fffbeb', padding: '0.85rem', borderRadius: '0.75rem' }}>
              {fileContent || 'Select a JSON file to preview it here.'}
            </pre>
          </div>
        </div>
      )}

      {!loading && tabId === 'config' && (
        <div style={S.card}>
          <div style={mutedText}>Non-secret configuration only.</div>
          <div style={{ display: 'grid', gap: '0.65rem', marginTop: '0.85rem' }}>
            {Object.entries(config).map(([key, value]) => (
              <div key={key} style={{ border: '1px solid #fed7aa', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <strong style={{ color: '#78350f' }}>{key}</strong>
                <div style={mutedText}>{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
