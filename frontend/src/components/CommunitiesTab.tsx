import { useEffect, useState } from 'react';
import { Community, createCommunity, getAllCommunities, getMyCommunities, joinCommunity, User } from '../api';
import ItemsTab from './ItemsTab';
import { S, mutedText, sectionTitle, subheading } from '../theme';

type Props = {
  user: User;
  isAdmin: boolean;
  selectedCommunity: Community | null;
  onSelectCommunity: (community: Community | null) => void;
  onUserChange: (user: User) => void;
  initialHashCommunityId?: string | null;
};

export default function CommunitiesTab({ user, isAdmin, selectedCommunity, onSelectCommunity, onUserChange, initialHashCommunityId }: Props) {
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [showJoinPanel, setShowJoinPanel] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [mine, all] = await Promise.all([getMyCommunities(user.phone), getAllCommunities(user.phone)]);
      setMyCommunities(mine);
      setAllCommunities(all);
      if (initialHashCommunityId && !selectedCommunity) {
        const found = [...mine, ...all].find(c => c.id === initialHashCommunityId);
        if (found) onSelectCommunity(found);
      }
      if (selectedCommunity) {
        const refreshed = [...mine, ...all].find(c => c.id === selectedCommunity.id) || null;
        if (refreshed) onSelectCommunity(refreshed);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load communities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user.phone]); // eslint-disable-line

  const syncUser = (nextUser?: User, community?: Community) => {
    if (nextUser) {
      onUserChange(nextUser);
      return;
    }
    if (community && !user.communityIds.includes(community.id)) {
      onUserChange({ ...user, communityIds: [...user.communityIds, community.id] });
    }
  };

  const handleJoinById = async (community: Community) => {
    setError('');
    setSuccess('');
    setJoiningId(community.id);
    try {
      const res = await joinCommunity(user.phone, community.inviteCode);
      if (!res.success || !res.community) {
        setError(res.message || 'Unable to join community');
        return;
      }
      syncUser(res.user, res.community);
      setSuccess(`Joined ${res.community.name}!`);
      setShowJoinPanel(false);
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to join community');
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Community name is required.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await createCommunity(user.phone, name.trim(), description.trim());
      syncUser(res.user, res.community);
      setName('');
      setDescription('');
      setSuccess(`Created ${res.community.name}.`);
      onSelectCommunity(res.community);
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to create community');
    }
  };

  if (selectedCommunity) {
    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={S.card}>
          <button onClick={() => onSelectCommunity(null)} style={{ ...S.linkBtn, marginBottom: '0.8rem' }}>← Back to communities</button>
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <h2 style={sectionTitle}>{selectedCommunity.name}</h2>
            <p style={mutedText}>{selectedCommunity.description || 'No description yet.'}</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ ...S.infoBox, padding: '0.35rem 0.6rem' }}>👥 {selectedCommunity.memberIds.length} members</span>
              {isAdmin && (
                <span style={{ ...S.successBox, padding: '0.35rem 0.6rem' }}>Invite code: {selectedCommunity.inviteCode}</span>
              )}
            </div>
          </div>
        </div>
        <ItemsTab community={selectedCommunity} user={user} />
      </div>
    );
  }

  // Joinable = communities user hasn't joined yet
  const joinableCommunities = allCommunities.filter(c => !user.communityIds.includes(c.id));

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {error && <div style={S.errorBox}>{error}</div>}
      {success && <div style={S.successBox}>{success}</div>}

      {/* My Communities */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h2 style={sectionTitle}>My Communities</h2>
            <p style={mutedText}>Tap a community to browse items.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button onClick={() => { setShowJoinPanel(true); setError(''); setSuccess(''); load(); }} style={S.smallBtn}>
              🔍 Join a Community
            </button>
            <button onClick={load} style={S.smallOutlineBtn}>Refresh</button>
          </div>
        </div>
        <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
          {loading ? <div>Loading communities...</div> : myCommunities.length ? myCommunities.map(community => (
            <button
              key={community.id}
              onClick={() => onSelectCommunity(community)}
              style={{ textAlign: 'left', ...S.card, padding: '1rem', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <strong style={{ color: '#78350f', fontSize: '1rem' }}>{community.name}</strong>
                {isAdmin && <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>Invite: {community.inviteCode}</span>}
              </div>
              <p style={{ ...mutedText, marginTop: '0.4rem' }}>{community.description || 'No description yet.'}</p>
              <div style={{ ...mutedText, marginTop: '0.45rem' }}>👥 {community.memberIds.length} members</div>
            </button>
          )) : <div style={mutedText}>You have not joined any communities yet. Click "Join a Community" to get started!</div>}
        </div>
      </div>

      {/* Admin-only: Create Community */}
      {isAdmin && (
        <div style={S.card}>
          <h3 style={subheading}>Create Community</h3>
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.9rem' }}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={S.inp} placeholder="Maple Street Kids" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...S.inp, minHeight: 80, resize: 'vertical' }} placeholder="Books, toys and games swap for Maple Street families" />
            </div>
            <button onClick={handleCreate} style={{ ...S.smallBtn, justifySelf: 'start' }}>Create Community</button>
          </div>
        </div>
      )}

      {/* Join Panel Overlay */}
      {showJoinPanel && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setShowJoinPanel(false)}>
          <div
            style={{ background: '#fff7ed', borderRadius: '1.2rem 1.2rem 0 0', padding: '1.5rem', width: '100%', maxWidth: 480, maxHeight: '75vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={subheading}>Communities Open to Join</h3>
              <button onClick={() => setShowJoinPanel(false)} style={{ ...S.linkBtn, fontSize: '1.2rem' }}>✕</button>
            </div>
            {loading ? (
              <div style={mutedText}>Loading…</div>
            ) : joinableCommunities.length ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {joinableCommunities.map(community => (
                  <div key={community.id} style={{ border: '1px solid #fed7aa', borderRadius: '0.8rem', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ color: '#78350f' }}>{community.name}</strong>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={mutedText}>👥 {community.memberIds.length}</span>
                        <button
                          onClick={() => handleJoinById(community)}
                          disabled={joiningId === community.id}
                          style={S.smallBtn}
                        >
                          {joiningId === community.id ? '…' : 'Join'}
                        </button>
                      </div>
                    </div>
                    {community.description && <p style={{ ...mutedText, marginTop: '0.35rem' }}>{community.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={mutedText}>No new communities to join at the moment.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

