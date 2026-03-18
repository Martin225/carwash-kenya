import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

export default function MyCommission() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState([]);
  const [totals, setTotals] = useState({ total_jobs: 0, total_revenue: 0, total_commission: 0 });
  
  const [filters, setFilters] = useState({
    viewType: 'month', // 'week', 'month', 'custom'
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (user?.id && user?.branch_id) {
      loadMyCommissions();
    }
  }, [user]);

  async function loadMyCommissions() {
    try {
      setLoading(true);
      
      let params = new URLSearchParams({
        branchId: user.branch_id,
        staffId: user.id
      });

      if (filters.viewType === 'week') {
        params.append('period', 'week');
      } else if (filters.viewType === 'month') {
        params.append('month', filters.month);
        params.append('year', filters.year);
      } else if (filters.viewType === 'custom' && filters.startDate && filters.endDate) {
        params.append('period', 'custom');
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
      }

      const response = await fetch(`/api/supervisor/commission-reports?${params}`);
      const data = await response.json();

      if (data.success) {
        setCommissions(data.commissions || []);
        setTotals(data.totals || { total_jobs: 0, total_revenue: 0, total_commission: 0 });
      } else {
        showToast(data.message || 'Failed to load commissions', 'error');
      }
    } catch (error) {
      console.error('Error loading commissions:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return (
      <>
        <Head><title>My Commission - CarWash Pro Kenya</title></Head>
        <ToastContainer />
        <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)' }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💰</div>
            <p style={{ fontSize: '1.2rem' }}>Loading your commission...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>My Commission - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1.5rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>💰 My Commission</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.full_name || 'Loading...'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/staff/dashboard')} style={{ background: 'white', color: '#006633', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Dashboard</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          {/* FILTERS */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#006633' }}>🔍 View Period</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* VIEW TYPE */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Period</label>
                <select
                  value={filters.viewType}
                  onChange={(e) => setFilters({ ...filters, viewType: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                >
                  <option value="week">This Week</option>
                  <option value="month">Monthly</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* MONTHLY SELECTOR */}
              {filters.viewType === 'month' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Month</label>
                    <select
                      value={filters.month}
                      onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                    >
                      {monthNames.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Year</label>
                    <select
                      value={filters.year}
                      onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                    >
                      {[2024, 2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* CUSTOM DATE RANGE */}
              {filters.viewType === 'custom' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>End Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                    />
                  </div>
                </>
              )}

              {/* APPLY BUTTON */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={loadMyCommissions}
                  style={{ width: '100%', background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* SUMMARY STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #2196f3' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👷</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1976d2' }}>{totals.total_jobs}</div>
              <div style={{ color: '#666', marginTop: '0.5rem' }}>Jobs Completed</div>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #4caf50' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2e7d32' }}>Kshs {totals.total_revenue.toLocaleString()}</div>
              <div style={{ color: '#666', marginTop: '0.5rem' }}>Revenue Generated</div>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #ff9800' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💸</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f57c00' }}>Kshs {totals.total_commission.toLocaleString()}</div>
              <div style={{ color: '#666', marginTop: '0.5rem' }}>Commission Earned</div>
            </div>
          </div>

          {/* JOB DETAILS */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>
              📋 Job Details - {filters.viewType === 'month' ? `${monthNames[filters.month - 1]} ${filters.year}` : filters.viewType === 'week' ? 'This Week' : 'Custom Period'}
            </h2>
            {commissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                <p>No jobs completed in this period</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#666' }}>Date</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#666' }}>Customer</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#666' }}>Vehicle</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#666' }}>Service</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#666' }}>Amount</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#666' }}>Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((job, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                          {new Date(job.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                          {job.customer_name || 'Walk-in'}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                          <div>{job.vehicle_reg}</div>
                          <div style={{ fontSize: '0.8rem', color: '#999' }}>{job.vehicle_type}</div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                          {job.service_name}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>
                          Kshs {parseFloat(job.final_amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#f57c00', fontSize: '1rem' }}>
                          Kshs {parseFloat(job.commission_earned).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f9f9f9', borderTop: '2px solid #e0e0e0' }}>
                      <td colSpan="4" style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>TOTAL</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#2e7d32', fontSize: '1.1rem' }}>
                        Kshs {totals.total_revenue.toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#f57c00', fontSize: '1.2rem' }}>
                        Kshs {totals.total_commission.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* INFO BOX */}
          <div style={{ background: '#e3f2fd', padding: '1rem', borderRadius: '8px', marginTop: '2rem', border: '1px solid #2196f3' }}>
            <div style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              ℹ️ About Your Commission
            </div>
            <ul style={{ margin: '0', paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#1976d2' }}>
              <li>Commission is calculated when you complete a job</li>
              <li>Payment is made monthly by the owner</li>
              <li>If multiple staff work on one job, commission is split equally</li>
              <li>Your current commission rate: <strong>{user?.commission_percentage || 10}%</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}