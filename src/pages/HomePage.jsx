import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/instruction');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh'
    }}>
      <h1>Accelerometer &amp; Gyroscope Test</h1>
      <button
        onClick={handleStart}
        style={{
          marginTop: 20,
          padding: '10px 20px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
      >
        Start
      </button>
    </div>
  );
}
