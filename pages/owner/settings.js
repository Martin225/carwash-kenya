import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

export default function OwnerSettings() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user && user.business_id) {
      loadFeatures();
    } else {
      router.push('/login');
    }
  }, [user]);

  async function loadFeatures() {
    try {
      const response = await fetch(`/api/features?businessId=${user.business_id}`);
      const data = await response.json();
      
      if (data.success) {
        setFeatures(data.allFeatures || []);
      }
    } catch (error) {
      showToast('Failed to load features', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeature(featureCode, currentStatus) {
    setUpdating(true);
    
    try {
      const response = await fetch('/api/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: user.business_id,
          featureCode,
          isEnabled: !currentStatus
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showToast(`Feature ${!currentStatus ? 'enabled' : 'disabled'}!`, 'success');
        loadFeatures();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Failed to update feature', 'error');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <>
        <Head><title>Settings - CarWash Pro Kenya</title></Head>
        <ToastContainer />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)' }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚙️</div>
            <p style={{ fontSize: '1.2rem' }}>Loading settings...</p>
          </div>
        </div>
      </>
    );
  }

  // Group features by category
  const groupedFeatures = features.reduce((acc, feature) => {
    const category = feature.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {});

  return (
    <>
      <Head><title>Feature Settings - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1.5rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>⚙️ Feature Settings</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Customize features for your business</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => router.push('/owner/dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Dashboard</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {/* INFO BOX */}
          <div style={{ background: '#e8f5e9', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              💡 About Features
            </div>
            <div style={{ fontSize: '0.95rem', color: '#666', lineHeight: '1.6' }}>
              Enable or disable features based on your business needs. Changes take effect immediately across all your dashboards.
              <br/>Some features may require a higher plan. Contact support to upgrade.
            </div>
          </div>

          {/* FEATURES BY CATEGORY */}
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
            <div key={category} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#006633', fontSize: '1.3rem' }}>
                {category === 'operations' ? '🔧 Operations' : 
                 category === 'billing' ? '💳 Billing' : 
                 category === 'customer' ? '👥 Customer' : 
                 category === 'reporting' ? '📊 Reporting' : 
                 category === 'communications' ? '📱 Communications' : 
                 category === 'integrations' ? '🔌 Integrations' : 
                 '📋 ' + category}
              </h2>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {categoryFeatures.map(feature => (
                  <div 
                    key={feature.feature_code}
                    style={{ 
                      border: feature.is_enabled ? '2px solid #4caf50' : '2px solid #e0e0e0',
                      background: feature.is_enabled ? '#f0f7ff' : 'white',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#006633' }}>
                          {feature.feature_name}
                        </h3>
                        {feature.is_premium && (
                          <span style={{ 
                            background: '#FCD116', 
                            color: '#006633', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '8px', 
                            fontSize: '0.7rem', 
                            fontWeight: 'bold'
                          }}>
                            PREMIUM
                          </span>
                        )}
                        {feature.is_enabled && (
                          <span style={{ 
                            background: '#e8f5e9', 
                            color: '#2e7d32', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '8px', 
                            fontSize: '0.7rem', 
                            fontWeight: 'bold'
                          }}>
                            ✓ ACTIVE
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
                        {feature.description}
                      </p>
                      {feature.enabled_at && (
                        <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                          Enabled on: {new Date(feature.enabled_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => toggleFeature(feature.feature_code, feature.is_enabled)}
                      disabled={updating}
                      style={{ 
                        background: feature.is_enabled ? '#ff9800' : '#4caf50',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: updating ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        minWidth: '120px',
                        opacity: updating ? 0.5 : 1
                      }}
                    >
                      {updating ? '⏳...' : feature.is_enabled ? '⏸️ Disable' : '✓ Enable'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {features.length === 0 && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '4rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚙️</div>
              <p style={{ color: '#999', fontSize: '1.2rem' }}>No features configured yet</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
