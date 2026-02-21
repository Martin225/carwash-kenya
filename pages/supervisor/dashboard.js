import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../lib/auth-context';

export default function SupervisorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [bays, setBays] = useState([]);
  const [error, setError] = useState('');
  const [todayBookings, setTodayBookings] = useState([]);
  const [services, setServices] = useState([]);
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
  serviceCategory: 'vehicle_service', // NEW!
  vehicleType: 'sedan',
  serviceId: '',
  bayId: '',
  staffId: ''
});
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // PAYMENT RECORDING STATES
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    method: 'mpesa_till',
    reference: ''
  });
  const [recordingPayment, setRecordingPayment] = useState(false);

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
      setError('');
      const response = await fetch(`/api/supervisor/dashboard?businessId=${user.business_id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
          
      if (data.success) {
        setBays(data.bays || []);
        setTodayBookings(data.todayBookings || []);
        setPendingApprovals(data.pendingApprovals || []);
        setStaff(data.staff || []);
        setStats(data.stats || stats);
      } else {
        setError(data.message || 'Failed to load dashboard');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadServices(category, vehicleType) {
  try {
    const response = await fetch(`/api/supervisor/services?businessId=${user.business_id}`);
    const data = await response.json();
    
    if (data.success) {
      // Filter by category
      let filtered = (data.services || []).filter(s => s.service_category === category);
      setServices(filtered);
    }
  } catch (error) {
    console.error('Error loading services:', error);
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
      const lastVisit = vehicle.last_visit_date ? new Date(vehicle.last_visit_date).toLocaleDateString() : 'N/A';
      showToast(
        `🎉 Returning Customer! ${vehicle.customer_name} - ${vehicle.total_visits} visits, ${vehicle.loyalty_points} points. Last visit: ${lastVisit}`, 
        'success'
      );
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
        showToast(`Customer registered! Queue #${data.queueNumber} | Bay: ${data.bayNumber} | Amount: Kshs ${data.amount}`, 'success');
        setShowWalkIn(false);
        setWalkInForm({ vehicleReg: '', phone: '', customerName: '', vehicleType: 'sedan', serviceId: '', bayId: '', staffId: '' });
        loadData();
      } else {
        let errorMsg = data.message;
        if (errorMsg.includes('Branch not found')) {
          errorMsg = 'No branch found. Please contact your administrator.';
        } else if (errorMsg.includes('not found')) {
          errorMsg = 'Service or pricing not configured. Please contact support.';
        }
        showToast(errorMsg, 'error');
      }
    } catch (error) {
      showToast('Network error. Please check your internet connection and try again.', 'error');
    } finally {
      setWalkInLoading(false);
    }
  }

  // PAYMENT RECORDING FUNCTION
  async function handleRecordPayment(e) {
    e.preventDefault();
    setRecordingPayment(true);

    try {
      const response = await fetch('/api/supervisor/record-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          paymentMethod: paymentForm.method,
          paymentReference: paymentForm.reference
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast('✅ Payment recorded! SMS sent to customer.', 'success');
        setShowPaymentModal(false);
        setSelectedBooking(null);
        setPaymentForm({ method: 'mpesa_till', reference: '' });
        loadData();
      } else {
        showToast(data.message || 'Failed to record payment', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setRecordingPayment(false);
    }
  }

  const bayColors = {
    available: '#4caf50',
    occupied: '#f44336',
    cleaning: '#ff9800'
  };

  // Get active bookings (completed but unpaid, or in-progress)
  const activeBookings = todayBookings.filter(b => 
  (b.status === 'completed' && b.payment_status !== 'paid') || 
  b.status === 'in-progress' ||
  b.status === 'pending'  // ADD THIS LINE!
);

  // Get paid bookings from today
  const paidBookings = todayBookings.filter(b => 
    b.payment_status === 'paid'
  );

  if (loading) {
    return (
      <>
        <Head><title>Supervisor Dashboard - CarWash Pro Kenya</title></Head>
        <ToastContainer />
        
        {error && (
          <div style={{ margin: '1rem 2rem', background: '#fff3cd', border: '2px solid #ffc107', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: '#856404' }}>{error}</div>
            </div>
            <button 
              onClick={() => { 
                setError(''); 
                loadData(); 
              }} 
              style={{ background: '#ffc107', color: '#856404', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Retry
            </button>
          </div>
        )}
        
        <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)' }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Loading Dashboard...</h2>
            <p style={{ opacity: 0.8, marginTop: '0.5rem' }}>Fetching bay status, bookings & staff data</p>
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
      <Head>
        <title>Supervisor Dashboard - CarWash Pro Kenya</title>
      </Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>👨‍💼 Supervisor Dashboard</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.business_name || 'Loading...'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => {
  setShowWalkIn(true);
  loadServices('vehicle_service', 'sedan'); // Load default services
}} style={{ background: '#FCD116', color: '#006633', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>+ Drive-In Customer</button>
              <button onClick={() => router.push('/supervisor/staff')} style={{ background: 'white', color: '#006633', border: '2px solid white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>👥 Manage Staff</button>
              <button onClick={() => router.push('/supervisor/inventory')} style={{ background: 'white', color: '#006633', border: '2px solid white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>📦 Inventory</button>
              <button onClick={() => router.push('/supervisor/services')} style={{ background: 'white', color: '#006633', border: '2px solid white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>✨ Services</button>
              <button onClick={() => loadData()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
          {/* STATS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {[
              { label: 'Cars Today', value: stats.carsToday, icon: '🚗', color: '#006633' },
              { label: 'Revenue Today', value: `Kshs ${stats.revenueToday.toLocaleString()}`, icon: '💰', color: '#0066cc' },
              { label: 'Active Bays', value: `${stats.activeBays}/4`, icon: '🚙', color: '#ff9800' },
              { label: 'Staff on Duty', value: stats.staffOnDuty, icon: '👥', color: '#9c27b0' }
            ].map((stat, i) => (
              <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: `4px solid ${stat.color}` }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                <div style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* BAY STATUS */}
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

          {/* ACTIVE BOOKINGS (UNPAID) */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>💼 Active Bookings ({activeBookings.length})</h2>
            {activeBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                <p style={{ color: '#999', fontSize: '1.2rem' }}>No active bookings</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {activeBookings.map((booking) => (
                  <div key={booking.id} style={{ background: 'white', padding: '1.5rem', border: '2px solid #e0e0e0', borderRadius: '12px', borderLeft: `4px solid ${booking.status === 'completed' ? '#4caf50' : '#ff9800'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
                          {booking.vehicle_reg ? `🚗 ${booking.vehicle_reg}` : '📦 Walk-in Service'}
                        </h3>
                        <div style={{ color: '#666', marginBottom: '0.5rem' }}>
                          <p style={{ margin: '0.25rem 0' }}>👤 {booking.customer_name}</p>
                          <p style={{ margin: '0.25rem 0' }}>📞 {booking.phone}</p>
                          <p style={{ margin: '0.25rem 0' }}>🧼 {booking.service_name}</p>
                          <p style={{ margin: '0.25rem 0', fontWeight: 'bold', color: '#006633', fontSize: '1.1rem' }}>
                            💰 Kshs {booking.final_amount}
                          </p>
                        </div>
                        {booking.bay_name && (
                          <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem', marginRight: '0.5rem' }}>
                            📍 {booking.bay_name}
                          </span>
                        )}
                        <span style={{ background: '#f3e5f5', color: '#7b1fa2', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                     👤 {booking.staff_name || 'Not assigned'}
                    </span>

                      </div>
                      <span style={{ 
                        background: '#fff3e0',
                        color: '#f57c00',
                        padding: '0.5rem 1rem', 
                        borderRadius: '20px', 
                        fontSize: '0.9rem', 
                        fontWeight: 'bold',
                        display: 'inline-block'
                      }}>
                        ⏳ UNPAID
                      </span>
                    </div>

                    {booking.status === 'completed' && (
                      <button 
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowPaymentModal(true);
                        }}
                        style={{ 
                          width: '100%', 
                          background: '#006633', 
                          color: 'white', 
                          border: 'none', 
                          padding: '1rem', 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        }}
                      >
                        💳 RECORD PAYMENT
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PAID BOOKINGS TODAY */}
          {paidBookings.length > 0 && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>✅ Paid Today ({paidBookings.length})</h2>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {paidBookings.map((booking) => (
                  <div key={booking.id} style={{ background: '#f9fff9', padding: '1.5rem', border: '2px solid #e8f5e9', borderRadius: '12px', borderLeft: '4px solid #4caf50' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
                          {booking.vehicle_reg ? `🚗 ${booking.vehicle_reg}` : '📦 Walk-in Service'}
                        </h3>
                        <div style={{ color: '#666', marginBottom: '0.5rem' }}>
                          <p style={{ margin: '0.25rem 0' }}>👤 {booking.customer_name}</p>
                          <p style={{ margin: '0.25rem 0' }}>📞 {booking.phone}</p>
                          <p style={{ margin: '0.25rem 0' }}>🧼 {booking.service_name}</p>
                          <p style={{ margin: '0.25rem 0', fontWeight: 'bold', color: '#006633', fontSize: '1.1rem' }}>
                            💰 Kshs {booking.final_amount}
                          </p>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                            💳 {booking.payment_method?.replace('_', ' ').toUpperCase()}
                            {booking.payment_reference && ` • ${booking.payment_reference}`}
                          </p>
                        </div>
                      </div>
                      <span style={{ 
                        background: '#e8f5e9',
                        color: '#2e7d32',
                        padding: '0.5rem 1rem', 
                        borderRadius: '20px', 
                        fontSize: '0.9rem', 
                        fontWeight: 'bold'
                      }}>
                        ✅ PAID
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        window.open(`/api/generate-receipt?bookingId=${booking.id}`, '_blank');
                        showToast('📄 Generating receipt...', 'success');
                      }}
                      style={{
                        width: '100%',
                        background: '#2196f3',
                        color: 'white',
                        border: 'none',
                        padding: '1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}
                    >
                      📄 Download Receipt
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PENDING APPROVALS & TODAY'S SCHEDULE */}
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
                      <div style={{ fontWeight: 'bold' }}>{booking.booking_time} • {booking.vehicle_reg || 'Walk-in'}</div>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>{booking.service_name} • {booking.customer_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WALK-IN MODAL */}
     
{showWalkIn && (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowWalkIn(false)}>
    <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
      <h2 style={{ color: '#006633', marginBottom: '0.5rem' }}>🚗 Drive-In Customer</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Quick registration for customers who just drove in</p>

      <form onSubmit={handleWalkIn}>
        {/* SERVICE CATEGORY SELECTOR */}
        <div style={{ marginBottom: '1.5rem', background: '#f0f7ff', padding: '1rem', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: '#006633' }}>
            What are you servicing? *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '1rem', 
              border: walkInForm.serviceCategory === 'vehicle_service' ? '3px solid #006633' : '2px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              background: walkInForm.serviceCategory === 'vehicle_service' ? '#e8f5e9' : 'white'
            }}>
              <input 
                type="radio" 
                name="serviceCategory"
                value="vehicle_service"
                checked={walkInForm.serviceCategory === 'vehicle_service'}
                onChange={(e) => {
                  setWalkInForm({ ...walkInForm, serviceCategory: e.target.value, serviceId: '' });
                  loadServices(e.target.value, walkInForm.vehicleType);
                }}
                style={{ marginRight: '0.75rem' }}
              />
              <div>
                <div style={{ fontWeight: 'bold' }}>🚗 Vehicle</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Car, truck, motorcycle</div>
              </div>
            </label>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '1rem', 
              border: walkInForm.serviceCategory === 'other_service' ? '3px solid #006633' : '2px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              background: walkInForm.serviceCategory === 'other_service' ? '#e8f5e9' : 'white'
            }}>
              <input 
                type="radio" 
                name="serviceCategory"
                value="other_service"
                checked={walkInForm.serviceCategory === 'other_service'}
                onChange={(e) => {
                  setWalkInForm({ ...walkInForm, serviceCategory: e.target.value, vehicleReg: '', serviceId: '' });
                  loadServices(e.target.value, null);
                }}
                style={{ marginRight: '0.75rem' }}
              />
              <div>
                <div style={{ fontWeight: 'bold' }}>🏠 Other</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Carpet, furniture, office</div>
              </div>
            </label>
          </div>
        </div>

        {/* VEHICLE REGISTRATION - Conditional */}
        <div style={{ marginBottom: '1rem', position: 'relative' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Vehicle Registration {walkInForm.serviceCategory === 'other_service' ? '(Optional)' : '*'}
          </label>
          <input 
            type="text" 
            value={walkInForm.vehicleReg} 
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              setWalkInForm({ ...walkInForm, vehicleReg: value });
              if (value.length >= 3 && walkInForm.serviceCategory === 'vehicle_service') {
                searchCustomer(value);
              }
            }} 
            required={walkInForm.serviceCategory === 'vehicle_service'}
            placeholder={walkInForm.serviceCategory === 'other_service' ? 'N/A (not needed for this service)' : 'KCA 123A (start typing...)'} 
            disabled={walkInForm.serviceCategory === 'other_service'}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              border: '2px solid #e0e0e0', 
              borderRadius: '8px', 
              fontSize: '1rem', 
              boxSizing: 'border-box', 
              background: walkInForm.serviceCategory === 'other_service' ? '#f5f5f5' : 'white',
              cursor: walkInForm.serviceCategory === 'other_service' ? 'not-allowed' : 'text'
            }} 
            autoComplete="off"
          />
          
          {showSuggestions && customerSuggestions.length > 0 && walkInForm.serviceCategory === 'vehicle_service' && (
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

        {/* PHONE NUMBER */}
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
            placeholder="0722XXXXXX" 
            style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} 
          />
        </div>

        {/* CUSTOMER NAME */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Customer Name (Optional)</label>
          <input 
            type="text" 
            value={walkInForm.customerName} 
            onChange={(e) => setWalkInForm({ ...walkInForm, customerName: e.target.value })} 
            placeholder="John Doe" 
            style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} 
          />
        </div>

        {/* VEHICLE TYPE - Only show for vehicle services */}
        {walkInForm.serviceCategory === 'vehicle_service' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Vehicle Type *</label>
            <select 
              value={walkInForm.vehicleType} 
              onChange={(e) => {
                const newType = e.target.value;
                setWalkInForm({ ...walkInForm, vehicleType: newType, serviceId: '' });
                loadServices(walkInForm.serviceCategory, newType);
              }} 
              required 
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
            >
              <option value="sedan">🚗 Sedan</option>
              <option value="suv">🚙 SUV</option>
              <option value="truck">🚚 Truck</option>
              <option value="matatu">🚐 Matatu</option>
            </select>
          </div>
        )}

        {/* SERVICE SELECTION */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Service *</label>
          <select 
            value={walkInForm.serviceId} 
            onChange={(e) => setWalkInForm({ ...walkInForm, serviceId: e.target.value })} 
            required 
            style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
          >
            <option value="">Select Service</option>
            {services.map(service => {
              const price = walkInForm.serviceCategory === 'other_service' 
                ? service.fixed_price 
                : service.pricing?.[walkInForm.vehicleType] || 0;
              
              return (
                <option key={service.id} value={service.id}>
                  {service.name} - Kshs {price ? price.toLocaleString() : '0'}
                </option>
              );
            })}
          </select>
          {services.length === 0 && (
            <div style={{ fontSize: '0.85rem', color: '#f57c00', marginTop: '0.5rem', background: '#fff3e0', padding: '0.5rem', borderRadius: '4px' }}>
              ⚠️ No services available. Please add services first in Services menu.
            </div>
          )}
        </div>

        {/* BAY ASSIGNMENT - Only for vehicle services */}
        {walkInForm.serviceCategory === 'vehicle_service' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Assign to Bay (Optional)</label>
            <select 
              value={walkInForm.bayId} 
              onChange={(e) => setWalkInForm({ ...walkInForm, bayId: e.target.value })} 
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
            >
              <option value="">No bay (Queue only)</option>
              {bays.filter(b => b.status === 'available').map(bay => (
                <option key={bay.id} value={bay.id}>Bay {bay.bay_number} - Available</option>
              ))}
            </select>
          </div>
        )}

        {/* STAFF ASSIGNMENT */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Assign Staff *</label>
          <select 
            value={walkInForm.staffId} 
            onChange={(e) => setWalkInForm({ ...walkInForm, staffId: e.target.value })} 
            required 
            style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
          >
            <option value="">Select Staff</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>

        {/* INFO BOX */}
        {walkInForm.serviceCategory === 'other_service' && (
          <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#2e7d32' }}>
              💡 <strong>Other Service:</strong> No vehicle registration or bay needed. Staff will perform the service at customer's location or in service area.
            </div>
          </div>
        )}

        {/* BUTTONS */}
        <button 
          type="submit" 
          disabled={walkInLoading} 
          style={{ 
            width: '100%', 
            background: walkInLoading ? '#ccc' : '#006633', 
            color: 'white', 
            border: 'none', 
            padding: '1rem', 
            borderRadius: '8px', 
            cursor: walkInLoading ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold', 
            fontSize: '1rem', 
            marginBottom: '0.5rem' 
          }}
        >
          {walkInLoading ? 'Registering...' : '✓ Register & Assign'}
        </button>

        <button 
          type="button" 
          onClick={() => setShowWalkIn(false)} 
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
      </form>
    </div>
  </div>
)}

      {/* PAYMENT RECORDING MODAL */}
      {showPaymentModal && selectedBooking && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => !recordingPayment && setShowPaymentModal(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '0.5rem' }}>💳 Record Payment</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Customer: {selectedBooking.customer_name}<br/>
              Vehicle: {selectedBooking.vehicle_reg || 'Walk-in Service'}<br/>
              Amount: <strong style={{ color: '#006633', fontSize: '1.2rem' }}>Kshs {selectedBooking.final_amount}</strong>
            </p>
            
            <form onSubmit={handleRecordPayment}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>How did customer pay? *</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                >
                  <option value="mpesa_till">M-Pesa Till</option>
                  <option value="mpesa_paybill">M-Pesa Paybill</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              {(paymentForm.method === 'mpesa_till' || paymentForm.method === 'mpesa_paybill') && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    M-Pesa Reference Code (optional but recommended)
                  </label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value.toUpperCase() })}
                    placeholder="e.g., AB12CD34EF"
                    maxLength="10"
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                    📱 Found in customer's M-Pesa message
                  </div>
                </div>
              )}

              {paymentForm.method === 'bank_transfer' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Bank Reference (optional)
                  </label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    placeholder="e.g., TXN123456"
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.5rem' }}>What happens next?</div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  ✅ Payment recorded in system<br/>
                  📱 SMS sent to customer automatically<br/>
                  📊 Revenue tracked in reports
                </div>
              </div>

              <button 
                type="submit" 
                disabled={recordingPayment}
                style={{ 
                  width: '100%', 
                  background: recordingPayment ? '#ccc' : '#006633', 
                  color: 'white', 
                  border: 'none', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  cursor: recordingPayment ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: '1rem', 
                  marginBottom: '0.5rem' 
                }}
              >
                {recordingPayment ? '⏳ Recording...' : '✓ CONFIRM PAYMENT & SEND SMS'}
              </button>

              <button 
                type="button" 
                onClick={() => setShowPaymentModal(false)} 
                disabled={recordingPayment}
                style={{ 
                  width: '100%', 
                  background: '#f0f0f0', 
                  color: '#666', 
                  border: 'none', 
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  cursor: recordingPayment ? 'not-allowed' : 'pointer' 
                }}
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