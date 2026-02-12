import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <Head><title>Check Your Email - CarWash Pro Kenya</title></Head>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)',
          padding: '2rem',
          fontFamily: 'system-ui'
        }}>
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📧</div>
            <h1 style={{ color: '#006633', marginBottom: '1rem' }}>Check Your Email</h1>
            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
              We've sent a password reset link to:
            </p>
            <div style={{
              background: '#f0f7ff',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '2rem',
              fontWeight: 'bold',
              color: '#0066cc'
            }}>
              {email}
            </div>
            <p style={{ fontSize: '0.9rem', color: '#999', marginBottom: '2rem' }}>
              The link will expire in 1 hour.
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                width: '100%',
                background: '#006633',
                color: 'white',
                border: 'none',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Forgot Password - CarWash Pro Kenya</title></Head>

      <div style={{ 
        minHeight: '100vh', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)',
        padding: '2rem',
        fontFamily: 'system-ui'
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
            <h1 style={{ color: '#006633', marginBottom: '0.5rem' }}>Forgot Password?</h1>
            <p style={{ color: '#666' }}>No worries, we'll send you reset instructions</p>
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

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
            <a 
              href="/login" 
              style={{ color: '#006633', textDecoration: 'none', fontWeight: '500' }}
            >
              ← Back to Login
            </a>
          </div>
        </div>
      </div>
    </>
  );
}