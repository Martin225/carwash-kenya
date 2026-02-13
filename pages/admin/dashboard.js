import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeSubscriptions: 0,
    pendingApprovals: 0,
    monthlyRevenue: 0
  });
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
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function approveBusiness(businessId) {
    if (!confirm('Approve this business?')) return;

    try {
      const response = await fetch('/api/admin/approve-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Business approved!\n\nEmail: ${data.email}\nPassword will be sent to owner's email`);
        loadData();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('Failed to approve business');
    }
  }

  async function extendTrial(businessId, days) {
    if (!confirm(`Extend trial by ${days} days?`)) return;

    try {
      const response = await fetch('/api/admin/extend-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, days })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Trial extended by ${days} days!`);
        loadData();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('Failed to extend trial');
    }
  }

  async function suspendBusiness(businessId) {
    if (!confirm('Suspend this business? They will lose access immediately.')) return;

    try {
      const response = await fetch('/api/admin/suspend-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Business suspended!');
        loadData();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('Failed to suspend business');
    }
  }

  async function reactivateBusiness(businessId) {
    if (!confirm('Reactivate this business?')) return;

    try {
      const response = await fetch('/api/admin/reactivate-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Business reactivated!');
        loadData();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('Failed to reactivate business');
    }
  }

  return (
    <>
      <Head><title>Super Admin Dashboard - CarWash Pro Kenya</title></Head>

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1.5rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>👑</span> Super Admin Dashboard
              </h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Martin Kamau • info@natsautomations.co.ke</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Home</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Businesses', value: stats.totalBusinesses, icon: '🏢', color: '#006633' },
              { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: '✅', color: '#0066cc' },
              { label: 'Pending Approvals', value: stats.pendingApprovals, icon: '⏳', color: '#ff9900' },
              { label: 'Monthly Revenue', value: `KES ${stats.monthlyRevenue.toLocaleString()}`, icon: '💰', color: '#CE1126' }
            ].map((stat, i) => (
              <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: `4px solid ${stat.color}` }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                <div style={{ color: '#666', marginTop: '0.5rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>All Carwash Businesses</h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>Loading...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9f9f9' }}>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Business</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Owner</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Location</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Trial Ends</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((business) => {
                      const trialDaysLeft = business.trial_ends_at ? Math.ceil((new Date(business.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
                      const isTrialExpired = trialDaysLeft <= 0 && business.subscription_status === 'trial';

                      return (
                        <tr key={business.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 'bold' }}>{business.business_name}</div>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>{business.email}</div>
                          </td>
                          <td style={{ padding: '1rem' }}>{business.owner_name}</td>
                          <td style={{ padding: '1rem' }}>{business.location}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', background: business.subscription_status === 'active' ? '#e8f5e9' : business.subscription_status === 'trial' ? '#fff3e0' : business.subscription_status === 'suspended' ? '#ffebee' : '#f5f5f5', color: business.subscription_status === 'active' ? '#2e7d32' : business.subscription_status === 'trial' ? '#f57c00' : business.subscription_status === 'suspended' ? '#c62828' : '#666' }}>
                              {business.subscription_status}
                            </span>
                            {isTrialExpired && (
                              <div style={{ fontSize: '0.75rem', color: '#c62828', marginTop: '0.25rem' }}>Trial Expired!</div>
                            )}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            {business.trial_ends_at ? (
                              <>
                                <div>{new Date(business.trial_ends_at).toLocaleDateString()}</div>
                                {trialDaysLeft > 0 && (
                                  <div style={{ fontSize: '0.75rem', color: '#666' }}>({trialDaysLeft} days left)</div>
                                )}
                              </>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {!business.approved_at && (
                                <button onClick={() => approveBusiness(business.id)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>✓ Approve</button>
                              )}

                              {business.approved_at && business.email !== 'info@natsautomations.co.ke' && (
                                <>
                                  <button onClick={() => extendTrial(business.id, 60)} style={{ background: '#0066cc', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>+60 Days</button>
                                  <button onClick={() => extendTrial(business.id, 90)} style={{ background: '#9c27b0', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>+90 Days</button>

                                  {business.subscription_status !== 'suspended' ? (
                                    <button onClick={() => suspendBusiness(business.id)} style={{ background: '#f44336', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>⛔ Suspend</button>
                                  ) : (
                                    <button onClick={() => reactivateBusiness(business.id)} style={{ background: '#4caf50', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>✓ Reactivate</button>
                                  )}
                                </>
                              )}

                              {business.email === 'info@natsautomations.co.ke' && (
                                <span style={{ color: '#999', fontSize: '0.85rem' }}>Super Admin</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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