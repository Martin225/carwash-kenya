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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (serviceId) {
      setFormData(prev => ({ ...prev, serviceId }));
    }
  }, [serviceId]);

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
        alert('Booking Successful!\n\nCode: ' + result.booking.booking_code + '\nAmount: KES ' + result.booking.final_amount);
        router.push('/');
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      alert('Failed to create booking');
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
    fontSize: '1em'
  };

  return (
    <>
      <Head>
        <title>Book Carwash</title>
      </Head>

      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
        <h1 style={{ textAlign: 'center', color: '#0070f3' }}>Book Your Carwash</h1>
        
        <form onSubmit={handleSubmit}>
          <input
            type="tel"
            placeholder="Phone: 0722XXXXXX"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            required
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Vehicle: KCA 123A"
            value={formData.vehicleReg}
            onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value.toUpperCase() })}
            required
            style={inputStyle}
          />

          <select
            value={formData.vehicleType}
            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
            required
            style={inputStyle}
          >
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="truck">Truck</option>
            <option value="matatu">Matatu</option>
          </select>

          <select
            value={formData.serviceId}
            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
            required
            style={inputStyle}
          >
            <option value="">Select Service</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.service_name} - KES {s.min_price}</option>
            ))}
          </select>

          <select
            value={formData.branchId}
            onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
            required
            style={inputStyle}
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.branch_name}</option>
            ))}
          </select>

          <input
            type="date"
            value={formData.bookingDate}
            onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            required
            style={inputStyle}
          />

          <input
            type="time"
            value={formData.bookingTime}
            onChange={(e) => setFormData({ ...formData, bookingTime: e.target.value })}
            required
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1em',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating...' : 'Confirm Booking'}
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
              cursor: 'pointer'
            }}
          >
            Back to Home
          </button>
        </form>
      </div>
    </>
  );
}