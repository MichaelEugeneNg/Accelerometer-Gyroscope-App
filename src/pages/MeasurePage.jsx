import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function MeasurePage() {
  const navigate = useNavigate();
  const dataRef = useRef({ accel: [], gyro: [] });
  const [remaining, setRemaining] = useState(10);
  const [isFinished, setFinished] = useState(false);

  // ======================= IMU MEASUREMENT FUNCTION =======================
  useEffect(() => {
    let motionHandler;

    // Request permission for iOS 13+, then start listening
    async function startCapture() {
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function'
      ) {
        const res = await DeviceMotionEvent.requestPermission();
        if (res !== 'granted') {
          alert('Motion permission not granted');
          navigate('/');
          return;
        }
      }
      motionHandler = (e) => {
        const ts = Date.now();
        const { x, y, z } = e.accelerationIncludingGravity;
        const { alpha = 0, beta = 0, gamma = 0 } = e.rotationRate || {};
        dataRef.current.accel.push({ ts, x, y, z });
        dataRef.current.gyro.push({ ts, alpha, beta, gamma });
      };
      window.addEventListener('devicemotion', motionHandler);
    }
    startCapture();

    // Countdown interval of 1 second
    const interval = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);

    // Stop after 10 seconds
    const timeout = setTimeout(() => {
      window.removeEventListener('devicemotion', motionHandler);
      clearInterval(interval);
      setFinished(true);
       console.log('Captured IMU data:', dataRef.current);
    }, 10000);

    // Cleanup if unmounted early
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener('devicemotion', motionHandler);
    };
  }, [navigate]);

  // ======================= Plotting function =======================
  const startTimeStamp = dataRef.current.accel[0]?.ts || Date.now(); // start time
  const plotData = dataRef.current.accel.map((a, i) => {
    const g = dataRef.current.gyro[i] || {};
    return {
      ts: ((a.ts - startTimeStamp) / 1000).toFixed(1),  // seconds relative to start time, to 1 decimal place
      ax: a.x, ay: a.y, az: a.z,
      gx: g.alpha, gy: g.beta, gz: g.gamma,
    };
  });

  // ======================= Render a “done” state =======================
  if (isFinished) {
    
    return (
      <div style={{ padding: 20 }}>
        <h2>Measurement complete!</h2>

        <h3>Acceleration</h3>
        <LineChart width={600} height={300} data={plotData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="ax" name="X" dot={false} />
          <Line type="monotone" dataKey="ay" name="Y" dot={false} />
          <Line type="monotone" dataKey="az" name="Z" dot={false} />
        </LineChart>

        <h3>Gyroscope</h3>
        <LineChart width={600} height={300} data={plotData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="gx" name="α" dot={false} />
          <Line type="monotone" dataKey="gy" name="β" dot={false} />
          <Line type="monotone" dataKey="gz" name="γ" dot={false} />
        </LineChart>

        {/* <button onClick={downloadCSV} style={{ marginTop: 20 }}>
          Download CSV
        </button> */}
        <button onClick={() => navigate('/')} style={{ marginLeft: 10 }}>
          Return Home
        </button>
      </div>
    );
  }

  // ======================= Render live countdown =======================
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '1.5rem',
      }}
    >
      <h2>Measuring…</h2>
      <p>Time remaining: {remaining}s</p>
    </div>
  );
}
