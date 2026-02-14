import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

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
      }
    } catch (error) {
      console.error('Error:', error);
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
if (!inventory) {
  return (
    <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>📦</div>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#006633' }}>Loading Inventory...</h2>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
```

**Save and close**

---

## 🎨 **VISUAL EXAMPLE:**

**Before (❌):**
```
[Blank white screen]
...2 seconds later...
[Dashboard appears]
```

**After (✅):**
```
[Loading Dashboard... ⏳ (spinning)]
...data loads...
[Dashboard appears smoothly]
  return (
    <>
      <Head><title>Inventory - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>📦 Inventory Management</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.business_name || 'Loading...'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => router.push('/supervisor/dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <button onClick={() => setShowAddItem(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add New Item</button>
            <button onClick={() => setShowUpdate(true)} style={{ background: '#0066cc', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📝 Use/Receive Stock</button>
          </div>

          {inventory.length === 0 ? (
            <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <p style={{ color: '#999', marginBottom: '1rem' }}>No inventory items yet</p>
              <button onClick={() => setShowAddItem(true)} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Add Your First Item</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {inventory.map((item) => (
                <div key={item.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: `4px solid ${item.current_stock <= item.reorder_level ? '#f44336' : '#4caf50'}` }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{item.item_name}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                    <span style={{ background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{item.category}</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0', color: item.current_stock <= item.reorder_level ? '#f44336' : '#006633' }}>
                    {item.current_stock} {item.unit}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
                    Reorder at: {item.reorder_level} {item.unit}
                  </div>
                  {item.current_stock <= item.reorder_level && (
                    <div style={{ background: '#ffebee', color: '#c62828', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      ⚠️ Low Stock - Reorder Now!
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add New Item Modal */}
      {showAddItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowAddItem(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '0.5rem' }}>Add New Inventory Item</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Add items like soap, wax, towels, chemicals, etc.</p>
            
            <form onSubmit={handleAddItem}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Item Name *</label>
                <input type="text" value={newItemForm.itemName} onChange={(e) => setNewItemForm({ ...newItemForm, itemName: e.target.value })} required placeholder="e.g., Car Soap, Wax, Microfiber Towel" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
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
                <input type="number" value={newItemForm.currentStock} onChange={(e) => setNewItemForm({ ...newItemForm, currentStock: e.target.value })} required min="0" step="0.01" placeholder="e.g., 50" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Reorder Level *</label>
                <input type="number" value={newItemForm.reorderLevel} onChange={(e) => setNewItemForm({ ...newItemForm, reorderLevel: e.target.value })} required min="0" step="0.01" placeholder="Alert when stock reaches this level" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>You'll be alerted when stock drops to this level</div>
              </div>

              <button type="submit" style={{ width: '100%', background: '#006633', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>Add Item</button>
              <button type="button" onClick={() => setShowAddItem(false)} style={{ width: '100%', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {showUpdate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowUpdate(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '1.5rem' }}>Use or Receive Stock</h2>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select Item *</label>
                <select value={updateForm.itemId} onChange={(e) => setUpdateForm({ ...updateForm, itemId: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="">Select Item</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.item_name} (Current: {item.current_stock} {item.unit})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Action *</label>
                <select value={updateForm.action} onChange={(e) => setUpdateForm({ ...updateForm, action: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="use">Use Stock (Decrease) - When washing cars</option>
                  <option value="add">Receive Stock (Increase) - New delivery arrived</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Quantity *</label>
                <input type="number" value={updateForm.quantity} onChange={(e) => setUpdateForm({ ...updateForm, quantity: e.target.value })} required min="0.01" step="0.01" placeholder="Enter quantity" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" style={{ width: '100%', background: '#006633', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>Update Stock</button>
              <button type="button" onClick={() => setShowUpdate(false)} style={{ width: '100%', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}