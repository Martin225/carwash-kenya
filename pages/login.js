import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Redirect based on role
        if (data.user.role === 'super_admin') {
          router.push('/admin/dashboard');
        } else if (data.user.role === 'owner') {
          router.push('/owner/dashboard');
        } else if (data.user.role === 'supervisor') {
          router.push('/supervisor/dashboard');
        } else if (data.user.role === 'staff') {
          router.push('/staff/dashboard');
        }
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
        <title>Login - CarWash Pro Kenya</title>
      </Head>

      <div style={{ 
        minHeight: '100vh', 
        display: 'flex',
        background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)',
        fontFamily: 'system-ui'
      }}>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '20px',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
              <h1 style={{ color: '#006633', marginBottom: '0.5rem' }}>Welcome Back</h1>
              <p style={{ color: '#666' }}>Login to CarWash Pro Kenya</p>
            </div>

            {error && (
              <div style={{
                background: '#fee',
                color: '#c00',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: loading ? '#ccc' : '#006633',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '1rem'
                }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <p style={{ color: '#666', marginBottom: '0.5rem' }}>Demo Accounts:</p>
              <p style={{ fontSize: '0.9rem', color: '#888' }}>
                Super Admin: info@natsautomations.co.ke<br/>
                Owner: owner@westlands.demo<br/>
                Supervisor: supervisor@westlands.demo
              </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
              <p style={{ color: '#666' }}>
                Don't have an account?{' '}
                <a 
                  href="/signup" 
                  style={{ color: '#006633', fontWeight: 'bold', textDecoration: 'none' }}
                >
                  Start Free Trial
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}