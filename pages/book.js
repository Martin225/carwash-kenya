import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function BookingPage() {
  const router = useRouter();
  const { service: serviceId } = router.query;

  const [formData, setFormData] = useState({
    phoneNumber: '',
    fullName: '',
    vehicleReg: '',
    vehicleType: 'sedan',
    serviceId: serviceId || '',
    branchId: '',
    bookingDate: '',
    bookingTime: ''
  });
  
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (serviceId) {
      setFormData(prev => ({ ...prev, serviceId }));
    }
  }, [serviceId]);

  // Search for existing customers/vehicles as user types
  useEffect(() => {
    if (formData.vehicleReg.length >= 3) {
      searchVehicles(formData.vehicleReg);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.vehicleReg]);

  async function loadData() {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services || []);
        setBranches(data.branches || []);
        
        if (data.branches && data.branches.length > 0) {
          setFormData(prev => ({ ...prev, branchId: data.branches[0].id }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function searchVehicles(query) {
    try {
      const response = await fetch(`/api/search-vehicles?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.vehicles || []);
        setShowSuggestions(data.vehicles.length > 0);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  function selectVehicle(vehicle) {
    setFormData({
      ...formData,
      vehicleReg: vehicle.registration_number,
      vehicleType: vehicle.vehicle_type || 'sedan',
      phoneNumber: vehicle.customer_phone,
      fullName: vehicle.customer_name
    });
    setCustomerInfo({
      name: vehicle.customer_name,
      totalVisits: vehicle.total_visits,
      loyaltyPoints: vehicle.loyalty_points,
      lastVisit: vehicle.last_visit_date
    });
    setShowSuggestions(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setBookingSuccess(result);
      } else {
        alert('❌ Error: ' + result.message);
      }
    } catch (error) {
      alert('Failed to create booking. Please try again.');
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333'
  };

  return (
    <>
      <Head>
        <title>Book Carwash - CarWash Pro Kenya</title>
      </Head>

      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
        <h1 style={{ textAlign: 'center', color: '#006633', marginBottom: '10px' }}>
          📅 Book Your Carwash
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          Fill in your details below
        </p>

        {/* Returning Customer Info */}
        {customerInfo && (
          <div style={{
            background: 'linear-gradient(135deg, #FCD116 0%, #f0c000 100%)',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            color: '#006633'
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              🎉 Welcome Back, {customerInfo.name}!
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
              <span>🚗 Visits: {customerInfo.totalVisits}</span>
              <span>⭐ Points: {customerInfo.loyaltyPoints}</span>
              {customerInfo.lastVisit && (
                <span>📅 Last: {new Date(customerInfo.lastVisit).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Vehicle Registration with Autocomplete */}
          <div style={{ position: 'relative' }}>
            <label style={labelStyle}>🚗 Vehicle Registration *</label>
            <input
              type="text"
              value={formData.vehicleReg}
              onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value.toUpperCase() })}
              placeholder="KCA 123A"
              required
              style={inputStyle}
              autoComplete="off"
            />
            
            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '2px solid #006633',
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                marginTop: '-15px'
              }}>
                {suggestions.map((vehicle, i) => (
                  <div
                    key={i}
                    onClick={() => selectVehicle(vehicle)}
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: i < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f7ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ fontWeight: 'bold', color: '#006633' }}>
                      {vehicle.registration_number}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {vehicle.customer_name} • {vehicle.customer_phone} • 
                      ⭐ {vehicle.loyalty_points} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>📱 Phone Number *</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="0722XXXXXX"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>👤 Full Name (Optional)</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="John Doe"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>🚙 Vehicle Type *</label>
            <select
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
              required
              style={inputStyle}
            >
              <option value="sedan">Sedan (Normal Car)</option>
              <option value="suv">SUV (Big Car)</option>
              <option value="truck">Truck / Pickup</option>
              <option value="matatu">Matatu / Van</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>✨ Service *</label>
            <select
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              required
              style={inputStyle}
            >
              <option value="">Select Service</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.service_name} - From Kshs {s.min_price}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>📍 Branch *</label>
            <select
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              required
              style={inputStyle}
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.branch_name} - {b.address}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>📅 Date *</label>
            <input
              type="date"
              value={formData.bookingDate}
              onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>⏰ Time *</label>
            <input
              type="time"
              value={formData.bookingTime}
              onChange={(e) => setFormData({ ...formData, bookingTime: e.target.value })}
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              marginTop: '10px',
              backgroundColor: loading ? '#ccc' : '#006633',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1em',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? '⏳ Creating Booking...' : '✅ Confirm Booking'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '10px',
              backgroundColor: '#fff',
              color: '#666',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1em',
              cursor: 'pointer'
            }}
          >
            ← Back to Home
          </button>
        </form>

        {/* Success Modal */}
        {bookingSuccess && (
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
          }}>
            <div style={{
              background: 'white',
              padding: '2.5rem',
              borderRadius: '20px',
              maxWidth: '450px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ color: '#006633', marginBottom: '1rem', fontSize: '1.8rem' }}>
                Booking Successful!
              </h2>
              
              <div style={{
                background: '#f0f7ff',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Booking Code:</span>
                  <strong style={{ color: '#006633', fontSize: '1.2rem' }}>{bookingSuccess.booking.booking_code}</strong>
                </div>
                <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Amount:</span>
                  <strong style={{ color: '#006633', fontSize: '1.2rem' }}>Kshs {bookingSuccess.booking.final_amount.toLocaleString()}</strong>
                </div>
                {bookingSuccess.loyaltyEarned > 0 && (
                  <>
                    <div style={{ borderTop: '1px solid #e0e0e0', margin: '0.75rem 0', paddingTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#666' }}>🎁 Points Earned:</span>
                        <strong style={{ color: '#FCD116' }}>+{bookingSuccess.loyaltyEarned}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>⭐ Total Points:</span>
                        <strong style={{ color: '#FCD116' }}>{bookingSuccess.totalPoints}</strong>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                We'll send you an SMS confirmation shortly. Thank you for choosing us!
              </p>

              <button
                onClick={() => router.push('/')}
                style={{
                  width: '100%',
                  background: '#006633',
                  color: 'white',
                  border: 'none',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}