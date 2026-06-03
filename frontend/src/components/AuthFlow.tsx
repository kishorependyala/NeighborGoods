import { useAuth0 } from '@auth0/auth0-react';
import { useMemo, useState } from 'react';
import { authCheckPhone, loginWithPin, signup, User } from '../api';
import { S, mutedText, sectionTitle } from '../theme';

type Step = 'phone' | 'pin' | 'signup-name' | 'signup-email' | 'signup-pin';

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleLogo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
  </svg>
);

const FacebookLogo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const YahooLogo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M13.9 7.1L10 14.2v5.9H7.6v-5.9L3.7 7.1h2.7l2.4 4.6 2.4-4.6h2.7zm6.1 0l-3.3 5.3v5.7h-2.3v-5.7L11.1 7.1h2.7l1.8 3.1 1.8-3.1h2.6z"/>
  </svg>
);

const DiscordLogo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const XLogo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const MicrosoftLogo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <path fill="#F25022" d="M1 1h10v10H1z"/>
    <path fill="#7FBA00" d="M13 1h10v10H13z"/>
    <path fill="#00A4EF" d="M1 13h10v10H1z"/>
    <path fill="#FFB900" d="M13 13h10v10H13z"/>
  </svg>
);

const SOCIAL_PROVIDERS = [
  { connection: 'google-oauth2', label: 'Google',    Logo: GoogleLogo,    bg: '#fff',    color: '#3c4043', border: '#dadce0' },
  { connection: 'apple',         label: 'Apple',     Logo: AppleLogo,     bg: '#000',    color: '#fff',    border: '#000' },
  { connection: 'facebook',      label: 'Facebook',  Logo: FacebookLogo,  bg: '#1877f2', color: '#fff',    border: '#1877f2' },
  { connection: 'yahoo',         label: 'Yahoo',     Logo: YahooLogo,     bg: '#6001d2', color: '#fff',    border: '#6001d2' },
  { connection: 'discord',       label: 'Discord',   Logo: DiscordLogo,   bg: '#5865f2', color: '#fff',    border: '#5865f2' },
  { connection: 'twitter',       label: 'Twitter/X', Logo: XLogo,         bg: '#000',    color: '#fff',    border: '#333' },
  { connection: 'microsoft',     label: 'Microsoft', Logo: MicrosoftLogo, bg: '#fff',    color: '#3c4043', border: '#dadce0' },
];

type Props = {
  onAuth: (user: User) => void;
};

