import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../lib/auth-context';

export default function StaffLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ phone: '', pin: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        login(data.user);
        router.push('/staff/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Staff Login - CarWash Pro Kenya</title>
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', fontFamily: 'system-ui', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 10 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>
            <span style={{ fontSize: '2rem' }}>🚗</span>
            <span>CarWash Pro</span>
          </a>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: 'white', padding: '3rem', borderRadius: '20px', maxWidth: '450px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧑‍🔧</div>
              <h1 style={{ color: '#006633', marginBottom: '0.5rem' }}>Staff Login</h1>
              <p style={{ color: '#666' }}>Enter your phone and PIN</p>
            </div>

            {error && (
              <div style={{ background: '#fee', color: '#c00', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone Number</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required placeholder="0722XXXXXX" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>4-Digit PIN</label>
                <input type="password" value={formData.pin} onChange={(e) => setFormData({ ...formData, pin: e.target.value })} required placeholder="••••" maxLength="4" pattern="[0-9]{4}" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1.5rem', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.5rem' }} />
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: loading ? '#ccc' : '#006633', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '1rem' }}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
              <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
                Forgot your PIN? Contact your supervisor
              </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
                Not a staff member?{' '}
                <a href="/login" style={{ color: '#006633', fontWeight: 'bold', textDecoration: 'none' }}>
                  Regular Login
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}