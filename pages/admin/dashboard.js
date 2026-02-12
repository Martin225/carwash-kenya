import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeSubscriptions: 0,
    pendingApprovals: 0,
    monthlyRevenue: 0
  });
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const response = await fetch('/api/admin/businesses');
      const data = await response.json();
      
      if (data.success) {
        setBusinesses(data.businesses || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function approveBusiness(businessId) {
    if (!confirm('Approve this carwash business?')) return;

    try {
      const response = await fetch('/api/admin/approve-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Business approved!');
        loadData();
      }
    } catch (error) {
      alert('Failed to approve business');
    }
  }

  return (
    <>
      <Head>
        <title>Super Admin Dashboard - CarWash Pro Kenya</title>
      </Head>

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)',
          color: 'white',
          padding: '1.5rem 2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>👑 Super Admin Dashboard</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                Martin Kamau • info@natsautomations.co.ke
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid white',
                color: 'white',
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {[
              { label: 'Total Businesses', value: stats.totalBusinesses, icon: '🏢', color: '#006633' },
              { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: '✅', color: '#0066cc' },
              { label: 'Pending Approvals', value: stats.pendingApprovals, icon: '⏳', color: '#ff9900' },
              { label: 'Monthly Revenue', value: `KES ${stats.monthlyRevenue.toLocaleString()}`, icon: '💰', color: '#cc0000' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${stat.color}`
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                <div style={{ color: '#666', marginTop: '0.5rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Businesses Table */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
              <h2 style={{ margin: 0, color: '#006633' }}>All Carwash Businesses</h2>
            </div>
            
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                Loading businesses...
              </div>
            ) : businesses.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                No businesses yet
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9f9f9' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Business</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Owner</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Location</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Trial Ends</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((business) => (
                      <tr key={business.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 'bold' }}>{business.business_name}</div>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>{business.email}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>{business.owner_name}</td>
                        <td style={{ padding: '1rem' }}>{business.location}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            background: business.subscription_status === 'active' ? '#e8f5e9' : 
                                       business.subscription_status === 'trial' ? '#fff3e0' : '#ffebee',
                            color: business.subscription_status === 'active' ? '#2e7d32' : 
                                   business.subscription_status === 'trial' ? '#f57c00' : '#c62828'
                          }}>
                            {business.subscription_status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {business.trial_ends_at ? new Date(business.trial_ends_at).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {!business.approved_at && (
                            <button
                              onClick={() => approveBusiness(business.id)}
                              style={{
                                background: '#006633',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                              }}
                            >
                              Approve
                            </button>
                          )}
                          {business.approved_at && (
                            <span style={{ color: '#666', fontSize: '0.9rem' }}>✓ Approved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}