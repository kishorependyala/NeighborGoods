import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Community, socialAuth, User } from './api';
import AuthFlow from './components/AuthFlow';
import AppHeader from './components/AppHeader';
import CommunitiesTab from './components/CommunitiesTab';
import TradesTab from './components/TradesTab';
import SuperAdminPanel from './components/SuperAdminPanel';
import { S, tab } from './theme';

type AppTab = 'communities' | 'trades' | 'admin';

const STORAGE_KEY = 'ng_user';

function readHashCommunityId() {
  const match = window.location.hash.match(/^#community=(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function communityShareUrl(id: string) {
  return `${window.location.origin}${window.location.pathname}#community=${encodeURIComponent(id)}`;
}

function appShareUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function useCopyLink(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), timeout);
    });
  }, [timeout]);
  return { copied, copy };
}

export default function App() {
  const { user: auth0User, isAuthenticated, logout: auth0Logout } = useAuth0();
  const [user, setUser] = useState<User | null>(null);
  const [tabId, setTabId] = useState<AppTab>('communities');
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [hashCommunityId, setHashCommunityId] = useState<string | null>(() => readHashCommunityId());
  const { copied: appLinkCopied, copy } = useCopyLink();

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => setHashCommunityId(readHashCommunityId());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (selectedCommunity) {
      window.history.replaceState(null, '', `#community=${encodeURIComponent(selectedCommunity.id)}`);
    } else if (window.location.hash.startsWith('#community=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [selectedCommunity?.id]);

  const setSessionUser = (next: User | null) => {
    setUser(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Sync Auth0 social login → backend user record
  useEffect(() => {
    if (isAuthenticated && auth0User) {
      const email = (auth0User.email || '').toLowerCase();
      const name = auth0User.name || auth0User.nickname || email.split('@')[0] || 'User';
      const picture = auth0User.picture || '';
      if (!email) return;
      socialAuth(email, name, picture).then((res) => {
        if (res.success && res.user) {
          const u: User = { ...res.user, email, picture, authMethod: 'social' };
          const stored = localStorage.getItem(STORAGE_KEY);
          const current = stored ? JSON.parse(stored) as User : null;
          if (!current || current.authMethod === 'social' || current.id !== u.id) {
            setSessionUser(u);
          }
        }
      }).catch(() => {
        // Fallback: use Auth0 data if backend unreachable
        const parts = name.split(' ', 1);
        const u: User = {
          id: '', phone: email, firstName: parts[0], lastName: parts[1] || '',
          email, picture, authMethod: 'social', tokenBalance: 0, communityIds: [],
        };
        setSessionUser(u);
      });
    }
    // eslint-disable-next-line
  }, [isAuthenticated, auth0User]);

  const availableTabs = useMemo(() => {
    if (!user) return [] as { id: AppTab; label: string; emoji: string }[];
    return [
      { id: 'communities' as AppTab, label: 'Communities', emoji: '🏘️' },
      ...(user.communityIds?.length ? [{ id: 'trades' as AppTab, label: 'Trades', emoji: '🔄' }] : []),
      ...(user.isSuperAdmin ? [{ id: 'admin' as AppTab, label: 'Admin', emoji: '🔑' }] : []),
    ];
  }, [user]);

  if (!user) {
    return <AuthFlow onAuth={setSessionUser} />;
  }

  const handleShare = () => {
    copy(selectedCommunity ? communityShareUrl(selectedCommunity.id) : appShareUrl());
  };

  return (
    <div style={S.page}>
      <AppHeader
        user={user}
        onLogout={() => {
          setSelectedCommunity(null);
          setTabId('communities');
          setSessionUser(null);
          if (isAuthenticated) {
            auth0Logout({ logoutParams: { returnTo: window.location.origin } });
          }
        }}
        onHome={() => {
          setSelectedCommunity(null);
          setTabId('communities');
        }}
        onShareApp={handleShare}
        appLinkCopied={appLinkCopied}
      />

      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          borderBottom: '2px solid #fed7aa',
          background: '#fff',
          padding: '0 1rem',
          position: 'sticky',
          top: 56,
          zIndex: 90,
          overflowX: 'auto',
        }}
      >
        {availableTabs.map(item => (
          <button key={item.id} onClick={() => setTabId(item.id)} style={tab(tabId === item.id)}>
            {item.emoji} {item.label}
          </button>
        ))}
      </div>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '1rem', display: 'grid', gap: '1rem' }}>
        {tabId === 'communities' && (
          <CommunitiesTab
            user={user}
            isAdmin={!!user.isSuperAdmin}
            selectedCommunity={selectedCommunity}
            onSelectCommunity={community => {
              setSelectedCommunity(community);
              if (community) setTabId('communities');
            }}
            onUserChange={setSessionUser}
            initialHashCommunityId={hashCommunityId}
          />
        )}

        {tabId === 'trades' && (
          selectedCommunity ? (
            <TradesTab community={selectedCommunity} user={user} />
          ) : (
            <div style={S.card}>Choose a community first to view trade matches.</div>
          )
        )}

        {tabId === 'admin' && user.isSuperAdmin && (
          <SuperAdminPanel
            user={user}
            onImpersonate={nextUser => {
              setSelectedCommunity(null);
              setTabId('communities');
              setSessionUser(nextUser);
            }}
          />
        )}
      </main>

      <footer style={{
        marginTop: '2rem',
        borderTop: '1px solid #fed7aa',
        padding: '1.25rem 1rem',
        textAlign: 'center',
        display: 'grid',
        gap: '0.3rem',
      }}>
        <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 600 }}>
          Designed by Vihaan, Sid &amp; Rishik
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          © {new Date().getFullYear()} Tea Break Tech · All rights reserved
        </div>
      </footer>
    </div>
  );
}
