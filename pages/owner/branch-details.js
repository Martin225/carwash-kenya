import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';

export default function BranchDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { user, logout } = useAuth();
  const [branch, setBranch] = useState(null);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalBookings: 0,
    activeBays: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      loadBranchDetails();
    }
  }, [id, user]);

  async function loadBranchDetails() {
    try {
      const response = await fetch(`/api/owner/branch-details?branchId=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setBranch(data.branch);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p>Loading branch details...</p>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <p>Branch not found</p>
          <button onClick={() => router.push('/owner/branches')} style={{ marginTop: '1rem', background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            ← Back to Branches
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>{branch.branch_name} - Details</title></Head>

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1.5rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{branch.branch_name}</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Code: {branch.branch_code} • {branch.address}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => router.push('/owner/branches')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {[
              { label: 'Today Revenue', value: `Kshs ${stats.todayRevenue.toLocaleString()}`, icon: '💰', color: '#006633' },
              { label: 'Monthly Revenue', value: `Kshs ${stats.monthlyRevenue.toLocaleString()}`, icon: '📊', color: '#0066cc' },
              { label: 'Total Bookings', value: stats.totalBookings, icon: '🚗', color: '#ff9900' },
              { label: 'Active Bays', value: `${stats.activeBays}/${branch.bay_count || 0}`, icon: '🚙', color: '#9c27b0' }
            ].map((stat, i) => (
              <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: `4px solid ${stat.color}` }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                <div style={{ color: '#666', marginTop: '0.5rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#006633' }}>🚙 Bays ({branch.bay_count || 0})</h2>
              <p style={{ color: '#666' }}>
                This branch has {branch.bay_count || 0} washing bays
              </p>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#006633' }}>👥 Staff ({branch.staff_count || 0})</h2>
              <p style={{ color: '#666' }}>
                {branch.staff_count || 0} staff members assigned to this branch
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}