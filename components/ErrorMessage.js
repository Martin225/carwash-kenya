export default function ErrorMessage({ message, onRetry }) {
  return (
    <div style={{
      background: '#fff3cd',
      border: '2px solid #ffc107',
      borderRadius: '12px',
      padding: '1.5rem',
      margin: '1rem 0',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{ fontSize: '2rem' }}>⚠️</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '0.5rem' }}>
          Oops! Something went wrong
        </div>
        <div style={{ color: '#856404', fontSize: '0.9rem' }}>
          {message || 'An unexpected error occurred. Please try again.'}
        </div>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{
            background: '#ffc107',
            color: '#856404',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}