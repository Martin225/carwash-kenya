import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

export default function Reports() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // NEW: Date filter states
  const [filters, setFilters] = useState({
    viewType: 'month',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    startDate: '',
    endDate: ''
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    if (user && user.business_id) {
      loadReports();
    } else {
      router.push('/login');
    }
  }, [user]);

  async function loadReports() {
    try {
      setLoading(true);
      
      // Build query params with date filters
      let params = new URLSearchParams({ businessId: user.business_id });
      
      if (filters.viewType === 'week') {
        params.append('period', 'week');
      } else if (filters.viewType === 'month') {
        params.append('month', filters.month);
        params.append('year', filters.year);
      } else if (filters.viewType === 'year') {
        params.append('year', filters.year);
      } else if (filters.viewType === 'custom' && filters.startDate && filters.endDate) {
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
      }
      
      const response = await fetch(`/api/owner/reports?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        showToast('Failed to load reports', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }

  function formatAmount(amount) {
    return `Kshs ${parseFloat(amount || 0).toLocaleString()}`;
  }

  function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatPaymentMethod(method) {
    const methods = {
      'mpesa_till': 'M-Pesa Till',
      'mpesa_paybill': 'M-Pesa Paybill',
      'bank_transfer': 'Bank Transfer',
      'cash': 'Cash'
    };
    return methods[method] || method;
  }

  function getPaymentIcon(method) {
    const icons = {
      'mpesa_till': '📱',
      'mpesa_paybill': '📱',
      'bank_transfer': '🏦',
      'cash': '💵'
    };
    return icons[method] || '💰';
  }

  async function exportToExcel() {
    try {
      showToast('Preparing Excel export...', 'info');
      
      if (!data?.transactions?.length) {
        showToast('No transactions to export', 'error');
        return;
      }

      const headers = ['Date', 'Vehicle', 'Customer', 'Phone', 'Service', 'Amount', 'Payment Method', 'Reference', 'Staff', 'Branch'];
      
      const rows = data.transactions.map(t => [
        formatDate(t.paid_at),
        t.vehicle_reg,
        t.customer_name,
        t.customer_phone,
        t.service_name,
        t.final_amount,
        formatPaymentMethod(t.payment_method),
        t.payment_reference || '',
        t.staff_name || '',
        t.branch_name || ''
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Include date range in filename
      let filename = 'transactions';
      if (filters.viewType === 'month') {
        filename += `_${monthNames[filters.month - 1]}_${filters.year}`;
      } else if (filters.viewType === 'year') {
        filename += `_${filters.year}`;
      } else if (filters.viewType === 'custom') {
        filename += `_${filters.startDate}_to_${filters.endDate}`;
      }
      filename += '.csv';
      
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      showToast('Excel file downloaded successfully!', 'success');
    } catch (error) {
      showToast('Export failed', 'error');
    }
  }

  if (loading) {
    return (
      <>
        <Head><title>Reports - CarWash Pro Kenya</title></Head>
        <ToastContainer />
        <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)' }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
            <h2>Loading Reports...</h2>
          </div>
        </div>
      </>
    );
  }

  const summary = data?.revenueSummary || {};

  return (
    <>
      <Head><title>Reports & Analytics - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1.5rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>📊 Reports & Analytics</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.business_name}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={loadReports} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
              <button onClick={exportToExcel} style={{ background: '#FCD116', color: '#006633', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📥 Export Excel</button>
              <button onClick={() => router.push('/owner/dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Dashboard</button>
              <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
          {/* REVENUE SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {[
              { label: 'Today', count: summary.today_count, revenue: summary.today_revenue, icon: '☀️', color: '#006633' },
              { label: 'This Week', count: summary.week_count, revenue: summary.week_revenue, icon: '📅', color: '#0066cc' },
              { label: 'This Month', count: summary.month_count, revenue: summary.month_revenue, icon: '🗓️', color: '#ff9900' },
              { label: 'This Year', count: summary.year_count, revenue: summary.year_revenue, icon: '📆', color: '#9c27b0' },
              { label: 'All Time', count: summary.total_count, revenue: summary.total_revenue, icon: '🏆', color: '#f44336' }
            ].map((item, i) => (
              <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: `4px solid ${item.color}` }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>{item.label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: item.color }}>{formatAmount(item.revenue)}</div>
                <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.25rem' }}>{item.count} transactions</div>
              </div>
            ))}
          </div>

          {/* TABS */}
          <div style={{ marginBottom: '2rem', borderBottom: '2px solid #e0e0e0' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {[
                { id: 'overview', label: '📊 Overview' },
                { id: 'transactions', label: '💰 Transactions' },
                { id: 'staff', label: '👥 Staff Performance' },
                { id: 'services', label: '✨ Services' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? '#006633' : 'transparent', color: activeTab === tab.id ? 'white' : '#666', border: 'none', padding: '1rem 1.5rem', cursor: 'pointer', fontWeight: 'bold', borderBottom: activeTab === tab.id ? '3px solid #006633' : '3px solid transparent', fontSize: '1rem', borderRadius: activeTab === tab.id ? '8px 8px 0 0' : '0' }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* REST OF THE TABS (keeping existing code) */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Payment Methods */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>💳 Payment Methods</h2>
                {data?.paymentMethods?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                    <div style={{ fontSize: '3rem' }}>📭</div>
                    <p>No payments yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {data?.paymentMethods?.map((method, i) => {
                      const totalRevenue = data.paymentMethods.reduce((sum, m) => sum + parseFloat(m.total), 0);
                      const percentage = totalRevenue > 0 ? ((parseFloat(method.total) / totalRevenue) * 100).toFixed(1) : 0;
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: '500' }}>
                              {getPaymentIcon(method.payment_method)} {formatPaymentMethod(method.payment_method)}
                            </span>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 'bold', color: '#006633' }}>{formatAmount(method.total)}</span>
                              <span style={{ color: '#999', fontSize: '0.85rem', marginLeft: '0.5rem' }}>({percentage}%)</span>
                            </div>
                          </div>
                          <div style={{ background: '#f0f0f0', borderRadius: '8px', height: '10px' }}>
                            <div style={{ background: '#006633', borderRadius: '8px', height: '10px', width: `${percentage}%`, transition: 'width 0.5s' }} />
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>{method.count} transactions</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Daily Revenue Last 7 Days */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>📈 Daily Revenue</h2>
                {data?.dailyRevenue?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                    <div style={{ fontSize: '3rem' }}>📭</div>
                    <p>No data yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {data?.dailyRevenue?.map((day, i) => {
                      const maxRevenue = Math.max(...data.dailyRevenue.map(d => parseFloat(d.revenue)));
                      const percentage = maxRevenue > 0 ? ((parseFloat(day.revenue) / maxRevenue) * 100).toFixed(1) : 0;
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: '500' }}>
                              {new Date(day.date).toLocaleDateString('en-KE', { weekday: 'short', day: '2-digit', month: 'short' })}
                            </span>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 'bold', color: '#0066cc' }}>{formatAmount(day.revenue)}</span>
                              <span style={{ color: '#999', fontSize: '0.85rem', marginLeft: '0.5rem' }}>({day.count} cars)</span>
                            </div>
                          </div>
                          <div style={{ background: '#f0f0f0', borderRadius: '8px', height: '10px' }}>
                            <div style={{ background: '#0066cc', borderRadius: '8px', height: '10px', width: `${percentage}%`, transition: 'width 0.5s' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {/* FILTERS INSIDE TRANSACTIONS TAB */}
              <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: '2px solid #e0e0e0' }}>
                <h2 style={{ margin: '0 0 1rem 0', color: '#006633' }}>🔍 Filter Transactions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  
                  {/* VIEW TYPE */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                      Period
                    </label>
                    <select
                      value={filters.viewType}
                      onChange={(e) => setFilters({ ...filters, viewType: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                    >
                      <option value="week">This Week</option>
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {/* MONTHLY SELECTOR */}
                  {filters.viewType === 'month' && (
                    <>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                          Month
                        </label>
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
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                          Year
                        </label>
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

                  {/* YEARLY SELECTOR */}
                  {filters.viewType === 'year' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                        Year
                      </label>
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
                  )}

                  {/* CUSTOM DATE RANGE */}
                  {filters.viewType === 'custom' && (
                    <>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                          End Date
                        </label>
                        <input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                        />
                      </div>
                    </>
                  )}

                  {/* APPLY & DOWNLOAD BUTTONS */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <button
                      onClick={loadReports}
                      style={{ flex: 1, background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
                    >
                      Apply
                    </button>
                    <button
                      onClick={exportToExcel}
                      style={{ flex: 1, background: '#4caf50', color: 'white', border: 'none', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
                    >
                      📊 Excel
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0, color: '#006633' }}>💰 Transaction History ({data?.transactions?.length || 0})</h2>
                <button onClick={exportToExcel} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📥 Export to Excel</button>
              </div>

              {data?.transactions?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ fontSize: '4rem' }}>📭</div>
                  <p style={{ color: '#999' }}>No transactions in selected period</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Date & Time</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Vehicle</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Customer</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Service</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: '1rem', textAlign: 'center' }}>Method</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Reference</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Staff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.transactions?.map((txn, i) => (
                        <tr key={txn.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ padding: '1rem', whiteSpace: 'nowrap', color: '#666', fontSize: '0.85rem' }}>{formatDate(txn.created_at)}</td>
                          <td style={{ padding: '1rem', fontWeight: '600' }}>🚗 {txn.vehicle_reg}</td>
                          <td style={{ padding: '1rem' }}>
                            <div>{txn.customer_name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#999' }}>{txn.customer_phone}</div>
                          </td>
                          <td style={{ padding: '1rem' }}>{txn.service_name}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#006633' }}>Kshs {parseFloat(txn.final_amount).toLocaleString()}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ background: txn.payment_method === 'cash' ? '#fff3e0' : '#e8f5e9', color: txn.payment_method === 'cash' ? '#f57c00' : '#2e7d32', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                              {getPaymentIcon(txn.payment_method)} {formatPaymentMethod(txn.payment_method)}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#666', fontSize: '0.85rem' }}>{txn.payment_reference || '-'}</td>
                          <td style={{ padding: '1rem', color: '#666' }}>{txn.staff_name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#e8f5e9', borderTop: '2px solid #006633' }}>
                        <td colSpan={4} style={{ padding: '1rem', fontWeight: 'bold', color: '#006633' }}>TOTAL ({data?.transactions?.length} transactions)</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#006633', fontSize: '1.1rem' }}>
                          {formatAmount(data?.transactions?.reduce((sum, t) => sum + parseFloat(t.final_amount), 0))}
                        </td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* STAFF PERFORMANCE TAB */}
          {activeTab === 'staff' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>👥 Staff Performance</h2>
              {data?.staffPerformance?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ fontSize: '4rem' }}>👥</div>
                  <p style={{ color: '#999' }}>No staff performance data yet</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {data?.staffPerformance?.map((staff, i) => (
                    <div key={i} style={{ background: 'white', border: '2px solid #e0e0e0', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${i === 0 ? '#FCD116' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#006633'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👤'} {staff.staff_name}</h3>
                        <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem' }}>#{i + 1}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#006633' }}>{staff.cars_served}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>Cars Served</div>
                        </div>
                        <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0066cc' }}>{formatAmount(staff.revenue_generated)}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>Revenue</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === 'services' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>✨ Service Breakdown</h2>
              {data?.serviceBreakdown?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ fontSize: '4rem' }}>✨</div>
                  <p style={{ color: '#999' }}>No service data yet</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {data?.serviceBreakdown?.map((service, i) => {
                    const totalRevenue = data.serviceBreakdown.reduce((sum, s) => sum + parseFloat(s.revenue), 0);
                    const percentage = totalRevenue > 0 ? ((parseFloat(service.revenue) / totalRevenue) * 100).toFixed(1) : 0;
                    return (
                      <div key={i} style={{ background: 'white', border: '2px solid #e0e0e0', padding: '1.5rem', borderRadius: '12px' }}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>✨ {service.service_name}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ff9900' }}>{service.count}</div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>Times Done</div>
                          </div>
                          <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#006633' }}>{formatAmount(service.revenue)}</div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>Revenue</div>
                          </div>
                        </div>
                        <div style={{ background: '#f0f0f0', borderRadius: '8px', height: '10px' }}>
                          <div style={{ background: '#ff9900', borderRadius: '8px', height: '10px', width: `${percentage}%` }} />
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>{percentage}% of total revenue</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}