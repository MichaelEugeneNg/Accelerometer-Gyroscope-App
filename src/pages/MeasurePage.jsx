import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function MeasurePage() {
    const navigate = useNavigate();
    const dataRef = useRef({ accel: [], gyro: [] }); // create buffers that persist across renders
    const [remaining, setRemaining] = useState(10);
    const [isFinished, setFinished] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    
    // Dynamically set the API_BASE
    const { protocol, hostname } = window.location;
    const API_BASE = `${protocol}//${hostname}:8000`; // For express, use 4000. FastAPI uses 8000
  
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
            const startTS = Date.now(); // start time
            motionHandler = (e) => {
                const ts = (Date.now() - startTS) / 1000; // relative to start time
                const { x, y, z } = e.accelerationIncludingGravity;
                // const { alpha = 0, beta = 0, gamma = 0 } = e.rotationRate || {};
                const { alpha, beta, gamma } = e.rotationRate
                dataRef.current.accel.push({ ts, x, y, z });
                dataRef.current.gyro.push({ ts, alpha, beta, gamma });
            };

            // By listening to 'devicemotion', the parameter "e" in motionHandler is a DeviceMotionEvent
            window.addEventListener('devicemotion', motionHandler);
            
            // Fallback: Use generic Sensor API (if supported)
            if (window.Accelerometer) {
                try {
                    accelSensor = new window.Accelerometer({ frequency: 60 });
                    accelSensor.addEventListener('reading', () => {
                        const ts = (Date.now() - startTS) / 1000; // relative to start time
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
                    const ts = (Date.now() - startTS) / 1000; // relative to start time
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
    
        const sendMeasurementsFastAPI = async (sensorType, data) => {
            try {
                const resp = await fetch(`${API_BASE}/api/measurements/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: '123e4567-e89b-12d3-a456-426614174000', // [DEV] TODO: currently hardcoded. Change this dynamically later
                    measuredAt: new Date().toISOString(), 
                    sensor_type: sensorType,
                    data,
                }),
                });
                if (!resp.ok) {
                    const text = await resp.text();
                    throw new Error(`${resp.status}: ${text}`);
                }
                console.log(`${sensorType} uploaded`);
                setSuccessMsg(prev => `${prev || ''}${sensorType} uploaded successfully!\n`);
            } catch (err) {
                console.error(`${sensorType} upload failed`, err);
                setError(`${sensorType} upload failed: ${err.message}`);
            }
        };
        sendMeasurementsFastAPI('accel', dataRef.current.accel);
        sendMeasurementsFastAPI('gyro', dataRef.current.gyro);
    }, [isFinished, API_BASE]);

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
                    {error && <div style={{ color: 'crimson' }}>{error}</div>}
                    {successMsg && <pre style={{ whiteSpace: 'pre-wrap' }}>{successMsg}</pre>}

                    {/* PLOT */}
                    <h3>Acceleration</h3>
                    <LineChart width={600} height={300} data={plotData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ts" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="ax" name="X" dot={false} stroke="#ff0000"/> {/*red*/}
                        <Line type="monotone" dataKey="ay" name="Y" dot={false} stroke="#00cc00"/> {/*green*/}
                        <Line type="monotone" dataKey="az" name="Z" dot={false} stroke="#0000ff"/>{/*blue*/}
                    </LineChart>

                    <h3>Gyroscope</h3>
                    <LineChart width={600} height={300} data={plotData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ts" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="gx" name="α" dot={false} stroke="#ff0000"/> {/*red*/}
                        <Line type="monotone" dataKey="gy" name="β" dot={false} stroke="#00cc00"/> {/*green*/}
                        <Line type="monotone" dataKey="gz" name="γ" dot={false} stroke="#0000ff"/>{/*blue*/}
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

    // ======================= Render live countdown only if it has not been posted to database =======================
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
