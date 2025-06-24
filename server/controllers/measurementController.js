const { retrieveMeasurements, saveMeasurements } = require('../models/measurementModel')

// This controller is a "doer", and actually handles the request and response

// This function will be called by the POST route in routes/measurements
async function postMeasurements(req, res, next) {
  try {
    console.log('req.body =', JSON.stringify(req.body)); // DEBUGGING
    console.log('type of data =', typeof req.body.data); // DEBUGGING
    const { userId, measuredAt, sensor, data } = req.body // pulls data out of request
    console.log('userId = ', userId) // DEBUGGING
    console.log('data = ', data) // DEBUGGING
    await saveMeasurements({ userId, measuredAt, sensor, data }) // saveMeasurements is the model that posts to database
    res.status(201).send({ success: true }) // sends success response
  } catch (err) {
    next(err)
  }
}

// This function will be called by the GET route in routes/measurements
async function getMeasurements(req, res, next) {
  try {
    const result = await retrieveMeasurements()
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMeasurements, postMeasurements }