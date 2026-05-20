import { User } from '../api';
import { S } from '../theme';

type Props = {
  user: User;
  onLogout: () => void;
  onHome: () => void;
  onShareApp: () => void;
  appLinkCopied: boolean;
};

export default function AppHeader({ user, onLogout, onHome, onShareApp, appLinkCopied }: Props) {
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'NG';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#fff',
        borderBottom: '2px solid #fed7aa',
        padding: '0 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        minHeight: 56,
        boxShadow: '0 2px 8px rgba(120,53,15,0.08)',
      }}
    >
      <button onClick={onHome} style={{ ...S.linkBtn, fontSize: '1.05rem', fontWeight: 800 }}>
        🏘️ NeighborGoods
      </button>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 999, padding: '0.3rem 0.65rem', fontWeight: 700, fontSize: '0.82rem', color: '#92400e' }}>
          🪙 {user.tokenBalance}
        </div>
        <button onClick={onShareApp} style={{ ...S.smallOutlineBtn, fontSize: '0.78rem' }}>
          {appLinkCopied ? '✓ Copied!' : '🔗 Share'}
        </button>
        <div
          title={`${user.firstName} ${user.lastName}`}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#fef3c7',
            border: '2px solid #fde68a',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            color: '#92400e',
            fontSize: '0.8rem',
          }}
        >
          {initials}
        </div>
        <button onClick={onLogout} style={{ ...S.smallOutlineBtn, fontSize: '0.75rem' }}>
          Logout
        </button>
      </div>
    </header>
  );
}
