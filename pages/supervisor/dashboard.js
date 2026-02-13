import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';

export default function SupervisorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [bays, setBays] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({
    carsToday: 0,
    revenueToday: 0,
    activeBays: 0,
    staffOnDuty: 0
  });
  const [loading, setLoading] = useState(true);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    vehicleReg: '',
    phone: '',
    customerName: '',
    vehicleType: 'sedan',
    serviceId: '',
    bayId: '',
    staffId: ''
  });
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (user && user.business_id) {
      loadData();
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    } else {
      router.push('/login');
    }
  }, [user]);

  async function loadData() {
    try {
      const response = await fetch(`/api/supervisor/dashboard?businessId=${user.business_id}`);
      const data = await response.json();
      
      if (data.success) {
        setBays(data.bays || []);
        setTodayBookings(data.todayBookings || []);
        setPendingApprovals(data.pendingApprovals || []);
        setStaff(data.staff || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function searchCustomer(searchText) {
    if (searchText.length < 3) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/search-vehicles?q=${encodeURIComponent(searchText)}`);
      const data = await response.json();
      
      if (data.success && data.vehicles.length > 0) {
        setCustomerSuggestions(data.vehicles);
        setShowSuggestions(true);
      } else {
        setCustomerSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  function selectCustomer(vehicle) {
    setWalkInForm({
      ...walkInForm,
      vehicleReg: vehicle.registration_number,
      phone: vehicle.customer_phone,
      customerName: vehicle.customer_name,
      vehicleType: vehicle.vehicle_type || 'sedan'
    });
    setShowSuggestions(false);
    
    if (vehicle.total_visits > 0) {
      const msg = `🎉 Returning Customer!\n\n` +
                  `Name: ${vehicle.customer_name}\n` +
                  `Visits: ${vehicle.total_visits}\n` +
                  `Loyalty Points: ${vehicle.loyalty_points}\n` +
                  `Last Visit: ${vehicle.last_visit_date ? new Date(vehicle.last_visit_date).toLocaleDateString() : 'N/A'}`;
      alert(msg);
    }
  }

  async function handleWalkIn(e) {
    e.preventDefault();
    setWalkInLoading(true);

    try {
      const response = await fetch('/api/supervisor/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...walkInForm, businessId: user.business_id })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Customer Registered!\n\nQueue #${data.queueNumber}\nBay: ${data.bayNumber}\nAmount: Kshs ${data.amount}\n\nStaff has been notified.`);
        setShowWalkIn(false);
        setWalkInForm({ vehicleReg: '', phone: '', customerName: '', vehicleType: 'sedan', serviceId: '', bayId: '', staffId: '' });
        loadData();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('Failed to register customer');
    } finally {
      setWalkInLoading(false);
    }
  }

  const bayColors = {
    available: '#4caf50',
    occupied: '#f44336',
    cleaning: '#ff9800'
  };

  return (
    <>
      <Head>
        <title>Supervisor Dashboard - CarWash Pro Kenya</title>
      </Head>

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>👨‍💼 Supervisor Dashboard</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.business_name || 'Loading...'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => setShowWalkIn(true)} style={{ background: '#FCD116', color: '#006633', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>+ Walk-in Customer</button>
              <button onClick={() => router.push('/supervisor/staff')} style={{ background: 'white', color: '#006633', border: '2px solid white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>👥 Manage Staff</button>
              <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Home</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {[
              { label: 'Cars Today', value: stats.carsToday, icon: '🚗', color: '#006633' },
              { label: 'Revenue Today', value: `Kshs ${stats.revenueToday.toLocaleString()}`, icon: '💰', color: '#0066cc' },
              { label: 'Active Bays', value: `${stats.activeBays}/4`, icon: '🚙', color: '#ff9900' },
              { label: 'Staff on Duty', value: stats.staffOnDuty, icon: '👥', color: '#9c27b0' }
            ].map((stat, i) => (
              <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: `4px solid ${stat.color}` }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                <div style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>🚙 Bay Status</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {bays.map((bay) => (
                <div key={bay.id} style={{ border: `3px solid ${bayColors[bay.status]}`, padding: '1.5rem', borderRadius: '12px', background: bay.status === 'available' ? '#f1f8f4' : bay.status === 'occupied' ? '#fff1f0' : '#fff8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Bay {bay.bay_number}</h3>
                    <span style={{ background: bayColors[bay.status], color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>{bay.status}</span>
                  </div>
                  {bay.status !== 'available' && bay.current_vehicle && (
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      <p style={{ margin: '0.5rem 0' }}>🚗 {bay.current_vehicle}</p>
                      <p style={{ margin: '0.5rem 0' }}>👤 {bay.customer_name}</p>
                      <p style={{ margin: '0.5rem 0' }}>✨ {bay.service_name}</p>
                      <p style={{ margin: '0.5rem 0' }}>🧑‍🔧 {bay.staff_name || 'Not assigned'}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#006633' }}>⏳ Pending Approvals ({pendingApprovals.length})</h2>
              {pendingApprovals.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No pending approvals</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pendingApprovals.map((booking) => (
                    <div key={booking.id} style={{ border: '1px solid #e0e0e0', padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{booking.vehicle_reg} • {booking.service_name}</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>{booking.customer_name} • {booking.phone}<br/>{new Date(booking.booking_date + ' ' + booking.booking_time).toLocaleString()}</div>
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                        <button style={{ flex: 1, background: '#4caf50', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✓ Approve</button>
                        <button style={{ flex: 1, background: '#f44336', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✗ Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#006633' }}>📅 Today's Schedule ({todayBookings.length})</h2>
              {todayBookings.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No bookings today</p>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {todayBookings.map((booking) => (
                    <div key={booking.id} style={{ borderLeft: `4px solid ${booking.status === 'completed' ? '#4caf50' : booking.status === 'in-progress' ? '#ff9800' : '#2196f3'}`, padding: '0.75rem', marginBottom: '0.75rem', background: '#f9f9f9', borderRadius: '0 8px 8px 0' }}>
                      <div style={{ fontWeight: 'bold' }}>{booking.booking_time} • {booking.vehicle_reg}</div>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>{booking.service_name} • {booking.customer_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showWalkIn && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowWalkIn(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '0.5rem' }}>🚗 Walk-in Customer</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>Quick registration for customers who just drove in</p>

            <form onSubmit={handleWalkIn}>
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Vehicle Registration *</label>
                <input 
                  type="text" 
                  value={walkInForm.vehicleReg} 
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setWalkInForm({ ...walkInForm, vehicleReg: value });
                    searchCustomer(value);
                  }} 
                  required 
                  placeholder="KCA 123A (start typing...)" 
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} 
                  autoComplete="off"
                />
                
                {showSuggestions && customerSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #006633', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    {customerSuggestions.map((vehicle, i) => (
                      <div
                        key={i}
                        onClick={() => selectCustomer(vehicle)}
                        style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f7ff'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        <div style={{ fontWeight: 'bold', color: '#006633', marginBottom: '0.25rem' }}>
                          🚗 {vehicle.registration_number}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          👤 {vehicle.customer_name} • 📞 {vehicle.customer_phone}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
                          🚙 Visits: {vehicle.total_visits} • ⭐ {vehicle.loyalty_points} points
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone Number *</label>
                <input 
                  type="tel" 
                  value={walkInForm.phone} 
                  onChange={(e) => {
                    const value = e.target.value;
                    setWalkInForm({ ...walkInForm, phone: value });
                    if (value.length >= 10) {
                      searchCustomer(value);
                    }
                  }} 
                  required 
                  placeholder="0722XXXXXX (or start typing...)" 
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} 
                  autoComplete="off"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Customer Name (Optional)</label>
                <input type="text" value={walkInForm.customerName} onChange={(e) => setWalkInForm({ ...walkInForm, customerName: e.target.value })} placeholder="John Doe" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Vehicle Type *</label>
                <select value={walkInForm.vehicleType} onChange={(e) => setWalkInForm({ ...walkInForm, vehicleType: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="sedan">Sedan (Normal Car)</option>
                  <option value="suv">SUV (Big Car)</option>
                  <option value="truck">Truck / Pickup</option>
                  <option value="matatu">Matatu / Van</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Service *</label>
                <select value={walkInForm.serviceId} onChange={(e) => setWalkInForm({ ...walkInForm, serviceId: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="">Select Service</option>
                  <option value="1">Basic Wash - Kshs 500</option>
                  <option value="2">Premium Wash - Kshs 800</option>
                  <option value="3">Full Detailing - Kshs 1500</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Assign to Bay *</label>
                <select value={walkInForm.bayId} onChange={(e) => setWalkInForm({ ...walkInForm, bayId: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="">Select Bay</option>
                  {bays.filter(b => b.status === 'available').map(bay => (
                    <option key={bay.id} value={bay.id}>Bay {bay.bay_number} - Available</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Assign Staff *</label>
                <select value={walkInForm.staffId} onChange={(e) => setWalkInForm({ ...walkInForm, staffId: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="">Select Staff</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={walkInLoading} style={{ width: '100%', background: walkInLoading ? '#ccc' : '#006633', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', cursor: walkInLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>
                {walkInLoading ? 'Registering...' : '✓ Register & Assign'}
              </button>

              <button type="button" onClick={() => setShowWalkIn(false)} style={{ width: '100%', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}