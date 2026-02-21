import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';

export default function StaffDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ todayJobs: 0, completed: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);
  const [confirmJobId, setConfirmJobId] = useState(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      loadJobs();
      const interval = setInterval(loadJobs, 30000);
      return () => clearInterval(interval);
    } else {
      router.push('/login');
    }
  }, [user]);

  async function loadJobs() {
    try {
      const response = await fetch(`/api/staff/jobs?staffId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setJobs(data.jobs || []);
        const completedJobs = (data.jobs || []).filter(j => j.status === 'completed');
        setStats({
          todayJobs: data.jobs.length,
          completed: completedJobs.length,
          earnings: completedJobs.length * (user.commission_per_car || 50)
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markComplete(jobId) {
    setCompleting(true);
    try {
      const response = await fetch('/api/staff/complete-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });

      const data = await response.json();
      if (data.success) {
        showToast('✅ Job marked as complete!', 'success');
        setConfirmJobId(null);
        loadJobs();
      } else {
        showToast(data.message || 'Failed to update job', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Head><title>Staff Dashboard - CarWash Pro Kenya</title></Head>
        <ToastContainer />
        <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)' }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{ fontSize: '1.2rem' }}>Loading your jobs...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Staff Dashboard - CarWash Pro Kenya</title></Head>
      <ToastContainer />

      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f5f5f5', paddingBottom: '2rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #006633 0%, #004d26 100%)', color: 'white', padding: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.3rem' }}>🧑‍🔧 My Jobs</h1>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>{user?.full_name || 'Loading...'}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => loadJobs()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>🔄 Refresh</button>
              <button onClick={() => logout()} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              { label: 'Today', value: stats.todayJobs, icon: '🚗', color: '#006633' },
              { label: 'Done', value: stats.completed, icon: '✅', color: '#4caf50' },
              { label: 'Earnings', value: `Kshs ${stats.earnings}`, icon: '💰', color: '#ff9900' }
            ].map((stat, i) => (
              <div key={i} style={{ background: 'white', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderTop: `4px solid ${stat.color}` }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div>
            <h2 style={{ margin: '0 0 1rem 0', color: '#006633', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📋 Assigned Jobs ({jobs.length})
            </h2>

            {jobs.length === 0 ? (
              <div style={{ background: 'white', padding: '3rem 1rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😊</div>
                <p style={{ color: '#999', margin: 0 }}>No jobs assigned yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {jobs.map((job) => {
                  const isOtherService = !job.vehicle_reg;
                  
                  return (
                    <div key={job.id} style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: `4px solid ${job.status === 'completed' ? '#4caf50' : job.status === 'in-progress' ? '#ff9800' : '#2196f3'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#006633', marginBottom: '0.25rem' }}>
                            {isOtherService ? '🏠 Other Service' : `🚗 ${job.vehicle_reg}`}
                          </div>
                          {job.bay_number && (
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>Bay {job.bay_number}</div>
                          )}
                        </div>
                        <div style={{ background: job.status === 'completed' ? '#e8f5e9' : '#fff3e0', color: job.status === 'completed' ? '#2e7d32' : '#f57c00', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          {job.status === 'completed' ? '✅ Done' : '⏳ Active'}
                        </div>
                      </div>

                      <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Service: </span>
                          <strong>{job.service_name}</strong>
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Customer: </span>
                          <strong>{job.customer_name}</strong>
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Time: </span>
                          <strong>{job.booking_time}</strong>
                        </div>
                        {job.customer_phone && (
                          <div>
                            <span style={{ color: '#666', fontSize: '0.9rem' }}>Phone: </span>
                            <strong>{job.customer_phone}</strong>
                          </div>
                        )}
                      </div>

                      {isOtherService && (
                        <div style={{ background: '#e8f5e9', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: '#2e7d32' }}>
                          💡 <strong>Other Service:</strong> No bay required. Perform service at customer's location.
                        </div>
                      )}

                      {job.status !== 'completed' && (
                        <button
                          onClick={() => setConfirmJobId(job.id)}
                          style={{ width: '100%', background: '#4caf50', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          ✓ Mark as Complete
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BEAUTIFUL CONFIRM MODAL - replaces ugly browser confirm() */}
      {confirmJobId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: '#006633', marginBottom: '0.5rem' }}>Mark Job Complete?</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              This will notify the supervisor that the job is done and ready for payment collection.
            </p>
            <button
              onClick={() => markComplete(confirmJobId)}
              disabled={completing}
              style={{ width: '100%', background: completing ? '#ccc' : '#4caf50', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: completing ? 'not-allowed' : 'pointer', marginBottom: '0.75rem' }}
            >
              {completing ? '⏳ Updating...' : '✓ Yes, Mark Complete!'}
            </button>
            <button
              onClick={() => setConfirmJobId(null)}
              disabled={completing}
              style={{ width: '100%', background: '#f0f0f0', color: '#666', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}