import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function LandingPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('silver');

  const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '2,000',
    color: '#0066cc',
    popular: false,
    features: [
      { icon: '🏢', text: '3 Branches' },
      { icon: '👨‍💼', text: '2 Supervisors' },
      { icon: '👥', text: '15 Staff Members' },
      { icon: '📊', text: 'Basic Reports' },
      { icon: '📱', text: 'SMS Notifications' },
      { icon: '📞', text: 'Mobile Support' },
      { icon: '📧', text: 'Email Support' }
    ]
  },
  {
    id: 'silver',
    name: 'Silver',
    price: '3,000',
    color: '#ff9900',
    popular: true,
    features: [
      { icon: '🏢', text: '5 Branches' },
      { icon: '👨‍💼', text: '4 Supervisors' },
      { icon: '👥', text: '20 Staff Members' },
      { icon: '📈', text: 'Advanced Analytics' },
      { icon: '📊', text: 'Excel Reports Download' },
      { icon: '🔌', text: 'API Access' },
      { icon: '📱', text: 'SMS Notifications' },
      { icon: '⚡', text: 'Priority Support' }
    ]
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '6,000',
    color: '#006633',
    popular: false,
    features: [
      { icon: '✨', text: 'Unlimited Users' },
      { icon: '🧾', text: 'eTIMS Integration (KRA)' },
      { icon: '👔', text: 'Dedicated Account Manager' },
      { icon: '🎨', text: 'White-Label Options' },
      { icon: '🔧', text: 'Custom Integrations' },
      { icon: '⚡', text: '24/7 Priority Support' },
      { icon: '📞', text: 'Phone Support' },
      { icon: '🎯', text: 'Training & Onboarding' }
    ]
  }
];

  return (
    <>
      <Head>
        <title>CarWash Pro Kenya - Professional Car Wash Management</title>
        <meta name="description" content="Streamline your car wash business with our all-in-one management system" />
      </Head>

      <div style={{ fontFamily: 'system-ui', background: '#f5f5f5' }}>
        {/* HEADER */}
        <header style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>🚗</div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>CarWash Pro Kenya</h1>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Professional Management System</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => router.push('/login')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                Login
              </button>
              <button onClick={() => router.push('/signup')} style={{ background: '#FCD116', color: '#006633', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                Start Free Trial
              </button>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <section style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '3rem', margin: '0 0 1rem 0', fontWeight: 'bold' }}>
              Transform Your Car Wash Business
            </h2>
            <p style={{ fontSize: '1.3rem', margin: '0 0 2rem 0', opacity: 0.9, maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
              Streamline operations, boost revenue, and delight customers with Kenya's leading car wash management platform
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/signup')} style={{ background: '#FCD116', color: '#006633', border: 'none', padding: '1rem 2.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                🚀 Start 7-Day Free Trial
              </button>
              <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '1rem 2.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}>
                View Pricing
              </button>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section style={{ padding: '4rem 2rem', background: 'white' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '1rem', color: '#006633' }}>
              Everything You Need to Run Your Car Wash
            </h2>
            <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666', marginBottom: '3rem', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }}>
              From booking to payment, staff management to analytics - we've got you covered
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {[
                { icon: '📱', title: 'Mobile Booking', desc: 'Customers book instantly via web or mobile. Automated SMS confirmations.' },
                { icon: '💰', title: 'Payment Integration', desc: 'M-Pesa, cash, bank transfers. Automatic receipts and accounting.' },
                { icon: '👥', title: 'Staff Management', desc: 'Track attendance, performance, commissions. PIN-based authentication.' },
                { icon: '📊', title: 'Analytics & Reports', desc: 'Real-time dashboards, ROI tracking, Excel exports, profit analysis.' },
                { icon: '📦', title: 'Inventory Control', desc: 'Track soap, wax, supplies. Auto-reorder alerts and usage logs.' },
                { icon: '🏢', title: 'Multi-Branch', desc: 'Manage multiple locations from one dashboard. Centralized control.' },
                { icon: '📧', title: 'SMS & Email', desc: 'Automated notifications for bookings, payments, and reminders.' },
                { icon: '🧾', title: 'eTIMS Ready', desc: 'KRA eTIMS integration for Gold plan. Compliant invoicing.' }
              ].map((feature, i) => (
                <div key={i} style={{ background: '#f9f9f9', padding: '2rem', borderRadius: '12px', border: '2px solid #e0e0e0', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#006633'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e0e0e0'; }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
                  <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', color: '#006633' }}>{feature.title}</h3>
                  <p style={{ color: '#666', margin: 0, lineHeight: '1.6' }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" style={{ padding: '4rem 2rem', background: 'linear-gradient(to bottom, #f5f5f5, #e8f5e9)' }}>
          <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '1rem', color: '#006633' }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666', marginBottom: '3rem' }}>
              Choose the plan that fits your business. All plans include 7-day free trial!
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  style={{ 
                    background: 'white', 
                    padding: '2rem', 
                    borderRadius: '20px', 
                    border: selectedPlan === plan.id ? `4px solid ${plan.color}` : '2px solid #e0e0e0',
                    position: 'relative',
                    boxShadow: selectedPlan === plan.id ? '0 12px 32px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.08)',
                    transform: selectedPlan === plan.id ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div style={{ position: 'absolute', top: '-15px', right: '20px', background: '#FCD116', color: '#006633', padding: '0.5rem 1.5rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                      ⭐ MOST POPULAR
                    </div>
                  )}

                  <div style={{ textAlign: 'center', marginBottom: '2rem', paddingTop: plan.popular ? '1rem' : 0 }}>
                    <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: plan.color, fontWeight: 'bold' }}>
                      {plan.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem', color: '#666' }}>Kshs</span>
                      <span style={{ fontSize: '3rem', fontWeight: 'bold', color: plan.color }}>{plan.price}</span>
                      <span style={{ fontSize: '1.2rem', color: '#666' }}>/month</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    {plan.features.map((feature, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: i < plan.features.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <span style={{ fontSize: '1.5rem' }}>{feature.icon}</span>
                        <span style={{ color: '#333', fontSize: '1rem' }}>{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => router.push('/signup?plan=' + plan.id)}
                    style={{ 
                      width: '100%', 
                      background: plan.color, 
                      color: 'white', 
                      border: 'none', 
                      padding: '1rem', 
                      borderRadius: '12px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      fontSize: '1.1rem',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Start Free Trial →
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center', border: '2px solid #e0e0e0' }}>
              <h3 style={{ fontSize: '1.5rem', margin: '0 0 1rem 0', color: '#006633' }}>✨ All Plans Include:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', color: '#666' }}>
                <div>✅ 7-Day Free Trial</div>
                <div>✅ No Credit Card Required</div>
                <div>✅ Cancel Anytime</div>
                <div>✅ Free Onboarding</div>
                <div>✅ Video Tutorials</div>
                <div>✅ Data Migration Help</div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section style={{ padding: '4rem 2rem', background: 'white' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem', color: '#006633' }}>
              Trusted by Car Wash Businesses Across Kenya
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {[
                { name: 'James Mwangi', business: 'Sparkle Wash Nairobi', text: 'Revenue increased 40% in 3 months! The SMS reminders brought back so many customers.' },
                { name: 'Grace Wanjiku', business: 'Premium Auto Care', text: 'Managing 3 branches is now effortless. Real-time reports help me make better decisions.' },
                { name: 'David Kipchoge', business: 'QuickWash Mombasa', text: 'Staff love the PIN system. No more manual timesheets. Everything is automated!' }
              ].map((testimonial, i) => (
                <div key={i} style={{ background: '#f9f9f9', padding: '2rem', borderRadius: '12px', border: '2px solid #e0e0e0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐⭐⭐⭐⭐</div>
                  <p style={{ fontSize: '1.1rem', color: '#333', lineHeight: '1.6', marginBottom: '1rem' }}>
                    "{testimonial.text}"
                  </p>
                  <div style={{ fontWeight: 'bold', color: '#006633' }}>{testimonial.name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>{testimonial.business}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section style={{ padding: '4rem 2rem', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', textAlign: 'center' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', margin: '0 0 1rem 0' }}>
              Ready to Transform Your Car Wash?
            </h2>
            <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2rem' }}>
              Join hundreds of successful car wash businesses. Start your free trial today!
            </p>
            <button onClick={() => router.push('/signup')} style={{ background: '#FCD116', color: '#006633', border: 'none', padding: '1.25rem 3rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.3rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              🚀 Start Free 7-Day Trial
            </button>
            <p style={{ fontSize: '0.9rem', marginTop: '1rem', opacity: 0.8 }}>
              No credit card required • Cancel anytime • Free support
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: '#1a1a1a', color: 'white', padding: '3rem 2rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🚗 CarWash Pro</h3>
              <p style={{ opacity: 0.8, lineHeight: '1.6' }}>
                Kenya's leading car wash management platform. Trusted by hundreds of businesses.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Product</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.8 }}>
                <a href="#pricing" style={{ color: 'white', textDecoration: 'none' }}>Pricing</a>
                <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Features</a>
                <a href="#" style={{ color: 'white', textDecoration: 'none' }}>FAQ</a>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Company</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.8 }}>
                <a href="#" style={{ color: 'white', textDecoration: 'none' }}>About Us</a>
                <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Contact</a>
                <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Privacy Policy</a>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Contact</h4>
              <div style={{ opacity: 0.8, lineHeight: '1.8' }}>
                📞 +254 726 259 977<br/>
                📧 info@carwashpro.ke<br/>
                🌐 www.natsautomations.co.ke
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '2rem', paddingTop: '2rem', textAlign: 'center', opacity: 0.6 }}>
            © 2026 CarWash Pro Kenya. Powered by Nats Automations Ltd. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}