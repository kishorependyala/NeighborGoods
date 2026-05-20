import { useEffect, useState } from 'react';
import { Community, createCommunity, getAllCommunities, getMyCommunities, joinCommunity, User } from '../api';
import ItemsTab from './ItemsTab';
import { S, mutedText, sectionTitle, subheading } from '../theme';

type Props = {
  user: User;
  selectedCommunity: Community | null;
  onSelectCommunity: (community: Community | null) => void;
  onUserChange: (user: User) => void;
  initialHashCommunityId?: string | null;
};

export default function CommunitiesTab({ user, selectedCommunity, onSelectCommunity, onUserChange, initialHashCommunityId }: Props) {
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
  }, [user.phone]);

  const syncUser = (nextUser?: User, community?: Community) => {
    if (nextUser) {
      onUserChange(nextUser);
      return;
    }
    if (community && !user.communityIds.includes(community.id)) {
      onUserChange({ ...user, communityIds: [...user.communityIds, community.id] });
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setError('');
    setSuccess('');
    try {
      const res = await joinCommunity(user.phone, inviteCode.trim().toUpperCase());
      if (!res.success || !res.community) {
        setError(res.message || 'Unable to join community');
        return;
      }
      syncUser(res.user, res.community);
      setInviteCode('');
      setSuccess(`Joined ${res.community.name}.`);
      onSelectCommunity(res.community);
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to join community');
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
              <span style={{ ...S.successBox, padding: '0.35rem 0.6rem' }}>Invite code: {selectedCommunity.inviteCode}</span>
            </div>
          </div>
        </div>
        <ItemsTab community={selectedCommunity} user={user} />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {error && <div style={S.errorBox}>{error}</div>}
      {success && <div style={S.successBox}>{success}</div>}

      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h2 style={sectionTitle}>My Communities</h2>
            <p style={mutedText}>Tap a community to browse items and share its invite code.</p>
          </div>
          <button onClick={load} style={S.smallOutlineBtn}>Refresh</button>
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
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>Invite: {community.inviteCode}</span>
              </div>
              <p style={{ ...mutedText, marginTop: '0.4rem' }}>{community.description || 'No description yet.'}</p>
              <div style={{ ...mutedText, marginTop: '0.45rem' }}>👥 {community.memberIds.length} members</div>
            </button>
          )) : <div style={mutedText}>You have not joined any communities yet.</div>}
        </div>
      </div>

      <div style={S.card}>
        <h3 style={subheading}>Join / Create</h3>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '0.9rem' }}>
          <div style={{ display: 'grid', gap: '0.45rem' }}>
            <label style={S.label}>Invite code</label>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} style={S.inp} placeholder="MAPLE42" />
              <button onClick={handleJoin} style={S.smallBtn}>Join</button>
            </div>
          </div>
          <div style={{ height: 1, background: '#fed7aa' }} />
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Create Community</label>
              <input value={name} onChange={e => setName(e.target.value)} style={S.inp} placeholder="Maple Street Kids" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...S.inp, minHeight: 90, resize: 'vertical' }} placeholder="Books, toys and games swap for Maple Street families" />
            </div>
            <button onClick={handleCreate} style={{ ...S.smallBtn, justifySelf: 'start' }}>Create Community</button>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <h3 style={subheading}>Browse All Communities</h3>
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.85rem' }}>
          {allCommunities.length ? allCommunities.map(community => (
            <div key={community.id} style={{ border: '1px solid #fed7aa', borderRadius: '0.8rem', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <strong style={{ color: '#78350f' }}>{community.name}</strong>
                <span style={mutedText}>👥 {community.memberIds.length}</span>
              </div>
              <p style={{ ...mutedText, marginTop: '0.35rem' }}>{community.description || 'No description yet.'}</p>
            </div>
          )) : <div style={mutedText}>No communities created yet.</div>}
        </div>
      </div>
    </div>
  );
}
