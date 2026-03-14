import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

export default function OwnerInventory() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({
    totalValue: 0,
    lowStockCount: 0,
    monthlyConsumption: 0,
    totalItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // Days

  useEffect(() => {
    if (user && user.business_id) {
      loadInventory();
    } else {
      router.push('/login');
    }
  }, [user, period]);

  async function loadInventory() {
    try {
      const response = await fetch(`/api/owner/inventory?businessId=${user.business_id}&period=${period}`);
      const data = await response.json();
      
      if (data.success) {
        setInventory(data.inventory || []);
        setStats(data.stats || stats);
      } else {
        showToast(data.message || 'Failed to load inventory', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function downloadReport() {
    try {
      showToast('📄 Generating report...', 'success');
      window.open(`/api/owner/inventory-report?businessId=${user.business_id}&period=${period}`, '_blank');
    } catch (error) {
      showToast('Failed to generate report', 'error');
    }
  }

  if (loading) {
    return (
      <>
        <Head><title>Inventory - CarWash Pro Kenya</title></Head>
        <ToastContainer />
        <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)' }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ fontSize: '1.2rem' }}>Loading inventory...</p>
          </div>
        </div>
      </>
    );
  }

  const lowStockItems = inventory.filter(item => 
    parseFloat(item.current_stock) <= parseFloat(item.reorder_level)
  );

  const topUsedItems = [...inventory]
    .sort((a, b) => (b.monthly_usage || 0) - (a.monthly_usage || 0))
    .slice(0, 5);

  return (
    <>
      <Head><title>Inventory Dashboard - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>📦 Inventory Dashboard</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.business_name || 'Loading...'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/owner/dashboard')} style={{ background: 'white', color: '#006633', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Dashboard</button>
              <button onClick={downloadReport} style={{ background: '#FCD116', color: '#006633', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📊 Download Report</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
          {/* PERIOD SELECTOR */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 'bold', color: '#006633' }}>Period:</span>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '2px solid #e0e0e0', cursor: 'pointer' }}>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>

          {/* STATS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Inventory Value', value: `Kshs ${stats.totalValue.toLocaleString()}`, icon: '💰', color: '#006633' },
              { label: 'Total Items', value: stats.totalItems, icon: '📦', color: '#2196f3' },
              { label: 'Low Stock Items', value: stats.lowStockCount, icon: '⚠️', color: stats.lowStockCount > 0 ? '#f44336' : '#4caf50' },
              { label: `Consumption (${period} days)`, value: `Kshs ${stats.monthlyConsumption.toLocaleString()}`, icon: '📊', color: '#ff9800' }
            ].map((stat, i) => (
              <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: `4px solid ${stat.color}` }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                <div style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* LOW STOCK ALERTS */}
          {lowStockItems.length > 0 && (
            <div style={{ background: '#fff3e0', border: '2px solid #ff9800', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#f57c00', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⚠️ LOW STOCK ALERTS ({lowStockItems.length})
              </h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {lowStockItems.map(item => (
                  <div key={item.id} style={{ background: 'white', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.item_name}</div>
                      <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Current: {item.current_stock} {item.unit} | Reorder at: {item.reorder_level} {item.unit}
                      </div>
                    </div>
                    <div style={{ background: '#f44336', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      🔴 RESTOCK NEEDED
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#e8f5e9', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.5rem' }}>💡 Action Required:</div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Contact your supervisor to restock these items immediately to avoid service disruptions.
                </div>
              </div>
            </div>
          )}

          {/* TOP CONSUMED ITEMS */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>📈 Top 5 Most Consumed Items ({period} days)</h2>
            {topUsedItems.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No consumption data yet</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {topUsedItems.map((item, index) => (
                  <div key={item.id} style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #006633, #004d26)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.item_name}</div>
                      <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Used: {item.monthly_usage || 0} {item.unit} | Value: Kshs {((item.monthly_usage || 0) * (item.unit_cost || 0)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* INVENTORY TABLE */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633' }}>📦 All Inventory Items</h2>
            {inventory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
                <p style={{ color: '#999', fontSize: '1.2rem' }}>No inventory items yet</p>
                <p style={{ color: '#666' }}>Your supervisor will add items when needed</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Item</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Category</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Current Stock</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Reorder Level</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Unit Cost</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Total Value</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => {
                      const currentStock = parseFloat(item.current_stock) || 0;
                      const reorderLevel = parseFloat(item.reorder_level) || 0;
                      const unitCost = parseFloat(item.unit_cost) || 0;
                      const totalValue = currentStock * unitCost;
                      const isLow = currentStock <= reorderLevel;
                      const isNear = currentStock <= (reorderLevel * 1.5) && !isLow;

                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{item.item_name}</div>
                            {item.description && (
                              <div style={{ fontSize: '0.85rem', color: '#666' }}>{item.description}</div>
                            )}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ padding: '0.35rem 0.85rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600', background: '#e3f2fd', color: '#1976d2' }}>
                              {item.category || 'General'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem' }}>
                            {currentStock} {item.unit}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                            {reorderLevel} {item.unit}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                            Kshs {unitCost.toLocaleString()}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#006633' }}>
                            Kshs {totalValue.toLocaleString()}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '0.35rem 0.75rem', 
                              borderRadius: '12px', 
                              fontSize: '0.85rem', 
                              fontWeight: '600',
                              background: isLow ? '#ffebee' : isNear ? '#fff3e0' : '#e8f5e9',
                              color: isLow ? '#c62828' : isNear ? '#f57c00' : '#2e7d32'
                            }}>
                              {isLow ? '🔴 Low' : isNear ? '🟡 Near' : '🟢 OK'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* INFO BOX */}
          <div style={{ background: '#e8f5e9', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem' }}>
            <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              ℹ️ About This Dashboard
            </div>
            <div style={{ fontSize: '0.95rem', color: '#666', lineHeight: '1.6' }}>
              • This is a <strong>read-only view</strong> for monitoring purposes<br/>
              • Your supervisor manages inventory (add, receive, use stock)<br/>
              • You can download detailed reports anytime<br/>
              • Low stock alerts help you plan purchases in advance<br/>
              • All values are calculated in real-time
            </div>
          </div>
        </div>
      </div>
    </>
  );
}