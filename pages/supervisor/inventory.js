import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

// Helper function to get stock status
function getStockStatus(currentStock, reorderLevel) {
  const stock = Number(currentStock);
  const reorder = Number(reorderLevel);
  
  if (stock === 0) {
    return { 
      status: 'out', 
      color: '#f44336', 
      bgColor: '#ffebee',
      badge: 'OUT OF STOCK!', 
      icon: '🔴',
      borderColor: '#f44336'
    };
  } else if (stock <= reorder) {
    return { 
      status: 'low', 
      color: '#ff9800', 
      bgColor: '#fff3e0',
      badge: 'LOW STOCK - Reorder Soon', 
      icon: '⚠️',
      borderColor: '#ff9800'
    };
  } else {
    return { 
      status: 'good', 
      color: '#4caf50', 
      bgColor: '#e8f5e9',
      badge: 'In Stock', 
      icon: '✅',
      borderColor: '#4caf50'
    };
  }
}

export default function SupervisorInventory() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [inventory, setInventory] = useState([]);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [updateForm, setUpdateForm] = useState({ itemId: '', quantity: '', action: 'use' });
  const [newItemForm, setNewItemForm] = useState({
    itemName: '',
    category: '',
    unit: 'pieces',
    currentStock: '',
    reorderLevel: ''
  });

  useEffect(() => {
    if (user && user.business_id) {
      loadInventory();
    } else {
      router.push('/login');
    }
  }, [user]);

  async function loadInventory() {
    try {
      const response = await fetch(`/api/supervisor/inventory?businessId=${user.business_id}`);
      const data = await response.json();
      if (data.success) {
        setInventory(data.inventory || []);
        
        // Check for low stock items and show toast
        const lowStockItems = (data.inventory || []).filter(item => {
          const stock = Number(item.current_stock);
          const reorder = Number(item.reorder_level);
          return stock > 0 && stock <= reorder;
        });
        
        if (lowStockItems.length > 0) {
          const itemNames = lowStockItems.map(i => i.item_name).join(', ');
          showToast(`${lowStockItems.length} item(s) need reordering: ${itemNames}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to load inventory', 'error');
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      const response = await fetch('/api/supervisor/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updateForm, businessId: user.business_id })
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Stock ${updateForm.action === 'add' ? 'received' : 'used'} successfully!`, 'success');
        setShowUpdate(false);
        setUpdateForm({ itemId: '', quantity: '', action: 'use' });
        loadInventory();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to update inventory', 'error');
    }
  }

  async function handleAddItem(e) {
    e.preventDefault();
    try {
      const response = await fetch('/api/supervisor/inventory/add-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItemForm, businessId: user.business_id })
      });

      const data = await response.json();
      if (data.success) {
        showToast('New item added to inventory!', 'success');
        setShowAddItem(false);
        setNewItemForm({ itemName: '', category: '', unit: 'pieces', currentStock: '', reorderLevel: '' });
        loadInventory();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to add item', 'error');
    }
  }

  // Count stock status
  const stockSummary = inventory.reduce((acc, item) => {
    const status = getStockStatus(item.current_stock, item.reorder_level);
    acc[status.status] = (acc[status.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <Head><title>Inventory - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>📦 Inventory Management</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.business_name || 'Loading...'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/supervisor/dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Dashboard</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          {/* Stock Summary */}
          {inventory.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #4caf50' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4caf50' }}>{stockSummary.good || 0}</div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>Items In Stock</div>
              </div>
              
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #ff9800' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff9800' }}>{stockSummary.low || 0}</div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>Low Stock Items</div>
              </div>
              
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #f44336' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔴</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f44336' }}>{stockSummary.out || 0}</div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>Out of Stock</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setShowAddItem(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add New Item</button>
            <button onClick={() => setShowUpdate(true)} style={{ background: '#0066cc', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📝 Use/Receive Stock</button>
            <button onClick={() => loadInventory()} style={{ background: '#f0f0f0', color: '#333', border: '2px solid #e0e0e0', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
          </div>

          {inventory.length === 0 ? (
            <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <p style={{ color: '#999', marginBottom: '1rem', fontSize: '1.2rem' }}>No inventory items yet</p>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>Add items like soap, wax, towels, chemicals to get started</p>
              <button onClick={() => setShowAddItem(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>+ Add Your First Item</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {inventory.map((item) => {
                const stockInfo = getStockStatus(item.current_stock, item.reorder_level);
                
                return (
                  <div key={item.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: `4px solid ${stockInfo.borderColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', flex: 1 }}>{item.item_name}</h3>
                      <span style={{ fontSize: '1.5rem' }}>{stockInfo.icon}</span>
                    </div>
                    
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
                      <span style={{ background: '#f0f0f0', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: '500' }}>{item.category}</span>
                    </div>
                    
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0', color: stockInfo.color }}>
                      {Number(item.current_stock).toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#666' }}>{item.unit}</span>
                    </div>
                    
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem', padding: '0.5rem', background: '#f9f9f9', borderRadius: '6px' }}>
                      📊 Reorder at: <strong>{Number(item.reorder_level).toLocaleString()} {item.unit}</strong>
                    </div>
                    
                    <div style={{ background: stockInfo.bgColor, color: stockInfo.color, padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>
                      {stockInfo.badge}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAddItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowAddItem(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '0.5rem' }}>📦 Add New Inventory Item</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Add items like soap, wax, towels, chemicals, etc.</p>
            
            <form onSubmit={handleAddItem}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Item Name *</label>
                <input type="text" value={newItemForm.itemName} onChange={(e) => setNewItemForm({ ...newItemForm, itemName: e.target.value })} required placeholder="e.g., Dashboard Shine, Car Soap, Microfiber Towel" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Category *</label>
                <select value={newItemForm.category} onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="">Select Category</option>
                  <option value="Cleaning Supplies">Cleaning Supplies</option>
                  <option value="Chemicals">Chemicals</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Consumables">Consumables</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Unit of Measurement *</label>
                <select value={newItemForm.unit} onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="pieces">Pieces (pcs)</option>
                  <option value="bottles">Bottles</option>
                  <option value="litres">Litres (L)</option>
                  <option value="millilitres">Millilitres (mL)</option>
                  <option value="kilograms">Kilograms (kg)</option>
                  <option value="grams">Grams (g)</option>
                  <option value="boxes">Boxes</option>
                  <option value="rolls">Rolls</option>
                  <option value="gallons">Gallons</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Current Stock Quantity *</label>
                <input type="number" value={newItemForm.currentStock} onChange={(e) => setNewItemForm({ ...newItemForm, currentStock: e.target.value })} required min="0" step="0.01" placeholder="e.g., 30" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>💡 How many do you have right now?</div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Reorder Level (Alert When Low) *</label>
                <input type="number" value={newItemForm.reorderLevel} onChange={(e) => setNewItemForm({ ...newItemForm, reorderLevel: e.target.value })} required min="0" step="0.01" placeholder="e.g., 5" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>⚠️ You'll be alerted when stock drops to this level or below</div>
              </div>

              <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#2e7d32', marginBottom: '0.5rem' }}>
                  <strong>📋 Example:</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  • Current Stock: <strong>30 bottles</strong><br/>
                  • Reorder at: <strong>5 bottles</strong><br/>
                  • Status: <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ In Stock</span> (30 is more than 5)
                </div>
              </div>

              <button type="submit" style={{ width: '100%', background: '#006633', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>✓ Add Item</button>
              <button type="button" onClick={() => setShowAddItem(false)} style={{ width: '100%', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {showUpdate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowUpdate(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '1.5rem' }}>📝 Use or Receive Stock</h2>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select Item *</label>
                <select value={updateForm.itemId} onChange={(e) => setUpdateForm({ ...updateForm, itemId: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="">Select Item</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.item_name} (Current: {Number(item.current_stock).toLocaleString()} {item.unit})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Action *</label>
                <select value={updateForm.action} onChange={(e) => setUpdateForm({ ...updateForm, action: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="use">➖ Use Stock (Decrease) - Used for washing cars</option>
                  <option value="add">➕ Receive Stock (Increase) - New delivery arrived</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Quantity *</label>
                <input type="number" value={updateForm.quantity} onChange={(e) => setUpdateForm({ ...updateForm, quantity: e.target.value })} required min="0.01" step="0.01" placeholder="Enter quantity" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" style={{ width: '100%', background: '#006633', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>✓ Update Stock</button>
              <button type="button" onClick={() => setShowUpdate(false)} style={{ width: '100%', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}