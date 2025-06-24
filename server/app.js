require('dotenv').config()
const express = require('express')
const measurementsRouter = require('./routes/measurements.js')
const cors = require('cors')

const app = express()
app.use(cors({ origin: 'http://localhost:3000' })) // React runs on localhost 3000 but express runs on localhost 4000
app.use(express.json())
app.use('/api/measurements', measurementsRouter) // Mount measurement router at /api/measurements

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`API listening on ${port}`))