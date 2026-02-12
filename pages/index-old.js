import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services || []);
        setBranches(data.branches || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Carwash Kenya - Book Your Carwash Online</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5em', color: '#0070f3' }}>🚗 Carwash Kenya</h1>
          <p style={{ fontSize: '1.2em', color: '#666' }}>Book your carwash in seconds!</p>
        </header>

        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading...</p>
        ) : (
          <>
            <section style={{ marginBottom: '50px' }}>
              <h2>📍 Our Branches</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {branches.map(branch => (
                  <div key={branch.id} style={{ border: '2px solid #e0e0e0', padding: '20px', borderRadius: '12px' }}>
                    <h3>{branch.branch_name}</h3>
                    <p>📍 {branch.address}</p>
                    <p>📞 {branch.phone_number}</p>
                    <p>🚙 {branch.number_of_bays} bays</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2>✨ Our Services</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {services.map(service => (
                  <div key={service.id} style={{ border: '2px solid #e0e0e0', padding: '20px', borderRadius: '12px', backgroundColor: '#fff' }}>
                    <h3>{service.service_name}</h3>
                    <p style={{ fontSize: '0.9em', color: '#999', fontStyle: 'italic' }}>{service.service_name_swahili}</p>
                    <p>⏱️ {service.base_duration_minutes} minutes</p>
                    <p style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#0070f3' }}>From KES {service.min_price}</p>
                    <button 
                      onClick={() => window.location.href = '/book?service=' + service.id}
                      style={{ width: '100%', padding: '12px', marginTop: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold' }}
                    >
                      Book Now →
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}