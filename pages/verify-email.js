import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  async function verifyEmail() {
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('Email verified successfully! Your account is now pending admin approval.');
        setTimeout(() => router.push('/login'), 5000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed. The link may be invalid or expired.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again later.');
    }
  }

  return (
    <>
      <Head><title>Email Verification - CarWash Pro Kenya</title></Head>

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', fontFamily: 'system-ui' }}>
        <div style={{ background: 'white', padding: '3rem', borderRadius: '20px', maxWidth: '500px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          {status === 'verifying' && (
            <>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              <h1 style={{ color: '#006633', marginBottom: '1rem' }}>Verifying Email...</h1>
              <p style={{ color: '#666' }}>Please wait a moment</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h1 style={{ color: '#006633', marginBottom: '1rem' }}>Email Verified!</h1>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>{message}</p>
              <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ margin: 0, color: '#2e7d32' }}>Redirecting to login in 5 seconds...</p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
              <h1 style={{ color: '#d32f2f', marginBottom: '1rem' }}>Verification Failed</h1>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>{message}</p>
              <button onClick={() => router.push('/signup')} style={{ background: '#006633', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Try Signup Again
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}