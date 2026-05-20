import { useMemo, useState } from 'react';
import { authCheckPhone, loginWithPin, signup, User } from '../api';
import { S, mutedText, sectionTitle } from '../theme';

type Step = 'phone' | 'pin' | 'signup-name' | 'signup-email' | 'signup-pin';

type Props = {
  onAuth: (user: User) => void;
};

const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export default function AuthFlow({ onAuth }: Props) {
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
              {loading ? 'Checking...' : 'Continue'}
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
      </div>

      <div style={{ textAlign: 'center', marginTop: '0.25rem', fontSize: '0.72rem', color: '#9ca3af' }}>
        © {new Date().getFullYear()} Tea Break Tech · All rights reserved
      </div>
    </div>
  );
}