const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export default function AuthFlow({ onAuth }: Props) {
  const { loginWithPopup } = useAuth0();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const phoneClean = useMemo(() => phone.replace(/\D/g, ''), [phone]);

  const pinInput = (value: string, onChange: (next: string) => void, onEnter?: () => void) => (
    <input
      type="password"
      inputMode="numeric"
      maxLength={4}
      placeholder="••••"
      value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
      onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      style={{ ...S.inp, letterSpacing: '0.4em', fontSize: '1.4rem', textAlign: 'center' }}
    />
  );

  const handleCheckPhone = async () => {
    if (phoneClean.length < 10) {
      setError('Enter a valid phone number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authCheckPhone(phoneClean);
      setStep(res.exists ? 'pin' : 'signup-name');
    } catch (err: any) {
      setError(err.message || 'Unable to continue');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      setError('Enter your 4-digit PIN.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await loginWithPin(phoneClean, pin);
      if (!res.success || !res.user) {
        setError(res.message || 'Login failed');
        return;
      }
      onAuth(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (firstName.trim() === '' || lastName.trim() === '') {
      setError('Enter your first and last name.');
      return;
    }
    if (pin.length !== 4) {
      setError('Choose a 4-digit PIN.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await signup(phoneClean, firstName.trim(), lastName.trim(), email.trim(), pin);
      if (!res.success || !res.user) {
        setError(res.message || 'Signup failed');
        return;
      }
      onAuth(res.user);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    setError('');
    try {
      const demoPhone = '7325551234';
      const demoPin = '1234';
      const login = await loginWithPin(demoPhone, demoPin);
      if (login.success && login.user) {
        onAuth(login.user);
        return;
      }
      const created = await signup(demoPhone, 'Demo', 'Neighbor', 'demo@neighborgoods.local', demoPin);
      if (created.success && created.user) {
        onAuth(created.user);
        return;
      }
      setError(created.message || 'Unable to create demo user');
    } catch (err: any) {
      setError(err.message || 'Unable to create demo user');
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (connection: string) => {
    setError('');
    setLoading(true);
    try {
      await loginWithPopup({ authorizationParams: { connection } });
      // App.tsx useEffect handles backend sync after Auth0 authenticates
    } catch (e: any) {
      if (e?.error !== 'popup_closed_by_user') setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.authPage}>
      <div style={S.authCard}>
        <div style={{ textAlign: 'center', display: 'grid', gap: '0.4rem' }}>
          <div style={{ fontSize: '3rem' }}>🏘️</div>
          <h1 style={{ ...sectionTitle, fontSize: '1.8rem' }}>NeighborGoods</h1>
          <p style={{ ...mutedText, fontSize: '0.95rem' }}>Barter books, toys, games, and bikes with your community.</p>
          <p style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, margin: 0 }}>
            Designed by Vihaan, Sid &amp; Rishik
          </p>
        </div>

        {error && <div style={S.errorBox}>{error}</div>}

        {step === 'phone' && (
          <>
            {/* Social login buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
              {SOCIAL_PROVIDERS.map(({ connection, label, Logo, bg, color, border }) => (
                <button
                  key={connection}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSocial(connection)}
                  title={label}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '0.2rem', background: bg, color, border: `1.5px solid ${border}`,
                    borderRadius: '0.75rem', padding: '0.5rem 0.25rem', fontSize: '0.7rem', fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, minWidth: 0,
                  }}
                >
                  <Logo />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', padding: '0 2px' }}>{label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: 1, background: '#fde68a' }} />
              <span style={{ color: '#92400e', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>or sign in with phone</span>
              <div style={{ flex: 1, height: 1, background: '#fde68a' }} />
            </div>

            <div style={S.fieldGroup}>
              <label style={S.label}>Phone number</label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Enter your phone number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleCheckPhone()}
                style={S.inp}
              />
            </div>
            <button onClick={handleCheckPhone} style={S.primaryBtn} disabled={loading}>
              {loading ? 'Checking...' : 'Continue →'}
            </button>
            {IS_LOCAL && (
              <button onClick={handleDemo} style={{ ...S.smallOutlineBtn, width: '100%', padding: '0.75rem 1rem' }} disabled={loading}>
                🎮 Demo login
              </button>
            )}
          </>
        )}

        {step === 'pin' && (
          <>
            <div style={S.infoBox}>Welcome back! Enter the 4-digit PIN for {phoneClean}.</div>
            <div style={S.fieldGroup}>
              <label style={S.label}>PIN</label>
              {pinInput(pin, setPin, handleLogin)}
            </div>
            <button onClick={handleLogin} style={S.primaryBtn} disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
            <button onClick={() => { setPin(''); setStep('phone'); }} style={{ ...S.linkBtn, justifySelf: 'center' }}>
              Use a different phone number
            </button>
          </>
        )}

        {step === 'signup-name' && (
          <>
            <div style={S.infoBox}>New here? Let’s set up your profile.</div>
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              <div style={S.fieldGroup}>
                <label style={S.label}>First name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} style={S.inp} />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Last name</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} style={S.inp} />
              </div>
            </div>
            <button onClick={() => setStep('signup-email')} style={S.primaryBtn} disabled={loading}>
              Continue
            </button>
          </>
        )}

        {step === 'signup-email' && (
          <>
            <div style={S.fieldGroup}>
              <label style={S.label}>Email (optional)</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setStep('signup-pin')}
                style={S.inp}
              />
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <button onClick={() => setStep('signup-pin')} style={S.primaryBtn} disabled={loading}>
                Continue
              </button>
              <button onClick={() => setStep('signup-pin')} style={{ ...S.linkBtn, justifySelf: 'center' }}>
                Skip for now
              </button>
            </div>
          </>
        )}

        {step === 'signup-pin' && (
          <>
            <div style={S.infoBox}>Choose a secure 4-digit PIN. You’ll start with 100 tokens. 🪙</div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Set PIN</label>
              {pinInput(pin, setPin, handleSignup)}
            </div>
            <button onClick={handleSignup} style={S.primaryBtn} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </>
        )}
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#9ca3af', paddingTop: '0.25rem' }}>
          © {new Date().getFullYear()} Tea Break Tech · All rights reserved
        </div>
      </div>
    </div>
  );
}
