import { useState } from 'react';
import { updateProfile, User } from '../api';
import { S, colors, mutedText, sectionTitle } from '../theme';

type Props = {
  user: User;
  onClose: () => void;
  onSave: (updated: User) => void;
};

export default function ProfileModal({ user, onClose, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'NG';

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await updateProfile(user.phone, firstName.trim(), lastName.trim(), email.trim());
      if (!res.success || !res.user) throw new Error('Update failed');
      setSaved(true);
      setEditing(false);
      onSave(res.user);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message || 'Could not save changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email || '');
    setError('');
    setEditing(false);
  };

  const isSocial = user.authMethod === 'social';
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '1.25rem',
          padding: '1.75rem', width: '100%', maxWidth: 400,
          boxShadow: '0 8px 40px rgba(120,53,15,0.18)',
          display: 'grid', gap: '1.25rem',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ ...sectionTitle, fontSize: '1.2rem' }}>My Profile</h2>
          <button onClick={onClose} style={{ ...S.linkBtn, fontSize: '1.3rem', lineHeight: 1 }}>✕</button>
        </div>

        {/* Avatar + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
          {user.picture ? (
            <img
              src={user.picture}
              alt={`${user.firstName} ${user.lastName}`}
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.border}` }}
            />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#fef3c7', border: `3px solid #fde68a`,
              display: 'grid', placeItems: 'center',
              fontWeight: 800, fontSize: '1.6rem', color: '#92400e',
            }}>
              {initials}
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: colors.text }}>
              {user.firstName} {user.lastName}
            </div>
            {isSocial && (
              <div style={{ ...mutedText, fontSize: '0.75rem' }}>Social account</div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ background: '#fef3c7', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#92400e' }}>🪙 {user.tokenBalance}</div>
            <div style={{ ...mutedText, fontSize: '0.75rem' }}>Token balance</div>
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#166534' }}>🏘️ {user.communityIds?.length ?? 0}</div>
            <div style={{ ...mutedText, fontSize: '0.75rem' }}>Communities</div>
          </div>
        </div>

        {/* Feedback */}
        {error && <div style={S.errorBox}>{error}</div>}
        {saved && <div style={S.successBox}>✓ Profile updated!</div>}

        {/* Fields */}
        {editing ? (
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div style={S.fieldGroup}>
                <label style={S.label}>First name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} style={S.inp} />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Last name</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} style={S.inp} />
              </div>
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={S.inp}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <button onClick={handleSave} style={S.primaryBtn} disabled={loading}>
                {loading ? 'Saving…' : 'Save'}
              </button>
              <button onClick={handleCancel} style={{ ...S.smallOutlineBtn, padding: '0.8rem', width: '100%' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <ProfileRow label="Phone" value={isSocial ? '—' : user.phone} />
            <ProfileRow label="Email" value={user.email || '—'} />
            {joinedDate && <ProfileRow label="Joined" value={joinedDate} />}
            {!isSocial && (
              <button onClick={() => setEditing(true)} style={{ ...S.smallOutlineBtn, marginTop: '0.5rem', width: '100%', padding: '0.65rem' }}>
                ✏️ Edit profile
              </button>
            )}
            {isSocial && (
              <button onClick={() => setEditing(true)} style={{ ...S.smallOutlineBtn, marginTop: '0.5rem', width: '100%', padding: '0.65rem' }}>
                ✏️ Edit name / email
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #fef3c7' }}>
      <span style={{ ...mutedText, fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: 600, color: colors.text, fontSize: '0.9rem' }}>{value}</span>
    </div>
  );
}
