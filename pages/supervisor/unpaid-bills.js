import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

export default function UnpaidBills() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [unpaidCustomers, setUnpaidCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerStatement, setCustomerStatement] = useState(null);
  const [paymentCustomer, setPaymentCustomer] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    reference: ''
  });

  useEffect(() => {
    if (!user) {
      console.log('⚠️ No user found, redirecting to login');
      router.push('/login');
      return;
    }
    
    const branchId = user.branch_id || user.branchId;
if (!branchId) {
  console.log('⚠️ No branch_id found in user object:', user);
  setLoading(false);
  showToast('No branch assigned to your account. Please contact admin.', 'error');
  return;
}
console.log('✅ Using branch_id:', branchId);
loadUnpaidBills();
    
    console.log('✅ User found with branch_id:', user.branch_id);
    loadUnpaidBills();
  }, []); // Run once on mount

  async function loadUnpaidBills() {
    console.log('🔍 loadUnpaidBills called, user:', user);
    try {
      setLoading(true);
      console.log('📡 Fetching from API, branchId:', user.branch_id);
      const response = await fetch(`/api/supervisor/unpaid-bills?branchId=${user.branch_id}`);
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📡 Response data:', data);
      
      if (data.success) {
        setUnpaidCustomers(data.customers || []);
        console.log('✅ Loaded', data.customers?.length || 0, 'customers');
      } else {
        showToast(data.message || 'Failed to load unpaid bills', 'error');
      }
    } catch (error) {
      console.error('❌ Error loading unpaid bills:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      console.log('⏹️ Setting loading to false');
      setLoading(false);
    }
  }

  async function viewCustomerStatement(customerId) {
    try {
      const response = await fetch(`/api/supervisor/customer-statement?customerId=${customerId}`);
      const data = await response.json();
      
      if (data.success) {
        setCustomerStatement(data);
        setSelectedCustomer(data.customer);
        setShowStatementModal(true);
      } else {
        showToast(data.message || 'Failed to load statement', 'error');
      }
    } catch (error) {
      console.error('Error loading statement:', error);
      showToast('Failed to load customer statement', 'error');
    }
  }

  function openPaymentModal(customer) {
    setPaymentCustomer(customer);
    setPaymentForm({
      amount: customer.total_owed || '',
      paymentMethod: 'cash',
      reference: ''
    });
    setShowPaymentModal(true);
  }

  async function handleCollectPayment(e) {
    e.preventDefault();
    setPaymentProcessing(true);

    try {
      const response = await fetch('/api/supervisor/collect-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: paymentCustomer.customer_id,
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          paymentReference: paymentForm.reference,
          receivedBy: user.id
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast(`✅ Payment recorded! ${data.bookingsPaid} bookings paid`, 'success');
        setShowPaymentModal(false);
        setShowStatementModal(false);
        loadUnpaidBills();
        setPaymentForm({ amount: '', paymentMethod: 'cash', reference: '' });
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to record payment', 'error');
    } finally {
      setPaymentProcessing(false);
    }
  }

  if (loading) {
    return (
      <>
        <Head><title>Unpaid Bills - CarWash Pro Kenya</title></Head>
        <ToastContainer />
        <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)' }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💳</div>
            <p style={{ fontSize: '1.2rem' }}>Loading unpaid bills...</p>
          </div>
        </div>
      </>
    );
  }

  const totalOwed = unpaidCustomers.reduce((sum, c) => sum + parseFloat(c.total_owed || 0), 0);

  return (
    <>
      <Head><title>Unpaid Bills - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1.5rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>💳 Unpaid Bills</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.business_name || 'Loading...'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/supervisor/dashboard')} style={{ background: 'white', color: '#006633', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Dashboard</button>
              <button onClick={loadUnpaidBills} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #ff9800' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>{unpaidCustomers.length}</div>
              <div style={{ color: '#666', marginTop: '0.5rem' }}>Customers with Unpaid Bills</div>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #f44336' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d32f2f' }}>Kshs {totalOwed.toLocaleString()}</div>
              <div style={{ color: '#666', marginTop: '0.5rem' }}>Total Outstanding</div>
            </div>
          </div>

          {/* CUSTOMER LIST */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>Customers</h2>

            {unpaidCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>✅</div>
                <p style={{ color: '#999', marginBottom: '0.5rem', fontSize: '1.3rem', fontWeight: '600' }}>No unpaid bills!</p>
                <p style={{ color: '#666', fontSize: '1rem' }}>All customers are up to date with payments</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {unpaidCustomers.map(customer => (
                  <div 
                    key={customer.customer_id}
                    style={{ 
                      border: '2px solid #e0e0e0', 
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      borderLeft: '4px solid #f44336'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: '250px' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: '#006633' }}>
                          {customer.customer_name}
                        </h3>
                        <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: '1rem' }}>
                          📞 {customer.phone_number}
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', color: '#999' }}>Unpaid Services</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                              {customer.unpaid_count}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.85rem', color: '#999' }}>Total Owed</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#d32f2f' }}>
                              Kshs {parseFloat(customer.total_owed || 0).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.85rem', color: '#999' }}>Oldest Bill</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#666' }}>
                              {new Date(customer.oldest_booking_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
                        <button
                          onClick={() => viewCustomerStatement(customer.customer_id)}
                          style={{ 
                            background: '#2196f3', 
                            color: 'white', 
                            border: 'none', 
                            padding: '0.75rem 1rem', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                          }}
                        >
                          📋 View Details
                        </button>
                        <button
                          onClick={() => openPaymentModal(customer)}
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
                          💰 Collect Payment
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOMER STATEMENT MODAL */}
      {showStatementModal && selectedCustomer && customerStatement && (
        <div 
          style={{ 
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
            padding: '1rem',
            overflowY: 'auto'
          }} 
          onClick={() => setShowStatementModal(false)}
        >
          <div 
            style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '20px', 
              maxWidth: '900px', 
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ color: '#006633', margin: '0 0 0.5rem 0' }}>
                  📋 {customerStatement.customer.full_name}
                </h2>
                <p style={{ color: '#666', margin: 0 }}>
                  📞 {customerStatement.customer.phone_number}
                </p>
              </div>
              <button
                onClick={() => setShowStatementModal(false)}
                style={{ 
                  background: '#f0f0f0', 
                  border: 'none', 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  cursor: 'pointer', 
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* TOTAL OWED */}
            <div style={{ background: '#ffebee', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', borderLeft: '4px solid #f44336' }}>
              <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: '0.5rem' }}>Total Outstanding</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#d32f2f' }}>
                Kshs {customerStatement.totalUnpaid.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                {customerStatement.unpaidBookings.length} unpaid services
              </div>
            </div>

            {/* UNPAID SERVICES TABLE */}
            <h3 style={{ color: '#006633', marginBottom: '1rem' }}>Unpaid Services</h3>
            <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Vehicle</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Service</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Days Old</th>
                  </tr>
                </thead>
                <tbody>
                  {customerStatement.unpaidBookings.map((booking) => (
                    <tr key={booking.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '1rem' }}>
                        {new Date(booking.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>
                        🚗 {booking.vehicle_reg}
                      </td>
                      <td style={{ padding: '1rem' }}>{booking.service_name}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#d32f2f' }}>
                        Kshs {parseFloat(booking.final_amount).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '12px', 
                          fontSize: '0.85rem',
                          background: booking.days_old > 30 ? '#ffebee' : '#fff3e0',
                          color: booking.days_old > 30 ? '#c62828' : '#f57c00'
                        }}>
                          {booking.days_old} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ACTIONS */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowStatementModal(false);
                  openPaymentModal({
                    customer_id: customerStatement.customer.id,
                    customer_name: customerStatement.customer.full_name,
                    total_owed: customerStatement.totalUnpaid
                  });
                }}
                style={{ 
                  background: '#4caf50', 
                  color: 'white', 
                  border: 'none', 
                  padding: '1rem 2rem', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                💰 Collect Payment
              </button>
              <button
                onClick={() => setShowStatementModal(false)}
                style={{ 
                  background: '#f0f0f0', 
                  color: '#666', 
                  border: 'none', 
                  padding: '1rem 2rem', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT COLLECTION MODAL */}
      {showPaymentModal && paymentCustomer && (
        <div 
          style={{ 
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
          }} 
          onClick={() => !paymentProcessing && setShowPaymentModal(false)}
        >
          <div 
            style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '20px', 
              maxWidth: '500px', 
              width: '100%'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#006633', marginBottom: '1.5rem' }}>💰 Collect Payment</h2>
            
            <form onSubmit={handleCollectPayment}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Customer</label>
                <div style={{ 
                  padding: '1rem', 
                  background: '#f9f9f9', 
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  {paymentCustomer.customer_name}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Total Outstanding</label>
                <div style={{ 
                  padding: '1rem', 
                  background: '#ffebee', 
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                  color: '#d32f2f'
                }}>
                  Kshs {parseFloat(paymentCustomer.total_owed || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Amount Received *</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                  min="1"
                  step="0.01"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '2px solid #e0e0e0', 
                    borderRadius: '8px', 
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter amount"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Payment Method *</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '2px solid #e0e0e0', 
                    borderRadius: '8px', 
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Reference/Receipt No</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '2px solid #e0e0e0', 
                    borderRadius: '8px', 
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Optional"
                />
              </div>

              <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  💡 Payment Allocation (FIFO)
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  Payment will be applied to oldest bills first. Oldest services get paid first automatically.
                </div>
              </div>

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
                {paymentProcessing ? '⏳ Processing...' : '✓ Record Payment'}
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