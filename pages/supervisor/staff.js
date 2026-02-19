import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';
import PinInput from '../../components/PinInput';

export default function StaffManagement() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [staff, setStaff] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReset, setConfirmReset] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);
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
        showToast('✅ Staff member added successfully!', 'success');
        setShowAdd(false);
        setFormData({ fullName: '', phone: '', pinCode: '', commission: '' });
        loadStaff();
      } else {
        showToast(data.message || 'Failed to add staff', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    }
  }

  async function toggleStaff(staffId, currentStatus) {
    try {
      const response = await fetch('/api/supervisor/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, isActive: !currentStatus })
      });

      const data = await response.json();
      if (data.success) {
        const action = currentStatus ? 'deactivated' : 'activated';
        showToast(`✅ Staff ${action} successfully!`, 'success');
        loadStaff();
      } else {
        showToast(data.message || 'Failed to update staff', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    }
  }

  async function deleteStaff(staffId) {
    setDeleting(true);
    try {
      const response = await fetch('/api/supervisor/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId })
      });

      const data = await response.json();
      if (data.success) {
        showToast('✅ Staff deleted permanently', 'success');
        setConfirmDelete(null);
        loadStaff();
      } else {
        showToast(data.message || 'Failed to delete staff', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function resetPin(staffId, staffPhone, staffName) {
    setResetting(true);
    try {
      // Generate random 4-digit PIN
      const newPin = Math.floor(1000 + Math.random() * 9000).toString();

      const response = await fetch('/api/supervisor/reset-staff-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          staffId, 
          newPin,
          staffPhone,
          staffName
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast('✅ New PIN sent via SMS to staff!', 'success');
        setConfirmReset(null);
      } else {
        showToast(data.message || 'Failed to reset PIN', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <Head><title>Staff Management - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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
          <button onClick={() => setShowAdd(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '1.5rem', fontSize: '1rem' }}>+ Add Staff Member</button>

          {staff.length === 0 ? (
            <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
              <p style={{ color: '#999', marginBottom: '1rem', fontSize: '1.1rem' }}>No staff members yet</p>
              <button onClick={() => setShowAdd(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Add Your First Staff Member</button>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {/* Table Header */}
              <div style={{ background: '#f9f9f9', padding: '1rem 1.5rem', borderBottom: '2px solid #e0e0e0', display: 'grid', gridTemplateColumns: '200px 150px 100px 120px 100px 400px', gap: '1rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#666', minWidth: '1070px' }}>
                <div>Name</div>
                <div>Phone</div>
                <div>PIN</div>
                <div>Commission</div>
                <div>Status</div>
                <div>Actions</div>
              </div>

              {/* Staff Rows */}
              {staff.map((member) => (
                <div key={member.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f0f0f0', display: 'grid', gridTemplateColumns: '200px 150px 100px 120px 100px 400px', gap: '1rem', alignItems: 'center', background: member.is_active ? 'white' : '#fafafa', minWidth: '1070px' }}>
                  <div style={{ fontWeight: '600', color: '#333' }}>{member.full_name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>📞 {member.phone_number}</div>
                  <div style={{ fontSize: '0.85rem', color: '#999', fontFamily: 'monospace' }}>••••</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#006633' }}>Kshs {member.commission_per_car || 50}</div>
                  <div>
                    <span style={{ background: member.is_active ? '#e8f5e9' : '#ffebee', color: member.is_active ? '#2e7d32' : '#c62828', padding: '0.35rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
  <button 
    onClick={() => toggleStaff(member.id, member.is_active)} 
                      style={{ padding: '0.5rem 0.75rem', background: member.is_active ? '#ff9800' : '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      title={member.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {member.is_active ? '⏸️ Deactivate' : '✓ Activate'}
                    </button>
                    <button 
  onClick={() => setConfirmReset(member)} 
  style={{ padding: '0.5rem 0.75rem', background: '#2196f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
  title="Reset PIN"
>
  🔑 Reset PIN
</button>
                    <button 
                      onClick={() => setConfirmDelete(member)} 
                      style={{ padding: '0.5rem 0.75rem', background: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      title="Delete permanently"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADD STAFF MODAL */}
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
                <PinInput
                  value={formData.pinCode}
                  onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                  placeholder="1234"
                  required
                  maxLength={4}
                />
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

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '450px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#f44336', marginBottom: '0.5rem' }}>Delete Staff Member?</h2>
            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '1.1rem' }}>
              <strong>{confirmDelete.full_name}</strong>
            </p>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              This will permanently remove them from the system. They will NOT be able to login again.
            </p>
            <div style={{ background: '#fff3e0', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'left' }}>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>📞 {confirmDelete.phone_number}</p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>💰 Kshs {confirmDelete.commission_per_car || 50} per car</p>
            </div>
            <button
              onClick={() => deleteStaff(confirmDelete.id)}
              disabled={deleting}
              style={{ width: '100%', background: deleting ? '#ccc' : '#f44336', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: deleting ? 'not-allowed' : 'pointer', marginBottom: '0.75rem' }}
            >
              {deleting ? '⏳ Deleting...' : '🗑️ Yes, Delete Permanently'}
            </button>
            <button
              onClick={() => setConfirmDelete(null)}
              disabled={deleting}
              style={{ width: '100%', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* RESET PIN MODAL */}
      {confirmReset && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '450px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔑</div>
            <h2 style={{ color: '#2196f3', marginBottom: '0.5rem' }}>Reset Staff PIN?</h2>
            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '1.1rem' }}>
              <strong>{confirmReset.full_name}</strong>
            </p>
            <div style={{ background: '#e3f2fd', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'left' }}>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>📞 {confirmReset.phone_number}</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                A new 4-digit PIN will be generated and sent via SMS to this number.
              </p>
            </div>
            <button
              onClick={() => resetPin(confirmReset.id, confirmReset.phone_number, confirmReset.full_name)}
              disabled={resetting}
              style={{ width: '100%', background: resetting ? '#ccc' : '#2196f3', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: resetting ? 'not-allowed' : 'pointer', marginBottom: '0.75rem' }}
            >
              {resetting ? '⏳ Resetting PIN...' : '🔑 Yes, Reset PIN & Send SMS'}
            </button>
            <button
              onClick={() => setConfirmReset(null)}
              disabled={resetting}
              style={{ width: '100%', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: resetting ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}