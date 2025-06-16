import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CountdownPage() {
  const navigate = useNavigate();
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      // once we hit 0, go to the measuring screen
      navigate('/measure');
      return;
    }
    // else, set a 1000 ms (1 second) timer to decrement "count"
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, navigate]); // dependency array: we trigger this useEffect anytime "count" or "navigate" changes

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontSize: '2rem'
    }}>
      <h2>Starting in {count}...</h2>
    </div>
  );
}
