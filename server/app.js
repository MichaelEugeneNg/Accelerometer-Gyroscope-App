require('dotenv').config()
const express = require('express')
const measurementsRouter = require('./routes/measurements.js')
const cors = require('cors')

const app = express()
app.use(cors({ origin: 
    [
        'http://localhost:3000',      // by default, React runs on localhost 3000 but express runs on localhost 4000
        'http://192.168.249.241:3000' // michael's hotspot
    ] 
 })) 

app.use(express.json({limit: '10mb'})) // increase default body size limit to 10mb
app.use('/api/measurements', measurementsRouter) // mount measurement router at /api/measurements

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`API listening on ${port}`))