const express = require("express")
const connectDB = require('./config/db')
const cors = require('cors');



const app = express()
app.use(cors());

// connecting database

connectDB();

// init MiddleWare

app.use(express.json({extended: false}))

app.get('/', (req,res)=> res.send('API Running'))

// defining routes
app.use('/api/users', require('./routes/api/users'))
app.use('/api/auth', require('./routes/api/auth'))
app.use('/api/posts', require('./routes/api/posts'))
app.use('/api/profile', require('./routes/api/profile'))





const PORT = process.env.PORT || 5000

app.listen(PORT, ()=> console.log(`Server started on port ${PORT}`))