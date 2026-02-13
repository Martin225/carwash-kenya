import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function LandingPage() {
  const router = useRouter();
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      <Head>
        <title>CarWash Pro Kenya - Professional Carwash Management System</title>
        <meta name="description" content="Modern carwash management platform for Kenya. KES 2,000/month with 30-day free trial." />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh' }}>
        {/* Navigation */}
        <nav style={{ 
          background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)',
          padding: '1rem 2rem',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2rem' }}>🚗</span>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>CarWash Pro Kenya</h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => router.push('/login')}
              style={{ 
                background: 'transparent', 
                border: '2px solid white', 
                color: 'white',
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Login
            </button>
            <button 
              onClick={() => router.push('/signup')}
              style={{ 
                background: '#FCD116', 
                border: 'none', 
                color: '#006633',
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Start Free Trial
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section style={{
          background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)',
          color: 'white',
          padding: '5rem 2rem',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🇰🇪</div>
            <h2 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold' }}>
              Transform Your Carwash Business
            </h2>
            <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.9 }}>
              Modern management system built for Kenyan carwashes
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => router.push('/signup')}
                style={{
                  background: '#CE1126',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  fontSize: '1.2rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(206,17,38,0.3)'
                }}
              >
                Start 30-Day Free Trial →
              </button>
              <button 
                onClick={() => setShowDemo(true)}
                style={{
                  background: 'white',
                  color: '#006633',
                  border: 'none',
                  padding: '1rem 2rem',
                  fontSize: '1.2rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                View Demo
              </button>
            </div>
            <p style={{ marginTop: '2rem', fontSize: '1.1rem' }}>
              ✨ No credit card required • 🚀 Setup in 5 minutes • 💯 Cancel anytime
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section style={{ padding: '4rem 2rem', background: '#f9f9f9' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h3 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: '#006633' }}>
              Everything You Need to Manage Your Carwash
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '2rem' 
            }}>
              {[
                { icon: '📊', title: 'Real-time Dashboard', desc: 'Monitor all operations from one beautiful dashboard' },
                { icon: '🚙', title: 'Bay Management', desc: 'Track which bays are occupied and assign staff efficiently' },
                { icon: '👥', title: 'Staff Management', desc: 'Clock in/out, assign jobs, track performance' },
                { icon: '📦', title: 'Inventory Tracking', desc: 'Monitor soap, wax, towels, and supplies in real-time' },
                { icon: '💰', title: 'Payment Integration', desc: 'M-Pesa and cash payments with automatic receipts' },
                { icon: '📱', title: 'Mobile Optimized', desc: 'Works perfectly on phones, tablets, and computers' },
                { icon: '📈', title: 'Reports & Analytics', desc: 'Daily, weekly, monthly reports with revenue tracking' },
                { icon: '💬', title: 'SMS Notifications', desc: 'Automatic booking confirmations and reminders' }
              ].map((feature, i) => (
                <div key={i} style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
                  <h4 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: '#006633' }}>{feature.title}</h4>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section style={{ padding: '4rem 2rem', background: 'white' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#006633' }}>
              Simple, Transparent Pricing
            </h3>
            <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '3rem' }}>
              No hidden fees. Cancel anytime.
            </p>
            <div style={{
              background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)',
              color: 'white',
              padding: '3rem',
              borderRadius: '20px',
              boxShadow: '0 10px 40px rgba(0,102,51,0.2)'
            }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                KES 2,000
              </div>
              <div style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2rem' }}>
                per month
              </div>
              <ul style={{ 
                textAlign: 'left', 
                listStyle: 'none', 
                padding: 0,
                fontSize: '1.1rem',
                lineHeight: '2.5'
              }}>
                <li>✅ 30-day free trial</li>
                <li>✅ Unlimited bookings</li>
                <li>✅ Up to 5 staff accounts</li>
                <li>✅ Full inventory management</li>
                <li>✅ M-Pesa & SMS integration</li>
                <li>✅ Daily reports & analytics</li>
                <li>✅ Mobile app access</li>
                <li>✅ Email & phone support</li>
              </ul>
              <button 
                onClick={() => router.push('/signup')}
                style={{
                  background: '#FCD116',
                  color: '#006633',
                  border: 'none',
                  padding: '1rem 2rem',
                  fontSize: '1.2rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginTop: '2rem',
                  width: '100%'
                }}
              >
                Start Free Trial →
              </button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          background: 'linear-gradient(135deg, #CE1126 0%, #a00e1e 100%)',
          color: 'white',
          padding: '4rem 2rem',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Ready to Transform Your Carwash?
          </h3>
          <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.9 }}>
            Join 50+ carwashes across Kenya already using CarWash Pro
          </p>
          <button 
            onClick={() => router.push('/signup')}
            style={{
              background: 'white',
              color: '#CE1126',
              border: 'none',
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Start Your Free Trial Now →
          </button>
        </section>

        {/* Footer */}
        <footer style={{ 
          background: '#1a1a1a', 
          color: 'white', 
          padding: '3rem 2rem',
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>🚗</span>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>CarWash Pro Kenya</h3>
              </div>
              <p style={{ opacity: 0.7, lineHeight: '1.6', margin: '0.5rem 0' }}>
                Modern carwash management system built for Kenyan businesses.
              </p>
              <p style={{ opacity: 0.7, marginTop: '1rem' }}>
                © 2026 CarWash Pro Kenya<br/>
                All rights reserved.
              </p>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>📞 Contact Us</h3>
              <div style={{ opacity: 0.8, lineHeight: '2' }}>
                <p style={{ margin: '0.5rem 0' }}>
                  📱 <a href="tel:+254726259977" style={{ color: 'white', textDecoration: 'none' }}>+254 726 259 977</a>
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  📧 <a href="mailto:info@natsautomations.co.ke" style={{ color: 'white', textDecoration: 'none' }}>info@natsautomations.co.ke</a>
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  📍 01000 Nairobi, Kenya
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  💬 <a 
                    href="https://wa.me/254726259977?text=Hi,%20I'm%20interested%20in%20CarWash%20Pro%20Kenya" 
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#25D366', textDecoration: 'none', fontWeight: 'bold' }}
                  >
                    WhatsApp Us
                  </a>
                </p>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>🔗 Quick Links</h3>
              <div style={{ opacity: 0.8, lineHeight: '2' }}>
                <p style={{ margin: '0.5rem 0' }}>
                  <a href="/signup" style={{ color: 'white', textDecoration: 'none' }}>Start Free Trial</a>
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  <a href="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</a>
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  <a href="#features" style={{ color: 'white', textDecoration: 'none' }}>Features</a>
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  <a href="#pricing" style={{ color: 'white', textDecoration: 'none' }}>Pricing</a>
                </p>
              </div>
            </div>
          </div>

          <div style={{ 
            textAlign: 'center', 
            marginTop: '2rem', 
            paddingTop: '2rem', 
            borderTop: '1px solid rgba(255,255,255,0.1)',
            opacity: 0.7 
          }}>
            Built with ❤️ for Kenyan businesses by <strong>NATS Automations</strong>
          </div>
        </footer>
      </div>

      {/* WhatsApp Floating Button with proper icon */}
      <a 
        href="https://wa.me/254726259977?text=Hi,%20I'm%20interested%20in%20CarWash%20Pro%20Kenya" 
        target="_blank" 
        rel="noopener noreferrer" 
        style={{ 
          position: 'fixed', 
          bottom: '2rem', 
          right: '2rem', 
          background: '#25D366', 
          color: 'white', 
          width: '65px', 
          height: '65px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '2.5rem', 
          boxShadow: '0 4px 20px rgba(37,211,102,0.5)', 
          textDecoration: 'none', 
          zIndex: 1000 
        }}
      >
        <i className="fab fa-whatsapp"></i>
      </a>

      {/* Demo Modal */}
      {showDemo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setShowDemo(false)}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '20px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#006633', marginBottom: '1rem' }}>🎯 Try Demo Account</h3>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Experience CarWash Pro Kenya with our demo business account
            </p>
            
            <div style={{
              background: '#f0f7ff',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Email:</strong> demo@carwashpro.co.ke
              </div>
              <div>
                <strong>Password:</strong> demo123
              </div>
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
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '0.5rem'
              }}
            >
              Go to Login →
            </button>
            
            <button 
              onClick={() => setShowDemo(false)}
              style={{
                width: '100%',
                background: '#f0f0f0',
                color: '#666',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}