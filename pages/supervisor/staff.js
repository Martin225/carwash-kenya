import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function StaffManagement() {
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    pinCode: '',
    role: 'staff',
    hourlyRate: ''
  });

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    try {
      const response = await fetch('/api/supervisor/staff');
      const data = await response.json();
      if (data.success) {
        setStaff(data.staff || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    try {
      const response = await fetch('/api/supervisor/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Staff member added successfully!');
        setShowAdd(false);
        setFormData({ fullName: '', phone: '', pinCode: '', role: 'staff', hourlyRate: '' });
        loadStaff();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('Failed to add staff');
    }
  }

  async function toggleActive(staffId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this staff member?`)) return;

    try {
      const response = await fetch('/api/supervisor/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, isActive: !currentStatus })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Staff ${action}d successfully!`);
        loadStaff();
      }
    } catch (error) {
      alert('Failed to update staff');
    }
  }

  return (
    <>
      <Head><title>Staff Management - CarWash Pro Kenya</title></Head>

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)',
          color: 'white',
          padding: '1rem 2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>👥 Staff Management</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                Westlands Premium Carwash
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  background: '#FCD116',
                  color: '#006633',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                + Add Staff
              </button>
              <button
                onClick={() => router.push('/supervisor/dashboard')}
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
                ← Back
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Staff Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {staff.map((member) => (
              <div key={member.id} style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${member.is_active ? '#4caf50' : '#f44336'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
                      {member.full_name}
                    </h3>
                    <span style={{
                      background: member.is_active ? '#e8f5e9' : '#ffebee',
                      color: member.is_active ? '#2e7d32' : '#c62828',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                  <p style={{ margin: '0.5rem 0' }}>📞 {member.phone_number}</p>
                  <p style={{ margin: '0.5rem 0' }}>🔐 PIN: {member.pin_code || 'Not set'}</p>
                  <p style={{ margin: '0.5rem 0' }}>💰 Rate: Kshs {member.hourly_rate || 0}/hr</p>
                  <p style={{ margin: '0.5rem 0' }}>🚗 Jobs: {member.total_services_completed || 0}</p>
                </div>

                <button
                  onClick={() => toggleActive(member.id, member.is_active)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: member.is_active ? '#f44336' : '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {member.is_active ? '✗ Deactivate' : '✓ Activate'}
                </button>
              </div>
            ))}
          </div>

          {staff.length === 0 && (
            <div style={{
              background: 'white',
              padding: '3rem',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
              <p style={{ color: '#999' }}>No staff members yet. Add your first staff member!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAdd && (
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
        }} onClick={() => setShowAdd(false)}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '1.5rem' }}>Add New Staff Member</h2>
            
            <form onSubmit={handleAdd}>
              <input
                type="text"
                placeholder="Full Name *"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />

              <input
                type="tel"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />

              <input
                type="text"
                placeholder="4-Digit PIN Code *"
                value={formData.pinCode}
                onChange={(e) => setFormData({ ...formData, pinCode: e.target.value.slice(0, 4) })}
                required
                maxLength="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />

              <input
                type="number"
                placeholder="Hourly Rate (Kshs)"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  marginBottom: '1.5rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#006633',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginBottom: '0.5rem'
                }}
              >
                Add Staff Member
              </button>

              <button
                type="button"
                onClick={() => setShowAdd(false)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#f0f0f0',
                  color: '#666',
                  border: 'none',
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
    </>
  );
}