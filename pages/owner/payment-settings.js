import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

export default function PaymentSettings() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    mpesa: {
      enabled: false,
      type: 'till',
      number: '',
      businessName: ''
    },
    bank: {
      enabled: false,
      bankName: '',
      accountNumber: '',
      accountName: ''
    },
    cash: {
      enabled: true
    }
  });

  useEffect(() => {
    if (user && user.business_id) {
      loadSettings();
    } else {
      router.push('/login');
    }
  }, [user]);

  async function loadSettings() {
    try {
      const response = await fetch(`/api/owner/payment-settings?businessId=${user.business_id}`);
      const data = await response.json();
      
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/owner/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: user.business_id,
          settings
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showToast('Payment settings saved successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to save settings', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Head><title>Payment Settings - CarWash Pro Kenya</title></Head>
        <ToastContainer />
        <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <p>Loading settings...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Payment Settings - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1.5rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>💳 Payment Settings</h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Configure how customers pay you</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => router.push('/owner/dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
              <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
          <form onSubmit={handleSave}>
            {/* M-Pesa Settings */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={settings.mpesa.enabled} 
                  onChange={(e) => setSettings({...settings, mpesa: {...settings.mpesa, enabled: e.target.checked}})}
                  style={{ width: '20px', height: '20px', marginRight: '1rem', cursor: 'pointer' }}
                />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#006633' }}>📱 M-Pesa Payments</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>Accept M-Pesa payments from customers</p>
                </div>
              </div>

              {settings.mpesa.enabled && (
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Payment Type *</label>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="mpesaType" 
                          value="till" 
                          checked={settings.mpesa.type === 'till'}
                          onChange={(e) => setSettings({...settings, mpesa: {...settings.mpesa, type: e.target.value}})}
                          style={{ marginRight: '0.5rem' }}
                        />
                        Till Number
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="mpesaType" 
                          value="paybill" 
                          checked={settings.mpesa.type === 'paybill'}
                          onChange={(e) => setSettings({...settings, mpesa: {...settings.mpesa, type: e.target.value}})}
                          style={{ marginRight: '0.5rem' }}
                        />
                        Paybill Number
                      </label>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      {settings.mpesa.type === 'till' ? 'Till' : 'Paybill'} Number *
                    </label>
                    <input 
                      type="text" 
                      value={settings.mpesa.number} 
                      onChange={(e) => setSettings({...settings, mpesa: {...settings.mpesa, number: e.target.value}})}
                      required={settings.mpesa.enabled}
                      placeholder="e.g., 123456"
                      pattern="[0-9]{5,7}"
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: '0' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Business Name *</label>
                    <input 
                      type="text" 
                      value={settings.mpesa.businessName} 
                      onChange={(e) => setSettings({...settings, mpesa: {...settings.mpesa, businessName: e.target.value}})}
                      required={settings.mpesa.enabled}
                      placeholder="e.g., Wangari's Carwash"
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bank Settings */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={settings.bank.enabled} 
                  onChange={(e) => setSettings({...settings, bank: {...settings.bank, enabled: e.target.checked}})}
                  style={{ width: '20px', height: '20px', marginRight: '1rem', cursor: 'pointer' }}
                />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#006633' }}>🏦 Bank Transfer</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>Accept bank transfers</p>
                </div>
              </div>

              {settings.bank.enabled && (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Bank Name *</label>
                    <input 
                      type="text" 
                      value={settings.bank.bankName} 
                      onChange={(e) => setSettings({...settings, bank: {...settings.bank, bankName: e.target.value}})}
                      required={settings.bank.enabled}
                      placeholder="e.g., Equity Bank"
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Account Number *</label>
                    <input 
                      type="text" 
                      value={settings.bank.accountNumber} 
                      onChange={(e) => setSettings({...settings, bank: {...settings.bank, accountNumber: e.target.value}})}
                      required={settings.bank.enabled}
                      placeholder="e.g., 0123456789"
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: '0' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Account Name *</label>
                    <input 
                      type="text" 
                      value={settings.bank.accountName} 
                      onChange={(e) => setSettings({...settings, bank: {...settings.bank, accountName: e.target.value}})}
                      required={settings.bank.enabled}
                      placeholder="e.g., Wangari's Carwash Ltd"
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cash Settings */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={settings.cash.enabled} 
                  onChange={(e) => setSettings({...settings, cash: {...settings.cash, enabled: e.target.checked}})}
                  style={{ width: '20px', height: '20px', marginRight: '1rem', cursor: 'pointer' }}
                />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#006633' }}>💵 Cash Payments</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>Accept cash from customers</p>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              style={{ width: '100%', background: saving ? '#ccc' : '#006633', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
            >
              {saving ? 'Saving...' : '💾 Save Payment Settings'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}