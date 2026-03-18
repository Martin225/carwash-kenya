import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

export default function BranchDetails() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const { id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allSupervisors, setAllSupervisors] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  
  const [showEditBranch, setShowEditBranch] = useState(false);
  const [showReassignSupervisor, setShowReassignSupervisor] = useState(false);
  const [showReassignStaff, setShowReassignStaff] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  const [branchForm, setBranchForm] = useState({
    branchName: '',
    branchCode: '',
    address: '',
    city: '',
    isActive: true
  });

  useEffect(() => {
    if (user?.business_id && id) {
      loadBranchDetails();
      loadAllSupervisors();
      loadAllStaff();
      loadAllBranches();
    }
  }, [user, id]);

  async function loadBranchDetails() {
    try {
      setLoading(true);
      const response = await fetch(`/api/owner/branch-details?branchId=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setBranch(data.branch);
        setSupervisors(data.supervisors || []);
        setStaff(data.staff || []);
        setBranchForm({
          branchName: data.branch.branch_name,
          branchCode: data.branch.branch_code,
          address: data.branch.address,
          city: data.branch.city,
          isActive: data.branch.is_active
        });
      } else {
        showToast(data.message || 'Failed to load branch details', 'error');
      }
    } catch (error) {
      console.error('Error loading branch details:', error);
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllSupervisors() {
    try {
      const response = await fetch(`/api/owner/supervisors?businessId=${user.business_id}`);
      const data = await response.json();
      if (data.success) {
        setAllSupervisors(data.supervisors || []);
      }
    } catch (error) {
      console.error('Error loading supervisors:', error);
    }
  }

  async function loadAllStaff() {
    try {
      const response = await fetch(`/api/owner/staff?businessId=${user.business_id}`);
      const data = await response.json();
      if (data.success) {
        setAllStaff(data.staff || []);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  }

  async function loadAllBranches() {
    try {
      const response = await fetch(`/api/owner/branches?businessId=${user.business_id}`);
      const data = await response.json();
      if (data.success) {
        setAllBranches(data.branches || []);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  }

  async function handleUpdateBranch(e) {
    e.preventDefault();
    try {
      const response = await fetch('/api/owner/branch-details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: id, ...branchForm })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Branch updated successfully!', 'success');
        setShowEditBranch(false);
        loadBranchDetails();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to update branch', 'error');
    }
  }

  async function handleReassignSupervisor(newSupervisorId) {
    try {
      const response = await fetch('/api/owner/reassign-supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          branchId: id, 
          supervisorId: newSupervisorId,
          oldSupervisorId: supervisors[0]?.id || null
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Supervisor reassigned successfully!', 'success');
        setShowReassignSupervisor(false);
        loadBranchDetails();
        loadAllSupervisors();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to reassign supervisor', 'error');
    }
  }

  async function handleRemoveSupervisor(supervisorId) {
    if (!confirm('Remove this supervisor from the branch? They will be unassigned.')) return;
    
    try {
      const response = await fetch('/api/owner/reassign-supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          branchId: id, 
          supervisorId: null,
          oldSupervisorId: supervisorId
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Supervisor removed from branch', 'success');
        loadBranchDetails();
        loadAllSupervisors();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to remove supervisor', 'error');
    }
  }

  async function handleReassignStaff(staffId, newBranchId) {
    try {
      const response = await fetch('/api/owner/reassign-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, newBranchId })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Staff reassigned successfully!', 'success');
        setShowReassignStaff(false);
        setSelectedStaff(null);
        loadBranchDetails();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to reassign staff', 'error');
    }
  }

  async function handleRemoveStaff(staffId) {
    if (!confirm('Remove this staff member? Set them as inactive.')) return;
    
    try {
      const response = await fetch('/api/owner/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, isActive: false })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Staff set as inactive', 'success');
        loadBranchDetails();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to remove staff', 'error');
    }
  }

  async function handleDeleteBranch() {
    if (!confirm(`DELETE "${branch?.branch_name}"? This cannot be undone!`)) return;
    if (!confirm('Are you ABSOLUTELY SURE? All data for this branch will be lost!')) return;
    
    try {
      const response = await fetch('/api/owner/branch-details', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: id })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Branch deleted successfully', 'success');
        router.push('/owner/branches');
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to delete branch', 'error');
    }
  }

  if (loading) {
    return (
      <>
        <Head><title>Branch Details - CarWash Pro Kenya</title></Head>
        <ToastContainer />
        <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)' }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏢</div>
            <p style={{ fontSize: '1.2rem' }}>Loading branch details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!branch) {
    return (
      <>
        <Head><title>Branch Not Found - CarWash Pro Kenya</title></Head>
        <ToastContainer />
        <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Branch not found</p>
            <button onClick={() => router.push('/owner/branches')} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Back to Branches</button>
          </div>
        </div>
      </>
    );
  }

  // Get branches for staff reassignment (exclude current branch)
  const otherBranches = allBranches.filter(b => b.id !== parseInt(id));

  // Get available supervisors (show ALL supervisors, not just unassigned ones)
  const availableSupervisors = allSupervisors.filter(s => s.is_active);

  return (
    <>
      <Head><title>{branch.branch_name} - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1.5rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>🏢 {branch.branch_name}</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Branch Management</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/owner/branches')} style={{ background: 'white', color: '#006633', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Back to Branches</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          {/* BRANCH INFO CARD */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', color: '#006633' }}>Branch Information</h2>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Code: {branch.branch_code}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setShowEditBranch(true)} style={{ background: '#2196f3', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>✏️ Edit Branch</button>
                <button onClick={handleDeleteBranch} style={{ background: '#f44336', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Delete</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '0.25rem' }}>Location</div>
                <div style={{ fontWeight: '500' }}>📍 {branch.address}</div>
                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>{branch.city}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '0.25rem' }}>Bays</div>
                <div style={{ fontWeight: '500' }}>🚙 {branch.bay_count || 0} washing bays</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '0.25rem' }}>Status</div>
                <span style={{ background: branch.is_active ? '#e8f5e9' : '#ffebee', color: branch.is_active ? '#2e7d32' : '#c62828', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', display: 'inline-block' }}>
                  {branch.is_active ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            {/* SUPERVISORS SECTION */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: '#006633' }}>👨‍💼 Supervisors</h3>
                {supervisors.length === 0 && (
                  <button onClick={() => setShowReassignSupervisor(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>+ Assign</button>
                )}
              </div>

              {supervisors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👤</div>
                  <p>No supervisor assigned</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {supervisors.map(supervisor => (
                    <div key={supervisor.id} style={{ border: '2px solid #e0e0e0', padding: '1rem', borderRadius: '8px', background: '#f9f9f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{supervisor.full_name}</div>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>📧 {supervisor.email}</div>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>📞 {supervisor.phone}</div>
                        </div>
                        <span style={{ background: supervisor.is_active ? '#e8f5e9' : '#ffebee', color: supervisor.is_active ? '#2e7d32' : '#c62828', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {supervisor.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button onClick={() => setShowReassignSupervisor(true)} style={{ flex: 1, background: '#2196f3', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>↔️ Reassign</button>
                        <button onClick={() => handleRemoveSupervisor(supervisor.id)} style={{ flex: 1, background: '#f44336', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>✕ Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STAFF SECTION */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: '#006633' }}>👥 Staff ({staff.length})</h3>
              </div>

              {staff.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👷</div>
                  <p>No staff assigned to this branch</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {staff.map(member => (
                    <div key={member.id} style={{ border: '2px solid #e0e0e0', padding: '1rem', borderRadius: '8px', background: '#f9f9f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{member.full_name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>📞 {member.phone}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                            💰 {member.commission_percentage}% commission
                          </div>
                        </div>
                        <span style={{ background: member.is_active ? '#e8f5e9' : '#ffebee', color: member.is_active ? '#2e7d32' : '#c62828', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {member.is_active && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <button 
                            onClick={() => {
                              setSelectedStaff(member);
                              setShowReassignStaff(true);
                            }}
                            style={{ flex: 1, background: '#ff9800', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                          >
                            ↔️ Transfer
                          </button>
                          <button 
                            onClick={() => handleRemoveStaff(member.id)}
                            style={{ flex: 1, background: '#f44336', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                          >
                            ✕ Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT BRANCH MODAL */}
      {showEditBranch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowEditBranch(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '1.5rem' }}>✏️ Edit Branch</h2>

            <form onSubmit={handleUpdateBranch}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Branch Name *</label>
                <input type="text" value={branchForm.branchName} onChange={(e) => setBranchForm({ ...branchForm, branchName: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Branch Code *</label>
                <input type="text" value={branchForm.branchCode} onChange={(e) => setBranchForm({ ...branchForm, branchCode: e.target.value.toUpperCase() })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>City/Town *</label>
                <input type="text" value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Address *</label>
                <textarea value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} required rows="3" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={branchForm.isActive} onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })} style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
                  <span style={{ fontWeight: '500' }}>Branch is active</span>
                </label>
              </div>

              <button type="submit" style={{ width: '100%', background: '#006633', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>Save Changes</button>
              <button type="button" onClick={() => setShowEditBranch(false)} style={{ width: '100%', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN SUPERVISOR MODAL */}
      {showReassignSupervisor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowReassignSupervisor(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '1.5rem' }}>Assign Supervisor to Branch</h2>

            {availableSupervisors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                <p>No available supervisors to assign</p>
                <button onClick={() => setShowReassignSupervisor(false)} style={{ marginTop: '1rem', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {availableSupervisors.map(supervisor => (
                  <div 
                    key={supervisor.id}
                    onClick={() => handleReassignSupervisor(supervisor.id)}
                    style={{ 
                      border: '2px solid #e0e0e0', 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: supervisor.branch_id === parseInt(id) ? '#fff3e0' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#006633'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{supervisor.full_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>📧 {supervisor.email}</div>
                    {supervisor.branch_id === parseInt(id) && (
                      <div style={{ fontSize: '0.8rem', color: '#f57c00', marginTop: '0.25rem', fontWeight: 'bold' }}>
                        ⚠️ Currently assigned to this branch
                      </div>
                    )}
                    {supervisor.branch_id && supervisor.branch_id !== parseInt(id) && (
                      <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
                        Currently at: {supervisor.branch_name || 'Other branch'}
                      </div>
                    )}
                    {!supervisor.branch_id && (
                      <div style={{ fontSize: '0.8rem', color: '#4caf50', marginTop: '0.25rem' }}>
                        ✓ Available (not assigned)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REASSIGN STAFF MODAL */}
      {showReassignStaff && selectedStaff && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => { setShowReassignStaff(false); setSelectedStaff(null); }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '0.5rem' }}>Transfer Staff</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>Transfer <strong>{selectedStaff.full_name}</strong> to:</p>

            {otherBranches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                <p>No other branches available</p>
                <button onClick={() => { setShowReassignStaff(false); setSelectedStaff(null); }} style={{ marginTop: '1rem', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {otherBranches.map(branch => (
                  <div 
                    key={branch.id}
                    onClick={() => handleReassignStaff(selectedStaff.id, branch.id)}
                    style={{ 
                      border: '2px solid #e0e0e0', 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#006633'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  >
                    <div style={{ fontWeight: 'bold' }}>🏢 {branch.branch_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                      {branch.address}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}