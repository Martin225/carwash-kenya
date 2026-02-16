import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

export default function OwnerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ phoneNumber: '', amount: 2000 });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    totalBookings: 0,
    activeCustomers: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSupervisor, setShowAddSupervisor] = useState(false);
  const [supervisorForm, setSupervisorForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    branchId: ''
  });
  const [subscriptionAlert, setSubscriptionAlert] = useState(null);

  useEffect(() => {
    if (user && user.business_id) {
      loadData();
      checkSubscription();
      if (activeTab === 'supervisors') {
        loadSupervisors();
        loadBranches();
      }
    } else {
      router.push('/login');
    }
  }, [user, activeTab]);

  function checkSubscription() {
    if (!user || !user.trial_ends_at) return;

    const trialEnd = new Date(user.trial_ends_at);
    const today = new Date();
    const daysLeft = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      setSubscriptionAlert({
        type: 'expired',
        message: '⛔ Your subscription has expired! Please renew to continue using the system.',
        daysLeft: 0
      });
    } else if (daysLeft <= 3) {
      setSubscriptionAlert({
        type: 'urgent',
        message: `⚠️ URGENT: Your subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}! Please renew now.`,
        daysLeft
      });
    } else if (daysLeft <= 7) {
      setSubscriptionAlert({
        type: 'warning',
        message: `⏰ Your subscription expires in ${daysLeft} days. Please renew soon.`,
        daysLeft
      });
    } else if (daysLeft <= 14) {
      setSubscriptionAlert({
        type: 'info',
        message: `ℹ️ Your subscription expires in ${daysLeft} days.`,
        daysLeft
      });
    }
  }

  async function loadData() {
    try {
      const response = await fetch(`/api/owner/dashboard?businessId=${user.business_id}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats || stats);
        setTransactions(data.transactions || []);
        setInventory(data.inventory || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSupervisors() {
    try {
      const response = await fetch(`/api/owner/supervisors?businessId=${user.business_id}`);
      const data = await response.json();
      if (data.success) {
        setSupervisors(data.supervisors || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function loadBranches() {
    try {
      const response = await fetch(`/api/owner/branches?businessId=${user.business_id}`);
      const data = await response.json();
      if (data.success) {
        setBranches(data.branches || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleAddSupervisor(e) {
    e.preventDefault();
    try {
      const response = await fetch('/api/owner/supervisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...supervisorForm, businessId: user.business_id })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Supervisor added successfully!', 'success');
        setShowAddSupervisor(false);
        setSupervisorForm({ fullName: '', email: '', phone: '', password: '', branchId: '' });
        loadSupervisors();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to add supervisor', 'error');
    }
  }

  async function toggleSupervisor(supervisorId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    try {
      const response = await fetch('/api/owner/supervisors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supervisorId, isActive: !currentStatus })
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Supervisor ${action}d successfully!`, 'success');
        loadSupervisors();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to update supervisor', 'error');
    }
  }

  async function handlePayment(e) {
    e.preventDefault();
    setPaymentLoading(true);

    try {
      const response = await fetch('/api/mpesa/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: user.business_id,
          userId: user.id,
          phoneNumber: paymentForm.phoneNumber,
          amount: paymentForm.amount,
          paymentType: 'subscription'
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast('Payment request sent! Check your phone for M-Pesa prompt.', 'success');
        setShowPayment(false);
        
        const paymentId = data.data.paymentId;
        pollPaymentStatus(paymentId);
      } else {
        showToast(data.message || 'Payment failed', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setPaymentLoading(false);
    }
  }

  async function pollPaymentStatus(paymentId) {
    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await fetch(`/api/mpesa/check-status?paymentId=${paymentId}`);
        const data = await response.json();

        if (data.success && data.payment.status === 'completed') {
          clearInterval(interval);
          showToast('Payment successful! Subscription activated.', 'success');
          setTimeout(() => window.location.reload(), 2000);
        } else if (data.success && data.payment.status === 'failed') {
          clearInterval(interval);
          showToast('Payment failed. Please try again.', 'error');
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          showToast('Payment is processing. Please check back in a moment.', 'info');
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 1000);
  }

  return (
    <>
      <Head>
        <title>Owner Dashboard - CarWash Pro Kenya</title>
      </Head>
      <ToastContainer />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1.5rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>👔 {user?.full_name ? `${user.full_name}'s Dashboard` : 'Owner Dashboard'}</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.business_name || 'Loading...'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => setActiveTab('overview')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Dashboard</button>
              <button onClick={() => router.push('/owner/payment-settings')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>💳 Payments</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
          {subscriptionAlert && (
            <div style={{ 
              background: subscriptionAlert.type === 'expired' ? '#d32f2f' : 
                          subscriptionAlert.type === 'urgent' ? '#f57c00' : 
                          subscriptionAlert.type === 'warning' ? '#ffc107' : '#2196f3',
              color: subscriptionAlert.type === 'info' || subscriptionAlert.type === 'warning' ? '#1565c0' : 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              animation: subscriptionAlert.type === 'expired' || subscriptionAlert.type === 'urgent' ? 'pulse 2s infinite' : 'none',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {subscriptionAlert.message}
                </div>
                {subscriptionAlert.daysLeft > 0 && user?.trial_ends_at && (
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    Trial ends: {new Date(user.trial_ends_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button 
                onClick={() => setShowPayment(true)}
                style={{ 
                  background: 'white', 
                  color: subscriptionAlert.type === 'expired' ? '#d32f2f' : subscriptionAlert.type === 'urgent' ? '#f57c00' : '#006633',
                  border: 'none', 
                  padding: '0.75rem 1.5rem', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  whiteSpace: 'nowrap'
                }}
              >
                💳 Pay Now - Kshs 2,000
              </button>
            </div>
          )}

          <div style={{ marginBottom: '2rem', borderBottom: '2px solid #e0e0e0' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {['overview', 'transactions', 'inventory', 'supervisors', 'branches'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? '#006633' : 'transparent', color: activeTab === tab ? 'white' : '#666', border: 'none', padding: '1rem 1.5rem', cursor: 'pointer', fontWeight: 'bold', borderBottom: activeTab === tab ? '3px solid #006633' : '3px solid transparent', fontSize: '1rem' }}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {[
                { label: 'Total Revenue', value: `Kshs ${(stats.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: '#006633' },
                { label: 'Today Revenue', value: `Kshs ${(stats.todayRevenue || 0).toLocaleString()}`, icon: '📊', color: '#0066cc' },
                { label: 'Total Bookings', value: stats.totalBookings || 0, icon: '🚗', color: '#ff9900' },
                { label: 'Active Customers', value: stats.activeCustomers || 0, icon: '👥', color: '#9c27b0' }
              ].map((stat, i) => (
                <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: `4px solid ${stat.color}`, transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                  <div style={{ color: '#666', marginTop: '0.5rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>💰 All Transactions</h2>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                  <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📭</div>
                  <p style={{ color: '#999', marginBottom: '0.5rem', fontSize: '1.3rem', fontWeight: '600' }}>No transactions yet</p>
                  <p style={{ color: '#666', fontSize: '1rem', maxWidth: '450px', margin: '0 auto' }}>
                    Transactions will appear here once customers start using your service
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Vehicle</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Service</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr key={txn.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '1rem' }}>{new Date(txn.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '1rem', fontWeight: '500' }}>🚗 {txn.vehicle_reg}</td>
                          <td style={{ padding: '1rem' }}>{txn.service_name}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#006633' }}>Kshs {txn.final_amount}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ padding: '0.35rem 0.85rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '600', background: '#e8f5e9', color: '#2e7d32' }}>✓ {txn.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>📦 Inventory Status</h2>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                  <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>Loading inventory...</p>
                </div>
              ) : inventory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📦</div>
                  <p style={{ color: '#999', marginBottom: '0.5rem', fontSize: '1.3rem', fontWeight: '600' }}>No inventory items yet</p>
                  <p style={{ color: '#666', fontSize: '1rem', maxWidth: '450px', margin: '0 auto' }}>
                    Your supervisor can add inventory items like soap, wax, and cleaning supplies from their dashboard
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {inventory.map((item) => (
                    <div key={item.id} style={{ background: 'white', border: '2px solid #e0e0e0', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${item.current_stock <= item.reorder_level ? '#f44336' : '#4caf50'}` }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{item.item_name}</h3>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
                        <span style={{ background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{item.category}</span>
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0', color: item.current_stock <= item.reorder_level ? '#f44336' : '#006633' }}>
                        {item.current_stock} {item.unit}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        Reorder at: {item.reorder_level} {item.unit}
                      </div>
                      {item.current_stock <= item.reorder_level && (
                        <div style={{ background: '#ffebee', color: '#c62828', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '1rem' }}>
                          ⚠️ Low Stock - Reorder Soon!
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'supervisors' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0, color: '#006633' }}>👨‍💼 Supervisors Management</h2>
                <button onClick={() => setShowAddSupervisor(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Supervisor</button>
              </div>

              {supervisors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>👨‍💼</div>
                  <p style={{ color: '#999', marginBottom: '0.5rem', fontSize: '1.3rem', fontWeight: '600' }}>No supervisors yet</p>
                  <p style={{ color: '#666', fontSize: '1rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
                    Add supervisors to help manage your carwash operations and staff
                  </p>
                  <button onClick={() => setShowAddSupervisor(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                    + Add Your First Supervisor
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {supervisors.map((sup) => (
                    <div key={sup.id} style={{ border: '2px solid #e0e0e0', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${sup.is_active ? '#4caf50' : '#f44336'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{sup.full_name}</h3>
                          {sup.branch_name && (
                            <div style={{ fontSize: '0.85rem', color: '#006633', background: '#e8f5e9', padding: '0.25rem 0.75rem', borderRadius: '12px', display: 'inline-block' }}>
                              🏢 {sup.branch_name}
                            </div>
                          )}
                        </div>
                        <span style={{ background: sup.is_active ? '#e8f5e9' : '#ffebee', color: sup.is_active ? '#2e7d32' : '#c62828', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', height: 'fit-content' }}>
                          {sup.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                        <p style={{ margin: '0.5rem 0' }}>📧 {sup.email}</p>
                        <p style={{ margin: '0.5rem 0' }}>📞 {sup.phone}</p>
                      </div>
                      <button onClick={() => toggleSupervisor(sup.id, sup.is_active)} style={{ width: '100%', padding: '0.75rem', background: sup.is_active ? '#f44336' : '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {sup.is_active ? '✗ Deactivate' : '✓ Activate'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'branches' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#006633' }}>🏢 Branch Management</h2>
              <p style={{ color: '#666', marginBottom: '2rem' }}>Manage multiple locations for your carwash business</p>
              <button onClick={() => router.push('/owner/branches')} style={{ background: '#006633', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                Manage Branches →
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddSupervisor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowAddSupervisor(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '1.5rem' }}>Add New Supervisor</h2>
            <form onSubmit={handleAddSupervisor}>
              <input type="text" placeholder="Full Name *" value={supervisorForm.fullName} onChange={(e) => setSupervisorForm({ ...supervisorForm, fullName: e.target.value })} required style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              <input type="email" placeholder="Email *" value={supervisorForm.email} onChange={(e) => setSupervisorForm({ ...supervisorForm, email: e.target.value })} required style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              <input type="tel" placeholder="Phone Number *" value={supervisorForm.phone} onChange={(e) => setSupervisorForm({ ...supervisorForm, phone: e.target.value })} required style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#666' }}>Assign to Branch *</label>
                <select value={supervisorForm.branchId} onChange={(e) => setSupervisorForm({ ...supervisorForm, branchId: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                  ))}
                </select>
              </div>
              <input type="password" placeholder="Temporary Password *" value={supervisorForm.password} onChange={(e) => setSupervisorForm({ ...supervisorForm, password: e.target.value })} required style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              <button type="submit" style={{ width: '100%', padding: '1rem', background: '#006633', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: '0.5rem' }}>Add Supervisor</button>
              <button type="button" onClick={() => setShowAddSupervisor(false)} style={{ width: '100%', padding: '0.75rem', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {showPayment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => !paymentLoading && setShowPayment(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '0.5rem' }}>💳 Pay Subscription</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>Pay Kshs 2,000 for 30 days subscription</p>
            
            <form onSubmit={handlePayment}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>M-Pesa Phone Number *</label>
                <input 
                  type="tel" 
                  value={paymentForm.phoneNumber} 
                  onChange={(e) => setPaymentForm({ ...paymentForm, phoneNumber: e.target.value })} 
                  required 
                  placeholder="0722123456 or 254722123456" 
                  pattern="(0|254)?[17][0-9]{8}"
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} 
                />
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                  📱 You'll receive an M-Pesa prompt on this number
                </div>
              </div>

              <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.5rem' }}>What happens next?</div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  1️⃣ Enter your M-Pesa PIN on your phone<br/>
                  2️⃣ Payment confirmed automatically<br/>
                  3️⃣ Subscription activated for 30 days!
                </div>
              </div>

              <button 
                type="submit" 
                disabled={paymentLoading}
                style={{ width: '100%', background: paymentLoading ? '#ccc' : '#006633', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', cursor: paymentLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}
              >
                {paymentLoading ? '⏳ Processing...' : '💳 Pay Kshs 2,000'}
              </button>

              <button 
                type="button" 
                onClick={() => setShowPayment(false)} 
                disabled={paymentLoading}
                style={{ width: '100%', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: paymentLoading ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}