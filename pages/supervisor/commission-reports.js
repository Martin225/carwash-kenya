import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

export default function CommissionReports() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState([]);
  const [staffSummary, setStaffSummary] = useState([]);
  const [totals, setTotals] = useState({ total_jobs: 0, total_revenue: 0, total_commission: 0 });
  const [allStaff, setAllStaff] = useState([]);
  
  const [filters, setFilters] = useState({
    staffId: '',
    period: 'month',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (user?.branch_id) {
      loadStaff();
      loadCommissions();
    }
  }, [user]);

  async function loadStaff() {
    try {
      const response = await fetch(`/api/supervisor/dashboard?businessId=${user.business_id}`);
      const data = await response.json();
      if (data.success) {
        setAllStaff(data.staff || []);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  }

  async function loadCommissions() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        branchId: user.branch_id,
        period: filters.period,
        ...(filters.staffId && { staffId: filters.staffId }),
        ...(filters.period === 'custom' && filters.startDate && { startDate: filters.startDate }),
        ...(filters.period === 'custom' && filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`/api/supervisor/commission-reports?${params}`);
      const data = await response.json();

      if (data.success) {
        setCommissions(data.commissions || []);
        setStaffSummary(data.staffSummary || []);
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

  async function exportToExcel() {
    try {
      showToast('📄 Generating Excel report...', 'success');
      
      const params = new URLSearchParams({
        branchId: user.branch_id,
        period: filters.period,
        ...(filters.staffId && { staffId: filters.staffId }),
        ...(filters.period === 'custom' && filters.startDate && { startDate: filters.startDate }),
        ...(filters.period === 'custom' && filters.endDate && { endDate: filters.endDate })
      });

      window.open(`/api/supervisor/commission-export?${params}`, '_blank');
    } catch (error) {
      showToast('Failed to export report', 'error');
    }
  }

  if (loading) {
    return (
      <>
        <Head><title>Commission Reports - CarWash Pro Kenya</title></Head>
        <ToastContainer />
        <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)' }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💰</div>
            <p style={{ fontSize: '1.2rem' }}>Loading commission reports...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Commission Reports - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1.5rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>💰 Commission Reports</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.business_name || 'Loading...'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/supervisor/dashboard')} style={{ background: 'white', color: '#006633', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Dashboard</button>
              <button onClick={exportToExcel} style={{ background: '#4caf50', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📊 Export Excel</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          {/* FILTERS */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#006633' }}>🔍 Filters</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* STAFF FILTER */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Staff</label>
                <select
                  value={filters.staffId}
                  onChange={(e) => setFilters({ ...filters, staffId: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                >
                  <option value="">All Staff</option>
                  {allStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              {/* PERIOD FILTER */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Period</label>
                <select
                  value={filters.period}
                  onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* CUSTOM DATE RANGE */}
              {filters.period === 'custom' && (
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
                  onClick={loadCommissions}
                  style={{ width: '100%', background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* SUMMARY STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #2196f3' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👷</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>{totals.total_jobs}</div>
              <div style={{ color: '#666', marginTop: '0.5rem' }}>Jobs Completed</div>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #4caf50' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2e7d32' }}>Kshs {totals.total_revenue.toLocaleString()}</div>
              <div style={{ color: '#666', marginTop: '0.5rem' }}>Total Revenue</div>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #ff9800' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💸</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>Kshs {totals.total_commission.toLocaleString()}</div>
              <div style={{ color: '#666', marginTop: '0.5rem' }}>Total Commission</div>
            </div>
          </div>

          {/* STAFF SUMMARY */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>👥 Staff Commission Summary</h2>
            {staffSummary.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                <p>No commission data for selected period</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Staff Name</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Commission %</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Jobs</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Revenue</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Commission Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffSummary.map((staff) => (
                      <tr key={staff.staff_id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>👤 {staff.staff_name}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            {staff.commission_percentage}%
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '1.1rem', fontWeight: '600' }}>{staff.jobs_completed}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#2e7d32' }}>Kshs {parseFloat(staff.total_revenue || 0).toLocaleString()}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.1rem', fontWeight: 'bold', color: '#f57c00' }}>Kshs {parseFloat(staff.total_commission || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* DETAILED JOBS LIST */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>📋 Detailed Job List</h2>
            {commissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
                <p>No jobs found for selected period</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Staff</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Vehicle</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Service</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>Split</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Commission</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((job, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '0.75rem' }}>{new Date(job.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{job.staff_name}</td>
                        <td style={{ padding: '0.75rem' }}>
                          🚗 {job.vehicle_reg}
                          {job.vehicle_type !== 'N/A' && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#666' }}>({job.vehicle_type})</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>{job.service_name}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          {job.staff_count > 1 ? (
                            <span style={{ background: '#fff3e0', color: '#f57c00', padding: '0.25rem 0.5rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                              1/{job.staff_count}
                            </span>
                          ) : (
                            <span style={{ color: '#999' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Kshs {parseFloat(job.final_amount).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#f57c00' }}>Kshs {parseFloat(job.commission_earned).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span style={{ 
                            background: job.payment_status === 'paid' ? '#e8f5e9' : '#fff3e0',
                            color: job.payment_status === 'paid' ? '#2e7d32' : '#f57c00',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            {job.payment_status === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}