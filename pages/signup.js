import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    location: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Signup failed');
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
        <Head><title>Success - CarWash Pro Kenya</title></Head>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)',
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '20px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h1 style={{ color: '#006633', marginBottom: '1rem' }}>Application Submitted!</h1>
            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
              Thank you for registering! Your application has been submitted for approval.
              We'll review it within 24 hours and send you a confirmation email with your login credentials.
            </p>
            <div style={{ 
              background: '#f0f7ff', 
              padding: '1rem', 
              borderRadius: '8px',
              marginBottom: '2rem',
              color: '#0066cc'
            }}>
              📧 Check your email: <strong>{formData.email}</strong>
            </div>
            <button
              onClick={() => router.push('/')}
              style={{
                width: '100%',
                background: '#006633',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Back to Homepage
            </button>
          </div>
        </div>
      </>
    );
  }
{/* Logo/Home Link */}
<div style={{
  position: 'absolute',
  top: '2rem',
  left: '2rem'
}}>
  <a 
    href="/"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: 'white',
      textDecoration: 'none',
      fontSize: '1.2rem',
      fontWeight: 'bold'
    }}
  >
    <span style={{ fontSize: '2rem' }}>🚗</span>
    <span>CarWash Pro</span>
  </a>
</div>

  return (
    <>
      <Head>
        <title>Start Free Trial - CarWash Pro Kenya</title>
      </Head>

      <div style={{ 
        minHeight: '100vh', 
        display: 'flex',
        background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)',
        fontFamily: 'system-ui',
        padding: '2rem'
      }}>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '20px',
            maxWidth: '550px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
              <h1 style={{ color: '#006633', marginBottom: '0.5rem' }}>Start Your Free Trial</h1>
              <p style={{ color: '#666' }}>30 days free • No credit card required</p>
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

            <form onSubmit={handleSignup}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Carwash Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  required
                  placeholder="e.g., Westlands Premium Carwash"
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
                  Owner Name *
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  required
                  placeholder="Your full name"
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
                  Email Address *
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
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="0722XXXXXX"
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
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  placeholder="e.g., Westlands, Nairobi"
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
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Choose a strong password"
                  minLength="6"
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
                {loading ? 'Submitting...' : 'Start Free Trial →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
              <p style={{ color: '#666' }}>
                Already have an account?{' '}
                <a 
                  href="/login" 
                  style={{ color: '#006633', fontWeight: 'bold', textDecoration: 'none' }}
                >
                  Login
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}