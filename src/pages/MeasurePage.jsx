import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function MeasurePage() {
    const navigate = useNavigate();
    const dataRef = useRef({ accel: [], gyro: [] }); // create buffers that persist across renders
    const [remaining, setRemaining] = useState(10);
    const [isFinished, setFinished] = useState(false);

    // ======================= IMU MEASUREMENT FUNCTION =======================
    useEffect(() => {
        let motionHandler;
        let accelSensor;
        let gyroSensor;

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

            // DeviceMotionEvent listener
            motionHandler = (e) => {
                const ts = Date.now();
                const { x, y, z } = e.accelerationIncludingGravity;
                const { alpha = 0, beta = 0, gamma = 0 } = e.rotationRate || {};
                dataRef.current.accel.push({ ts, x, y, z });
                dataRef.current.gyro.push({ ts, alpha, beta, gamma });
            };

            // By listening to 'devicemotion', the parameter "e" in motionHandler is a DeviceMotionEvent
            window.addEventListener('devicemotion', motionHandler);
            
            // Fallback: Generic Sensor API (if supported)
            if (window.Accelerometer) {
                try {
                accelSensor = new window.Accelerometer({ frequency: 60 });
                accelSensor.addEventListener('reading', () => {
                    const ts = Date.now();
                    dataRef.current.accel.push({ ts, x: accelSensor.x, y: accelSensor.y, z: accelSensor.z });
                });
                accelSensor.start();
                } catch (e) {
                console.warn('Accelerometer not available:', e);
                }
            }

            if (window.Gyroscope) {
                try {
                gyroSensor = new window.Gyroscope({ frequency: 60 });
                gyroSensor.addEventListener('reading', () => {
                    const ts = Date.now();
                    dataRef.current.gyro.push({ ts, alpha: gyroSensor.x, beta: gyroSensor.y, gamma: gyroSensor.z });
                });
                gyroSensor.start();
                } catch (e) {
                console.warn('Gyroscope not available:', e);
                }
            }
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

    // ======================= Only when isFinished is True, send accel & gyro to backend =======================
    useEffect(() => {
        if (!isFinished) return;

        const sendMeasurements = async () => {
            const userId = '123e4567-e89b-12d3-a456-426614174000'; // TODO: currently hardcoded. Change this dynamically later
            // use the timestamp of the first accel reading (or `new Date().toISOString()`)
            const measuredAt = new Date(dataRef.current.accel[0].ts).toISOString();

            try {
                // send accel data
                await fetch('http://localhost:4000/api/measurements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        measuredAt,
                        sensor: 'accel',
                        data: dataRef.current.accel,
                    }),
                });
                
                // send gyro data
                await fetch('http://localhost:4000/api/measurements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        measuredAt,
                        sensor: 'gyro',
                        data: dataRef.current.gyro,
                    }),
                });

                console.log('Posted to database!')
            } catch (err) {
                console.error('Upload failed', err);
            }
        };

        sendMeasurements();
    }, [isFinished]);

    // ======================= Plotting function to build plotData =======================
    const startTimeStamp = dataRef.current.accel[0]?.ts || Date.now(); // start time
    
    // Iterate over accumulated accelerometer readings: 
    //    a is an object like { ts, x, y, z }
    //    i is its position in the dataRef array
    const plotData = dataRef.current.accel.map((a, i) => {
        const g = dataRef.current.gyro[i] || {}; // grab the gyro reading at that same index
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
                    {/* PLOT */}
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
                
                <button onClick={() => navigate('/')} style={{ marginLeft: 10 }}>
                    Return Home
                </button>

                {/* DATA DUMP */}
                <h3>Raw Data</h3>
                <pre style={{ textAlign: 'left' }}>
                    {JSON.stringify(dataRef.current, null, 2)}
                </pre>
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
