import { useState, useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: { bg: '#4caf50', icon: '✅' },
    error: { bg: '#f44336', icon: '❌' },
    info: { bg: '#2196f3', icon: 'ℹ️' },
    warning: { bg: '#ff9800', icon: '⚠️' }
  };

  const config = colors[type] || colors.success;

  return (
    <div style={{
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      background: config.bg,
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      zIndex: 9999,
      minWidth: '300px',
      maxWidth: '500px',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      animation: isVisible ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-in',
      fontFamily: 'system-ui'
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
      `}</style>
      <div style={{ fontSize: '1.5rem' }}>{config.icon}</div>
      <div style={{ flex: 1, fontSize: '1rem', fontWeight: '500' }}>{message}</div>
      <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} style={{ background: 'rgba(255,255,255,0.3)', border: 'none', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>✕</button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </>
  );

  return { showToast, ToastContainer };
}