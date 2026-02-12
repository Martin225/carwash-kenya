import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function SupervisorDashboard() {
  const router = useRouter();
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

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const response = await fetch('/api/supervisor/dashboard');
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
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)',
          color: 'white',
          padding: '1rem 2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>👨‍💼 Supervisor Dashboard</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                Westlands Premium Carwash • Demo Supervisor
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowWalkIn(true)}
                style={{
                  background: '#FCD116',
                  color: '#006633',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                + Walk-in Customer
              </button>
              <button
                onClick={() => router.push('/')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid white',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {[
              { label: 'Cars Today', value: stats.carsToday, icon: '🚗', color: '#006633' },
              { label: 'Revenue Today', value: `KES ${stats.revenueToday.toLocaleString()}`, icon: '💰', color: '#0066cc' },
              { label: 'Active Bays', value: `${stats.activeBays}/4`, icon: '🚙', color: '#ff9900' },
              { label: 'Staff on Duty', value: stats.staffOnDuty, icon: '👥', color: '#9c27b0' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${stat.color}`
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                <div style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Bay Status Board */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>🚙 Bay Status</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
              gap: '1rem' 
            }}>
              {bays.map((bay) => (
                <div key={bay.id} style={{
                  border: `3px solid ${bayColors[bay.status]}`,
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: bay.status === 'available' ? '#f1f8f4' : 
                             bay.status === 'occupied' ? '#fff1f0' : '#fff8f0'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Bay {bay.bay_number}</h3>
                    <span style={{
                      background: bayColors[bay.status],
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {bay.status}
                    </span>
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

          {/* Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Pending Online Bookings */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#006633' }}>
                ⏳ Pending Approvals ({pendingApprovals.length})
              </h2>
              {pendingApprovals.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
                  No pending approvals
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pendingApprovals.map((booking) => (
                    <div key={booking.id} style={{
                      border: '1px solid #e0e0e0',
                      padding: '1rem',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {booking.vehicle_reg} • {booking.service_name}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        {booking.customer_name} • {booking.phone}<br/>
                        {new Date(booking.booking_date + ' ' + booking.booking_time).toLocaleString()}
                      </div>
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          flex: 1,
                          background: '#4caf50',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}>
                          ✓ Approve
                        </button>
                        <button style={{
                          flex: 1,
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}>
                          ✗ Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Schedule */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#006633' }}>
                📅 Today's Schedule ({todayBookings.length})
              </h2>
              {todayBookings.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
                  No bookings today
                </p>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {todayBookings.map((booking) => (
                    <div key={booking.id} style={{
                      borderLeft: `4px solid ${
                        booking.status === 'completed' ? '#4caf50' :
                        booking.status === 'in-progress' ? '#ff9800' : '#2196f3'
                      }`,
                      padding: '0.75rem',
                      marginBottom: '0.75rem',
                      background: '#f9f9f9',
                      borderRadius: '0 8px 8px 0'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {booking.booking_time} • {booking.vehicle_reg}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                        {booking.service_name} • {booking.customer_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Walk-in Modal */}
      {showWalkIn && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setShowWalkIn(false)}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '1.5rem' }}>Register Walk-in Customer</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Quick registration for customers who walk in without booking
            </p>
            <button 
              onClick={() => {
                setShowWalkIn(false);
                router.push('/book');
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
                fontSize: '1rem',
                marginBottom: '0.5rem'
              }}
            >
              Go to Booking Form →
            </button>
            <button 
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
          </div>
        </div>
      )}
    </>
  );
}