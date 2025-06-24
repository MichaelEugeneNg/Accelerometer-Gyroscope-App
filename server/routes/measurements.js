const router = require('express').Router()
const { postMeasurements, getMeasurements } = require('../controllers/measurementController')

// a router ties an HTTP method + URL path to the appropriate function
router.post('/', postMeasurements)
router.get('/', getMeasurements)

module.exports = router