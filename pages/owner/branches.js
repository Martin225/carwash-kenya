import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

export default function BranchesManagement() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [branches, setBranches] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [branchForm, setBranchForm] = useState({
    branchName: '',
    branchCode: '',
    address: '',
    city: '',
    numberOfBays: 4
  });

  useEffect(() => {
    if (user && user.business_id) {
      loadBranches();
    } else {
      router.push('/login');
    }
  }, [user]);

  async function loadBranches() {
    try {
      const response = await fetch(`/api/owner/branches?businessId=${user.business_id}`);
      const data = await response.json();
      if (data.success) {
        setBranches(data.branches || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleAddBranch(e) {
    e.preventDefault();
    try {
      const response = await fetch('/api/owner/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...branchForm, businessId: user.business_id })
      });

      const data = await response.json();
      if (data.success) {
        showToast('New branch added successfully!', 'success');
        setShowAdd(false);
        setBranchForm({ branchName: '', branchCode: '', address: '', city: '', numberOfBays: 4 });
        loadBranches();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to add branch', 'error');
    }
  }

  return (
    <>
      <Head><title>Branches - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1.5rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>🏢 Branch Management</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.business_name || 'Loading...'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => router.push('/owner/dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <button onClick={() => setShowAdd(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add New Branch</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {branches.map((branch) => (
              <div key={branch.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: `4px solid ${branch.is_active ? '#4caf50' : '#f44336'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>{branch.branch_name}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#666', background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                      Code: {branch.branch_code}
                    </div>
                  </div>
                  <span style={{ background: branch.is_active ? '#e8f5e9' : '#ffebee', color: branch.is_active ? '#2e7d32' : '#c62828', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {branch.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                  <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📍 {branch.address}
                  </p>
                  <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🚙 {branch.bay_count || 0} Bays
                  </p>
                  <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    👥 {branch.staff_count || 0} Staff
                  </p>
                  <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📊 {branch.supervisor_count || 0} Supervisor(s)
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => router.push(`/owner/branch-details?id=${branch.id}`)} style={{ flex: 1, background: '#006633', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {branches.length === 0 && (
            <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
              <p style={{ color: '#999', marginBottom: '1rem' }}>No branches yet</p>
              <button onClick={() => setShowAdd(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Add Your First Branch</button>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '0.5rem' }}>Add New Branch</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Expand your carwash business to a new location</p>

            <form onSubmit={handleAddBranch}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Branch Name *</label>
                <input type="text" value={branchForm.branchName} onChange={(e) => setBranchForm({ ...branchForm, branchName: e.target.value })} required placeholder="e.g., Nairobi CBD Branch" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Branch Code *</label>
                <input type="text" value={branchForm.branchCode} onChange={(e) => setBranchForm({ ...branchForm, branchCode: e.target.value.toUpperCase() })} required placeholder="e.g., CBD-01" maxLength="10" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>Unique identifier for this branch</div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>City/Town *</label>
                <input type="text" value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} required placeholder="e.g., Nairobi" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Address *</label>
                <textarea value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} required placeholder="e.g., Kimathi Street, Next to ABC Building" rows="3" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Number of Bays *</label>
                <select value={branchForm.numberOfBays} onChange={(e) => setBranchForm({ ...branchForm, numberOfBays: parseInt(e.target.value) })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="2">2 Bays</option>
                  <option value="3">3 Bays</option>
                  <option value="4">4 Bays (Recommended)</option>
                  <option value="5">5 Bays</option>
                  <option value="6">6 Bays</option>
                  <option value="8">8 Bays</option>
                  <option value="10">10 Bays</option>
                </select>
              </div>

              <button type="submit" style={{ width: '100%', background: '#006633', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>Add Branch</button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ width: '100%', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}