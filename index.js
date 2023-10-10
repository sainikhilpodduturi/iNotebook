const express = require('express')
const connectToMongo = require('./db')
const app = express()
const cors = require('cors')
const port = 5000

// connecting the database with the application
connectToMongo

// used to read the requested json body
app.use(express.json())

// CORS Policy
app.use(cors())

// Available Routes
app.use('/api/notes', require('./routes/notes'))
app.use('/api/auth', require('./routes/auth'))

// Listening the application to a port
app.listen(port, () => {
  console.log(`inotebook backend app listening on port ${port}`)
})