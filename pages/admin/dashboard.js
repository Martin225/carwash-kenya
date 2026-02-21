import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../lib/auth-context';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [businesses, setBusinesses] = useState([]);
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeSubscriptions: 0,
    pendingApprovals: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [trialDays, setTrialDays] = useState(30);

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

  function openApprovalModal(business) {
    setSelectedBusiness(business);
    setTrialDays(30); // Default 30 days
    setShowApprovalModal(true);
  }

  async function approveBusiness() {
    if (!selectedBusiness) return;

    try {
      const response = await fetch('/api/admin/approve-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessId: selectedBusiness.id,
          trialDays: trialDays
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast(`✅ Business approved with ${trialDays} days trial!`, 'success');
        setShowApprovalModal(false);
        setSelectedBusiness(null);
        loadData();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to approve business', 'error');
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
        showToast(`Trial extended by ${days} days!`, 'success');
        loadData();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to extend trial', 'error');
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
        showToast('Business suspended!', 'success');
        loadData();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to suspend business', 'error');
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
        showToast('Business reactivated!', 'success');
        loadData();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to reactivate business', 'error');
    }
  }

  const planColors = {
    basic: '#0066cc',
    silver: '#ff9900',
    gold: '#006633'
  };

  if (loading) {
    return (
      <>
        <Head><title>Super Admin Dashboard - CarWash Pro Kenya</title></Head>
        <ToastContainer />
        
        <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)' }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>👑</div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Loading Admin Dashboard...</h2>
            <p style={{ opacity: 0.8, marginTop: '0.5rem' }}>Fetching all businesses</p>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Super Admin Dashboard - CarWash Pro Kenya</title></Head>
      <ToastContainer />

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
              <button onClick={() => loadData()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
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

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Business</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Owner</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Plan</th>
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
                    const plan = business.subscription_plan || 'basic';

                    return (
                      <tr key={business.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 'bold' }}>{business.business_name}</div>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>{business.email}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>{business.owner_name}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ 
                            padding: '0.35rem 0.85rem', 
                            borderRadius: '12px', 
                            fontSize: '0.85rem', 
                            fontWeight: 'bold',
                            background: `${planColors[plan]}20`,
                            color: planColors[plan],
                            textTransform: 'uppercase'
                          }}>
                            {plan}
                          </span>
                        </td>
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
                              <button onClick={() => openApprovalModal(business)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>✓ Approve</button>
                            )}

                            {business.approved_at && business.email !== 'info@natsautomations.co.ke' && (
                              <>
                                <button onClick={() => extendTrial(business.id, 30)} style={{ background: '#0066cc', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>+30 Days</button>
                                <button onClick={() => extendTrial(business.id, 60)} style={{ background: '#9c27b0', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>+60 Days</button>
                                <button onClick={() => extendTrial(business.id, 90)} style={{ background: '#ff9900', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>+90 Days</button>

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
          </div>
        </div>
      </div>

      {/* APPROVAL MODAL */}
      {showApprovalModal && selectedBusiness && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowApprovalModal(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '1rem' }}>✅ Approve Business</h2>
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{selectedBusiness.business_name}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Owner: {selectedBusiness.owner_name}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Email: {selectedBusiness.email}</div>
              <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                Selected Plan: <span style={{ fontWeight: 'bold', color: planColors[selectedBusiness.subscription_plan || 'basic'], textTransform: 'uppercase' }}>{selectedBusiness.subscription_plan || 'basic'}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Set Trial Period (Days) *
              </label>
              <input
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(parseInt(e.target.value))}
                min="1"
                max="365"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                💡 Common: 30 days (1 month), 60 days (2 months), 90 days (3 months)
              </div>
            </div>

            <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.5rem' }}>What happens next:</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                ✅ Account activated immediately<br/>
                📧 Welcome email sent with login details<br/>
                ⏰ Trial expires in {trialDays} days
              </div>
            </div>

            <button
              onClick={approveBusiness}
              style={{
                width: '100%',
                background: '#006633',
                color: 'white',
                border: 'none',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                marginBottom: '0.5rem'
              }}
            >
              ✓ Approve with {trialDays} Days Trial
            </button>

            <button
              onClick={() => setShowApprovalModal(false)}
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
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}