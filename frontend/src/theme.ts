import React from 'react';

export const colors = {
  primary: '#f59e0b',
  primaryDark: '#d97706',
  bg: '#fffbeb',
  card: '#ffffff',
  border: '#fed7aa',
  text: '#78350f',
  textMuted: '#6b7280',
  authGradient: 'linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)',
  success: '#166534',
  successBg: '#f0fdf4',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#1d4ed8',
  infoBg: '#eff6ff',
};

export const tab = (active: boolean): React.CSSProperties => ({
  padding: '0.75rem 1rem',
  background: 'none',
  border: 'none',
  borderBottom: active ? `3px solid ${colors.primary}` : '3px solid transparent',
  color: active ? colors.text : colors.textMuted,
  fontWeight: active ? 700 : 500,
  fontSize: '0.92rem',
  cursor: 'pointer',
  marginBottom: '-2px',
  whiteSpace: 'nowrap',
});

export const statusPill = (status: string): React.CSSProperties => ({
  fontSize: '0.72rem',
  fontWeight: 700,
  padding: '0.2rem 0.55rem',
  borderRadius: '99px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  background:
    status === 'available' || status === 'active'
      ? '#dcfce7'
      : status === 'reserved' || status === 'proposed'
      ? '#fef3c7'
      : status === 'traded' || status === 'completed'
      ? '#e0e7ff'
      : '#f3f4f6',
  color:
    status === 'available' || status === 'active'
      ? '#166534'
      : status === 'reserved' || status === 'proposed'
      ? '#854d0e'
      : status === 'traded' || status === 'completed'
      ? '#3730a3'
      : '#374151',
});

export const sectionTitle = { fontSize: '1.25rem', fontWeight: 800, color: colors.text, margin: 0 } as const;
export const subheading = { fontSize: '1rem', fontWeight: 700, color: '#92400e', margin: 0 } as const;
export const mutedText = { color: colors.textMuted, fontSize: '0.88rem', margin: 0 } as const;

export const S = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: colors.text,
  } as React.CSSProperties,
  card: {
    background: colors.card,
    borderRadius: '1rem',
    padding: '1.25rem',
    boxShadow: '0 2px 12px rgba(120,53,15,0.07)',
    border: `1px solid ${colors.border}`,
  } as React.CSSProperties,
  authPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.authGradient,
    padding: '1rem',
  } as React.CSSProperties,
  authCard: {
    background: '#fff',
    borderRadius: '1.5rem',
    padding: '2rem',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 8px 32px rgba(120,53,15,0.12)',
    display: 'grid',
    gap: '1.25rem',
  } as React.CSSProperties,
  primaryBtn: {
    background: 'linear-gradient(135deg,#f59e0b,#d97706)',
    color: '#fff',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.8rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 2px 8px rgba(217,119,6,0.3)',
  } as React.CSSProperties,
  smallBtn: {
    background: '#f59e0b',
    color: '#fff',
    border: 'none',
    borderRadius: '0.6rem',
    padding: '0.4rem 0.9rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(217,119,6,0.2)',
  } as React.CSSProperties,
  smallOutlineBtn: {
    background: '#fff',
    color: '#92400e',
    border: '1.5px solid #fde68a',
    borderRadius: '0.6rem',
    padding: '0.4rem 0.9rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#d97706',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0.25rem 0',
  } as React.CSSProperties,
  inp: {
    width: '100%',
    border: '1.5px solid #fde68a',
    borderRadius: '0.6rem',
    padding: '0.65rem 0.8rem',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fffbeb',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#78350f',
    marginBottom: '0.3rem',
  } as React.CSSProperties,
  fieldGroup: { display: 'grid', gap: '0.1rem' } as React.CSSProperties,
  errorBox: {
    background: colors.dangerBg,
    border: '1px solid #fecaca',
    borderRadius: '0.6rem',
    padding: '0.65rem 0.9rem',
    color: colors.danger,
    fontSize: '0.88rem',
  } as React.CSSProperties,
  successBox: {
    background: colors.successBg,
    border: '1px solid #bbf7d0',
    borderRadius: '0.6rem',
    padding: '0.65rem 0.9rem',
    color: colors.success,
    fontSize: '0.88rem',
  } as React.CSSProperties,
  infoBox: {
    background: colors.infoBg,
    border: '1px solid #bfdbfe',
    borderRadius: '0.6rem',
    padding: '0.65rem 0.9rem',
    color: colors.info,
    fontSize: '0.85rem',
  } as React.CSSProperties,
  tab,
};
