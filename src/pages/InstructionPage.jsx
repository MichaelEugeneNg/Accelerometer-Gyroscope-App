import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function InstructionPage() {
  
  const navigate = useNavigate();
  
  return (
    <div style={{
      padding: 20,
      textAlign: 'center'
    }}>
      <h2>Hold your phone in your right hand<br/>
          with the screen facing upwards</h2>

      <p><em>([DEV] TODO: Descriptive image goes here)</em></p>

      <button
        onClick={() => navigate('/countdown')}
        style={{
          marginTop: 30,
          padding: '10px 20px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
      >
          Begin
      </button>
    </div>
  );
}
