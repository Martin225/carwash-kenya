import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import PasswordInput from '../components/PasswordInput';

export default function SignupPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('silver'); // Default to Silver
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

  // Get plan from URL if provided
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planFromUrl = urlParams.get('plan');
    if (planFromUrl && ['basic', 'silver', 'gold'].includes(planFromUrl)) {
      setSelectedPlan(planFromUrl);
    }
  }, []);

  const plans = {
    basic: { name: 'Basic', price: '2,000', color: '#0066cc' },
    silver: { name: 'Silver', price: '3,000', color: '#ff9900', popular: true },
    gold: { name: 'Gold', price: '6,000', color: '#006633' }
  };

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          selectedPlan // Include selected plan
        })
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
            <h1 style={{ color: '#006633', marginBottom: '1rem' }}>Welcome to CarWash Pro!</h1>
            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '1rem', lineHeight: '1.6' }}>
              Your <strong style={{ color: plans[selectedPlan].color }}>{plans[selectedPlan].name}</strong> plan account has been created!
            </p>
            <p style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
              You have <strong>7 days free trial</strong>. Check your email for verification and login details.
            </p>
            <div style={{ 
              background: '#f0f7ff', 
              padding: '1rem', 
              borderRadius: '8px',
              marginBottom: '2rem',
              color: '#0066cc'
            }}>
              📧 Email sent to: <strong>{formData.email}</strong>
            </div>
            <button
              onClick={() => router.push('/login')}
              style={{
                width: '100%',
                background: '#006633',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '0.5rem'
              }}
            >
              Login Now →
            </button>
            <button
              onClick={() => router.push('/')}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#666',
                border: 'none',
                padding: '0.75rem',
                fontSize: '0.9rem',
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
        padding: '2rem',
        position: 'relative'
      }}>
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
            maxWidth: '650px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
              <h1 style={{ color: '#006633', marginBottom: '0.5rem' }}>Start Your Free Trial</h1>
              <p style={{ color: '#666' }}>7 days free • No credit card required</p>
            </div>

            {/* PLAN SELECTOR */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#333', fontSize: '1.1rem' }}>Choose Your Plan:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {Object.entries(plans).map(([key, plan]) => (
                  <div
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    style={{
                      padding: '1rem',
                      border: selectedPlan === key ? `3px solid ${plan.color}` : '2px solid #e0e0e0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      position: 'relative',
                      background: selectedPlan === key ? `${plan.color}15` : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    {plan.popular && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#FCD116',
                        color: '#006633',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        POPULAR
                      </div>
                    )}
                    <div style={{ fontWeight: 'bold', color: plan.color, marginBottom: '0.25rem' }}>
                      {plan.name}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      Kshs {plan.price}/mo
                    </div>
                    {selectedPlan === key && (
                      <div style={{ marginTop: '0.5rem', color: plan.color, fontWeight: 'bold' }}>
                        ✓ Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                <PasswordInput
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Choose a strong password (min 6 characters)"
                  required
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: loading ? '#ccc' : plans[selectedPlan].color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '1rem'
                }}
              >
                {loading ? 'Creating Account...' : `Start ${plans[selectedPlan].name} Trial (7 Days Free) →`}
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