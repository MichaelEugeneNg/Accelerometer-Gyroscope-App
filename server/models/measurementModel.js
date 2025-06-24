const pool = require('../database')

// Data access layer: talks to the DATABASE and gives the info to the controller

// This function INSERTS data into the database and is called in the POST controller in routes/measurementController
async function saveMeasurements({ userId, measuredAt, sensor, data }) {
    // console.log('data=', data)
    const dataJson = JSON.stringify(data);
    const query = `
    INSERT INTO measurements
      (user_id, measured_at, sensor_type, data)
    VALUES ($1, $2, $3, $4::jsonb)
    `
    return pool.query(query, [userId, measuredAt, sensor, dataJson])
}

// This function SELECTS data from the database and is called in the GET controller in routes/measurementController
async function retrieveMeasurements() {
    return pool.query('SELECT * FROM measurements ORDER BY id DESC LIMIT 10');
}

module.exports = { retrieveMeasurements, saveMeasurements }