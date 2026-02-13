import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';

export default function OwnerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalBookings: 0,
    completedToday: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSupervisor, setShowAddSupervisor] = useState(false);
  const [supervisorForm, setSupervisorForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    if (user && user.business_id) {
      loadData();
      if (activeTab === 'supervisors') {
        loadSupervisors();
      }
    } else {
      router.push('/login');
    }
  }, [user, activeTab]);

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
        alert('✅ Supervisor added successfully!');
        setShowAddSupervisor(false);
        setSupervisorForm({ fullName: '', email: '', phone: '', password: '' });
        loadSupervisors();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('Failed to add supervisor');
    }
  }

  async function toggleSupervisor(supervisorId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this supervisor?`)) return;

    try {
      const response = await fetch('/api/owner/supervisors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supervisorId, isActive: !currentStatus })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Supervisor ${action}d successfully!`);
        loadSupervisors();
      }
    } catch (error) {
      alert('Failed to update supervisor');
    }
  }

  return (
    <>
      <Head><title>Owner Dashboard - CarWash Pro Kenya</title></Head>

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1.5rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>🏢 Owner Dashboard</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.business_name || 'Loading...'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setActiveTab('overview')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Dashboard</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {[
              { label: 'Today Revenue', value: `Kshs ${stats.todayRevenue.toLocaleString()}`, icon: '💰', color: '#006633' },
              { label: 'Monthly Revenue', value: `Kshs ${stats.monthlyRevenue.toLocaleString()}`, icon: '📊', color: '#0066cc' },
              { label: 'Total Bookings', value: stats.totalBookings, icon: '🚗', color: '#ff9900' },
              { label: 'Completed Today', value: stats.completedToday, icon: '✅', color: '#4caf50' }
            ].map((stat, i) => (
              <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: `4px solid ${stat.color}` }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                <div style={{ color: '#666', marginTop: '0.5rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {['overview', 'transactions', 'inventory', 'supervisors', 'branches'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.75rem 1.5rem', background: activeTab === tab ? '#006633' : 'white', color: activeTab === tab ? 'white' : '#666', border: activeTab === tab ? 'none' : '2px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'capitalize' }}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'supervisors' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#006633' }}>👨‍💼 Supervisors Management</h2>
                <button onClick={() => setShowAddSupervisor(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Supervisor</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {supervisors.map((sup) => (
                  <div key={sup.id} style={{ border: '2px solid #e0e0e0', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${sup.is_active ? '#4caf50' : '#f44336'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{sup.full_name}</h3>
                      <span style={{ background: sup.is_active ? '#e8f5e9' : '#ffebee', color: sup.is_active ? '#2e7d32' : '#c62828', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {sup.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                      <p style={{ margin: '0.5rem 0' }}>📧 {sup.email}</p>
                      <p style={{ margin: '0.5rem 0' }}>📞 {sup.phone}</p>
                      <p style={{ margin: '0.5rem 0' }}>📅 Added: {new Date(sup.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => toggleSupervisor(sup.id, sup.is_active)} style={{ width: '100%', padding: '0.75rem', background: sup.is_active ? '#f44336' : '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      {sup.is_active ? '✗ Deactivate' : '✓ Activate'}
                    </button>
                  </div>
                ))}
              </div>

              {supervisors.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍💼</div>
                  <p>No supervisors yet. Add your first supervisor!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>💰 All Transactions</h2>
              {transactions.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No transactions yet</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9f9f9' }}>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Date/Time</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Vehicle</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Customer</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Service</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr key={txn.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '1rem' }}>{new Date(txn.created_at).toLocaleString()}</td>
                          <td style={{ padding: '1rem' }}>{txn.vehicle_reg}</td>
                          <td style={{ padding: '1rem' }}>{txn.customer_name}</td>
                          <td style={{ padding: '1rem' }}>{txn.service_name}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Kshs {txn.final_amount.toLocaleString()}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', background: txn.status === 'completed' ? '#e8f5e9' : '#fff3e0', color: txn.status === 'completed' ? '#2e7d32' : '#f57c00' }}>
                              {txn.status}
                            </span>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {inventory.map((item) => (
                  <div key={item.id} style={{ border: '2px solid #e0e0e0', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${item.current_stock <= item.reorder_level ? '#f44336' : '#4caf50'}` }}>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{item.item_name}</h3>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Category: {item.category}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.75rem 0' }}>{item.current_stock} {item.unit}</div>
                    {item.current_stock <= item.reorder_level && (
                      <div style={{ background: '#ffebee', color: '#c62828', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>⚠️ Low Stock - Reorder Soon!</div>
                    )}
                  </div>
                ))}
              </div>
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

          {activeTab === 'overview' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#006633' }}>📈 Business Overview</h2>
              <p style={{ color: '#666', marginBottom: '2rem' }}>Comprehensive analytics and reports will be displayed here</p>
              <div style={{ textAlign: 'center', padding: '3rem', background: '#f9f9f9', borderRadius: '8px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <p style={{ color: '#999' }}>Advanced analytics dashboard coming soon...</p>
              </div>
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
              <input type="password" placeholder="Temporary Password *" value={supervisorForm.password} onChange={(e) => setSupervisorForm({ ...supervisorForm, password: e.target.value })} required style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              <button type="submit" style={{ width: '100%', padding: '1rem', background: '#006633', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: '0.5rem' }}>Add Supervisor</button>
              <button type="button" onClick={() => setShowAddSupervisor(false)} style={{ width: '100%', padding: '0.75rem', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}