import { useState } from 'react';

export default function PinInput({ 
  value, 
  onChange, 
  placeholder = "Enter 4-digit PIN", 
  required = true,
  maxLength = 4,
  style = {}
}) {
  const [showPin, setShowPin] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <input
        type={showPin ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        pattern="[0-9]*"
        inputMode="numeric"
        style={{ 
          width: '100%', 
          padding: '0.75rem', 
          paddingRight: '3rem',
          border: '2px solid #e0e0e0', 
          borderRadius: '8px', 
          fontSize: '1.5rem',
          letterSpacing: '0.5rem',
          textAlign: 'center',
          fontWeight: 'bold',
          boxSizing: 'border-box' 
        }}
      />
      <button
        type="button"
        onClick={() => setShowPin(!showPin)}
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.2rem',
          padding: '0.25rem',
          color: '#666'
        }}
        title={showPin ? 'Hide PIN' : 'Show PIN'}
      >
        {showPin ? '👁️' : '👁️‍🗨️'}
      </button>
    </div>
  );
}