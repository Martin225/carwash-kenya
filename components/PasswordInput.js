import { useState } from 'react';

export default function PasswordInput({ 
  value, 
  onChange, 
  placeholder = "Password", 
  required = true,
  name = "password",
  autoComplete = "current-password",
  style = {}
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        style={{ 
          width: '100%', 
          padding: '0.75rem', 
          paddingRight: '3rem',
          border: '2px solid #e0e0e0', 
          borderRadius: '8px', 
          fontSize: '1rem', 
          boxSizing: 'border-box' 
        }}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
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
        title={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? '👁️' : '👁️‍🗨️'}
      </button>
    </div>
  );
}