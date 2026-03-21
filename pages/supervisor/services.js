import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

export default function ServiceManagement() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [saving, setSaving] = useState(false); // NEW: Prevent double-submit
  const [deleting, setDeleting] = useState(false); // NEW: Delete state
  const [confirmDelete, setConfirmDelete] = useState(null); // NEW: Confirm modal
  
  const [serviceForm, setServiceForm] = useState({
    serviceName: '',
    description: '',
    serviceCategory: 'vehicle_service',
    fixedPrice: '',
    pricing: {
      sedan: '',
      suv: '',
      truck: '',
      matatu: ''
    }
  });

  useEffect(() => {
    if (user && user.business_id) {
      loadServices();
    } else {
      router.push('/login');
    }
  }, [user]);

  async function loadServices() {
    try {
      const response = await fetch(`/api/supervisor/services?businessId=${user.business_id}`);
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services || []);
      }
    } catch (error) {
      showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveService(e) {
    e.preventDefault();
    
    // FIX 1: Prevent double-submit
    if (saving) return;
    setSaving(true);

    try {
      const method = editingService ? 'PUT' : 'POST';
      const body = editingService 
        ? { ...serviceForm, serviceId: editingService.id, businessId: user.business_id }
        : { ...serviceForm, businessId: user.business_id };

      const response = await fetch('/api/supervisor/services', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        showToast(editingService ? '✅ Service updated!' : '✅ Service created!', 'success');
        setShowAddService(false);
        setEditingService(null);
        setServiceForm({
          serviceName: '',
          description: '',
          serviceCategory: 'vehicle_service',
          fixedPrice: '',
          pricing: { sedan: '', suv: '', truck: '', matatu: '' }
        });
        loadServices();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to save service', 'error');
    } finally {
      setSaving(false); // Re-enable button
    }
  }

  function editService(service) {
    setEditingService(service);
    setServiceForm({
      serviceName: service.name,
      description: service.description || '',
      serviceCategory: service.service_category || 'vehicle_service',
      fixedPrice: service.fixed_price || '',
      pricing: {
        sedan: service.pricing?.sedan || '',
        suv: service.pricing?.suv || '',
        truck: service.pricing?.truck || '',
        matatu: service.pricing?.matatu || ''
      }
    });
    setShowAddService(true);
  }

  async function toggleService(serviceId, currentStatus) {
    try {
      const response = await fetch('/api/supervisor/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serviceId, 
          isActive: !currentStatus,
          businessId: user.business_id,
          serviceName: services.find(s => s.id === serviceId).name,
          description: services.find(s => s.id === serviceId).description,
          serviceCategory: services.find(s => s.id === serviceId).service_category,
          fixedPrice: services.find(s => s.id === serviceId).fixed_price,
          pricing: services.find(s => s.id === serviceId).pricing
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast(currentStatus ? '✅ Service deactivated' : '✅ Service activated', 'success');
        loadServices();
      }
    } catch (error) {
      showToast('Failed to update service', 'error');
    }
  }

  // NEW: Delete service function
  async function deleteService(serviceId) {
    setDeleting(true);
    try {
      const response = await fetch('/api/supervisor/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId })
      });

      const data = await response.json();

      if (data.success) {
        if (data.deactivated) {
          showToast('✅ Service deactivated (has booking history)', 'success');
        } else {
          showToast('✅ Service deleted permanently', 'success');
        }
        setConfirmDelete(null);
        loadServices();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Head><title>Service Management - CarWash Pro</title></Head>
        <ToastContainer />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)' }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
            <h2>Loading Services...</h2>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Service Management - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>✨ Service Management</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Manage your carwash services and pricing</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/supervisor/dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Dashboard</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#006633' }}>🚗 Your Services</h2>
              <button onClick={() => {
                setEditingService(null);
                setServiceForm({ 
                  serviceName: '', 
                  description: '', 
                  serviceCategory: 'vehicle_service',
                  fixedPrice: '',
                  pricing: { sedan: '', suv: '', truck: '', matatu: '' } 
                });
                setShowAddService(true);
              }} style={{ background: '#006633', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                + Add Service
              </button>
            </div>

            {services.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>✨</div>
                <p style={{ color: '#999', fontSize: '1.2rem', marginBottom: '1rem' }}>No services yet</p>
                <p style={{ color: '#666' }}>Add your first service to start accepting customers!</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Service</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Category</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Pricing</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(service => {
                      const isOtherService = service.service_category === 'other_service';
                      return (
                        <tr key={service.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{service.name}</div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>{service.description || 'No description'}</div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '0.35rem 0.85rem', 
                              borderRadius: '12px', 
                              fontSize: '0.85rem', 
                              fontWeight: '600',
                              background: isOtherService ? '#fff3e0' : '#e3f2fd',
                              color: isOtherService ? '#f57c00' : '#1976d2'
                            }}>
                              {isOtherService ? '🏠 Other' : '🚗 Vehicle'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {isOtherService ? (
                              <div style={{ textAlign: 'center', fontWeight: '600', color: '#006633' }}>
                                Kshs {(service.fixed_price || 0).toLocaleString()}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.85rem' }}>
                                <div>🚗 Sedan: Kshs {(service.pricing?.sedan || 0).toLocaleString()}</div>
                                <div>🚙 SUV: Kshs {(service.pricing?.suv || 0).toLocaleString()}</div>
                                <div>🚚 Truck: Kshs {(service.pricing?.truck || 0).toLocaleString()}</div>
                                <div>🚐 Matatu: Kshs {(service.pricing?.matatu || 0).toLocaleString()}</div>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ padding: '0.35rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600', background: service.isActive ? '#e8f5e9' : '#ffebee', color: service.isActive ? '#2e7d32' : '#c62828' }}>
                              {service.isActive ? '✓ Active' : '✗ Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button onClick={() => editService(service)} style={{ background: '#2196f3', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                ✏️ Edit
                              </button>
                              <button onClick={() => toggleService(service.id, service.isActive)} style={{ background: service.isActive ? '#ff9800' : '#4caf50', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                {service.isActive ? '⏸️ Disable' : '✓ Enable'}
                              </button>
                              {/* NEW: Delete button */}
                              <button 
                                onClick={() => setConfirmDelete(service)} 
                                style={{ background: '#f44336', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                                title="Delete service"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD/EDIT SERVICE MODAL */}
      {showAddService && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => !saving && setShowAddService(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#006633', marginBottom: '1.5rem' }}>
              {editingService ? '✏️ Edit Service' : '✨ Add New Service'}
            </h2>

            <form onSubmit={handleSaveService}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Service Name *</label>
                <input 
                  type="text" 
                  value={serviceForm.serviceName} 
                  onChange={(e) => setServiceForm({ ...serviceForm, serviceName: e.target.value })} 
                  required 
                  disabled={saving}
                  placeholder="e.g., Premium Wash, Carpet Cleaning, Office Cleaning" 
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description (Optional)</label>
                <textarea 
                  value={serviceForm.description} 
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} 
                  disabled={saving}
                  placeholder="Brief description of the service" 
                  rows="2"
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box', resize: 'vertical' }} 
                />
              </div>

              {/* SERVICE CATEGORY SELECTOR */}
              <div style={{ marginBottom: '1.5rem', background: '#f0f7ff', padding: '1rem', borderRadius: '8px' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: '#006633' }}>
                  Service Category *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '1rem', 
                    border: serviceForm.serviceCategory === 'vehicle_service' ? '3px solid #006633' : '2px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    background: serviceForm.serviceCategory === 'vehicle_service' ? '#e8f5e9' : 'white',
                    opacity: saving ? 0.6 : 1
                  }}>
                    <input 
                      type="radio" 
                      name="category"
                      value="vehicle_service"
                      checked={serviceForm.serviceCategory === 'vehicle_service'}
                      onChange={(e) => setServiceForm({ ...serviceForm, serviceCategory: e.target.value })}
                      disabled={saving}
                      style={{ marginRight: '0.75rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>🚗 Vehicle Service</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Requires vehicle type</div>
                    </div>
                  </label>

                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '1rem', 
                    border: serviceForm.serviceCategory === 'other_service' ? '3px solid #006633' : '2px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    background: serviceForm.serviceCategory === 'other_service' ? '#e8f5e9' : 'white',
                    opacity: saving ? 0.6 : 1
                  }}>
                    <input 
                      type="radio" 
                      name="category"
                      value="other_service"
                      checked={serviceForm.serviceCategory === 'other_service'}
                      onChange={(e) => setServiceForm({ ...serviceForm, serviceCategory: e.target.value })}
                      disabled={saving}
                      style={{ marginRight: '0.75rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>🏠 Other Service</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>No vehicle needed</div>
                    </div>
                  </label>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.75rem' }}>
                  💡 <strong>Vehicle Service:</strong> Car wash, detailing, buffing. <strong>Other Service:</strong> Carpet cleaning, furniture, office cleaning.
                </div>
              </div>

              {/* CONDITIONAL PRICING */}
              {serviceForm.serviceCategory === 'vehicle_service' ? (
                <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#006633' }}>💰 Pricing by Vehicle Type *</h3>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>Set prices for each vehicle type. At least one price is required.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>🚗 Sedan</label>
                      <input 
                        type="number" 
                        value={serviceForm.pricing.sedan} 
                        onChange={(e) => setServiceForm({ ...serviceForm, pricing: { ...serviceForm.pricing, sedan: e.target.value } })} 
                        disabled={saving}
                        placeholder="e.g., 500" 
                        min="0"
                        style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>🚙 SUV</label>
                      <input 
                        type="number" 
                        value={serviceForm.pricing.suv} 
                        onChange={(e) => setServiceForm({ ...serviceForm, pricing: { ...serviceForm.pricing, suv: e.target.value } })} 
                        disabled={saving}
                        placeholder="e.g., 700" 
                        min="0"
                        style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>🚚 Truck/Pickup</label>
                      <input 
                        type="number" 
                        value={serviceForm.pricing.truck} 
                        onChange={(e) => setServiceForm({ ...serviceForm, pricing: { ...serviceForm.pricing, truck: e.target.value } })} 
                        disabled={saving}
                        placeholder="e.g., 1000" 
                        min="0"
                        style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>🚐 Matatu/Van</label>
                      <input 
                        type="number" 
                        value={serviceForm.pricing.matatu} 
                        onChange={(e) => setServiceForm({ ...serviceForm, pricing: { ...serviceForm.pricing, matatu: e.target.value } })} 
                        disabled={saving}
                        placeholder="e.g., 1200" 
                        min="0"
                        style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Service Price (Kshs) *</label>
                  <input 
                    type="number" 
                    value={serviceForm.fixedPrice} 
                    onChange={(e) => setServiceForm({ ...serviceForm, fixedPrice: e.target.value })} 
                    required={serviceForm.serviceCategory === 'other_service'}
                    disabled={saving}
                    placeholder="e.g., 2000" 
                    min="0"
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} 
                  />
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                    💡 Single price for this service (same for all customers). You can edit this anytime.
                  </div>
                </div>
              )}

              {/* FIX 1: Disabled button while saving */}
              <button 
                type="submit" 
                disabled={saving}
                style={{ 
                  width: '100%', 
                  background: saving ? '#ccc' : '#006633', 
                  color: 'white', 
                  border: 'none', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  cursor: saving ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: '1rem', 
                  marginBottom: '0.5rem' 
                }}
              >
                {saving ? '⏳ Saving...' : (editingService ? '💾 Update Service' : '✓ Create Service')}
              </button>

              <button 
                type="button" 
                onClick={() => setShowAddService(false)} 
                disabled={saving}
                style={{ 
                  width: '100%', 
                  background: '#f0f0f0', 
                  color: '#666', 
                  border: 'none', 
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  cursor: saving ? 'not-allowed' : 'pointer' 
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NEW: DELETE CONFIRMATION MODAL */}
      {confirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '1rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '450px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#f44336', marginBottom: '0.5rem' }}>Delete Service?</h2>
            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '1.1rem' }}>
              <strong>{confirmDelete.name}</strong>
            </p>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              This service will be permanently removed or deactivated if it has booking history.
            </p>
            <div style={{ background: '#fff3e0', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'left' }}>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                📋 {confirmDelete.description || 'No description'}
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                {confirmDelete.service_category === 'other_service' 
                  ? `💰 Kshs ${confirmDelete.fixed_price?.toLocaleString() || 0}`
                  : `🚗 Sedan: Kshs ${confirmDelete.pricing?.sedan?.toLocaleString() || 0}`
                }
              </p>
            </div>
            <button
              onClick={() => deleteService(confirmDelete.id)}
              disabled={deleting}
              style={{ width: '100%', background: deleting ? '#ccc' : '#f44336', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: deleting ? 'not-allowed' : 'pointer', marginBottom: '0.75rem' }}
            >
              {deleting ? '⏳ Deleting...' : '🗑️ Yes, Delete Service'}
            </button>
            <button
              onClick={() => setConfirmDelete(null)}
              disabled={deleting}
              style={{ width: '100%', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}