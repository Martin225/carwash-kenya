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
  const [totals, setTotals] = useState({ total_jobs: 0, total_revenue: 0, total_commission: 0, total_paid: 0, total_unpaid: 0 });
  const [allStaff, setAllStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentNotes: ''
  });
  
  const [filters, setFilters] = useState({
    branchId: '', // NEW: Owner can filter by branch
    staffId: '',
    viewType: 'monthly',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    // FIXED: Check for business_id instead of branch_id
    if (user?.business_id) {
      loadBranches(); // NEW: Load branches for owner
      loadStaff();
      loadCommissions();
    }
  }, [user]);

  // NEW: Load branches for owner
  async function loadBranches() {
    try {
      const response = await fetch(`/api/owner/dashboard?businessId=${user.business_id}`);
      const data = await response.json();
      if (data.success) {
        setBranches(data.branches || []);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  }

  async function loadStaff() {
    try {
      // FIXED: Use business_id for owner, not branch_id
      const response = await fetch(`/api/owner/staff?businessId=${user.business_id}`);
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
      
      let params = new URLSearchParams({
        businessId: user.business_id // FIXED: Use businessId for owner
      });

      // Add branch filter if selected
      if (filters.branchId) {
        params.append('branchId', filters.branchId);
      }

      if (filters.staffId) {
        params.append('staffId', filters.staffId);
      }

      if (filters.viewType === 'monthly') {
        params.append('month', filters.month);
        params.append('year', filters.year);
      } else if (filters.viewType === 'custom' && filters.startDate && filters.endDate) {
        params.append('period', 'custom');
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
      }

      // FIXED: Use owner commission reports API
      const response = await fetch(`/api/owner/commission-reports?${params}`);
      const data = await response.json();

      if (data.success) {
        setCommissions(data.commissions || []);
        setStaffSummary(data.staffSummary || []);
        setTotals(data.totals || { total_jobs: 0, total_revenue: 0, total_commission: 0, total_paid: 0, total_unpaid: 0 });
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

  async function handleMarkAsPaid(e) {
    e.preventDefault();
    setPaymentProcessing(true);

    try {
      const response = await fetch('/api/owner/record-commission-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: selectedStaff.staff_id,
          businessId: user.business_id,
          month: filters.month,
          year: filters.year,
          commissionAmount: selectedStaff.total_commission,
          jobsCount: selectedStaff.jobs_completed,
          paymentDate: paymentForm.paymentDate,
          paymentNotes: paymentForm.paymentNotes,
          recordedBy: user.id
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast('✅ Commission marked as paid!', 'success');
        setShowPaymentModal(false);
        setSelectedStaff(null);
        setPaymentForm({ paymentDate: new Date().toISOString().split('T')[0], paymentNotes: '' });
        loadCommissions();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to record payment', 'error');
    } finally {
      setPaymentProcessing(false);
    }
  }

  async function exportToExcel() {
    try {
      showToast('📄 Generating Excel report...', 'success');
      
      let params = new URLSearchParams({
        businessId: user.business_id
      });

      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.staffId) params.append('staffId', filters.staffId);
      if (filters.viewType === 'monthly') {
        params.append('month', filters.month);
        params.append('year', filters.year);
      } else if (filters.viewType === 'custom' && filters.startDate && filters.endDate) {
        params.append('period', 'custom');
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
      }

      window.open(`/api/owner/commission-export?${params}`, '_blank');
    } catch (error) {
      showToast('Failed to export report', 'error');
    }
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

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
              <button onClick={() => router.push('/owner/dashboard')} style={{ background: 'white', color: '#006633', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Dashboard</button>
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
              {/* BRANCH FILTER - NEW FOR OWNER */}
              {branches.length > 1 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Branch</label>
                  <select
                    value={filters.branchId}
                    onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                  >
                    <option value="">All Branches</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.branch_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* VIEW TYPE */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>View Type</label>
                <select
                  value={filters.viewType}
                  onChange={(e) => setFilters({ ...filters, viewType: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* MONTHLY SELECTOR */}
              {filters.viewType === 'monthly' && (
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
                    <option key={s.id} value={s.id}>{s.full_name} {s.branch_name && `(${s.branch_name})`}</option>
                  ))}
                </select>
              </div>

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
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
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #4caf50' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2e7d32' }}>Kshs {totals.total_paid.toLocaleString()}</div>
              <div style={{ color: '#666', marginTop: '0.5rem' }}>Paid</div>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #f44336' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d32f2f' }}>Kshs {totals.total_unpaid.toLocaleString()}</div>
              <div style={{ color: '#666', marginTop: '0.5rem' }}>Unpaid</div>
            </div>
          </div>

          {/* STAFF SUMMARY */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>
              👥 Staff Commission Summary - {monthNames[filters.month - 1]} {filters.year}
            </h2>
            {staffSummary.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                <p>No commission data for selected period</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {staffSummary.map((staff) => (
                  <div 
                    key={staff.staff_id} 
                    style={{ 
                      border: '2px solid #e0e0e0', 
                      padding: '1.5rem', 
                      borderRadius: '12px',
                      borderLeft: staff.payment_id ? '4px solid #4caf50' : '4px solid #ff9800',
                      background: staff.payment_id ? '#f1f8f4' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#006633' }}>
                          👤 {staff.staff_name}
                          {staff.branch_name && (
                            <span style={{ fontSize: '0.9rem', color: '#666', marginLeft: '0.5rem' }}>
                              ({staff.branch_name})
                            </span>
                          )}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
                          <div>
                            <div style={{ color: '#999', fontSize: '0.85rem' }}>Commission %</div>
                            <div style={{ fontWeight: 'bold', color: '#1976d2' }}>{staff.commission_percentage}%</div>
                          </div>
                          <div>
                            <div style={{ color: '#999', fontSize: '0.85rem' }}>Jobs</div>
                            <div style={{ fontWeight: 'bold' }}>{staff.jobs_completed}</div>
                          </div>
                          <div>
                            <div style={{ color: '#999', fontSize: '0.85rem' }}>Revenue</div>
                            <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>Kshs {parseFloat(staff.total_revenue || 0).toLocaleString()}</div>
                          </div>
                          <div>
                            <div style={{ color: '#999', fontSize: '0.85rem' }}>Commission</div>
                            <div style={{ fontWeight: 'bold', color: '#f57c00', fontSize: '1.1rem' }}>
                              Kshs {parseFloat(staff.total_commission || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
                        {staff.payment_id ? (
                          <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px', border: '2px solid #4caf50' }}>
                            <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.5rem' }}>✅ PAID</div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                              Paid on: {new Date(staff.payment_date).toLocaleDateString()}
                            </div>
                            {staff.payment_notes && (
                              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                                Note: {staff.payment_notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedStaff(staff);
                              setShowPaymentModal(true);
                            }}
                            style={{ 
                              background: '#4caf50', 
                              color: 'white', 
                              border: 'none', 
                              padding: '0.75rem 1rem', 
                              borderRadius: '8px', 
                              cursor: 'pointer', 
                              fontWeight: 'bold',
                              fontSize: '0.9rem'
                            }}
                          >
                            💰 Mark as Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MARK AS PAID MODAL */}
      {showPaymentModal && selectedStaff && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => !paymentProcessing && setShowPaymentModal(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '550px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '0.5rem' }}>💰 Mark Commission as Paid</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Record payment for {monthNames[filters.month - 1]} {filters.year}
            </p>

            <form onSubmit={handleMarkAsPaid}>
              {/* STAFF INFO */}
              <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  👤 {selectedStaff.staff_name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                  <div>Jobs: <strong>{selectedStaff.jobs_completed}</strong></div>
                  <div>Commission: <strong style={{ color: '#f57c00' }}>Kshs {parseFloat(selectedStaff.total_commission).toLocaleString()}</strong></div>
                </div>
              </div>

              {/* PAYMENT DATE */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                  Select the actual date you paid the staff (can be a past date)
                </div>
              </div>

              {/* PAYMENT NOTES */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Payment Notes (Optional)
                </label>
                <textarea
                  value={paymentForm.paymentNotes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentNotes: e.target.value })}
                  placeholder="e.g., M-Pesa ref: ABC123, Bank transfer, Cash payment"
                  rows="3"
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              {/* INFO BOX */}
              <div style={{ background: '#e3f2fd', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #2196f3' }}>
                <div style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  ℹ️ What happens next:
                </div>
                <ul style={{ margin: '0', paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#1976d2' }}>
                  <li>Commission will be marked as paid</li>
                  <li>Payment date and notes will be recorded</li>
                  <li>Status will change to "Paid" in reports</li>
                </ul>
              </div>

              {/* BUTTONS */}
              <button 
                type="submit"
                disabled={paymentProcessing}
                style={{ 
                  width: '100%', 
                  background: paymentProcessing ? '#ccc' : '#4caf50', 
                  color: 'white', 
                  border: 'none', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  cursor: paymentProcessing ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  marginBottom: '0.5rem'
                }}
              >
                {paymentProcessing ? '⏳ Processing...' : '✓ Confirm Payment'}
              </button>

              <button 
                type="button"
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentProcessing}
                style={{ 
                  width: '100%', 
                  background: '#f0f0f0', 
                  color: '#666', 
                  border: 'none', 
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  cursor: paymentProcessing ? 'not-allowed' : 'pointer'
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