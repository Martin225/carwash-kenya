import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';

export default function StaffManagement() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [staff, setStaff] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    pinCode: '',
    commission: ''
  });

  useEffect(() => {
    if (user && user.business_id) {
      loadStaff();
    } else {
      router.push('/login');
    }
  }, [user]);

  async function loadStaff() {
    try {
      const response = await fetch(`/api/supervisor/staff?businessId=${user.business_id}`);
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
        body: JSON.stringify({ ...formData, businessId: user.business_id })
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Staff member added successfully!');
        setShowAdd(false);
        setFormData({ fullName: '', phone: '', pinCode: '', commission: '' });
        loadStaff();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('Failed to add staff member');
    }
  }

  async function toggleStaff(staffId, currentStatus) {
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
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>👥 Staff Management</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.business_name || 'Loading...'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => router.push('/supervisor/dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <button onClick={() => setShowAdd(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '1.5rem' }}>+ Add Staff Member</button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {staff.map((member) => (
              <div key={member.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: `4px solid ${member.is_active ? '#4caf50' : '#f44336'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{member.full_name}</h3>
                  <span style={{ background: member.is_active ? '#e8f5e9' : '#ffebee', color: member.is_active ? '#2e7d32' : '#c62828', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                  <p style={{ margin: '0.5rem 0' }}>📞 {member.phone_number}</p>
                  <p style={{ margin: '0.5rem 0' }}>🔑 PIN: {member.pin_code}</p>
                  <p style={{ margin: '0.5rem 0', fontWeight: 'bold', color: '#006633' }}>💰 Kshs {member.commission_per_car || 50} per car</p>
                  <p style={{ margin: '0.5rem 0' }}>🚗 Role: {member.role || 'Washer'}</p>
                </div>
                <button onClick={() => toggleStaff(member.id, member.is_active)} style={{ width: '100%', padding: '0.75rem', background: member.is_active ? '#f44336' : '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {member.is_active ? '✗ Deactivate' : '✓ Activate'}
                </button>
              </div>
            ))}
          </div>

          {staff.length === 0 && (
            <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
              <p style={{ color: '#999', marginBottom: '1rem' }}>No staff members yet</p>
              <button onClick={() => setShowAdd(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Add Your First Staff Member</button>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '1.5rem' }}>Add New Staff Member</h2>
            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name *</label>
                <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required placeholder="e.g., John Kamau" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone Number *</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required placeholder="0722XXXXXX" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>Used for staff login</div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>4-Digit PIN *</label>
                <input type="text" value={formData.pinCode} onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })} required placeholder="1234" maxLength="4" pattern="[0-9]{4}" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1.5rem', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.5rem' }} />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>Staff will use this PIN to login</div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Commission per Car (Kshs) *</label>
                <input type="number" value={formData.commission} onChange={(e) => setFormData({ ...formData, commission: e.target.value })} required placeholder="e.g., 50" min="0" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>Amount staff earns per completed car wash</div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '1rem', background: '#006633', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: '0.5rem' }}>Add Staff Member</button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ width: '100%', padding: '0.75rem', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}